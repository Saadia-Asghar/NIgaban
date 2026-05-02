/** Optional Clerk session token getter (set from App when Clerk loads). */
let clerkGetToken = null;

export function configureApiAuth({ getToken } = {}) {
  clerkGetToken = typeof getToken === "function" ? getToken : null;
}

async function bearerForRequest() {
  if (typeof localStorage === "undefined") return "";
  const otp = localStorage.getItem("nigehbaan_token") || "";
  if (clerkGetToken) {
    try {
      const jwt = await clerkGetToken();
      if (jwt) return jwt;
    } catch {
      // fall through to OTP token
    }
  }
  return otp;
}

export async function api(path, options = {}) {
  try {
    const token = await bearerForRequest();
    const res = await fetch(`/api${path}`, {
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers || {}),
      },
      ...options,
    });
    if (!res.ok) throw new Error(`Request failed ${res.status}`);
    return res.json();
  } catch {
    return {};
  }
}
