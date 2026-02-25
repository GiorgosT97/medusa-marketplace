import { MedusaRequest, MedusaResponse } from "@medusajs/framework";
import { Modules } from "@medusajs/framework/utils";
import { IAuthModuleService, AuthenticationInput } from "@medusajs/framework/types";

import {
  CreateStoreInput,
  createStoreWorkflow,
} from "../../../workflows/create-store";

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

  const { registration_code, email, password, ...rest } = req.body as any

  // Register auth identity here (in route handler context) instead of inside
  // the workflow step, to avoid container scope issues in production.
  const authService: IAuthModuleService = req.scope.resolve(Modules.AUTH)
  let authIdentityId: string

  try {
    const registerResponse = await authService.register("emailpass", {
      body: { email, password },
    } as AuthenticationInput)
    authIdentityId = registerResponse.authIdentity.id
  } catch (error) {
    console.error("/stores/regular auth register error", error)
    return res.status(422).json({
      message: error.message || "Σφάλμα κατά τη δημιουργία λογαριασμού.",
      error: error.message || error,
    }) as any
  }

  try {
    const { result } = await createStoreWorkflow(req.scope).run({
      input: {
        ...rest,
        email,
        password,
        authIdentityId,
      },
    })

    // Authenticate to get a token for auto-login
    let token: string | undefined
    try {
      const authResult = await authService.authenticate("emailpass", {
        body: { email, password },
      } as AuthenticationInput)
      token = (authResult as any).token
    } catch {
      // Non-fatal: store creation succeeded, auto-login just won't work
    }

    res.json({
      message: "Ok",
      user: result.user,
      token,
    })
  } catch (error) {
    console.error("/stores/regular error", error)

    // Clean up the auth identity we created before the workflow
    try {
      await authService.deleteAuthIdentities([authIdentityId])
    } catch {
      // best-effort cleanup
    }

    res.status(422).json({
      message: error.message || "Error creating regular store",
      error: error.message || error,
    })
  }
}
