const encoder = new TextEncoder();

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });
}

function allowedOrigins(env) {
  return (env.CMS_ORIGINS || "").split(",").map((value) => value.trim()).filter(Boolean);
}

function base64url(bytes) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function fromBase64url(value) {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((value.length + 3) % 4);
  const binary = atob(padded);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

async function signState(payload, secret) {
  const key = await crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return base64url(new Uint8Array(await crypto.subtle.sign("HMAC", key, encoder.encode(payload))));
}

async function verifyState(state, secret) {
  const parts = state.split(".");
  if (parts.length !== 2 || !secret) return null;
  const expected = await signState(parts[0], secret);
  if (expected !== parts[1]) return null;
  try {
    const data = JSON.parse(new TextDecoder().decode(fromBase64url(parts[0])));
    return data.expires >= Date.now() ? data : null;
  } catch {
    return null;
  }
}

function cookieValue(request, name) {
  const prefix = name + "=";
  const cookie = request.headers.get("cookie") || "";
  const part = cookie.split(";").map((item) => item.trim()).find((item) => item.startsWith(prefix));
  return part ? part.slice(prefix.length) : "";
}

function htmlResponse(body, status = 200, nonce = "") {
  return new Response(body, {
    status,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store, max-age=0",
      "referrer-policy": "no-referrer",
      "x-content-type-options": "nosniff",
      "content-security-policy": "default-src 'none'; script-src 'nonce-" + nonce + "'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'",
    },
  });
}

function popupMessage(kind, payload, origin, nonce) {
  const message = "authorization:github:" + kind + ":" + JSON.stringify(payload);
  const handshake = "authorizing:github";
  const safeMessage = JSON.stringify(message).replace(/</g, "\\u003c");
  const safeHandshake = JSON.stringify(handshake);
  const safeOrigin = JSON.stringify(origin).replace(/</g, "\\u003c");
  const page = "<!doctype html><html><head><meta charset=\"utf-8\"><title>Editor sign-in</title></head><body><p>Returning to the editor…</p><script nonce=\"" +
    nonce + "\">if(window.opener){window.addEventListener('message',function(event){if(event.origin!==" + safeOrigin + "||event.data!==" + safeHandshake + ")return;window.opener.postMessage(" + safeMessage + "," + safeOrigin + ");window.close();});window.opener.postMessage(" + safeHandshake + "," + safeOrigin + ");}else{document.body.textContent='Return to the editor tab.';}</script></body></html>";
  const response = htmlResponse(page, kind === "success" ? 200 : 403, nonce);
  response.headers.append("set-cookie", "decap_oauth_state=; Path=/callback; Secure; HttpOnly; SameSite=Lax; Max-Age=0");
  return response;
}

function originFromRequest(request) {
  const url = new URL(request.url);
  const candidate = url.searchParams.get("origin") || request.headers.get("origin") || "";
  if (candidate) return candidate;
  const referer = request.headers.get("referer");
  if (!referer) return "";
  try { return new URL(referer).origin; }
  catch { return ""; }
}

async function startAuthorization(request, env) {
  if (!env.GITHUB_CLIENT_ID || !env.OAUTH_STATE_SECRET) return json({ error: "Editor OAuth is not configured." }, 503);
  const requestedOrigin = originFromRequest(request);
  if (!allowedOrigins(env).includes(requestedOrigin)) return json({ error: "Editor origin is not allowed." }, 403);
  const nonceBytes = crypto.getRandomValues(new Uint8Array(24));
  const payload = base64url(encoder.encode(JSON.stringify({
    nonce: base64url(nonceBytes), origin: requestedOrigin, expires: Date.now() + 10 * 60 * 1000,
  })));
  const state = payload + "." + await signState(payload, env.OAUTH_STATE_SECRET);
  const callback = env.CALLBACK_URL || new URL("/callback", request.url).toString();
  const authorize = new URL("https://github.com/login/oauth/authorize");
  authorize.searchParams.set("client_id", env.GITHUB_CLIENT_ID);
  authorize.searchParams.set("redirect_uri", callback);
  authorize.searchParams.set("scope", "public_repo");
  authorize.searchParams.set("state", state);
  return new Response(null, {
    status: 302,
    headers: {
      location: authorize.toString(),
      "cache-control": "no-store",
      "set-cookie": "decap_oauth_state=" + state + "; Path=/callback; Secure; HttpOnly; SameSite=Lax; Max-Age=600",
      "referrer-policy": "no-referrer",
    },
  });
}

