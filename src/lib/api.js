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

/**
 * @param {string} path - e.g. "/health" (becomes fetch to "/api/health")
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

  const res = await fetch(`/api${normalized}`, {
    ...options,
    headers: { ...headers, ...options.headers },
  });

  const text = await res.text();
  let body = {};
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = { error: "Server returned non-JSON", raw: text.slice(0, 240) };
    }
  }

  if (!res.ok) {
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
