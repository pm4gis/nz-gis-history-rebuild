import { access, mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const inputPath = process.argv[2] && path.resolve(process.argv[2]);
if (!inputPath) {
  console.error("Usage: node scripts/import-canonical-baseline.mjs <published-base-canonical.json>");
  process.exit(2);
}

const snapshot = JSON.parse(await readFile(inputPath, "utf8"));
const required = { records: 796, edges: 2502, events: 167, themes: 7 };
for (const [key, expected] of Object.entries(required)) {
  if (!Array.isArray(snapshot[key]) || snapshot[key].length !== expected) {
    throw new Error(`Refusing import: ${key} must contain ${expected} published items.`);
  }
}
if (snapshot.records.filter((item) => item.kind === "Chapter").length !== 44) {
  throw new Error("Refusing import: the source release does not contain its expected narrative records.");
}

const collectionNames = ["articles", "passages", "records", "events", "relationships", "themes", "images"];
for (const name of collectionNames) {
  const directory = path.join(root, "src", "content", name);
  await rm(directory, { recursive: true, force: true });
  await mkdir(directory, { recursive: true });
}

const safeSegment = (value) => String(value || "item").normalize("NFKD")
  .replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, "") || "item";
const hash = (value) => createHash("sha256").update(String(value)).digest("hex").slice(0, 10);
const cleanText = (value) => String(value || "").replace(/\b([A-Z0-9._%+-]+)@([A-Z0-9.-]+\.[A-Z]{2,})\b/gi, "$1 [at] $2");
const cleanNote = (value) => cleanText(value)
  .replace(/Master Research Register routes include [^.]*\.?/gi, "")
  .replace(/The source route is R24-S02, with R26-S08 providing related institutional product history\.?/gi, "Related institutional product history is also referenced.")
  .replace(/Routes? (?:include )?(?:[A-Z0-9-]+(?:, | and |\.)?)+/gi, "")
  .replace(/R24-S02 is the principal route for this baseline\.?/gi, "The cited material is the principal route for this baseline.")
  .replace(/,\s*R20-S24,?/gi, "")
  .replace(/Master Research Register C34-S01 supports/gi, "The cited material supports")
  .replace(/,\s*C34-S02,? supports/gi, " supports")
  .replace(/New Zealand Police official records support ([^.]*?)\. Routes include [^.]*?\./gi, "New Zealand Police official records support $1.")
  .replace(/Privacy\/anonymisation controls remain part of the evidence and distinguish/gi, "Privacy and anonymisation controls distinguish")
  .replace(/European Space Agency mission material, Master Research Register C36-S03, supports/gi, "European Space Agency mission material supports")
  .replace(/\s*\(?\/?assets\/contributions\/[^\s)]+\)?/gi, "")
  .replace(/\b(?:MRR:)?(?:DR|GAP\d*|PE|OP\d*|LINZCAP|BIO|R\d*|C\d*|P\d*|UT\d*|GOV\d*)-[A-Z0-9-]{1,16}\b/gi, "")
  .replace(/\s{2,}/g, " ").replace(/\s+([,.])/g, "$1").trim();
const cleanLabel = (value) => String(value || "")
  .replace(/^(?:[A-Z]+\d*(?:[-:][A-Z0-9]+)+)\s*[·:–-]\s*/i, "")
  .replace(/\s*\(project-held\s+[A-Z0-9-]+,?\s*transcribed in Chapter \d+\)/i, "")
  .replace(/\bResearch register source\s+[A-Z0-9-]+\b/i, "")
  .replace(/\b(?:MRR:)?(?:DR|GAP\d*|PE|OP\d*|LINZCAP|BIO|R\d*|C\d*|P\d*|UT\d*|GOV\d*)-[A-Z0-9-]{1,16}\b/gi, "")
  .replace(/\s{2,}/g, " ").replace(/\s+([,.])/g, "$1").trim();
