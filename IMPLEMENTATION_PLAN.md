# NZ GIS History reader rebuild plan

## Direction

Make the narrative the default reading experience. Treat people, organisations, projects, technologies, events, passages, images and themes as linked, independently editable records. The graph stays quiet in the page background, with a small contextual view beside the story; readers can open the larger Network view when they want it. Keep a compact timeline fixed at the bottom, expandable into lanes grouped by record type.

The reader can follow the complete narrative, narrow it by themes, resume reading in the same browser, inspect a linked record, or open a source when they want to check it. Images have their own detail pages for credit, source and licence information. The site has no PDF function and no submission form. “Suggest an update” opens a prefilled email to `pm4gis@gmail.com`.

## Content model and migration

Use the existing Astro static site and Git-backed Decap CMS, with editorial changes reviewed through the existing Git workflow. The open-ended collections for stories, passages, records, themes and images, plus events and connections, do not require a chapter number. The published baseline preserves the narrative and named sources, including the 2009 AAMHatch Wellington model and the 2014 AAM / NorthSouth GIS NZ acquisition.

## Current checkpoint — 9 October 2026

The full published baseline is imported as 45 stories including the preface, 583 passages, 796 records, 167 events, 2,502 connections, seven themes, 300 source notes and 19 figure blocks. It includes two local image copies with source and licence detail pages; other figure captions are retained where the package did not include the image file. The separate unpublished candidate, internal research metadata and contributor-only assets are excluded. Legacy story routes redirect to the new article routes.

The reader, persistent parallel timeline, theme filters, light and dark skins, browser resume link, optional animated network, record routes, editor config and email-only suggestion link are implemented. Content validation checks all imported links and source references. This is a staging-only rebuild; the canonical `history.pm4gis.nz` publication remains separate.

## Work sequence

1. Establish the article, passage, theme, image, event, relationship and record schemas; validate cross-links and date precision.
2. Build a responsive narrative reader with saved browser progress, reader-selected themes, linked record pages, a source drawer and image detail pages.
3. Add the persistent mini timeline and expandable parallel lanes; synchronise event selection with passages and the contextual graph. Keep the animated full network optional.
4. Update the editor fields and publishing notes so an editor can create and update items without changing templates. Keep suggestions as an email link with a prepared subject and prompts.
5. Check the complete build, responsive layout, keyboard interaction, reduced-motion mode and content references before publishing to the staging hostname. Keep the canonical publication untouched.

## Updating content

Editors update the JSON entries in `/admin/`. A story is an article entry plus any number of ordered passage entries. Each passage carries its themes, linked records and named sources. Events point to one or more passages; relationships point to two records and can cite their related passages. New material appears in the reader when the related records are published and the static site rebuild completes. “Updated” dates are editorial metadata and must be changed when text changes; they are not generated from a build timestamp.

Before publishing, check that IDs and slugs are unique, linked IDs exist, date precision is present, each image has alt text and a source/credit/licence record, and new relationships have a clear label and source or published passage. Git history and pull-request review retain the change trail.

## Later phases

- Review the migrated narratives and source notes with an editor, including dates, labels and their links to passages.
- Check Decap response time and editorial workflow with the complete collection size; add a visual draft preview if needed.
- Confirm the legacy redirects and search indexing after staging publication.
- Review image reuse permissions and local-copy rules item by item; do not copy an image solely because it is visible online.
- Keep staging and production domains separate; publishing the migrated baseline does not update the canonical site.
