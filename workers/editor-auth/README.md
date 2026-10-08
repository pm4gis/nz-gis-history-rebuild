# Decap GitHub OAuth Worker

This Worker is the OAuth callback proxy for the editor at /admin/. It keeps the GitHub client secret server-side, checks a signed short-lived state cookie, accepts only the exact staging editor origin, and verifies the GitHub login against ALLOWED_GITHUB_LOGIN before returning a token to the Decap popup.

## One-time setup

1. Create a GitHub OAuth App for the staging editor.
2. Set its callback URL to https://nzgis-history-editor-auth.duane-wilkins.workers.dev/callback.
3. Publish the Worker from this directory with Wrangler.
4. Add secrets with wrangler secret put GITHUB_CLIENT_ID, wrangler secret put GITHUB_CLIENT_SECRET, and wrangler secret put OAUTH_STATE_SECRET. Generate a random state secret of at least 32 bytes.
5. Keep CMS_ORIGINS restricted to the stable editor origin in wrangler.jsonc. Do not add arbitrary pull request preview origins; preview branches are public code.

The OAuth app needs the public_repo scope for Decap's GitHub backend. The account check is restricted to pm4gis. The Worker never writes content or exposes its client secret. Tokens are returned only to the allowlisted editor origin over the OAuth popup flow.

Run the OAuth unit smoke checks with npm test.