async function finishAuthorization(request, env) {
  const url = new URL(request.url);
  const state = url.searchParams.get("state") || "";
  const cookieState = cookieValue(request, "decap_oauth_state");
  const verified = await verifyState(state, env.OAUTH_STATE_SECRET || "");
  const nonce = base64url(crypto.getRandomValues(new Uint8Array(16)));
  if (!verified || state !== cookieState || !allowedOrigins(env).includes(verified.origin)) {
    return htmlResponse("<!doctype html><html><head><meta charset=\"utf-8\"><title>Editor sign-in</title></head><body><p>Editor sign-in expired or could not be verified. Close this window and try again.</p></body></html>", 403, nonce);
  }
  if (url.searchParams.has("error")) {
    return popupMessage("error", { message: "GitHub sign-in was cancelled." }, verified.origin, nonce);
  }
  const code = url.searchParams.get("code");
  if (!code || !env.GITHUB_CLIENT_ID || !env.GITHUB_CLIENT_SECRET) {
    return popupMessage("error", { message: "Editor OAuth is not configured or GitHub did not return a code." }, verified.origin, nonce);
  }
  const tokenResponse = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: { "content-type": "application/json", accept: "application/json", "user-agent": "nzgis-history-editor-auth" },
    body: JSON.stringify({
      client_id: env.GITHUB_CLIENT_ID,
      client_secret: env.GITHUB_CLIENT_SECRET,
      code,
      redirect_uri: env.CALLBACK_URL || new URL("/callback", request.url).toString(),
    }),
  });
  if (!tokenResponse.ok) return popupMessage("error", { message: "GitHub did not complete editor sign-in." }, verified.origin, nonce);
  const tokenData = await tokenResponse.json();
  if (!tokenData.access_token) return popupMessage("error", { message: "GitHub did not return an editor token." }, verified.origin, nonce);
  const userResponse = await fetch("https://api.github.com/user", {
    headers: { authorization: "Bearer " + tokenData.access_token, accept: "application/vnd.github+json", "user-agent": "nzgis-history-editor-auth" },
  });
  if (!userResponse.ok) return popupMessage("error", { message: "The GitHub account could not be verified." }, verified.origin, nonce);
  const user = await userResponse.json();
  const allowedLogin = (env.ALLOWED_GITHUB_LOGIN || "").toLowerCase();
  if (!allowedLogin || String(user.login || "").toLowerCase() !== allowedLogin) {
    return popupMessage("error", { message: "This GitHub account is not authorised to edit the publication." }, verified.origin, nonce);
  }
  const scopes = String(userResponse.headers.get("x-oauth-scopes") || tokenData.scope || "").split(",").map((scope) => scope.trim());
  if (!scopes.includes("public_repo")) return popupMessage("error", { message: "GitHub did not grant the required public repository scope." }, verified.origin, nonce);
  return popupMessage("success", { token: tokenData.access_token, provider: "github", scope: "public_repo" }, verified.origin, nonce);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (request.method !== "GET") return json({ error: "Method not allowed." }, 405);
    if (url.pathname === "/healthz") return new Response("ok", { headers: { "cache-control": "no-store" } });
    if (url.pathname === "/auth") return startAuthorization(request, env);
    if (url.pathname === "/callback") return finishAuthorization(request, env);
    return json({ error: "Not found." }, 404);
  },
};
