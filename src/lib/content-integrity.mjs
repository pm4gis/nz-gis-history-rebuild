const PRIVATE_FIELD = /(researchSources|researchRegister|mrr|editorial|review|internal|private|sourceDocument|googleDrive|drive|assetMetadata|storageMetadata|contributor|contact|email|phone|moderator|metadata)/i;
const PRIVATE_VALUE = /\/assets\/contributions\/|\/drive\/folders\/|research register source|\b(?:MRR|DR|GAP\d*|PE|OP\d*|LINZCAP|BIO|R\d*|C\d*|P\d*|UT\d*|GOV\d*)-[A-Z0-9-]{1,16}\b/i;
const PRIVATE_URL = /\/assets\/contributions\/|\/drive\/folders\//i;
const EMAIL_VALUE = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i;
const DATE_PARTS = /^(\d{4})(?:-(\d{2})(?:-(\d{2}))?)?$/;

export function inspectContent({ records = [], events = [], relationships = [], articles = [], passages = [], themes = [], images = [] }) {
  const errors = [];
  const ids = { records: new Set(), events: new Set(), relationships: new Set(), articles: new Set(), passages: new Set(), themes: new Set(), images: new Set() };
  const allIds = new Set();
  const routes = new Map();
  const sources = (items, at) => {
    if (items == null) return;
    if (!Array.isArray(items)) { errors.push(at + ": sources must be a list"); return; }
    items.forEach((source, index) => {
      if (!source?.label?.trim()) errors.push(at + "[" + index + "]: source label is required");
      if (source?.url && !(source.url.startsWith("/") || /^https?:\/\//i.test(source.url))) errors.push(at + "[" + index + "]: source URL must be a site path or HTTP(S)");
    });
  };
  const unique = (id, at, type) => {
    if (!id) errors.push(at + ": stable ID is required");
    else if (allIds.has(id)) errors.push(at + ": duplicate stable ID " + id);
    else { allIds.add(id); ids[type].add(id); }
  };
  const route = (path, at) => {
    const clean = path?.replace(/\/+$/, "") || "";
    if (!clean.startsWith("/")) errors.push(at + ": route must start with /");
    else if (routes.has(clean)) errors.push(at + ": route collision with " + routes.get(clean));
    else routes.set(clean, at);
  };
  const privateFields = (value, at) => {
    if (typeof value === "string") {
      if (/---\s*TRUNCATED\s*---|\.\.\.\s*\d+\s*more items|\d+\s+keys omitted/i.test(value)) errors.push(at + ": export placeholder is not allowed");
      if (/\.url$/.test(at) && PRIVATE_URL.test(value)) errors.push(at + ": private contributor asset URL is not allowed");
      if (/\.(?:label|basis|text|summary)$/.test(at) && PRIVATE_VALUE.test(value)) errors.push(at + ": private contributor asset or research-register reference is not allowed");
      if (EMAIL_VALUE.test(value)) errors.push(at + ": contact email is not allowed in public content");
      return;
    }
    if (Array.isArray(value)) { value.forEach((child, index) => privateFields(child, at + "[" + index + "]")); return; }
    if (!value || typeof value !== "object") return;
    for (const [key, child] of Object.entries(value)) {
      if (PRIVATE_FIELD.test(key)) errors.push(at + "." + key + ": private or internal field is not allowed in public content");
      privateFields(child, at + "." + key);
    }
  };

  for (const theme of themes) {
    const at = "theme " + (theme.id || "(missing ID)"); unique(theme.id, at, "themes");
    if (!theme.slug || !theme.title) errors.push(at + ": title and slug are required");
  }
  const articleById = new Map(articles.map((article) => [article.id, article]));
  for (const record of records) {
    const at = "record " + (record.id || "(missing ID)"); unique(record.id, at, "records");
    if (!record.slug || !record.name || !record.kind) errors.push(at + ": name, type and slug are required");
    if (record.kind === "Story") {
      const article = articleById.get(record.articleId);
      if (!article || article.url !== record.url) errors.push(at + ": story record must link to its matching article route");
    } else route(record.url, at);
    sources(record.sources, at + ".sources");
    (record.paragraphSources || []).forEach((group, index) => sources(group, at + ".paragraphSources[" + index + "]"));
    (record.biographyParagraphSources || []).forEach((group, index) => sources(group, at + ".biographyParagraphSources[" + index + "]"));
    sources(record.contextLinks, at + ".contextLinks");
    for (const id of record.themeIds || []) if (!ids.themes.has(id)) errors.push(at + ": theme " + id + " is missing");
  }
  for (const article of articles) {
    const at = "story " + (article.id || "(missing ID)"); unique(article.id, at, "articles");
    if (!article.title || !article.slug || !article.summary || !article.updatedAt) errors.push(at + ": title, slug, summary and update date are required");
    route(article.url, at);
    for (const id of article.themeIds || []) if (!ids.themes.has(id)) errors.push(at + ": theme " + id + " is missing");
  }
  for (const passage of passages) {
    const at = "passage " + (passage.id || "(missing ID)"); unique(passage.id, at, "passages");
    if (!passage.title || !passage.slug || !passage.articleId || !passage.updatedAt) errors.push(at + ": title, anchor, parent story and update date are required");
    if (!ids.articles.has(passage.articleId)) errors.push(at + ": story " + passage.articleId + " is missing");
    for (const id of passage.themeIds || []) if (!ids.themes.has(id)) errors.push(at + ": theme " + id + " is missing");
    for (const id of passage.recordIds || []) if (!ids.records.has(id)) errors.push(at + ": record " + id + " is missing");
    const blocks = passage.blocks || [];
    if (!blocks.length && !passage.paragraphs?.length) errors.push(at + ": at least one narrative block is required");
    blocks.forEach((block, index) => {
      if (block.type === "paragraph" && !block.text?.trim()) errors.push(at + ".blocks[" + index + "]: paragraph text is required");
      if (block.type === "figure" && !block.caption?.trim()) errors.push(at + ".blocks[" + index + "]: figure caption is required");
      if (!['paragraph', 'figure'].includes(block.type)) errors.push(at + ".blocks[" + index + "]: unsupported block type");
      sources(block.sources, at + ".blocks[" + index + "].sources");
    });
    (passage.paragraphs || []).forEach((paragraph, index) => sources(paragraph.sources, at + ".paragraphs[" + index + "].sources"));
    sources(passage.sources, at + ".sources");
  }
  for (const article of articles) {
    if (article.status === "published" && !passages.some((passage) => passage.articleId === article.id)) errors.push("story " + article.id + ": a published story needs a passage");
  }
  for (const event of events) {
    const at = "event " + (event.id || "(missing ID)"); unique(event.id, at, "events");
    if (!event.dateDisplay || !event.datePrecision || !event.label) errors.push(at + ": date, precision and label are required");
    const unknownDate = event.datePrecision === "unknown" || event.startDate === "unknown";
    const start = unknownDate ? null : DATE_PARTS.exec(event.startDate || "");
    const end = event.endDate ? DATE_PARTS.exec(event.endDate) : null;
    if (!unknownDate && !start) errors.push(at + ": start date must keep year, month or day precision");
    if (event.endDate && !end) errors.push(at + ": end date must keep year, month or day precision");
    if (start && end && event.endDate < event.startDate) errors.push(at + ": end date precedes start date");
    const validPrecision = new Set(["day", "month", "year", "approximate", "range", "year-range", "day-range", "decade", "unknown"]);
    if (!validPrecision.has(event.datePrecision)) errors.push(at + ": date precision is not recognised");
    for (const id of event.passageIds || []) if (!ids.passages.has(id)) errors.push(at + ": passage " + id + " is missing");
    for (const id of event.recordIds || []) if (!ids.records.has(id)) errors.push(at + ": record " + id + " is missing");
    for (const id of event.themeIds || []) if (!ids.themes.has(id)) errors.push(at + ": theme " + id + " is missing");
    sources(event.sources, at + ".sources");
  }
  for (const relationship of relationships) {
    const at = "relationship " + (relationship.id || "(missing ID)"); unique(relationship.id, at, "relationships");
    if (!ids.records.has(relationship.a) || !ids.records.has(relationship.b)) errors.push(at + ": both endpoints must be records in the collection");
    if (!relationship.label?.trim() || !relationship.basis?.trim()) errors.push(at + ": relationship wording and basis are required");
    for (const id of relationship.passageIds || []) if (!ids.passages.has(id)) errors.push(at + ": passage " + id + " is missing");
    sources(relationship.sources, at + ".sources");
  }
  for (const image of images) {
    const at = "image " + (image.id || "(missing ID)"); unique(image.id, at, "images");
    if (!image.slug || !image.title || !image.altText || !image.credit || !image.licence) errors.push(at + ": title, slug, alternative text, credit and licence are required");
    route("/images/" + image.slug + "/", at);
    for (const id of image.themeIds || []) if (!ids.themes.has(id)) errors.push(at + ": theme " + id + " is missing");
    sources([{ label: image.sourceName, url: image.sourceUrl }, { label: image.licence, url: image.licenceUrl }], at + ".attribution");
  }
  for (const passage of passages) for (const [index, block] of (passage.blocks || []).entries()) {
    if (block.imageId && !ids.images.has(block.imageId)) errors.push("passage " + passage.id + ".blocks[" + index + "]: image " + block.imageId + " is missing");
  }
  for (const theme of themes) {
    for (const id of theme.passageIds || []) if (!ids.passages.has(id)) errors.push("theme " + theme.id + ": passage " + id + " is missing");
    for (const stop of theme.stops || []) if (!ids.passages.has(stop.passageId)) errors.push("theme " + theme.id + ": stop passage " + stop.passageId + " is missing");
  }
  privateFields([records, events, relationships, articles, passages, themes, images], "content");
  return errors;
}
