/**
 * Post-build patch: runs on the built admin output at .medusa/server/public/admin/
 * Safety net in case the prebuild patch doesn't fully propagate through medusa build.
 * Branding and theme are handled by the login-branding-widget — this only cleans up
 * default Medusa text/logos.
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

  // 2) Remove AvatarBox (Medusa logo) from login page
  if (fileName.startsWith("login-") && content.includes("AvatarBox")) {
    content = content.replace(
      /e\.jsx\(\w+,\{\}\),(\s*e\.jsxs?\("div",\{className:"mb-4)/g,
      "$1"
    );
  }

  if (content !== before) {
    fs.writeFileSync(filePath, content, "utf8");
    console.log(`[postbuild] Patched: ${fileName}`);
    totalPatched++;
  }
}

console.log(`[postbuild] Done. ${totalPatched} file(s) patched.`);
