import { MedusaRequest, MedusaResponse } from "@medusajs/framework";

import {
  CreateStoreInput,
  createStoreWorkflow,
} from "../../../workflows/create-store";

// curl -X POST http://localhost:9000/stores/regular -d '{ "store_name":"My Shop", "email":"admin@test.com", "password": "123", "registration_code": "SECRET" }' -H 'Content-Type: application/json'

export async function POST(
  req: MedusaRequest<CreateStoreInput & { registration_code?: string }>,
  res: MedusaResponse
): Promise<void> {
  const expectedCode = process.env.STORE_REGISTRATION_CODE

  if (expectedCode) {
    const provided = (req.body as any).registration_code
    if (!provided || provided !== expectedCode) {
      return res.status(401).json({ message: "Μη έγκυρος κωδικός εγγραφής." }) as any
    }
  }

  try {
    const { registration_code, ...storeInput } = req.body as any
    const { result } = await createStoreWorkflow(req.scope).run({
      input: storeInput,
    });
    res.json({
      message: "Ok",
      user: result.user,
    });
  } catch (error) {
    console.error("/stores/regular error", error);

    res.status(422).json({
      message: error.message || "Error creating regular store",
      error: error.message || error,
    });
  }
}