const cleanUrl = (value) => {
  if (typeof value !== "string" || !value.trim()) return "";
  const url = value.trim();
  if (/^\/?assets\/contributions\//i.test(url) || /(?:drive|docs)\.google\.com/i.test(url)) return "";
  const oldChapter = url.match(/^(?:https?:\/\/history\.pm4gis\.nz)?\/book\/chapter\/\d+\/([^/?#]+)\/?(?:#[^?]*)?$/i);
  if (oldChapter) return `/stories/${safeSegment(oldChapter[1])}/`;
  if (/^https?:\/\/history\.pm4gis\.nz\//i.test(url)) return new URL(url).pathname;
  return url;
};
const cleanSources = (items = []) => (Array.isArray(items) ? items : []).flatMap((item) => {
  const label = cleanLabel(item?.label);
  if (/^\/?assets\/contributions\//i.test(String(item?.url || "")) || /(?:drive|docs)\.google\.com/i.test(String(item?.url || ""))) return [];
  const url = cleanUrl(item?.url);
  if (!label || !url && /research register|project-held/i.test(String(item?.label || ""))) return [];
  if (url && !/^https?:\/\//i.test(url) && !url.startsWith("/")) return [];
  return [{ label, ...(url ? { url } : {}) }];
});
const cleanSourceGroups = (groups) => Array.isArray(groups) ? groups.map(cleanSources) : [];
const fileNames = new Map();
const writeItem = async (collection, preferredName, item) => {
  const directory = path.join(root, "src", "content", collection);
  const base = safeSegment(preferredName).slice(0, 72);
  let filename = `${base}.json`;
  if (fileNames.has(`${collection}/${filename}`)) {
    filename = `${base}--${safeSegment(item.id.replace(/[:/]/g, "-"))}.json`;
  }
  if (fileNames.has(`${collection}/${filename}`)) throw new Error(`Filename collision: ${collection}/${filename}`);
  fileNames.set(`${collection}/${filename}`, item.id);
  await writeFile(path.join(directory, filename), JSON.stringify(item, null, 2) + "\n");
};
const date = "2026-10-08";
const chapters = snapshot.records.filter((item) => item.kind === "Chapter").sort((a, b) => a.number - b.number);
const chapterById = new Map(chapters.map((item) => [item.id, item]));
const chapterByNumber = new Map(chapters.map((item) => [item.number, item]));
const passageIdBySection = new Map();
const passageById = new Map();
const themeStops = new Map();
for (const theme of snapshot.themes) {
  for (const stop of theme.stops || []) {
    const sectionId = stop.sectionId || stop.url?.split("#")[1]?.replace(/\/$/, "");
    if (sectionId) {
      const key = `${stop.chapter}:${sectionId}`;
      themeStops.set(key, [...(themeStops.get(key) || []), theme.id]);
    }
  }
}

const articles = [];
const passages = [];
const storyRecords = [];
const passageRecords = new Map();
const articleForChapter = new Map();
const routeForChapter = new Map();
const oldRouteForChapter = new Map();

const prefaceParagraphs = cleanText(snapshot.preface).trim().split(/\n\s*\n/).map((text) => text.trim()).filter(Boolean);
const prefaceArticle = {
  id: "article:preface",
  slug: "preface",
  title: "Preface",
  url: "/stories/preface/",
  summary: prefaceParagraphs[0]?.slice(0, 230) || "The author's introduction to the evolving history of GIS in New Zealand.",
  status: "published",
  updatedAt: date,
  readingOrder: 0,
  themeIds: [],
  featured: true,
  sourceNotes: [],
};
const prefacePassage = {
  id: "passage:preface-introduction",
  slug: "preface",
  articleId: prefaceArticle.id,
  title: "Preface",
  order: 0,
  updatedAt: date,
  themeIds: [],
  recordIds: [],
  blocks: prefaceParagraphs.map((text) => ({ type: "paragraph", text, sources: [] })),
};
articles.push(prefaceArticle);
passages.push(prefacePassage);
passageById.set(prefacePassage.id, prefacePassage);

for (const chapter of chapters) {
  const oldPath = chapter.url || "";
  const slug = safeSegment(oldPath.split("/").filter(Boolean).at(-1) || chapter.name);
  const articleId = `article:chapter-${chapter.number}`;
  const articleUrl = `/stories/${slug}/`;
  articleForChapter.set(chapter.id, articleId);
  routeForChapter.set(chapter.id, articleUrl);
  oldRouteForChapter.set(chapter.id, oldPath);
  const articlePassages = [];
  for (const [order, section] of (chapter.sections || []).entries()) {
    const passageId = `passage:chapter-${chapter.number}-${hash(section.id)}`;
    const sectionThemes = [...new Set(themeStops.get(`${chapter.number}:${section.id}`) || [])];
    const blocks = (section.blocks || []).flatMap((block) => {
      if (block.type === "paragraph" && String(block.text || "").trim()) {
        return [{ type: "paragraph", text: cleanText(block.text), ...(block.markdown ? { markdown: cleanText(block.markdown) } : {}), sources: cleanSources(block.sources) }];
      }
      if (block.type === "figure") {
        const imageId = String(block.asset || "").endsWith("figure-20.jpg") ? "image:linz-otago" : null;
        return [{ type: "figure", ...(imageId ? { imageId } : {}), alt: cleanText(block.alt || ""), caption: cleanText(block.caption || ""), credit: cleanLabel(block.source || "") }];
      }
      return [];
    });
    const passage = {
      id: passageId,
      slug: `${safeSegment(section.title).slice(0, 48)}-${hash(section.id)}`,
      articleId,
      title: section.title,
      order,
      updatedAt: date,
      themeIds: sectionThemes,
      recordIds: [chapter.id],
      blocks,
      sources: cleanSources(section.sources),
    };
    const key = `${chapter.number}:${section.id}`;
    passageIdBySection.set(key, passageId);
    passageById.set(passageId, passage);
    articlePassages.push(passage);
    passages.push(passage);
  }
  const allText = articlePassages.flatMap((passage) => passage.blocks.filter((block) => block.type === "paragraph").map((block) => block.text));
  const title = chapter.name;
  const firstText = allText[0] || title;
  const articleThemeIds = [...new Set(articlePassages.flatMap((passage) => passage.themeIds))];
  const header = snapshot.headerImages?.[oldPath];
  const headerAssetPath = header?.file;
  let headerImageId = null;
  if (headerAssetPath?.endsWith("heading-034.jpg")) headerImageId = "image:linz-pauatahanui";
  const article = {
    id: articleId,
    slug,
    title,
    url: articleUrl,
    summary: firstText.slice(0, 230),
    status: "published",
    updatedAt: date,
    readingOrder: chapter.number,
    themeIds: articleThemeIds,
    featured: false,
    ...(headerImageId ? { headerImageId } : {}),
      sourceNotes: (chapter.sourceNotes || []).map((note, index) => ({ id: note.id || `ch${chapter.number}-note-${index + 1}`, text: cleanNote(note.text) })).filter((note) => note.text),
  };
  articles.push(article);
  const storyRecord = {
    id: chapter.id,
    articleId,
    slug,
    name: title,
    kind: "Story",
    category: chapter.category || "Narrative",
    url: articleUrl,
    description: cleanText(firstText.slice(0, 420)),
    story: [],
    sources: [],
    aliases: [],
    themeIds: articleThemeIds,
  };
  storyRecords.push(storyRecord);
  for (const passage of articlePassages) passageRecords.set(passage.id, new Set([chapter.id]));
}

const nonChapterRecords = snapshot.records.filter((item) => item.kind !== "Chapter");
for (const record of nonChapterRecords) {
  for (const ref of record.passages || []) {
    const chapter = chapterByNumber.get(Number(ref.chapter));
    const sectionId = ref.id || ref.url?.split("#")[1]?.replace(/\/$/, "");
    if (!chapter || !sectionId) continue;
    const passageId = passageIdBySection.get(`${chapter.number}:${sectionId}`);
    if (!passageId) continue;
    const ids = passageRecords.get(passageId) || new Set();
    ids.add(record.id);
    passageRecords.set(passageId, ids);
  }
}
for (const passage of passages) {
  passage.recordIds = [...(passageRecords.get(passage.id) || new Set(passage.recordIds))];
}

for (const article of articles) {
  const articlePassages = passages.filter((passage) => passage.articleId === article.id);
  article.themeIds = [...new Set(articlePassages.flatMap((passage) => passage.themeIds))];
  const storyRecord = storyRecords.find((record) => record.id === `chapter:${article.readingOrder}`);
  if (storyRecord) storyRecord.themeIds = [...article.themeIds];
}

const sourceRecordById = new Map(nonChapterRecords.map((record) => [record.id, record]));
const migratedRecords = nonChapterRecords.map((record) => {
  const profileSourceGroups = cleanSourceGroups(record.biographyParagraphSources || []);
  const storySourceGroups = cleanSourceGroups(record.paragraphSources || []);
  const contentSections = (record.contentSections || []).map((section) => ({
    title: cleanText(section.title),
    paragraphs: (section.paragraphs || []).filter(Boolean).map(cleanText),
  }));
  const photoGallery = record.photoGallery ? {
    title: cleanText(record.photoGallery.title || "Photographs"),
    intro: cleanText(record.photoGallery.intro || ""),
    credit: cleanText(record.photoGallery.credit || ""),
    items: (record.photoGallery.items || []).map((item) => ({
      alt: cleanText(item.alt || ""),
      caption: cleanText(item.caption || ""),
      ...(item.people ? { people: item.people.map((group) => ({ label: group.label, ids: group.ids || [] })) } : {}),
    })),
  } : undefined;
  const themesForRecord = [...new Set((record.passages || []).flatMap((ref) => {
    const chapter = chapterByNumber.get(Number(ref.chapter));
    const sectionId = ref.id || ref.url?.split("#")[1]?.replace(/\/$/, "");
    const passageId = chapter && sectionId ? passageIdBySection.get(`${chapter.number}:${sectionId}`) : null;
    return passageId ? passageById.get(passageId)?.themeIds || [] : [];
  }))];
  return {
    id: record.id,
    slug: record.slug,
    name: cleanText(record.name),
    kind: record.kind,
    category: record.category || record.kind,
    url: record.url,
    ...(record.website !== undefined ? { website: record.website } : {}),
    ...(record.description ? { description: cleanText(record.description) } : {}),
    story: Array.isArray(record.story) ? record.story.filter(Boolean).map(cleanText) : [],
    sources: cleanSources(record.sources),
    aliases: record.aliases || [],
    themeIds: themesForRecord,
    ...(record.status ? { status: record.status } : {}),
    ...(record.coverageEnd != null ? { coverageEnd: record.coverageEnd } : {}),
    ...(record.currentCouncil != null ? { currentCouncil: record.currentCouncil } : {}),
    paragraphSources: storySourceGroups,
    biographyParagraphSources: profileSourceGroups,
    ...(record.contextLinks?.length ? { contextLinks: record.contextLinks.flatMap((link) => cleanSources([link])) } : {}),
    ...(contentSections.length ? { contentSections } : {}),
    ...(record.recollections?.length ? { recollections: record.recollections.map(cleanText) } : {}),
    ...(photoGallery ? { photoGallery } : {}),
  };
});

const themeColors = ["#74b9ae", "#8aa7d8", "#d28e6f", "#b69bc9", "#c4a85a", "#68a8c6", "#8bb17a"];
const themes = snapshot.themes.map((theme, index) => {
  const stops = (theme.stops || []).flatMap((stop) => {
    const sectionId = stop.sectionId || stop.url?.split("#")[1]?.replace(/\/$/, "");
    const passageId = sectionId ? passageIdBySection.get(`${stop.chapter}:${sectionId}`) : null;
    const article = chapterByNumber.get(Number(stop.chapter));
    return passageId && article ? [{ passageId, title: stop.sectionTitle || stop.sectionId, url: `${routeForChapter.get(article.id)}#${sectionId}` }] : [];
  });
  return {
    id: theme.id,
    slug: safeSegment(theme.id),
    title: theme.title,
    description: cleanText(theme.description || ""),
    color: themeColors[index % themeColors.length],
    passageIds: [...new Set(stops.map((stop) => stop.passageId))],
    stops,
  };
});

const validRecordIds = new Set([...migratedRecords, ...storyRecords].map((record) => record.id));
const relationships = snapshot.edges.map((edge, index) => {
  if (!validRecordIds.has(edge.a) || !validRecordIds.has(edge.b)) throw new Error(`Relationship ${index + 1} has an unknown endpoint.`);
  let contextPassages = [];
  const chapterId = chapterById.has(edge.a) ? edge.a : chapterById.has(edge.b) ? edge.b : null;
  const entityId = chapterId === edge.a ? edge.b : chapterId === edge.b ? edge.a : null;
  if (chapterId && entityId) {
    const entity = sourceRecordById.get(entityId);
    contextPassages = (entity?.passages || []).flatMap((ref) => {
      if (Number(ref.chapter) !== chapterById.get(chapterId).number) return [];
      const sectionId = ref.id || ref.url?.split("#")[1]?.replace(/\/$/, "");
      const id = passageIdBySection.get(`${chapterById.get(chapterId).number}:${sectionId}`);
      return id ? [id] : [];
    });
  }
  return {
    id: `relationship:baseline-${String(index + 1).padStart(4, "0")}`,
    a: edge.a,
    b: edge.b,
    label: cleanText(edge.label),
    basis: cleanText(edge.basis),
    passageIds: [...new Set(contextPassages)],
    sources: [],
  };
});

const events = snapshot.events.map((event) => {
  const sectionId = event.sectionId || event.canonicalUrl?.split("#")[1]?.replace(/\/$/, "");
  const chapter = chapterByNumber.get(Number(event.chapter));
  const passageId = chapter && sectionId ? passageIdBySection.get(`${chapter.number}:${sectionId}`) : null;
  const passage = passageId ? passageById.get(passageId) : null;
  const articleUrl = chapter ? routeForChapter.get(chapter.id) : "/timeline/";
  const related = [...new Set([...(event.related || []), ...(event.placeIds || []), ...(passage?.recordIds || [])])].filter((id) => validRecordIds.has(id));
  const passageSources = passage ? cleanSources(passage.blocks.filter((block) => block.type === "paragraph").flatMap((block) => block.sources || [])) : [];
  return {
    id: event.id,
    dateDisplay: event.dateDisplay,
    startDate: event.startDate,
    ...(event.endDate ? { endDate: event.endDate } : {}),
    datePrecision: event.datePrecision,
    ...(Number.isFinite(event.year) ? { year: event.year } : {}),
    label: cleanText(event.label),
    summary: cleanText(event.summary || ""),
    url: passage && chapter ? `${articleUrl}#${passage.slug}` : "/timeline/",
    passageIds: passage ? [passage.id] : [],
    recordIds: related,
    themeIds: passage?.themeIds || [],
    categories: event.categories || [],
    sources: passageSources,
  };
});

const imageRows = [
  {
    id: "image:linz-pauatahanui",
    slug: "linz-pauatahanui",
    title: "Pauatahanui",
    assetPath: "/assets/images/heading-034.jpg",
    sourceUrl: "https://data.linz.govt.nz/",
    sourceName: "LINZ Data Service",
    credit: "LINZ (2021)",
    licence: "Creative Commons Attribution 4.0 International (CC BY 4.0)",
    licenceUrl: "https://creativecommons.org/licenses/by/4.0/",
    altText: "Aerial image of Pauatahanui Inlet and the surrounding landscape.",
    caption: "Pauatahanui. Imagery CC4.0 LINZ 2021.",
  },
  {
    id: "image:linz-otago",
    slug: "linz-otago",
    title: "Otago",
    assetPath: "/assets/images/figure-20.jpg",
    sourceUrl: "https://data.linz.govt.nz/",
    sourceName: "LINZ Data Service",
    credit: "LINZ (2021)",
    licence: "Creative Commons Attribution 4.0 International (CC BY 4.0)",
    licenceUrl: "https://creativecommons.org/licenses/by/4.0/",
    altText: "Aerial image of Otago. The original image labels coordinates 169.30483°E, 44.3903°S.",
    caption: "Otago. Imagery CC4.0 LINZ 2021.",
  },
];
for (const image of imageRows) {
  await access(path.join(root, "public", image.assetPath.replace(/^\//, "")));
}

const imageIdByAsset = new Map(imageRows.map((item) => [item.assetPath, item.id]));
// The Otago crop is reused in two published passages; associate it by its public asset path.
for (const chapter of chapters) {
  for (const section of chapter.sections || []) {
    const passageId = passageIdBySection.get(`${chapter.number}:${section.id}`);
    const passage = passageById.get(passageId);
    const figures = (section.blocks || []).filter((block) => block.type === "figure");
    const migratedFigures = passage.blocks.filter((block) => block.type === "figure");
    for (let index = 0; index < figures.length; index++) {
      const sourceFigure = figures[index];
      const targetFigure = migratedFigures[index];
      if (sourceFigure.asset && imageIdByAsset.has(sourceFigure.asset)) targetFigure.imageId = imageIdByAsset.get(sourceFigure.asset);
    }
  }
}

for (const article of articles) await writeItem("articles", article.slug, article);
for (const passage of passages) await writeItem("passages", `${passage.articleId.replace("article:", "")}-p${String(passage.order + 1).padStart(3, "0")}`, passage);
for (const record of [...migratedRecords, ...storyRecords]) await writeItem("records", record.slug, record);
for (const event of events) await writeItem("events", event.id, event);
for (const relationship of relationships) await writeItem("relationships", relationship.id, relationship);
for (const theme of themes) await writeItem("themes", theme.slug, theme);
for (const image of imageRows) await writeItem("images", image.slug, image);

const legacyRedirects = chapters.map((chapter) => `${chapter.url.replace(/\/$/, "")} ${routeForChapter.get(chapter.id)} 301`);
await writeFile(path.join(root, "public", "_redirects"), legacyRedirects.join("\n") + "\n");

const writtenCounts = Object.fromEntries(await Promise.all(collectionNames.map(async (name) => [name, (await readdir(path.join(root, "src", "content", name))).filter((file) => file.endsWith(".json")).length])));
console.log("Imported published baseline into editable content collections.");
console.log(JSON.stringify({ writtenCounts, paragraphCount: passages.reduce((n, passage) => n + passage.blocks.filter((block) => block.type === "paragraph").length, 0), figureBlocks: passages.reduce((n, passage) => n + passage.blocks.filter((block) => block.type === "figure").length, 0), notes: articles.reduce((n, article) => n + article.sourceNotes.length, 0), legacyRedirects: legacyRedirects.length, sourceSnapshot: "canonical-000001 + editorial-000007" }, null, 2));
