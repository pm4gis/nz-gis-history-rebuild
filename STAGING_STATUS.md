# Staging rebuild

The staging site at https://gishistory.pm4gis.nz is a narrative-first, data-driven NZ GIS history reader. The migrated content model has no fixed chapter count and no PDF feature.

The published baseline (canonical release `nzgis-history-canonical-2026-10-07`) contains 45 stories including the preface, 583 passages, 796 records, 167 events, 2,502 connections, seven themes, 300 source notes and 19 figure blocks. It includes AAM / AAMHatch and NorthSouth GIS in their published narrative context. Two supplied image copies have individual source and licence pages; captions remain for other figures whose files were not included.

Internal research fields, contributor-only assets and the unpublished candidate package were excluded. The data is editable through the seven Decap CMS collections, and the static build validates cross-links and source references.

The site is published from the `main` branch of `pm4gis/nz-gis-history-rebuild` to Cloudflare Pages project `nzgis-history-stage`. The production domain for that project is `gishistory.pm4gis.nz`; `history.pm4gis.nz` is a separate canonical site and is not part of this rebuild.
