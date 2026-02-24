import { defineWidgetConfig } from "@medusajs/admin-sdk"

const LoginBrandingWidget = () => {
  return (
    <>
    <style>{`
      html, html.dark { --ui-bg-base: #F9F3EE !important; --ui-bg-subtle: #F9F3EE !important; background-color: #F9F3EE !important; }
      body, html.dark body { background-color: #F9F3EE !important; }
      #root, #root > div { background-color: #F9F3EE !important; }
    `}</style>
    <div
      style={{
        backgroundColor: "#F9F3EE",
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
