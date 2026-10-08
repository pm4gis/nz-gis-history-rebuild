# Phase 2 staging status, 8 October 2026

## Live staging slice

- Public source: https://github.com/pm4gis/nz-gis-history-rebuild, `main`. The temporary reader domain is https://gishistory.pm4gis.nz. The existing `history.pm4gis.nz` domain was not changed.
- Cloudflare Pages project `nzgis-history-stage` builds `main` with `npm run build` to `dist`. Production deployment for commit `8371838b6c223d31a438781df21ac3a2562c357c` succeeded. GitHub Actions validated pull request #1, its Cloudflare preview loaded, and the merged commit deployed successfully.
- The sample retains Chapter 39 (16 sections and six source notes), 38 public accounts, eight events, 82 qualified links, credited imagery and a generated A5 PDF. It was reconciled to canonical release `nzgis-history-canonical-2026-10-07`, revision `canonical-000001`, SHA-256 `ef90c9a4970a4147fc50d4f9fa59d53256247d68742a4312344696472f0ed4c0`.
- Browser checks covered the homepage, chapter, timeline, search, network controls and SVG graph interaction. The SVG fallback renders 39 nodes and 82 links when WebGL is unavailable. The accessible relationship list and path finder work. The timeline presents out-of-slice links as counts instead of raw IDs.
- Tests passed (three files). The actual Pages build generated the 720,935-byte A5 PDF and verified 117 static assets totalling about 7.9 MB.

## Editor sign-in remaining

The Decap login screen loads at https://gishistory.pm4gis.nz/admin/. The OAuth Worker is deployed at `auth.gishistory.pm4gis.nz`; its `/healthz` returned `ok` from an independent Cloudflare browser rendering check. The short-lived state signing secret is stored in Cloudflare. Browser testing of the OAuth flow is pending because no GitHub OAuth App or its client credentials exist yet. The agent's cloud browser cannot use the owner's Google sign-in and its proxy returned a TLS error for the Worker hostname; Cloudflare's independent check succeeded.

Create a GitHub OAuth App while signed in as `pm4gis`:

1. Application name: `NZ GIS History staging editor`.
2. Homepage URL: `https://gishistory.pm4gis.nz/admin/`.
3. Authorization callback URL: `https://auth.gishistory.pm4gis.nz/callback`.
4. Keep the app owned by the GitHub account that can edit this public repository.
5. Leave Device Flow off and turn off “Expire user access tokens”; the current Decap proxy does not refresh them.

Enter the app's Client ID and newly generated Client Secret directly as Cloudflare Worker secrets named `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET` on Worker `nzgis-history-editor-auth`. Do not put the secret in GitHub files, issues, email or chat. The existing `OAUTH_STATE_SECRET` stays in place. Then test editor login, a controlled draft, its pull request and preview, and a merge. Mobile layout and the complete OAuth popup flow have not yet been verified.
