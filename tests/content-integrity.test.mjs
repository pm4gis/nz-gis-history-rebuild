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
  chapters: await readJsonDir("src/content/chapters"),
  events: await readJsonDir("src/content/events"),
  relationships: await readJsonDir("src/content/relationships"),
};

test("published slice retains stable record identity and the connected sample", () => {
  const ids = new Set(sample.records.map((record) => record.id));
  assert.equal(sample.records.length, 38);
  assert.ok(ids.has("entity:aam-aamhatch"));
  assert.equal(sample.records.find((record) => record.id === "entity:aam-aamhatch").slug, "aam-aamhatch");
  assert.equal(sample.chapters[0].id, "chapter:39");
  assert.equal(sample.chapters[0].sections.length, 16);
  assert.equal(sample.events.length, 8);
  assert.equal(sample.relationships.length, 82);
  assert.equal(sample.chapters[0].heroImage.license, "Imagery CC4.0 LINZ 2021");
  assert.ok(sample.relationships.some((edge) => edge.evidence.paragraphRefs.length > 0));
});

test("public content passes cross-file and privacy checks", () => {
  assert.deepEqual(inspectContent(sample), []);
  const serialized = JSON.stringify(sample);
  assert.doesNotMatch(serialized, /researchRegister|editorialNotes|drive\.google|contributorEmail|assets\/contributions|research register source/i);
});

test("relationship endpoints, evidence and routes fail closed on a broken edit", () => {
  const changed = structuredClone(sample);
  changed.relationships[0].a = "person:not-in-this-slice";
  changed.records[0].url = changed.records[1].url;
  changed.relationships[1].evidence.status = "";
  const errors = inspectContent(changed).join("\n");
  assert.match(errors, /relationship endpoint/);
  assert.match(errors, /route collision/);
  assert.match(errors, /evidence status/);
});
