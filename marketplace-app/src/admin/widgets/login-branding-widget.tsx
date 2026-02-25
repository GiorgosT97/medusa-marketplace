"use client"

import { useEffect } from "react"
import { defineWidgetConfig } from "@medusajs/admin-sdk"

const BG = "#F9F3EE"

const LoginBrandingWidget = () => {
  useEffect(() => {
    // Force light theme — overrides both background AND foreground CSS variables
    const html = document.documentElement
    // Backgrounds
    html.style.setProperty("--ui-bg-base", BG)
    html.style.setProperty("--ui-bg-subtle", BG)
    html.style.setProperty("--ui-bg-component", BG)
    html.style.setProperty("--ui-bg-field", "#ffffff")
    html.style.setProperty("--ui-bg-field-hover", "#f9fafb")
    html.style.backgroundColor = BG
    document.body.style.backgroundColor = BG
    // Foregrounds (force dark text so inputs are readable)
    html.style.setProperty("--ui-fg-base", "#111827")
    html.style.setProperty("--ui-fg-subtle", "#6B7280")
    html.style.setProperty("--ui-fg-muted", "#9CA3AF")
    html.style.setProperty("--ui-fg-on-color", "#111827")

    const root = document.getElementById("root")
    if (root) root.style.backgroundColor = BG

    return () => {
      for (const prop of [
        "--ui-bg-base", "--ui-bg-subtle", "--ui-bg-component",
        "--ui-bg-field", "--ui-bg-field-hover",
        "--ui-fg-base", "--ui-fg-subtle", "--ui-fg-muted", "--ui-fg-on-color",
      ]) html.style.removeProperty(prop)
      html.style.backgroundColor = ""
      document.body.style.backgroundColor = ""
      if (root) root.style.backgroundColor = ""
    }
  }, [])

  return (
    <>
      <style>{`
        html { background-color: ${BG} !important; }
        body { background-color: ${BG} !important; }
        #root, #root > div { background-color: ${BG} !important; }
        .bg-ui-bg-base { background-color: ${BG} !important; }
        .bg-ui-bg-subtle { background-color: ${BG} !important; }
        /* Force dark text on all inputs/textareas on the login page */
        input, textarea { color: #111827 !important; background-color: #ffffff !important; }
        input::placeholder, textarea::placeholder { color: #9CA3AF !important; }
      `}</style>
      <div
        style={{
          backgroundColor: BG,
          borderBottom: "1px solid #e8ddd4",
          padding: "32px 24px 24px",
          textAlign: "center",
          width: "100%",
        }}
      >
        <div
          style={{
            display: "inline-block",
            borderBottom: "2px solid #560B18",
            paddingBottom: "12px",
            marginBottom: "8px",
          }}
        >
          <span
            style={{
              fontFamily: "serif",
              fontSize: "28px",
              fontWeight: "700",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "#560B18",
            }}
          >
            Vintage Vault
          </span>
        </div>
        <p
          style={{
            fontSize: "13px",
            color: "#8b6a5c",
            margin: 0,
            letterSpacing: "0.04em",
          }}
        >
          Vendor Portal
        </p>
      </div>
    </>
  )
}

export const config = defineWidgetConfig({
  zone: "login.before",
})

export default LoginBrandingWidget
