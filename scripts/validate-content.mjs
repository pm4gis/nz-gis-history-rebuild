import { access, readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { inspectContent } from "../src/lib/content-integrity.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const readJsonFiles = async (relative) => {
  const dir = path.join(root, relative);
  const files = (await readdir(dir)).filter((file) => file.endsWith(".json")).sort();
  return Promise.all(files.map(async (file) => JSON.parse(await readFile(path.join(dir, file), "utf8"))));
};
const [records, chapters, events, relationships] = await Promise.all([
  readJsonFiles("src/content/records"), readJsonFiles("src/content/chapters"),
  readJsonFiles("src/content/events"), readJsonFiles("src/content/relationships"),
]);
const problems = inspectContent({ records, chapters, events, relationships });
for (const chapter of chapters) {
  const assets = [chapter.heroImage?.path, ...(chapter.sections || []).flatMap((section) => (section.blocks || []).filter((block) => block.type === "figure").map((block) => block.asset))].filter(Boolean);
  for (const asset of assets) {
    try { await access(path.join(root, "public", asset.replace(/^\//, ""))); }
    catch { problems.push("chapter " + chapter.id + ": media file is missing: " + asset); }
  }
}
if (problems.length) {
  console.error("Content validation failed (" + problems.length + " issue(s)):");
  for (const problem of problems) console.error("- " + problem);
  process.exitCode = 1;
} else {
  console.log("Content validation passed: " + records.length + " records, " + chapters.length + " chapter, " + events.length + " events, " + relationships.length + " relationships.");
}
