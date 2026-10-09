import test from "node:test";
import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { inspectContent } from "../src/lib/content-integrity.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const readJsonDir = async (relative) => Promise.all(
  (await readdir(path.join(root, relative))).filter((file) => file.endsWith(".json")).map(async (file) =>
    JSON.parse(await readFile(path.join(root, relative, file), "utf8"))),
);
const sample = {
  records: await readJsonDir("src/content/records"),
  events: await readJsonDir("src/content/events"),
  relationships: await readJsonDir("src/content/relationships"),
  articles: await readJsonDir("src/content/articles"),
  passages: await readJsonDir("src/content/passages"),
  themes: await readJsonDir("src/content/themes"),
  images: await readJsonDir("src/content/images"),
};

test("small sample keeps the published AAM / NorthSouth text and date precision", () => {
  assert.ok(sample.records.some((record) => record.id === "entity:aam-aamhatch"));
  assert.ok(sample.records.some((record) => record.id === "entity:northsouth-gis-nz"));
  assert.equal(sample.articles.length, 1);
  assert.equal(sample.passages.length, 2);
  assert.equal(sample.events.length, 2);
  assert.ok(sample.events.every((event) => event.datePrecision === "year"));
  assert.ok(sample.relationships.some((relationship) => relationship.label === "acquired"));
  assert.equal(sample.images.length, 0, "legacy imagery is not carried into the clean sample");
});

test("all sample links, sources, routes and local image copies validate", () => {
  assert.deepEqual(inspectContent(sample), []);
  const serialized = JSON.stringify(sample);
  assert.doesNotMatch(serialized, /researchRegister|editorialNotes|drive\.google|contributorEmail|assets\/contributions|research register source/i);
});

test("articles can contain any number of passages without chapter numbering", () => {
  const changed = structuredClone(sample);
  const article = { id: "article:future", slug: "future", title: "Future story", url: "/stories/future/", summary: "An additional story.", status: "published", updatedAt: "2026-10-09", themeIds: [] };
  changed.articles.push(article);
  for (const [index, id] of ["passage:future-1", "passage:future-2", "passage:future-3", "passage:future-4"].entries()) changed.passages.push({ id, slug: `future-${index + 1}`, articleId: article.id, title: `Passage ${index + 1}`, order: index, updatedAt: article.updatedAt, themeIds: [], recordIds: [], paragraphs: [{ text: "A short passage." }] });
  assert.deepEqual(inspectContent(changed), []);
});

test("an event with unknown date precision remains publishable", () => {
  const changed = structuredClone(sample);
  changed.events.push({ id: "event:undated", dateDisplay: "Date unknown", startDate: "unknown", datePrecision: "unknown", label: "Undated sample event", summary: "A record without a known date.", passageIds: [], themeIds: [], sources: [] });
  assert.deepEqual(inspectContent(changed), []);
});

test("broken relationship endpoints and duplicate routes are flagged", () => {
  const changed = structuredClone(sample);
  changed.relationships[0].a = "record:missing";
  changed.records[0].url = changed.records[1].url;
  changed.relationships[1].basis = "";
  const errors = inspectContent(changed).join("\n");
  assert.match(errors, /both endpoints/);
  assert.match(errors, /route collision/);
  assert.match(errors, /relationship wording and basis/);
});
