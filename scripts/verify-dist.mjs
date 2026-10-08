import { access, readFile, readdir, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const chapterDirectory = path.join(root, "src/content/chapters");
const chapterFile = (await readdir(chapterDirectory)).find((file) => file.endsWith(".json"));
if (!chapterFile) throw new Error("No sample chapter is available for output verification.");
const chapter = JSON.parse(await readFile(path.join(chapterDirectory, chapterFile), "utf8"));
const records = await Promise.all((await readdir(path.join(root, "src/content/records")))
  .filter((file) => file.endsWith(".json"))
  .map(async (file) => JSON.parse(await readFile(path.join(root, "src/content/records", file), "utf8"))));
const events = await Promise.all((await readdir(path.join(root, "src/content/events")))
  .filter((file) => file.endsWith(".json"))
  .map(async (file) => JSON.parse(await readFile(path.join(root, "src/content/events", file), "utf8"))));
const chapterHtmlPath = path.join(root, "dist", chapter.url.replace(/^\/+|\/+$/g, ""), "index.html");
const pdfRelative = "dist/downloads/chapter-" + chapter.number + "-a5.pdf";
const required = [
  "dist/index.html", "dist/network/index.html", "dist/timeline/index.html", "dist/browse/index.html",
  "dist/search/index.html", "dist/about/index.html",
  "dist/404.html",
  path.relative(root, chapterHtmlPath),
  path.join("dist", records[0].url.replace(/^\/+|\/+$/g, ""), "index.html"),
  "dist/pagefind/pagefind.js", "dist/pagefind/pagefind-ui.js",
  pdfRelative, "dist/admin/index.html", "dist/admin/config.yml", "dist/admin/decap-cms.js",
  path.join("dist", chapter.heroImage.path.replace(/^\//, "")),
  ...chapter.sections.flatMap((section) => section.blocks.filter((block) => block.type === "figure").map((block) => path.join("dist", block.asset.replace(/^\//, "")))),
];
for (const relative of required) {
  try { await access(path.join(root, relative)); }
  catch { throw new Error("Build output is missing " + relative); }
}
async function filesIn(directory) {
  const output = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) output.push(...await filesIn(fullPath));
    else output.push(fullPath);
  }
  return output;
}
const builtAssets = await filesIn(path.join(root, "dist"));
if (builtAssets.length > 20_000) throw new Error("Pages Free file limit exceeded: " + builtAssets.length);
for (const file of builtAssets) {
  const size = (await stat(file)).size;
  if (size > 25 * 1024 * 1024) throw new Error("Pages Free per-file size limit exceeded: " + path.relative(root, file) + " is " + size + " bytes");
}
const pdfPath = path.join(root, pdfRelative);
const pdf = await readFile(pdfPath);
if (pdf.subarray(0, 5).toString("ascii") !== "%PDF-") throw new Error("A5 file is not a valid PDF.");
const pdfSize = (await stat(pdfPath)).size;
if (pdfSize < 8_000 || pdfSize > 25 * 1024 * 1024) throw new Error("A5 PDF size is outside the expected range: " + pdfSize + " bytes");
const mediaBox = /\/MediaBox\s*\[\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)\s*\]/.exec(pdf.toString("latin1"));
if (!mediaBox) throw new Error("A5 PDF is missing a page-size box.");
const width = Number(mediaBox[3]) - Number(mediaBox[1]);
const height = Number(mediaBox[4]) - Number(mediaBox[2]);
if (Math.abs(width - 419.53) > 1 || Math.abs(height - 595.28) > 1) throw new Error("PDF page size is not A5 portrait: " + width + " × " + height + " points");
const chapterHtml = await readFile(chapterHtmlPath, "utf8");
if (!chapterHtml.includes("Chapter source notes") || !chapterHtml.includes("Imagery CC4.0 LINZ 2021")) {
  throw new Error("Chapter output is missing its source notes or published image credit.");
}
const networkHtml = await readFile(path.join(root, "dist/network/index.html"), "utf8");
for (const requiredText of ["Find a path", "Copy view link", "Text alternative", "Dataset association only"]) {
  if (!networkHtml.includes(requiredText)) throw new Error("Network output is missing " + requiredText);
}
const timelineHtml = await readFile(path.join(root, "dist/timeline/index.html"), "utf8");
const precisionLabels = { day: "exact day recorded", month: "month recorded", year: "year recorded", approximate: "approximate date", range: "bounded range", decade: "decade recorded", unknown: "date unknown" };
for (const precision of new Set(events.map((event) => event.datePrecision))) {
  if (!timelineHtml.includes(precisionLabels[precision])) throw new Error("Timeline output is missing the " + precision + " date-precision label.");
}
console.log("Static output verification passed: " + required.length + " required paths, " + builtAssets.length + " Pages assets (" + (await Promise.all(builtAssets.map((file) => stat(file)))).reduce((total, item) => total + item.size, 0) + " bytes), A5 portrait PDF (" + pdfSize + " bytes), chapter credits and graph text alternative.");
