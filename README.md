# NZ GIS History reader

This is a clean structural preview of a narrative-led history reader. The sample contains one story about the AAM / AAMHatch Wellington city model and the AAM acquisition of NorthSouth GIS NZ. It is designed to grow by adding records rather than extending a fixed chapter list.

## Run locally

Use Node 22.16.x, then run:

```sh
npm ci
npm run dev
```

Open the local address printed by Astro. Validate content and build the static site with:

```sh
npm test
npm run build
```

The build checks collection links and routes, runs Astro's type and template checks, generates the static pages and Pagefind index, and verifies the output. It has no PDF generation step.

## Content structure

The Git-backed editor at `/admin/` manages seven collections:

- **Stories** contain the title, summary, publication state, themes and update date.
- **Passages** hold the ordered narrative text, named sources, themes and linked records.
- **Records** give people, organisations, businesses, projects, technologies and systems their own pages.
- **Events** retain date precision and link to related passages.
- **Connections** link two records using explicit wording, context and named sources.
- **Themes** let readers filter across the narrative and visual views.
- **Images** have their own detail page for the local copy, source, credit and licence.

Add as many entries as needed. A new story is an article and one or more passages; it does not need a chapter number or a template edit. Link IDs between entries, then run validation and review the generated preview before publishing.

## Reader interactions

The story is the default view. The contextual network stays small; the full animated network is optional. The compact timeline stays at the bottom of the screen and opens into parallel lanes. Theme filters, two visual skins, reading progress and timeline selection are stored or applied in the browser. Motion stops when the operating system requests reduced motion. Keyboard users can follow links and controls without the animated view.

“Suggest an update” opens a prepared email to `pm4gis@gmail.com`. The site has no public submission form and no PDF function.

## Scope

This staging preview uses only a small AAM / NorthSouth sample and does not publish a full content migration. It is available at [gishistory.pm4gis.nz](https://gishistory.pm4gis.nz); the canonical publication at `history.pm4gis.nz` remains separate. Review [`IMPLEMENTATION_PLAN.md`](IMPLEMENTATION_PLAN.md) for the content update process.
