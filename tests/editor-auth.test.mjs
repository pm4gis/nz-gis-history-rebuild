import test from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import worker from "../workers/editor-auth/src/index.js";

test("OAuth start rejects an unapproved editor origin before contacting GitHub", async () => {
  const response = await worker.fetch(
    new Request("https://editor-auth.test/auth?origin=https%3A%2F%2Fevil.example"),
    { GITHUB_CLIENT_ID: "test-client", OAUTH_STATE_SECRET: "test-only-state-secret", CMS_ORIGINS: "https://nzgis-history-stage.pages.dev" },
  );
  assert.equal(response.status, 403);
  assert.match(await response.text(), /not allowed/);
});

test("OAuth configuration errors do not leak secret values", async () => {
  const response = await worker.fetch(
    new Request("https://editor-auth.test/auth?origin=https%3A%2F%2Fnzgis-history-stage.pages.dev"),
    { CMS_ORIGINS: "https://nzgis-history-stage.pages.dev" },
  );
  assert.equal(response.status, 503);
  assert.doesNotMatch(await response.text(), /secret|undefined/i);
});

test("only the health check and OAuth paths are exposed", async () => {
  const health = await worker.fetch(new Request("https://editor-auth.test/healthz"), {});
  const other = await worker.fetch(new Request("https://editor-auth.test/admin"), {});
  assert.equal(health.status, 200);
  assert.equal(await health.text(), "ok");
  assert.equal(other.status, 404);
});

test("OAuth callback returns a token only to the approved editor origin and GitHub account", async () => {
  const originalFetch = globalThis.fetch;
  try {
    globalThis.fetch = async (input) => {
      const url = String(input);
      if (url.includes("github.com/login/oauth/access_token")) {
        return new Response(JSON.stringify({ access_token: "test-token", scope: "public_repo" }), {
          headers: { "content-type": "application/json" },
        });
      }
      assert.ok(url.includes("api.github.com/user"));
      return new Response(JSON.stringify({ login: "pm4gis" }), {
        headers: { "content-type": "application/json", "x-oauth-scopes": "public_repo" },
      });
    };
    const env = {
      GITHUB_CLIENT_ID: "test-client",
      GITHUB_CLIENT_SECRET: "test-secret",
      OAUTH_STATE_SECRET: "test-only-state-secret",
      CMS_ORIGINS: "https://nzgis-history-stage.pages.dev",
      ALLOWED_GITHUB_LOGIN: "pm4gis",
      CALLBACK_URL: "https://editor-auth.test/callback",
    };
    const start = await worker.fetch(
      new Request("https://editor-auth.test/auth?origin=https%3A%2F%2Fnzgis-history-stage.pages.dev"), env,
    );
    assert.equal(start.status, 302);
    const authorization = new URL(start.headers.get("location"));
    const state = authorization.searchParams.get("state");
    assert.ok(state);
    assert.equal(authorization.searchParams.get("scope"), "public_repo");
    const cookie = start.headers.get("set-cookie").split(";")[0];
    const callback = await worker.fetch(
      new Request("https://editor-auth.test/callback?code=test-code&state=" + encodeURIComponent(state), { headers: { cookie } }),
      env,
    );
    assert.equal(callback.status, 200);
    const body = await callback.text();
    assert.match(body, /authorization:github:success/);
    const script = body.match(/<script nonce="[^"]+">([\s\S]*?)<\/script>/)?.[1];
    assert.ok(script);
    const messages = [];
    let handler;
    let closed = false;
    const origin = "https://nzgis-history-stage.pages.dev";
    vm.runInNewContext(script, {
      window: {
        opener: { postMessage: (...args) => messages.push(args) },
        addEventListener: (_name, callback) => { handler = callback; },
        close: () => { closed = true; },
      },
      document: { body: { textContent: "" } },
    });
    assert.deepEqual(messages, [["authorizing:github", origin]]);
    handler({ origin: "https://evil.example", data: "authorizing:github" });
    assert.equal(messages.length, 1);
    handler({ origin, data: "authorizing:github" });
    assert.match(messages[1][0], /^authorization:github:success:/);
    assert.match(messages[1][0], /test-token/);
    assert.equal(messages[1][1], origin);
    assert.equal(closed, true);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("OAuth callback refuses a valid state for a non-editor GitHub account", async () => {
  const originalFetch = globalThis.fetch;
  try {
    globalThis.fetch = async (input) => String(input).includes("github.com/login/oauth/access_token")
      ? new Response(JSON.stringify({ access_token: "test-token", scope: "public_repo" }), { headers: { "content-type": "application/json" } })
      : new Response(JSON.stringify({ login: "someone-else" }), { headers: { "content-type": "application/json", "x-oauth-scopes": "public_repo" } });
    const env = {
      GITHUB_CLIENT_ID: "test-client", GITHUB_CLIENT_SECRET: "test-secret",
      OAUTH_STATE_SECRET: "test-only-state-secret", CMS_ORIGINS: "https://nzgis-history-stage.pages.dev",
      ALLOWED_GITHUB_LOGIN: "pm4gis", CALLBACK_URL: "https://editor-auth.test/callback",
    };
    const start = await worker.fetch(new Request("https://editor-auth.test/auth?origin=https%3A%2F%2Fnzgis-history-stage.pages.dev"), env);
    const state = new URL(start.headers.get("location")).searchParams.get("state");
    const cookie = start.headers.get("set-cookie").split(";")[0];
    const callback = await worker.fetch(
      new Request("https://editor-auth.test/callback?code=test-code&state=" + encodeURIComponent(state), { headers: { cookie } }), env,
    );
    assert.equal(callback.status, 403);
    assert.match(await callback.text(), /not authorised to edit/);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
