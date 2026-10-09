import test from "node:test";
import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { inspectContent } from "../src/lib/content-integrity.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const readJsonDir = async (relative) => Promise.all(
  (await readdir(path.join(root, relative))).filter((file) => file.endsWith(".json")).map(async (file) =>
    JSON.parse(await readFile(path.join(root, relative, file), "utf8")),
  ),
);
let corpusPromise;
const corpus = () => corpusPromise ??= Promise.all([
  readJsonDir("src/content/records"),
  readJsonDir("src/content/events"),
  readJsonDir("src/content/relationships"),
  readJsonDir("src/content/articles"),
  readJsonDir("src/content/passages"),
  readJsonDir("src/content/themes"),
  readJsonDir("src/content/images"),
]).then(([records, events, relationships, articles, passages, themes, images]) => ({ records, events, relationships, articles, passages, themes, images }));

test("the complete published baseline includes the AAM / NorthSouth GIS account", { timeout: 60_000 }, async () => {
  const data = await corpus();
  assert.equal(data.records.length, 796);
  assert.equal(data.articles.length, 45, "the preface and 44 imported narrative groups are editable stories");
  assert.equal(data.passages.length, 583);
  assert.equal(data.events.length, 167);
  assert.equal(data.relationships.length, 2502);
  assert.equal(data.themes.length, 7);
  assert.equal(data.images.length, 2, "both local image copies have image detail records");
  assert.ok(data.records.some((record) => record.id === "entity:aam-aamhatch"));
  assert.ok(data.records.some((record) => record.id === "entity:explorer-graphics-northsouth-gis"));
  assert.ok(data.events.some((event) => event.id === "2009-aamhatch-wellington-city-model" && event.datePrecision === "year"));
  assert.ok(data.events.some((event) => event.id === "2014-aam-acquires-northsouth-gis-nz" && event.datePrecision === "year"));
});

test("all imported links, routes, source references and local image copies validate", { timeout: 60_000 }, async () => {
  const data = await corpus();
  assert.deepEqual(inspectContent(data), []);
  const serialized = JSON.stringify(data);
  assert.doesNotMatch(serialized, /researchRegister|editorialNotes|drive\.google|contributorEmail|assets\/contributions|research register source/i);
  const redirects = await readFile(path.join(root, "public/_redirects"), "utf8");
  assert.equal(redirects.trim().split("\n").length, 45, "previous story URLs and the preface route redirect to their new locations");
  assert.match(redirects, /^\/preface\/ \/stories\/preface\/ 301$/m);
});

test("the story model accepts more passages without a fixed chapter count", { timeout: 60_000 }, async () => {
  const changed = structuredClone(await corpus());
  const article = { id: "article:future", slug: "future", title: "Future story", url: "/stories/future/", summary: "An additional story.", status: "published", updatedAt: "2026-10-09", themeIds: [] };
  changed.articles.push(article);
  for (const [index, id] of ["passage:future-1", "passage:future-2", "passage:future-3", "passage:future-4"].entries()) {
    changed.passages.push({ id, slug: `future-${index + 1}`, articleId: article.id, title: `Passage ${index + 1}`, order: index, updatedAt: article.updatedAt, themeIds: [], recordIds: [], blocks: [{ type: "paragraph", text: "A short passage." }] });
  }
  assert.deepEqual(inspectContent(changed), []);
});

test("an event with unknown date precision remains publishable", { timeout: 60_000 }, async () => {
  const changed = structuredClone(await corpus());
  changed.events.push({ id: "event:undated", dateDisplay: "Date unknown", startDate: "unknown", datePrecision: "unknown", label: "Undated sample event", summary: "A record without a known date.", passageIds: [], themeIds: [], sources: [] });
  assert.deepEqual(inspectContent(changed), []);
});

test("broken relationship endpoints and duplicate routes are flagged", { timeout: 60_000 }, async () => {
  const changed = structuredClone(await corpus());
  changed.relationships[0].a = "record:missing";
  changed.records[0].url = changed.records[1].url;
  changed.relationships[1].basis = "";
  const errors = inspectContent(changed).join("\n");
  assert.match(errors, /both endpoints/);
  assert.match(errors, /route collision/);
  assert.match(errors, /relationship wording and basis/);
});
