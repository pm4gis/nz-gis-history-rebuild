const PRIVATE_FIELD = /(researchSources|researchRegister|mrr|editorial|review|internal|private|sourceDocument|googleDrive|drive|assetMetadata|storageMetadata|contributor|contact|email|phone|moderator|metadata)/i;
const PRIVATE_VALUE = /\/assets\/contributions\/|\/drive\/folders\/|research register source|\b(?:MRR|DR|GAP\d*|PE|OP\d*|LINZCAP|BIO|R\d*|C\d*|P\d*|UT\d*|GOV\d*)-[A-Z0-9-]{1,16}\b/i;
const EMAIL_VALUE = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i;
const DATE_PARTS = /^(\d{4})(?:-(\d{2})(?:-(\d{2}))?)?$/;

export function inspectContent({ records, chapters, events, relationships }) {
  const errors = [];
  const ids = new Set();
  const routes = new Map();
  const recordIds = new Set();
  const chapterIds = new Set();
  const eventIds = new Set();
  const relationshipIds = new Set();
  const sectionIds = new Set();
  const blockIds = new Set();
  const sourceNoteIds = new Set();
  const sourceUrl = (url, location) => {
    if (url == null || url === "") return;
    if (typeof url !== "string" || !(url.startsWith("/") || /^https?:\/\//i.test(url))) {
      errors.push(location + ": source URL must be relative or HTTP(S)");
    }
  };
  const privateKeys = (value, location) => {
    if (typeof value === "string") {
      if (/---\s*TRUNCATED\s*---|\.\.\.\s*\d+\s*more items|\d+\s+keys omitted/i.test(value)) {
        errors.push(location + ": export placeholder or truncation marker is not allowed");
      }
      if (/\.(?:label|url|basis|text|summary)$/.test(location) && PRIVATE_VALUE.test(value)) errors.push(location + ": private contributor asset or research-register reference is not allowed");
      if (EMAIL_VALUE.test(value)) errors.push(location + ": contact email is not allowed in the public slice");
      return;
    }
    if (Array.isArray(value)) {
      value.forEach((child, index) => privateKeys(child, location + "[" + index + "]"));
      return;
    }
    if (!value || typeof value !== "object") return;
    for (const [key, child] of Object.entries(value)) {
      if (PRIVATE_FIELD.test(key)) errors.push(location + "." + key + ": private or internal field is not allowed in the public slice");
      privateKeys(child, location + "." + key);
    }
  };
  const unique = (key, location, set) => {
    if (!key) errors.push(location + ": missing stable identifier");
    else if (ids.has(key)) errors.push(location + ": duplicate stable ID " + key);
    else { ids.add(key); set.add(key); }
  };
  const checkSources = (sources, location) => {
    if (sources == null) return;
    if (!Array.isArray(sources)) {
      errors.push(location + ": sources must be an array");
      return;
    }
    for (const [index, source] of sources.entries()) {
      if (!source || typeof source.label !== "string" || !source.label.trim()) errors.push(location + "[" + index + "]: source label is required");
      sourceUrl(source?.url, location + "[" + index + "]");
    }
  };
  if (records.length < 30 || records.length > 50) errors.push("records: expected 30–50 public records; found " + records.length);
  for (const record of records) {
    const location = "record " + (record.id || "(missing id)");
    unique(record.id, location, recordIds);
    if (!record.slug || !record.name || !record.kind) errors.push(location + ": slug, name and kind are required");
    const route = record.url?.replace(/\/+$/, "") || "";
    if (!route.startsWith("/")) errors.push(location + ": route must be an absolute site path");
    else if (routes.has(route)) errors.push(location + ": route collision with " + routes.get(route));
    else routes.set(route, location);
    checkSources(record.sources, location + ".sources");
  }
  for (const chapter of chapters) {
    const location = "chapter " + (chapter.id || "(missing id)");
    unique(chapter.id, location, chapterIds);
    const route = chapter.url?.replace(/\/+$/, "") || "";
    if (!route.startsWith("/")) errors.push(location + ": route must be an absolute site path");
    else if (routes.has(route)) errors.push(location + ": route collision with " + routes.get(route));
    else routes.set(route, location);
    for (const section of chapter.sections || []) {
      if (sectionIds.has(section.id)) errors.push(location + ": duplicate section ID " + section.id);
      sectionIds.add(section.id);
      for (const block of section.blocks || []) {
        if (blockIds.has(block.id)) errors.push(location + ": duplicate block ID " + block.id);
        blockIds.add(block.id);
        checkSources(block.sources, location + ".block " + block.id + ".sources");
        if (block.type === "figure" && (!block.asset || !block.alt || !block.caption || !block.source)) {
          errors.push(location + ".block " + block.id + ": figure needs an asset, alt text, caption and credit");
        }
      }
    }
    if (!chapter.heroImage?.origin || !chapter.heroImage?.license || !chapter.heroImage?.author || !chapter.heroImage?.licenseUrl) {
      errors.push(location + ": hero image needs origin, creator, licence and licence URL");
    }
    if (!Array.isArray(chapter.sourceNotes) || !chapter.sourceNotes.length) errors.push(location + ": public source notes are required");
    for (const note of chapter.sourceNotes || []) sourceNoteIds.add(note.id);
  }
  for (const event of events) {
    const location = "event " + (event.id || "(missing id)");
    unique(event.id, location, eventIds);
    if (!event.dateDisplay || !event.datePrecision || !event.label) errors.push(location + ": display date, precision and label are required");
    const start = DATE_PARTS.exec(event.startDate || "");
    const end = event.endDate ? DATE_PARTS.exec(event.endDate) : null;
    if (!start) errors.push(location + ": startDate must retain a year, month or day precision");
    if (event.endDate && !end) errors.push(location + ": endDate must retain a year, month or day precision");
    if (start && end && event.endDate < event.startDate) errors.push(location + ": endDate precedes startDate");
    checkSources(event.sources, location + ".sources");
  }
  const validTargets = new Set([...recordIds, ...chapterIds]);
  for (const relationship of relationships) {
    const location = "relationship " + (relationship.id || "(missing id)");
    unique(relationship.id, location, relationshipIds);
    if (!validTargets.has(relationship.a) || !validTargets.has(relationship.b)) errors.push(location + ": relationship endpoint is not in this slice");
    if (!relationship.label?.trim() || !relationship.basis?.trim()) errors.push(location + ": published wording and qualification are required");
    if (!relationship.evidence?.status || !relationship.evidence?.basis?.trim()) errors.push(location + ": evidence status and basis are required");
    for (const ref of relationship.evidence?.paragraphRefs || []) {
      if (ref.blockId && !blockIds.has(ref.blockId)) errors.push(location + ": context block " + ref.blockId + " is missing");
      if (!ref.blockId && !sectionIds.has(ref.sectionId) && !sourceNoteIds.has(ref.sectionId)) errors.push(location + ": context section " + ref.sectionId + " is missing");
      checkSources(ref.sources, location + ".paragraphRefs." + (ref.blockId || ref.sectionId) + ".sources");
    }
    for (const eventId of relationship.evidence?.eventIds || []) {
      if (!events.some((event) => event.id === eventId)) errors.push(location + ": context event " + eventId + " is missing");
    }
  }
  for (const value of [records, chapters, events, relationships]) privateKeys(value, "content");
  return errors;
}
