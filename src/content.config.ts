import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

const source = z.object({
  id: z.string().optional(),
  label: z.string().min(1),
  url: z.union([z.string().url(), z.string().startsWith("/"), z.literal("")]).optional(),
}).loose();

const article = z.object({
  id: z.string().min(1),
  slug: z.string().min(1),
  title: z.string().min(1),
  url: z.string().startsWith("/"),
  summary: z.string().min(1),
  status: z.enum(["draft", "published"]).default("draft"),
  updatedAt: z.string().min(4),
  readingOrder: z.number().int().nonnegative().optional(),
  themeIds: z.array(z.string()).default([]),
  featured: z.boolean().default(false),
  headerImageId: z.string().optional(),
  sourceNotes: z.array(z.object({ id: z.string().optional(), text: z.string().min(1) }).loose()).default([]),
}).loose();

const block = z.object({
  type: z.enum(["paragraph", "figure"]),
  text: z.string().optional(),
  markdown: z.string().optional(),
  imageId: z.string().nullable().optional(),
  alt: z.string().optional(),
  caption: z.string().optional(),
  credit: z.string().optional(),
  sources: z.array(source).default([]),
}).loose();

const passage = z.object({
  id: z.string().min(1),
  slug: z.string().min(1),
  articleId: z.string().min(1),
  title: z.string().min(1),
  order: z.number().int().nonnegative(),
  updatedAt: z.string().min(4),
  themeIds: z.array(z.string()).default([]),
  recordIds: z.array(z.string()).default([]),
  blocks: z.array(block).default([]),
  paragraphs: z.array(z.object({ text: z.string().min(1), sources: z.array(source).default([]) })).default([]),
  sources: z.array(source).default([]),
}).loose();

const record = z.object({
  id: z.string().min(1),
  slug: z.string().min(1),
  name: z.string().min(1),
  kind: z.string().min(1),
  articleId: z.string().optional(),
  url: z.string().startsWith("/"),
  description: z.string().optional(),
  story: z.array(z.string()).default([]),
  sources: z.array(source).default([]),
  aliases: z.array(z.string()).default([]),
  themeIds: z.array(z.string()).default([]),
  paragraphSources: z.array(z.array(source)).default([]),
  biographyParagraphSources: z.array(z.array(source)).default([]),
  contextLinks: z.array(source).default([]),
  contentSections: z.array(z.object({ title: z.string(), paragraphs: z.array(z.string()).default([]) }).loose()).default([]),
  recollections: z.array(z.string()).default([]),
  photoGallery: z.object({ title: z.string(), intro: z.string(), credit: z.string(), items: z.array(z.object({ alt: z.string(), caption: z.string(), people: z.array(z.object({ label: z.string(), ids: z.array(z.string()) }).loose()).optional() }).loose()) }).loose().optional(),
  coverageEnd: z.union([z.number(), z.string()]).optional(),
  currentCouncil: z.boolean().optional(),
  status: z.string().optional(),
  website: z.union([z.string().url(), z.literal(""), z.null()]).optional(),
}).loose();

const event = z.object({
  id: z.string().min(1),
  dateDisplay: z.string().min(1),
  startDate: z.string().min(1),
  endDate: z.string().nullable().optional(),
  datePrecision: z.enum(["day", "month", "year", "approximate", "range", "year-range", "day-range", "decade", "unknown"]),
  year: z.number().optional(),
  label: z.string().min(1),
  summary: z.string(),
  url: z.string().startsWith("/").optional(),
  passageIds: z.array(z.string()).default([]),
  recordIds: z.array(z.string()).default([]),
  themeIds: z.array(z.string()).default([]),
  categories: z.array(z.string()).default([]),
  sources: z.array(source).default([]),
}).loose();

const relationship = z.object({
  id: z.string().min(1),
  a: z.string().min(1),
  b: z.string().min(1),
  label: z.string().min(1),
  basis: z.string().min(1),
  passageIds: z.array(z.string()).default([]),
  sources: z.array(source).default([]),
}).loose();

const theme = z.object({
  id: z.string().min(1),
  slug: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional(),
  color: z.string().optional(),
  passageIds: z.array(z.string()).default([]),
  stops: z.array(z.object({ passageId: z.string(), title: z.string(), url: z.string() }).loose()).default([]),
}).loose();

const image = z.object({
  id: z.string().min(1),
  slug: z.string().min(1),
  title: z.string().min(1),
  assetPath: z.string().startsWith("/"),
  sourceUrl: z.string().url(),
  sourceName: z.string().min(1),
  credit: z.string().min(1),
  licence: z.string().min(1),
  licenceUrl: z.string().url(),
  altText: z.string().min(1),
  themeIds: z.array(z.string()).default([]),
  caption: z.string().optional(),
}).loose();

export const collections = {
  articles: defineCollection({ loader: glob({ base: "./src/content/articles", pattern: "**/*.json", generateId: ({ data }) => String(data.id).replace(/[^a-zA-Z0-9_-]+/g, "-") }), schema: article }),
  passages: defineCollection({ loader: glob({ base: "./src/content/passages", pattern: "**/*.json", generateId: ({ data }) => String(data.id).replace(/[^a-zA-Z0-9_-]+/g, "-") }), schema: passage }),
  records: defineCollection({ loader: glob({ base: "./src/content/records", pattern: "**/*.json", generateId: ({ data }) => String(data.id).replace(/[^a-zA-Z0-9_-]+/g, "-") }), schema: record }),
  events: defineCollection({ loader: glob({ base: "./src/content/events", pattern: "**/*.json", generateId: ({ data }) => String(data.id).replace(/[^a-zA-Z0-9_-]+/g, "-") }), schema: event }),
  relationships: defineCollection({ loader: glob({ base: "./src/content/relationships", pattern: "**/*.json", generateId: ({ data }) => String(data.id).replace(/[^a-zA-Z0-9_-]+/g, "-") }), schema: relationship }),
  themes: defineCollection({ loader: glob({ base: "./src/content/themes", pattern: "**/*.json", generateId: ({ data }) => String(data.id).replace(/[^a-zA-Z0-9_-]+/g, "-") }), schema: theme }),
  images: defineCollection({ loader: glob({ base: "./src/content/images", pattern: "**/*.json", generateId: ({ data }) => String(data.id).replace(/[^a-zA-Z0-9_-]+/g, "-") }), schema: image }),
};
