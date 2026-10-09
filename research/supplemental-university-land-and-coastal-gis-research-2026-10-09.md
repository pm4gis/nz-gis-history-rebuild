# Supplemental New Zealand GIS research findings

**Prepared:** 9 October 2026  
**Status:** Research-only working paper. No canonical publication content was overwritten or published.

This package expands the existing collection’s research leads around university work, Māori claimant mapping, land alienation, sea-level and coastal mapping, Koordinates, LINZ and topographic mapping. The accompanying [structured source and relationship register](./supplemental-university-land-and-coastal-gis-research-2026-10-09.json) holds source metadata, paraphrased evidence notes, access and rights cautions, and proposed research records.

## Main findings

### University research and theses

The strongest additions identified so far link GIS practice to cadastral systems, coastal change, planning risk, Māori geospatial practice and the recovery of land histories.

| Work | Institution / date | Why it matters |
|---|---|---|
| [Developing a 3D Digital Cadastral Survey System for New Zealand](https://hdl.handle.net/10092/11730) | University of Canterbury, 2015 | A Master of Geographic Information Science thesis proposing a New Zealand approach to digital 3D cadastral capability. |
| [Sea level rise: an assessment of risk, South Dunedin, New Zealand](https://hdl.handle.net/10523/8468) | University of Otago, 2009 | Integrates GIS into a local risk-assessment method. Its numeric scenario findings depend on assumptions described in the thesis and should be presented as historical research, not current forecasts. |
| [Decadal shoreline change on the New Zealand coast](https://hdl.handle.net/10523/3990) | University of Otago, 2013 | Combines orthorectified aerial imagery, GIS, GPS and beach-profile evidence across four coastal study sites. The repository says its full text is unavailable/restricted. |
| [Using Historic Satellite and 3D UAV Imagery to Map the Dynamics of the Coast … in Southland](https://openrepository.aut.ac.nz/items/17e3daab-8246-4738-bbbd-8f6c6716133b) | Auckland University of Technology, 2022 | Uses historical satellite and seasonal 3D UAV imagery to study coastal change at four Southland sites. |
| [Geospatial Analysis of Marine Habitat Representation around Waiheke](https://hdl.handle.net/10292/15445) | Auckland University of Technology, 2022 | Uses GIS, habitat mapping and spatial-planning models to explore marine protected-area representation and participatory management. |
| [Sand Dune Vegetation Monitoring … Karekare Beach](https://hdl.handle.net/10292/15135) | Auckland University of Technology, 2022 | Compares UAV vegetation-classification approaches for coastal dune monitoring. |
| [The benefits and barriers to GIS for Māori](http://hdl.handle.net/10182/655) | Lincoln University, 2005 | A Kaupapa Māori thesis on GIS opportunities and barriers, including capability, cost, access, cultural heritage and intellectual-property issues. |
| [The alienation of the Opuatia block: a GIS case study](https://hdl.handle.net/10289/17803) | University of Waikato, 2021 | Demonstrates a block-level method that connects historic Māori Land Court material with LINZ geospatial data, while documenting interoperability and archival limits. |
| [He Whare Hangarau Māori: Language, culture & technology](https://hdl.handle.net/10289/12259) | University of Waikato, 2017 | An open-access edited collection with Māori mapping and technology case studies, including Te Koronga mapping and the Indigenous Mapping Wānanga. Check the licence and chapter-level rights before reuse. |

Other high-value repository leads include theses about 3D cadastral systems, urban natural environments and health, basemap usability, Kaikōura shoreline dynamics, Māori geospatial kawa, marine spatial planning and dune vegetation mapping. The JSON register captures the leads and flags records whose exact permalink or metadata still needs confirmation.

DigitalNZ’s NZ Research portal is useful for discovery across repositories, but its result counts change over time. This is a curated sample, not an exhaustive census of New Zealand university research.

### Māori claimant mapping, CFRT and LHAD

CFRT describes mapping as support for eligible claimant groups preparing evidence for Waitangi Tribunal hearings or settlement negotiations. Its page identifies mapping of alienation events, raupatu, purchases, development schemes, historic block ownership, claimant rohe, wāhi tapu and land remaining in Māori ownership. It distinguishes public generic overview map books filed with the Tribunal from claimant-specific map books owned by claimant groups; it also notes that many maps contain confidential Māori-supplied information. genui{"citation":{"ref":"turn62search0"}}

The Land History and Alienation Database, also called **Te Matua Whenua**, must be described with a narrow scope. Tribunal records place it in the Combined Central North Island Regional Inquiry and list 2005 evidence plus a separate data bundle. The Tribunal says the data is too large for download from the website and must be requested. Available evidence does not establish a single nationwide LHAD. genui{"citation":{"ref":"turn64search0"}}

The Opuatia case study is a strong, source-backed story about land-history reconstruction. It connects Māori Land Court records to LINZ spatial data to examine a defined block over time. The report also names poor interoperability and incomplete archival explanation as limitations. This supports a story about data linkage and method as well as the land-history findings; it does not justify generalising the Opuatia results to other iwi or blocks. genui{"citation":{"ref":"turn61search3"}}

The 2005 Motueka iwi/hapū GIS report, Pacey’s Lincoln thesis, Māori mapping chapters in *He Whare Hangarau Māori*, and research on bicultural spatial governance offer context for how GIS capability, knowledge, access and governance are discussed. Any claimant map, culturally sensitive information or claimant-owned research needs item-specific permission and appropriate authority before republication.

### Sea-level and coastal mapping

The research spans several different kinds of evidence that should stay distinct:

- Historical theses assess local risk or shoreline change using the assumptions, data and methods available at the time.
- Peer-reviewed studies examine exposure or possible consequences, such as insurance retreat.
- LINZ’s 3D Coastal Mapping programme builds a terrain and bathymetric baseline. It began in late 2023, runs through June 2027, and targets up to 40% of the coastline, nominally from 200 metres inland of Mean High-Water Springs to 25 metres depth, using LiDAR and multibeam. A baseline map is not itself a sea-level-rise forecast or hazard model. genui{"citation":{"ref":"turn63search0"}}

A publication-ready chronology can connect the 2008 New Zealand sea-level review, the 2009 South Dunedin planning thesis, 2013 shoreline and New Plymouth studies, 2022 Southland UAV research, 2024 insurance-retreat analysis, and the current LINZ coastal mapping programme. It must identify scenario dates, vertical datums, assumptions, uncertainty and the difference between elevation, inundation modelling and planning decisions.

### Koordinates, LINZ Data Service and topographic maps

LINZ describes the LINZ Data Service as an online place to search, preview, download and access land and seabed data through APIs. Its catalogue categories include imagery, elevation, topographic and hydrographic data, property and boundaries, ownership, place names, addresses, roads and Crown land. genui{"citation":{"ref":"turn64search3"}}

Current LDS guidance documents OGC web services, including WMTS and WFS. Access method is not a licence: each dataset’s attribution and terms must be checked. LINZ says almost all LDS data is available under CC BY 4.0, while identifying exceptions for some aerial imagery, personal-information layers and pending-approval cadastral data. genui{"citation":{"refs":["turn63search2","turn64search4"]}}

Koordinates’ own account says the LINZ Data Service was built using Koordinates Enterprise and supported by Koordinates engineers; LINZ annual reporting should be used alongside this company source. The most accurate framing separates LINZ’s role as data custodian/publisher from Koordinates’ platform and engineering role. genui{"citation":{"ref":"turn66view3"}}

The person name in the request needs care: Koordinates identifies **Ed Corkery** as its CEO. A separate GIS emergency-management presentation lead identifies an **Ed Cook** in an Eagle Technology role. Do not merge these identities or attribute Koordinates work to Ed Cook without further evidence. genui{"citation":{"refs":["turn61search4","turn66view1"]}}

LINZ’s Topo50 update history, National Library material on the topographic series, and research comparing topographic, street and canvas basemaps can support a story about the transition from printed national series to digital, service-based access. Pinpoint the exact historic map-series references before publication.

## Relationship register highlights

The structured file proposes only relationships directly supported by sources:

- **CFRT → provides mapping support to → eligible claimant groups**, as described by CFRT.
- **CFRT → supported / commissioned → Te Matua Whenua (LHAD)**, based on CFRT reporting and Tribunal evidence, qualified to the Central North Island inquiry context.
- **Jesse Whitehead → authored → Opuatia GIS case study report**, from repository metadata.
- **Opuatia study → used → Māori Land Court records and LINZ geospatial information**, from the report abstract.
- **LINZ → publishes data through → LINZ Data Service**, using LINZ service and annual-report records.
- **LINZ → runs → 3D Coastal Mapping programme**, from the official programme page.

Each relationship has its source and a description of the evidence basis in the JSON register. Co-occurrence in a source is not treated as proof of a relationship.

## Rights and data handling

The research store contains citations, repository identifiers, original summaries and evidence notes. It does not contain copied thesis or article PDFs, figures, claimant map books or other full text. Where an item is embargoed, unavailable or restricted, that status is recorded. The *He Whare Hangarau Māori* repository entry lists a CC BY-NC 4.0 licence, but attribution, noncommercial limits, chapter-level rights and third-party content still need to be checked before reusing material. LINZ dataset licences are recorded per layer in future work, not assumed from the platform.

No existing record IDs, names, slugs, text, citations, dates or accepted research were changed. This material remains outside the site’s content collections, in the reviewable research directory.

## Remaining research gaps

1. Run a systematic NZ Research and institutional-repository search across all universities, degrees, and historic GIS terms.
2. Resolve exact stable repository links and complete bibliographic fields for medium-confidence leads before importing them as publication records.
3. Find and verify additional public CFRT map books and Tribunal GIS evidence while respecting ownership, confidentiality and cultural authority.
4. Build the LINZ dataset register layer by layer: identifier, custodian, lineage, dates/revisions, scale/resolution, API, licence, and independently documented use.
5. Expand coastal research to council hazard assessments, NIWA scenarios, MfE guidance, adaptation plans and community mapping; retain model assumptions and vertical-datum details.
6. Search Survey and Spatial New Zealand, Spatial News, Esri user-group newsletters and conference proceedings for evidence not indexed in university repositories.
