/** Optional Clerk session token getter (set from App when Clerk loads). */
let clerkGetToken = null;

export function configureApiAuth({ getToken } = {}) {
  clerkGetToken = typeof getToken === "function" ? getToken : null;
}

async function bearerForRequest(path = "") {
  const p = typeof path === "string" ? path : "";
  if (p.startsWith("/moderation")) {
    try {
      const mk = localStorage.getItem("nigehbaan_moderator_bootstrap");
      if (mk && mk.trim()) return mk.trim();
    } catch {
      // ignore
    }
  }
  if (clerkGetToken) {
    try {
      const jwt = await clerkGetToken();
      if (jwt) return jwt;
    } catch {
      // fall through to OTP / empty
    }
  }
  try {
    return localStorage.getItem("nigehbaan_token") || "";
  } catch {
    return "";
  }
}

function apiOrigin() {
  const raw = typeof import.meta.env.VITE_API_URL === "string" ? import.meta.env.VITE_API_URL.trim() : "";
  return raw.replace(/\/$/, "");
}

/**
 * @param {string} path - e.g. "/health" (becomes fetch to "/api/health" or `${VITE_API_URL}/api/health`)
 * @param {RequestInit} [options]
 */
export async function api(path, options = {}) {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  const token = await bearerForRequest(normalized);
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const origin = apiOrigin();
  const url = `${origin}/api${normalized}`;

  let res;
  try {
    res = await fetch(url, {
      ...options,
      headers: { ...headers, ...options.headers },
    });
  } catch (e) {
    const err = new Error(
      e?.message?.includes("Failed to fetch")
        ? "Network error — is the API running? Try: npm run dev:full (or set VITE_API_URL to your deployed API)."
        : e?.message || "Network error",
    );
    err.cause = e;
    throw err;
  }

  const text = await res.text();
  let body = {};
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = { error: "Server returned non-JSON", raw: text.slice(0, 240) };
    }
  }

  const looksLikeSpaHtml =
    res.ok &&
    typeof body.error === "string" &&
    body.error === "Server returned non-JSON" &&
    (String(body.raw || "").includes("<!DOCTYPE") || String(body.raw || "").includes("<html"));

  if (!res.ok || looksLikeSpaHtml) {
    if (looksLikeSpaHtml) {
      const err = new Error(
        "API returned a web page instead of JSON — the backend is probably not running. Use npm run dev:full or set VITE_API_URL to your API host.",
      );
      err.status = res.status;
      err.body = body;
      throw err;
    }
    const msg =
      typeof body.error === "string"
        ? body.error
        : typeof body.message === "string"
          ? body.message
          : `Request failed (${res.status})`;
    const err = new Error(msg);
    err.status = res.status;
    err.body = body;
    throw err;
  }

  return body;
}
