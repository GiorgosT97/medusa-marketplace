import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";
import { CreateStoreInput } from "..";
import { Modules } from "@medusajs/framework/utils";
import {
  IUserModuleService,
  IAuthModuleService,
  AuthenticationInput,
} from "@medusajs/framework/types";

export type CreateUserStepInput = Required<
  Omit<CreateStoreInput, "user_id" | "store_name" | "metadata" | "address">
>;

export type CreateUserStepCompensationInput = {
  userId?: string;
  authIdentityId?: string;
};

export const createUserStep = createStep(
  "create-user-step",
  async (
    input: CreateUserStepInput,
    { container }
  ) => {
    const userService: IUserModuleService = container.resolve(Modules.USER);
    const authService: IAuthModuleService = container.resolve(Modules.AUTH);
    const compensationInput: CreateUserStepCompensationInput = {};

    try {
      // 1. create user
      const user = await userService.createUsers({
        email: input.email,
        metadata: input.is_super_admin ? { is_super_admin: true } : undefined,
      });
      compensationInput.userId = user.id;

      let authIdentityId = input.authIdentityId

      if (!authIdentityId) {
        // 2a. create auth identity (fallback: register inside step)
        // NOTE: this path should not be hit in production — prefer passing
        // authIdentityId from the route handler to avoid container scope issues.
        const registerResponse = await authService.register("emailpass", {
          body: {
            email: input.email,
            password: input.password,
          },
        } as AuthenticationInput);
        authIdentityId = registerResponse.authIdentity.id;
      }

      compensationInput.authIdentityId = authIdentityId;

      // 2b. attach auth identity to user
      await authService.updateAuthIdentities({
        id: authIdentityId,
        app_metadata: {
          user_id: user.id,
        },
      });

      return new StepResponse({ user, registerResponse: {} }, compensationInput);
    } catch (e) {
      return StepResponse.permanentFailure(
        `Couldn't create the user: ${e}`,
        compensationInput
      );
    }
  },
  async (input: CreateUserStepCompensationInput, { container }) => {
    const userService: IUserModuleService = container.resolve(Modules.USER);
    const authService: IAuthModuleService = container.resolve(Modules.AUTH);

    if (input?.userId) {
      await userService.deleteUsers([input.userId]);
    }
    if (input?.authIdentityId) {
      await authService.deleteAuthIdentities([input.authIdentityId]);
    }
  }
);
