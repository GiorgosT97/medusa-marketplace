import { defineWidgetConfig } from "@medusajs/admin-sdk"

const COMMISSION_RATE = 0.10

function formatCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat("el-GR", {
    style: "currency",
    currency: currency.toUpperCase(),
    minimumFractionDigits: 2,
  }).format(amount)
}

type OrderCommissionWidgetProps = {
  data: {
    id: string
    total: number
    currency_code: string
    metadata?: Record<string, unknown> | null
  }
}

const OrderCommissionWidget = ({ data: order }: OrderCommissionWidgetProps) => {
  const total = order.total ?? 0
  const currency = order.currency_code ?? "eur"

  const commissionAmount =
    (order.metadata?.platform_commission_amount as number) ??
    Math.round(total * COMMISSION_RATE)

  const vendorPayout =
    (order.metadata?.vendor_payout_estimate as number) ??
    Math.round(total * (1 - COMMISSION_RATE))

  const payoutStatus =
    (order.metadata?.payout_status as string) ?? "pending"

  const statusColor =
    payoutStatus === "paid"
      ? "bg-green-100 text-green-800"
      : "bg-yellow-100 text-yellow-800"

  const payoutStatusLabel =
    payoutStatus === "paid" ? "Πληρώθηκε" : "Εκκρεμεί"

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
      <h2 className="text-base font-semibold text-gray-900 mb-4">
        Ανάλυση Προμήθειας &amp; Πληρωμής
      </h2>

      <div className="space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Σύνολο παραγγελίας</span>
          <span className="font-medium text-gray-900">
            {formatCurrency(total, currency)}
          </span>
        </div>

        <div className="flex justify-between text-sm">
          <span className="text-gray-500">
            Προμήθεια πλατφόρμας ({Math.round(COMMISSION_RATE * 100)}%)
          </span>
          <span className="font-medium text-gray-900">
            {formatCurrency(commissionAmount, currency)}
          </span>
        </div>

        <div className="border-t border-gray-100 pt-3 flex justify-between text-sm">
          <span className="text-gray-500">Εκτιμώμενη πληρωμή πωλητή (90%)</span>
          <span className="font-semibold text-gray-900">
            {formatCurrency(vendorPayout, currency)}
          </span>
        </div>

        <div className="flex justify-between items-center text-sm pt-1">
          <span className="text-gray-500">Κατάσταση πληρωμής</span>
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColor}`}
          >
            {payoutStatusLabel}
          </span>
        </div>
      </div>

      <p className="mt-4 text-xs text-gray-400">
        Πραγματική πληρωμή πωλητή = παραπάνω εκτίμηση μείον χρεώσεις Stripe
        (~1,5% + €0,25 για ευρωπαϊκές κάρτες). Δείτε το{" "}
        <a
          href="https://dashboard.stripe.com/payments"
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-gray-600"
        >
          Stripe dashboard
        </a>{" "}
        για την ακριβή χρέωση ανά συναλλαγή.
      </p>
    </div>
  )
}

export const config = defineWidgetConfig({
  zone: "order.details.after",
})

export default OrderCommissionWidget
