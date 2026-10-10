# Retired NZ GIS History staging repository

This repository is no longer deployed or maintained as a website. Production is at https://history.pm4gis.nz and the active source repository is https://github.com/pm4gis/gishistory26. The previous Cloudflare Pages project nzgis-history-stage was deleted on 10 October 2026. Retain this repository as an archival reference until the unfinished PR #9 and unique source/research material have been reconciled. Do not deploy from this repository.

---

# NZ GIS History reader

This is the staging rebuild of the NZ GIS History reader. It contains the complete published baseline released on 7 October 2026: 45 editable stories (the preface and 44 narrative groupings), 583 passages, 796 records, 167 events, 2,502 connections, seven themes and 300 source notes. The AAM / AAMHatch Wellington city model and NorthSouth GIS NZ acquisition are included in the relevant narrative and linked records. The content model has no fixed chapter count.

The migration uses the published baseline only. It excludes the separate unpublished candidate and removes internal research metadata and contributor-only file paths. The package supplied two local image copies; those have individual source and licence pages. Captions remain for published figures whose image file was not included.

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

Add as many entries as needed. A new story is an article and one or more passages; it does not need a chapter number or a template edit. Link stable IDs between entries, then run validation and review the generated preview before publishing. The migration can be reproduced from an approved published-baseline JSON with `npm run import:baseline -- /path/to/base_canonical.json`; the import source file is intentionally not stored in this repository.

## Reader interactions

The story is the default view. Story and record pages have compact interactive Sigma.js 4 network diagrams with draggable nodes and linked record navigation. The full network supports dragging nodes, rearranging and resetting positions while retaining filters, search, selection and source links. Keyboard users have text-based alternatives. The full animated network is optional. The compact timeline stays at the bottom of the screen and opens into parallel lanes. Theme filters, four accessible colour palettes (Night, Forest, Paper and Mist), reading progress and timeline selection are stored or applied in the browser. The top-right button cycles through two dark and two light palettes, including page backgrounds, text, controls and Sigma network diagrams. Motion stops when the operating system requests reduced motion. Keyboard users can follow links and controls without the animated view.

“Suggest an update” opens a prepared email to `pm4gis@gmail.com`. The site has no public submission form and no PDF function.

## Scope

This full-baseline rebuild is published to [gishistory.pm4gis.nz](https://gishistory.pm4gis.nz); the canonical publication at `history.pm4gis.nz` remains separate. Review [`IMPLEMENTATION_PLAN.md`](IMPLEMENTATION_PLAN.md) for the content update process and remaining editorial checks.
