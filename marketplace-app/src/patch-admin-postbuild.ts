/**
 * Post-build patch: runs on the built admin output at .medusa/server/public/admin/
 * Safety net in case the prebuild patch doesn't fully propagate through medusa build.
 * Also injects the Vintage Vault login branding directly into the built output.
 */
const fs = require("fs");
const path = require("path");

const ADMIN_DIR = path.join(process.cwd(), ".medusa", "server", "public", "admin");
const ADMIN_ASSETS = path.join(ADMIN_DIR, "assets");

if (!fs.existsSync(ADMIN_ASSETS)) {
  console.log("No built admin assets found — skipping postbuild patch.");
  process.exit(0);
}

const jsFiles = (fs.readdirSync(ADMIN_ASSETS) as string[]).filter(
  (f: string) => f.endsWith(".js")
);

let totalPatched = 0;

// Vintage Vault branding JSX to inject into the login page
const VV_BRANDING = [
  'e.jsx("div",{style:{backgroundColor:"#F9F3EE",borderBottom:"1px solid #e8ddd4",',
  'padding:"32px 24px 24px",textAlign:"center",width:"100%"},',
  'children:[e.jsx("div",{style:{display:"inline-block",borderBottom:"2px solid #560B18",',
  'paddingBottom:"12px",marginBottom:"8px"},',
  'children:e.jsx("span",{style:{fontFamily:"serif",fontSize:"28px",fontWeight:"700",',
  'letterSpacing:"0.12em",textTransform:"uppercase",color:"#560B18"},',
  'children:"Vintage Vault"})}),',
  'e.jsx("p",{style:{fontSize:"13px",color:"#8b6a5c",margin:0,letterSpacing:"0.04em"},',
  'children:"Vendor Portal"})]}),',
].join("");

for (const fileName of jsFiles) {
  const filePath = path.join(ADMIN_ASSETS, fileName);
  let content: string = fs.readFileSync(filePath, "utf8");
  const before = content;

  // 1) Clear login title/hint for ALL locales
  if (content.includes("login:")) {
    content = content.replace(
      /(login:\s*\{[^}]*?title:\s*)"([^"]+)"/g,
      '$1""'
    );
    content = content.replace(
      /(login:\s*\{[^}]*?hint:\s*)"([^"]+)"/g,
      '$1""'
    );
  }

  // 2) Login page specific patches
  if (fileName.startsWith("login-")) {
    // Remove AvatarBox (Medusa logo)
    if (content.includes("AvatarBox")) {
      content = content.replace(
        /e\.jsx\(\w+,\{\}\),(\s*e\.jsxs?\("div",\{className:"mb-4)/g,
        "$1"
      );
    }

    // Inject Vintage Vault branding before the title div (if not already injected)
    const titleDiv = 'e.jsxs("div",{className:"mb-4 flex flex-col items-center"';
    if (content.includes(titleDiv) && !content.includes("Vintage Vault")) {
      content = content.replace(titleDiv, VV_BRANDING + titleDiv);
    }

    // Inject JS theme override to force light beige background on login page
    if (!content.startsWith("(function(){")) {
      const themeJs = [
        '(function(){',
        'var BG="#F9F3EE";var h=document.documentElement;',
        'var props=["--bg-base","--bg-subtle","--bg-component","--bg-field",',
        '"--bg-field-hover","--bg-field-component","--bg-field-component-hover",',
        '"--fg-base","--fg-subtle","--fg-muted","--fg-on-color"];',
        'function apply(){',
        'h.style.setProperty("--bg-base",BG);',
        'h.style.setProperty("--bg-subtle",BG);',
        'h.style.setProperty("--bg-component",BG);',
        'h.style.setProperty("--bg-field","#ffffff");',
        'h.style.setProperty("--bg-field-hover","#f9fafb");',
        'h.style.setProperty("--bg-field-component","#ffffff");',
        'h.style.setProperty("--bg-field-component-hover","#f9fafb");',
        'h.style.backgroundColor=BG;document.body.style.backgroundColor=BG;',
        'h.style.setProperty("--fg-base","#111827");',
        'h.style.setProperty("--fg-subtle","#6B7280");',
        'h.style.setProperty("--fg-muted","#9CA3AF");',
        'h.style.setProperty("--fg-on-color","#111827");',
        'var r=document.getElementById("medusa");if(r)r.style.backgroundColor=BG;',
        '}',
        'function cleanup(){',
        'props.forEach(function(p){h.style.removeProperty(p)});',
        'h.style.backgroundColor="";document.body.style.backgroundColor="";',
        'var r=document.getElementById("medusa");if(r)r.style.backgroundColor="";',
        '}',
        'apply();',
        'var iv=setInterval(function(){',
        'if(window.location.pathname.indexOf("/login")===-1',
        '&&window.location.pathname.indexOf("/reset-password")===-1){',
        'cleanup();clearInterval(iv);}',
        '},500);',
        '})();\n',
      ].join("");
      content = themeJs + content;
    }
  }

  if (content !== before) {
    fs.writeFileSync(filePath, content, "utf8");
    console.log(`[postbuild] Patched: ${fileName}`);
    totalPatched++;
  }
}

// 3) Add login page CSS to index.html
const htmlPath = path.join(ADMIN_DIR, "index.html");
if (fs.existsSync(htmlPath)) {
  let html: string = fs.readFileSync(htmlPath, "utf8");
  if (!html.includes("vv-login.css")) {
    const cssContent = `
:root, [data-theme="light"], [data-theme="dark"] {
  --bg-subtle: #F9F3EE !important;
  --bg-base: #F9F3EE !important;
}
html, body, #root, #root > div, #medusa,
.bg-ui-bg-subtle, .bg-ui-bg-base,
[class*="bg-ui-bg-subtle"], [class*="bg-ui-bg-base"] {
  background-color: #F9F3EE !important;
}
input, textarea { color: #111827 !important; background-color: #ffffff !important; }
input::placeholder, textarea::placeholder { color: #9CA3AF !important; }
h1, h2, h3, p, span, label, a, button { color: #111827; }
.text-ui-fg-subtle { color: #6B7280 !important; }
.text-ui-fg-muted { color: #9CA3AF !important; }
`;
    fs.writeFileSync(path.join(ADMIN_ASSETS, "vv-login.css"), cssContent.trim(), "utf8");
    html = html.replace("</head>", '  <link rel="stylesheet" href="/app/assets/vv-login.css">\n</head>');
    fs.writeFileSync(htmlPath, html, "utf8");
    console.log("[postbuild] Added vv-login.css to index.html");
    totalPatched++;
  }
}

console.log(`[postbuild] Done. ${totalPatched} file(s) patched.`);
