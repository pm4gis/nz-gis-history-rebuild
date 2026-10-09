# Decap GitHub OAuth Worker

This Worker is the OAuth callback proxy for the editor at /admin/. It keeps the GitHub client secret server-side, checks a signed short-lived state cookie, accepts only the exact staging editor origin, and verifies the GitHub login against ALLOWED_GITHUB_LOGIN before returning a token to the Decap popup.

## One-time setup

1. Create a GitHub OAuth App for the staging editor.
2. Set its homepage to https://gishistory.pm4gis.nz/admin/ and callback URL to https://auth.gishistory.pm4gis.nz/callback.
   Leave Device Flow off. Turn off “Expire user access tokens” because this Decap proxy does not refresh them.
3. The Worker is published at auth.gishistory.pm4gis.nz, with the OAUTH_STATE_SECRET already stored in Cloudflare.
4. Add the OAuth App's GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET as Worker secrets in Cloudflare. Enter the client secret directly in the Cloudflare dashboard; do not put it in repository files or messages.
5. Keep CMS_ORIGINS restricted to the stable editor origin in wrangler.jsonc. Do not add arbitrary pull request preview origins; preview branches are public code.

The OAuth app needs the public_repo scope for Decap's GitHub backend. The account check is restricted to pm4gis. The Worker never writes content or exposes its client secret. Tokens are returned only to the allowlisted editor origin over the OAuth popup flow.

Run the OAuth unit smoke checks with npm test.
