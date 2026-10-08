import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

const source = z.object({
  id: z.string().optional(),
  label: z.string(),
  url: z.union([z.string().url(), z.string().startsWith("/"), z.literal("")]).optional(),
}).loose();

const passage = z.object({
  title: z.string(),
  url: z.string(),
  chapter: z.number().optional(),
  id: z.string().optional(),
}).loose();

const record = z.object({
  id: z.string().min(1),
  slug: z.string().min(1),
  name: z.string().min(1),
  kind: z.string().min(1),
  category: z.string().optional(),
  url: z.string().startsWith("/"),
  website: z.url().nullable().optional(),
  story: z.array(z.string()).default([]),
  sources: z.array(source).default([]),
  chapters: z.array(z.number()).default([]),
  aliases: z.array(z.string()).default([]),
  passages: z.array(passage).default([]),
  paragraphSources: z.unknown().optional(),
  biographyParagraphSources: z.unknown().optional(),
  contentSections: z.array(z.object({ title: z.string(), paragraphs: z.array(z.string()) }).loose()).optional(),
  contextLinks: z.array(z.object({ label: z.string(), url: z.string() }).loose()).optional(),
  photoGallery: z.unknown().optional(),
  recollections: z.array(z.unknown()).optional(),
  description: z.string().optional(),
  status: z.string().optional(),
  coverageEnd: z.union([z.string(), z.number()]).optional(),
  currentCouncil: z.boolean().nullable().optional(),
  identityNotice: z.boolean().optional(),
}).loose();

const block = z.object({
  id: z.string().min(1),
  type: z.enum(["paragraph", "figure"]),
  text: z.string().optional(),
  markdown: z.string().optional(),
  sources: z.array(source).optional(),
  asset: z.string().optional(),
  alt: z.string().optional(),
  caption: z.string().optional(),
  source: z.string().optional(),
}).loose();

const chapter = z.object({
  id: z.string().min(1),
  slug: z.string().min(1),
  name: z.string().min(1),
  kind: z.literal("Chapter"),
  category: z.string().optional(),
  url: z.string().startsWith("/"),
  number: z.number().int().positive(),
  part: z.number().int().positive(),
  chapters: z.array(z.number()).default([]),
  status: z.string().optional(),
  sections: z.array(z.object({
    id: z.string().min(1),
    title: z.string().min(1),
    blocks: z.array(block).min(1),
  })),
  sourceNotes: z.array(z.object({ id: z.string().min(1), chapter: z.number(), text: z.string().min(1) })),
  heroImage: z.object({
    path: z.string().startsWith("/"),
    origin: z.string().url(),
    title: z.string(),
    author: z.string(),
    license: z.string(),
    licenseUrl: z.string().url(),
    width: z.number().positive(),
    height: z.number().positive(),
  }),
}).loose();

const event = z.object({
  id: z.string().min(1),
  dateDisplay: z.string().min(1),
  startDate: z.string().min(4),
  endDate: z.string().nullable().optional(),
  datePrecision: z.enum(["day", "month", "year", "approximate", "range", "decade", "unknown"]),
  year: z.number().optional(),
  label: z.string().min(1),
  summary: z.string(),
  chapter: z.number(),
  chapterTitle: z.string(),
  sectionId: z.string(),
  sectionTitle: z.string(),
  url: z.string().startsWith("/"),
  sources: z.array(source).nullable().optional(),
  relatedRecordIds: z.array(z.string()).optional(),
  relatedEntityIds: z.array(z.string()).optional(),
  related: z.array(z.string()).optional(),
  evidenceStatus: z.string().optional(),
  associationLabel: z.string().optional(),
  canonicalUrl: z.string().optional(),
  categories: z.array(z.string()).optional(),
}).loose();

const relationship = z.object({
  id: z.string().min(1),
  a: z.string().min(1),
  b: z.string().min(1),
  label: z.string().min(1),
  basis: z.string().min(1),
  evidence: z.object({
    status: z.enum(["published-context-found", "source-dataset-association-only"]),
    paragraphRefs: z.array(z.object({ sectionId: z.string(), sectionTitle: z.string(), blockId: z.string().optional(), url: z.string().optional(), sources: z.array(source) })),
    eventIds: z.array(z.string()),
    basis: z.string(),
  }),
}).loose();

export const collections = {
  records: defineCollection({ loader: glob({ base: "./src/content/records", pattern: "**/*.json" }), schema: record }),
  chapters: defineCollection({ loader: glob({ base: "./src/content/chapters", pattern: "**/*.json" }), schema: chapter }),
  events: defineCollection({ loader: glob({ base: "./src/content/events", pattern: "**/*.json" }), schema: event }),
  relationships: defineCollection({ loader: glob({ base: "./src/content/relationships", pattern: "**/*.json" }), schema: relationship }),
};
