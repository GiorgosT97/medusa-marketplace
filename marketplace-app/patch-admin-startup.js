/**
 * Runs on container startup before Medusa starts.
 * Clears default Medusa login text/logos and replaces baked-in backend URL.
 * Branding and theme are handled by the login-branding-widget.
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
  if (count < 5) continue;
  const before = c;
  c = c.replace(/(login:\s*\{[^}]*?title:\s*)"([^"]+)"/g, '$1""');
  c = c.replace(/(login:\s*\{[^}]*?hint:\s*)"([^"]+)"/g, '$1""');
  if (c !== before) {
    fs.writeFileSync(fp, c, "utf8");
    console.log("[vv-patch] Cleared login text in: " + f);
    patched++;
  }
}

// --- 2) Remove AvatarBox (Medusa logo) from login page ---
for (const f of jsFiles) {
  if (!f.startsWith("login-")) continue;
  const fp = path.join(ADMIN_ASSETS, f);
  let c = fs.readFileSync(fp, "utf8");
  const avatarPattern = /e\.jsx\(\w+,\{\}\),(e\.jsxs?\("div",\{className:"mb-4)/;
  if (avatarPattern.test(c)) {
    c = c.replace(avatarPattern, "$1");
    fs.writeFileSync(fp, c, "utf8");
    console.log("[vv-patch] Removed AvatarBox in: " + f);
    patched++;
  }
}

// --- 3) Replace baked-in backend URL with current MEDUSA_BACKEND_URL ---
const currentBackendUrl = process.env.MEDUSA_BACKEND_URL;
if (currentBackendUrl) {
  for (const f of jsFiles) {
    const fp = path.join(ADMIN_ASSETS, f);
    let c = fs.readFileSync(fp, "utf8");
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
