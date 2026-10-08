# NZ GIS History — Phase 2 staging slice

This is a new, static rebuild for review. The staging destination is `gishistory.pm4gis.nz`; the existing `history.pm4gis.nz` publication stays in place. The sample is reconciled against the active canonical release `nzgis-history-canonical-2026-10-07` at revision `canonical-000001` (SHA-256 `ef90c9a4970a4147fc50d4f9fa59d53256247d68742a4312344696472f0ed4c0`).

## Sample content

- Chapter 39, “Mapping in 3D”, with all 16 sections, six published source notes, the chapter image and LINZ credits.
- 38 public records. Their live IDs, slugs, routes, account text and published citation labels and URLs are retained.
- Eight events with their published dates and date precision.
- 82 relationships: 64 links from the active release and 18 co-mention links grounded in Chapter 39 passages. The live publication does not assign IDs to its edges, so stable IDs are derived from each preserved relationship.

The import reads the public reader data, then writes only the sample into Git. Private research datasets, editorial and review fields, contributor contact details, internal source-register identifiers and private asset-storage metadata are excluded. Published citations keep their bibliographic labels and URLs; source-register IDs are omitted. Seven relationship qualifications that named internal research work are replaced with public-facing wording. Their published endpoints and labels remain unchanged. The export snapshot and sanitized-content checksum are recorded in `src/content/provenance.json`.

## Reader views

- **Read:** the complete chapter and 38 linked account pages, with exact section anchors, image credits, source notes, adjustable reading width and type size, and a generated A5 PDF.
- **Timeline:** eight events with record, date-precision and year filters. Display dates retain the precision in the source.
- **Network:** Sigma.js with Graphology, filters by record type, relationship wording and event-year range, explicit inclusion of undated links, shortest-path finding, evidence details and a shareable query-string state.
- **Text alternative:** every node and relationship is available as HTML with links and evidence labels; the network does not require a pointer or motion.
- **Search:** Pagefind indexes the static chapter, accounts and timeline in the browser.

Links with a Chapter passage or event are labeled with that context. Other associations remain qualified and are not presented as proof of employment, collaboration or causation. Co-mentions explicitly say they do not establish a direct relationship.

## Build and checks

Use Node `22.16.0`:

```sh
npm ci --no-audit --no-fund
npm test
npm run build
```

`npm run build` validates content schemas, IDs, routes, evidence endpoints, date precision, privacy fields and media credits; runs Astro checks and the static build; builds the Pagefind index; extracts PDF fonts from pdfmake’s bundled files; generates the A5 PDF; then verifies static paths, image credits, PDF header, page size and the under-25-MiB asset target.

GitHub Actions runs the same tests and build on pull requests and changes to `main`. Cloudflare Pages uses `npm run build` and `dist` as its output. Connect it to the public GitHub repository with `main` as the staging branch and pull-request previews enabled. Do not add the live custom domain.

## Editor and OAuth

`/admin/` uses Decap CMS with the GitHub backend and `editorial_workflow`. Edits go to an editorial branch and pull request. `workers/editor-auth/` contains the OAuth callback Worker. It validates a short-lived signed state cookie, limits the editor origin to the stable staging URL, checks the GitHub login against the repository owner, and keeps the OAuth client secret in Worker secrets. Follow the setup steps in `workers/editor-auth/README.md`; secrets are not stored in this repository.

## Free-tier fit

Reader routes are static and make no runtime Function, D1, analytics or paid-service requests. The sample has 38 account pages, one chapter, eight events, one PDF and two local LINZ images. The local build produces 117 assets totalling 7.9 MB, with a 721 kB A5 PDF. On 2026-10-08, Cloudflare's [Pages limits](https://developers.cloudflare.com/pages/platform/limits/) document 500 builds per month, one build at a time, a 20-minute build timeout, 20,000 site files, 25 MiB per file, and unlimited active preview deployments. The OAuth callback is a separate Worker and shares the Free allowance of 100,000 requests per day and 10 ms CPU per invocation in the [Workers pricing](https://developers.cloudflare.com/workers/platform/pricing/) docs. The PDF still needs a build in the actual Pages environment.

This is a vertical slice, not the full 796-record migration. The private research corpus, contact details, submission inbox, full publication, reading trails and production cutover stay outside this repository.
