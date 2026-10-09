import { access, readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dist = path.join(root, "dist");
const exists = async (relative) => access(path.join(dist, relative)).then(() => true, () => false);
const required = [
  "index.html", "timeline/index.html", "browse/index.html", "network/index.html", "about/index.html",
  "images/index.html", "search/index.html", "admin/index.html", "admin/config.yml", "admin/decap-cms.js",
  "pagefind/pagefind.js", "pagefind/pagefind-ui.js",
];
for (const relative of required) if (!(await exists(relative))) throw new Error("Required static output is missing: " + relative);

const readJsonFiles = async (relative) => {
  const directory = path.join(root, relative);
  const names = (await readdir(directory)).filter((name) => name.endsWith(".json"));
  return Promise.all(names.map(async (name) => JSON.parse(await readFile(path.join(directory, name), "utf8"))));
};
const [articles, records, images] = await Promise.all([
  readJsonFiles("src/content/articles"), readJsonFiles("src/content/records"), readJsonFiles("src/content/images"),
]);
for (const article of articles.filter((item) => item.status === "published")) {
  const relative = path.join(article.url.replace(/^\/+|\/+$/g, ""), "index.html");
  if (!(await exists(relative))) throw new Error("Published story route is missing: " + relative);
}
for (const record of records) {
  const relative = path.join(record.url.replace(/^\/+|\/+$/g, ""), "index.html");
  if (!(await exists(relative))) throw new Error("Record route is missing: " + relative);
}
for (const image of images) {
  const page = path.join("images", image.slug, "index.html");
  const asset = image.assetPath.replace(/^\//, "");
  if (!(await exists(page))) throw new Error("Image detail page is missing: " + page);
  if (!(await exists(asset))) throw new Error("Local image copy is missing from output: " + asset);
}

const walk = async (directory) => {
  const found = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) found.push(...await walk(full));
    else found.push(full);
  }
  return found;
};
const builtFiles = await walk(dist);
if (builtFiles.some((file) => file.toLowerCase().endsWith(".pdf"))) throw new Error("Unexpected PDF output exists in the static site.");
const home = await readFile(path.join(dist, "index.html"), "utf8");
if (!home.includes("AAM, AAMHatch and NorthSouth GIS") || !home.includes("Suggest an update by email")) {
  throw new Error("Home output is missing the sample narrative or email update link.");
}
if (home.includes("Chapter 39") || home.includes("Download PDF")) throw new Error("Old chapter or PDF content remains on the reader home.");
const totalBytes = (await Promise.all(builtFiles.map((file) => stat(file)))).reduce((sum, item) => sum + item.size, 0);
console.log(`Static output verification passed: ${required.length} core paths, ${articles.filter((item) => item.status === "published").length} story, ${records.length} records, ${images.length} image detail page, ${builtFiles.length} files (${totalBytes} bytes), no PDF output.`);
