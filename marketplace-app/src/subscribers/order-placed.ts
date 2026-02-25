import { SubscriberArgs, type SubscriberConfig } from "@medusajs/framework";
import { IOrderModuleService } from "@medusajs/framework/types";
import { ContainerRegistrationKeys, OrderWorkflowEvents } from "@medusajs/framework/utils";
import { Modules } from "@medusajs/framework/utils";
import productStoreLink from "../links/product-store";
import { linkOrderToStoreWorkflow } from "../workflows/link-order-to-store";
import { linkCustomerToStoreWorkflow } from "../workflows/link-customer-to-store";

const COMMISSION_RATE = 0.10;

export default async function orderPlacedHandler({ event: { data }, container }: SubscriberArgs<{ id: string }>) {
  try {
    console.log("orderPlacedHandler data", data);

    const orderId = data.id;
    const orderModuleService: IOrderModuleService = container.resolve(Modules.ORDER);
    const query = container.resolve(ContainerRegistrationKeys.QUERY);

    // retrieve order
    const order = await orderModuleService.retrieveOrder(orderId, {
      relations: ["items", "shipping_address", "billing_address", "shipping_methods"],
      select: ["id", "total", "metadata", "customer_id"],
    });
    console.log("order", order);

    // get products of store
    const productsIds = order.items?.map((item) => item.product_id);
    const { data: productsStores } = await query.graph({
      entity: productStoreLink.entryPoint,
      fields: ["*"],
      filters: {
        product_id: productsIds,
      },
    });
    console.log("productsStores", productsStores);

    if (productsStores.length > 0) {
      const storeId = productsStores[0].store_id;
      console.log("storeId", storeId);

      // link order to store
      await linkOrderToStoreWorkflow(container).run({
        input: {
          orderId: order.id,
          storeId,
        },
      });

      // link customer to store (ignore duplicate — customer may already be linked)
      try {
        await linkCustomerToStoreWorkflow(container).run({
          input: {
            customerIds: [order.customer_id],
            storeId,
          },
        });
      } catch (err: any) {
        if (err?.type === "duplicate_error") {
          console.log("Customer already linked to store, skipping.");
        } else {
          throw err;
        }
      }

      // Store commission metadata on the order
      const total = Number((order as any).raw_total?.value ?? order.total ?? 0);
      await orderModuleService.updateOrders(order.id, {
        metadata: {
          ...((order.metadata as object) ?? {}),
          platform_commission_rate: COMMISSION_RATE,
          platform_commission_amount: Math.round(total * COMMISSION_RATE),
          vendor_payout_estimate: Math.round(total * (1 - COMMISSION_RATE)),
          payout_status: "pending",
        },
      });
      console.log(`Commission metadata saved — order: ${order.id}, total: ${total}`);

      // Update Stripe PaymentIntent with order + store info for easy monthly payout tracking
      try {
        const stripeApiKey = process.env.STRIPE_API_KEY;
        if (!stripeApiKey) throw new Error("STRIPE_API_KEY not set");

        // Get store name
        const storeModuleService = container.resolve(Modules.STORE);
        const [storeData] = await storeModuleService.listStores({ id: [storeId] });
        const storeName = (storeData as any)?.name ?? storeId;

        // Traverse order → payment_collections → payment_sessions via query.graph
        const { data: orderResults } = await query.graph({
          entity: "order",
          filters: { id: order.id },
          fields: ["payment_collections.payment_sessions.data"],
        });

        const piId = (orderResults as any)?.[0]
          ?.payment_collections?.[0]
          ?.payment_sessions?.[0]
          ?.data?.id as string | undefined;

        if (!piId) {
          console.warn("No Stripe PaymentIntent ID found for order", order.id);
        } else {
          const res = await fetch(`https://api.stripe.com/v1/payment_intents/${piId}`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${stripeApiKey}`,
              "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
              description: `Order — ${storeName}`,
              "metadata[order_id]": order.id,
              "metadata[store_id]": storeId,
              "metadata[store_name]": storeName,
            }).toString(),
          });
          if (!res.ok) {
            const body = await res.text();
            console.warn(`Stripe PI update failed (${res.status}): ${body}`);
          } else {
            console.log(`Stripe PI ${piId} updated — order: ${order.id}, store: ${storeName}`);
          }
        }
      } catch (err) {
        // Non-critical — don't fail the order if Stripe metadata update fails
        console.error("Failed to update Stripe PaymentIntent metadata:", err);
      }
    }
  } catch (error) {
    console.error(error);
  }
}

// subscriber config
export const config: SubscriberConfig = {
  event: OrderWorkflowEvents.PLACED,
};
