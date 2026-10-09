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
const [records, events, relationships, articles, passages, themes, images] = await Promise.all([
  readJsonFiles("src/content/records"), readJsonFiles("src/content/events"), readJsonFiles("src/content/relationships"),
  readJsonFiles("src/content/articles"), readJsonFiles("src/content/passages"), readJsonFiles("src/content/themes"), readJsonFiles("src/content/images"),
]);
const problems = inspectContent({ records, events, relationships, articles, passages, themes, images });
for (const image of images) {
  try { await access(path.join(root, "public", image.assetPath.replace(/^\//, ""))); }
  catch { problems.push("image " + image.id + ": local copy is missing: " + image.assetPath); }
}
if (problems.length) {
  console.error("Content validation failed (" + problems.length + " issue(s)):");
  for (const problem of problems) console.error("- " + problem);
  process.exitCode = 1;
} else {
  console.log(`Content validation passed: ${articles.length} stories, ${passages.length} passages, ${records.length} records, ${events.length} events, ${relationships.length} connections, ${themes.length} themes and ${images.length} images.`);
}
