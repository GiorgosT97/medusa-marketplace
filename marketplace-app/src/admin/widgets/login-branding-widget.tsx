"use client"

import { useEffect } from "react"
import { defineWidgetConfig } from "@medusajs/admin-sdk"

const BG = "#F9F3EE"

const LoginBrandingWidget = () => {
  useEffect(() => {
    // Force light background — overrides Medusa dark theme CSS variables at the JS level
    const html = document.documentElement
    html.style.setProperty("--ui-bg-base", BG)
    html.style.setProperty("--ui-bg-subtle", BG)
    html.style.setProperty("--ui-bg-component", BG)
    html.style.backgroundColor = BG
    document.body.style.backgroundColor = BG

    const root = document.getElementById("root")
    if (root) root.style.backgroundColor = BG

    return () => {
      html.style.removeProperty("--ui-bg-base")
      html.style.removeProperty("--ui-bg-subtle")
      html.style.removeProperty("--ui-bg-component")
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
