/**
 * Runs on container startup before Medusa starts.
 * Patches the built admin login page: removes Medusa branding,
 * injects Vintage Vault branding, forces light theme.
 */
const fs = require("fs");
const path = require("path");

const ADMIN_ASSETS = "/app/.medusa/server/public/admin/assets";

if (!fs.existsSync(ADMIN_ASSETS)) {
  console.log("[vv-patch] No admin assets found — skipping.");
  process.exit(0);
}

const jsFiles = fs.readdirSync(ADMIN_ASSETS).filter(f => f.endsWith(".js"));
let patched = 0;

// --- 1) Clear login title/hint for ALL locales in the translations chunk ---
for (const f of jsFiles) {
  const fp = path.join(ADMIN_ASSETS, f);
  let c = fs.readFileSync(fp, "utf8");
  if (!c.includes("login:")) continue;
  let idx = 0, count = 0;
  while ((idx = c.indexOf("login:", idx)) !== -1) { count++; idx += 10; }
  if (count < 5) continue; // skip files with fewer than 5 login blocks
  const before = c;
  c = c.replace(/(login:\s*\{[^}]*?title:\s*)"([^"]+)"/g, '$1""');
  c = c.replace(/(login:\s*\{[^}]*?hint:\s*)"([^"]+)"/g, '$1""');
  if (c !== before) {
    fs.writeFileSync(fp, c, "utf8");
    console.log("[vv-patch] Cleared login text in: " + f);
    patched++;
  }
}

// --- 2) Patch login page ---
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

const THEME_JS = [
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
  // Watch for navigation away from login (URL change)
  'var iv=setInterval(function(){',
  'if(window.location.pathname.indexOf("/login")===-1',
  '&&window.location.pathname.indexOf("/reset-password")===-1){',
  'cleanup();clearInterval(iv);}',
  '},500);',
  '})();\n',
].join("");

for (const f of jsFiles) {
  if (!f.startsWith("login-")) continue;
  const fp = path.join(ADMIN_ASSETS, f);
  let c = fs.readFileSync(fp, "utf8");
  let changed = false;

  // Remove AvatarBox (Medusa logo)
  const avatarPattern = /e\.jsx\(\w+,\{\}\),(e\.jsxs?\("div",\{className:"mb-4)/;
  if (avatarPattern.test(c)) {
    c = c.replace(avatarPattern, "$1");
    changed = true;
  }

  // Inject VV branding before the title div
  const titleDiv = 'e.jsxs("div",{className:"mb-4 flex flex-col items-center"';
  if (c.includes(titleDiv) && !c.includes("Vintage Vault")) {
    c = c.replace(titleDiv, VV_BRANDING + titleDiv);
    changed = true;
  }

  // Inject theme override JS at top of file
  if (!c.startsWith("(function(){")) {
    c = THEME_JS + c;
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(fp, c, "utf8");
    console.log("[vv-patch] Patched login page: " + f);
    patched++;
  }
}

// --- 3) Replace baked-in backend URL with current MEDUSA_BACKEND_URL ---
const currentBackendUrl = process.env.MEDUSA_BACKEND_URL;
if (currentBackendUrl) {
  for (const f of jsFiles) {
    const fp = path.join(ADMIN_ASSETS, f);
    let c = fs.readFileSync(fp, "utf8");
    // Match any https URL that looks like a production backend
    const bakedUrls = c.match(/https?:\/\/api\.[a-zA-Z0-9.-]+\.[a-z]{2,}/g);
    if (bakedUrls && bakedUrls.length > 0) {
      const uniqueUrls = [...new Set(bakedUrls)];
      let changed = false;
      for (const url of uniqueUrls) {
        if (url !== currentBackendUrl) {
          c = c.split(url).join(currentBackendUrl);
          console.log("[vv-patch] Replaced " + url + " → " + currentBackendUrl + " in " + f);
          changed = true;
        }
      }
      if (changed) {
        fs.writeFileSync(fp, c, "utf8");
        patched++;
      }
    }
  }
}

console.log("[vv-patch] Done. " + patched + " file(s) patched.");
