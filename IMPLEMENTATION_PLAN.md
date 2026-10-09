# NZ GIS History reader rebuild plan

## Direction

Make the narrative the default reading experience. Treat people, organisations, projects, technologies, events, passages, images and themes as linked, independently editable records. The graph stays quiet in the page background, with a small contextual view beside the story; readers can open the larger Network view when they want it. Keep a compact timeline fixed at the bottom, expandable into lanes grouped by record type.

The reader can follow the complete narrative, narrow it by themes, resume reading in the same browser, inspect a linked record, or open a source when they want to check it. Images have their own detail pages for credit, source and licence information. The site has no PDF function and no submission form. “Suggest an update” opens a prefilled email to `pm4gis@gmail.com`.

## First structural slice

Use the existing Astro static site and Git-backed Decap CMS, with editorial changes reviewed through the existing Git workflow. Add open-ended collections for articles, passages, themes and images, and adapt events and relationships so new records do not need a chapter number. The sample demonstrates the 2009 AAMHatch Wellington model and the 2014 AAM / NorthSouth GIS NZ acquisition using the published account text and its named sources. This is a model of the content structure, not a migration of the complete publication.

## Current checkpoint — 9 October 2026

The structural rebuild contains one AAM / AAMHatch and NorthSouth GIS NZ story, two ordered passages, three linked records, two year-precision events, two connections and two themes. The image collection, image detail route and editor fields are ready, with no unrelated legacy image carried into this sample. The old chapter entry, prior record/event/connection imports and PDF generator have been removed from the staging source.

The reader, persistent parallel timeline, theme filters, light and dark skins, browser resume link, optional animated network, record routes, editor config and email-only suggestion link are implemented. `npm test`, content validation, Astro checks, the static build, Pagefind indexing and generated-output checks pass. This is a staging-only rebuild; the canonical `history.pm4gis.nz` publication remains separate.

## Work sequence

1. Establish the article, passage, theme, image, event, relationship and record schemas; validate cross-links and date precision.
2. Build a responsive narrative reader with saved browser progress, reader-selected themes, linked record pages, a source drawer and image detail pages.
3. Add the persistent mini timeline and expandable parallel lanes; synchronise event selection with passages and the contextual graph. Keep the animated full network optional.
4. Update the editor fields and publishing notes so an editor can create and update items without changing templates. Keep suggestions as an email link with a prepared subject and prompts.
5. Check the sample build, responsive layout, keyboard interaction, reduced-motion mode and content references before publishing to the staging hostname. Keep the canonical publication untouched.

## Updating content

Editors update the JSON entries in `/admin/`. A story is an article entry plus any number of ordered passage entries. Each passage carries its themes, linked records and named sources. Events point to one or more passages; relationships point to two records and can cite their related passages. New material appears in the reader when the related records are published and the static site rebuild completes. “Updated” dates are editorial metadata and must be changed when text changes; they are not generated from a build timestamp.

Before publishing, check that IDs and slugs are unique, linked IDs exist, date precision is present, each image has alt text and a source/credit/licence record, and new relationships have a clear label and source or published passage. Git history and pull-request review retain the change trail.

## Later phases

- Migrate the existing publication into articles and passages without requiring a fixed number of chapters.
- Add a visual draft preview for editors and check how Decap handles the nested passage workflow at the full collection size.
- Add broader search, route sharing, and optional reading routes once the sample interactions have been reviewed.
- Review image reuse permissions and local-copy rules item by item; do not copy an image solely because it is visible online.
- Keep staging and production domains separate until the migrated sample and editorial workflow are approved.
