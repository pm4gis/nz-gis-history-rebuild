import { access, readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dist = path.join(root, "dist");
const exists = async (relative) => access(path.join(dist, relative)).then(() => true, () => false);
const required = [
  "index.html", "stories/preface/index.html", "timeline/index.html", "browse/index.html", "network/index.html", "about/index.html",
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
const themes = await readJsonFiles("src/content/themes");
for (const article of articles.filter((item) => item.status === "published")) {
  const relative = path.join(article.url.replace(/^\/+|\/+$/g, ""), "index.html");
  if (!(await exists(relative))) throw new Error("Published story route is missing: " + relative);
}
for (const record of records.filter((item) => item.kind !== "Story")) {
  const relative = path.join(record.url.replace(/^\/+|\/+$/g, ""), "index.html");
  if (!(await exists(relative))) throw new Error("Record route is missing: " + relative);
}
for (const theme of themes) {
  const relative = path.join("themes", theme.slug, "index.html");
  if (!(await exists(relative))) throw new Error("Theme route is missing: " + relative);
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
if (!home.includes("A History of GIS in New Zealand") || !home.includes("Start reading") || !home.includes("Open chronology") || !home.includes("Suggest an update by email") || !home.includes('data-reader-workspace')) {
  throw new Error("Home output is missing the continuous reading entry point, chronology link or update-by-email link.");
}
if (!home.includes("Contents") || !home.includes('class="book-section"') || home.includes("timeline-dock") || home.includes("MiniNetwork")) {
  throw new Error("The home page does not render the long-form book without a shared timeline or embedded graph.");
}
if (home.includes("Writing this book began as a way of using AI") || home.includes("Staging publication")) throw new Error("The home page renders internal staging copy.");
const preface = await readFile(path.join(dist, "stories/preface/index.html"), "utf8");
if (!preface.includes("Writing this book began as a way of using AI") || !preface.includes("use the Suggest an update by email link")) throw new Error("The separate preface page is missing or its update instructions are out of date.");
const aam = records.find((record) => record.id === "entity:aam-aamhatch");
if (!aam) throw new Error("The AAM / AAMHatch record is missing.");
const aamPage = await readFile(path.join(dist, aam.url.replace(/^\/+/, ""), "index.html"), "utf8");
if (!aamPage.includes("AAM / AAMHatch") || !aamPage.includes("NorthSouth GIS NZ")) throw new Error("The AAM / NorthSouth GIS record content is missing.");
if (home.includes("Download PDF")) throw new Error("PDF functionality remains on the reader home.");
for (const file of builtFiles.filter((path) => path.endsWith(".html"))) {
  const html = await readFile(file, "utf8");
  if (html.includes('class="timeline-dock"')) throw new Error("A shared timeline dock remains on " + path.relative(dist, file) + ".");
}
const chronology = await readFile(path.join(dist, "timeline/index.html"), "utf8");
if (!chronology.includes("Chronological event cards") || !chronology.includes("Earlier events") || !chronology.includes("Later events")) throw new Error("Chronology is missing its accessible horizontal scroll region.");
for (const relative of ["network/index.html", "timeline/index.html", "browse/index.html"]) {
  const html = await readFile(path.join(dist, relative), "utf8");
  if (/<select\b/i.test(html)) throw new Error("A dropdown selector remains on " + relative + ". Use visible selection buttons instead.");
}
const network = await readFile(path.join(dist, "network/index.html"), "utf8");
if (!network.includes('data-kind-filter="people"') || !network.includes('data-kind-filter="organisations"') || !network.includes('Interactive network of stories, records, events and themes')) {
  throw new Error("Network output is missing the people/organisation selection buttons or accessible graph fallback.");
}
const graphMatch = network.match(/<script id="graph-data" type="application\/json">([\s\S]*?)<\/script>/);
if (!graphMatch) throw new Error("Network graph data is missing from the built page.");
const graphData = JSON.parse(graphMatch[1]);
const graphIds = new Set(graphData.nodes.map((node) => node.id));
const dangling = graphData.edges.filter((edge) => !graphIds.has(edge.a) || !graphIds.has(edge.b) || edge.a === edge.b);
if (dangling.length) throw new Error(`Network graph has ${dangling.length} missing or self-linked endpoints.`);
const adjacency = new Map(graphData.nodes.map((node) => [node.id, []]));
for (const edge of graphData.edges) { adjacency.get(edge.a).push(edge.b); adjacency.get(edge.b).push(edge.a); }
const connected = new Set(["index:collection"]);
const pending = ["index:collection"];
while (pending.length) for (const id of adjacency.get(pending.pop()) || []) if (!connected.has(id)) { connected.add(id); pending.push(id); }
const unconnectedCore = graphData.nodes.filter((node) => ["people", "organisations", "themes"].includes(node.group) && !connected.has(node.id));
if (unconnectedCore.length) throw new Error(`Network graph leaves ${unconnectedCore.length} people, organisations or themes disconnected from its index.`);
for (const [group, contextGroups] of [["people", ["stories", "organisations"]], ["organisations", ["stories", "people"]], ["themes", ["stories", "people"]]]) {
  const focused = new Set(graphData.nodes.filter((node) => node.group === group).map((node) => node.id));
  const contextEdges = graphData.edges.filter((edge) => focused.has(edge.a) || focused.has(edge.b));
  const contextIds = new Set(focused);
  for (const edge of contextEdges) { contextIds.add(edge.a); contextIds.add(edge.b); }
  const context = graphData.nodes.filter((node) => contextIds.has(node.id));
  if (!contextGroups.every((contextGroup) => context.some((node) => node.group === contextGroup))) {
    throw new Error(`Focusing the network on ${group} no longer retains its connected stories and records.`);
  }
}
const totalBytes = (await Promise.all(builtFiles.map((file) => stat(file)))).reduce((sum, item) => sum + item.size, 0);
console.log(`Static output verification passed: ${required.length} core paths, ${articles.filter((item) => item.status === "published").length} stories, ${records.filter((item) => item.kind !== "Story").length} entity records, ${themes.length} theme pages, ${images.length} image detail pages, ${builtFiles.length} files (${totalBytes} bytes), no PDF output.`);
