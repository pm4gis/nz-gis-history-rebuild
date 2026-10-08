import { access, copyFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const candidates = ["node_modules/decap-cms/dist/decap-cms.js", "node_modules/decap-cms/dist/decap-cms.min.js"];
let source = null;
for (const candidate of candidates) {
  try { await access(path.join(root, candidate)); source = candidate; break; }
  catch {}
}
if (!source) throw new Error("Decap CMS browser bundle was not found in node_modules/decap-cms/dist.");
const destination = path.join(root, "public/admin/decap-cms.js");
await mkdir(path.dirname(destination), { recursive: true });
await copyFile(path.join(root, source), destination);
console.log("Copied " + source + " to public/admin/decap-cms.js");
