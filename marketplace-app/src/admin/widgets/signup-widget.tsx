import { defineWidgetConfig } from "@medusajs/admin-sdk";
import SignupForm from "../components/signup-form";
import DrawerComponent from "../components/drawer";

const SignupWidget = () => {
  const disableSignupWidget =
    //@ts-ignore
    typeof __VITE_DISABLE_SIGNUP_WIDGET__ !== "undefined"
      ? //@ts-ignore
        __VITE_DISABLE_SIGNUP_WIDGET__
      : false;

  return disableSignupWidget ? null : (
    <div className="flex flex-col">
      <div className="flex items-center gap-x-3 my-2">
        <div className="flex-1 h-px bg-ui-border-base" />
        <p className="text-ui-fg-muted txt-compact-small">or</p>
        <div className="flex-1 h-px bg-ui-border-base" />
      </div>
      <DrawerComponent title="Sign Up" content={<SignupForm />} />
    </div>
  );
};

// The widget's configurations
export const config = defineWidgetConfig({
  zone: "login.after",
});

export default SignupWidget;
