const rawBaseUrl = import.meta.env.VITE_API_URL?.trim();
const BASE_URL =
  rawBaseUrl ||
  (import.meta.env.DEV ? "http://localhost:3000" : "");

if (!BASE_URL) {
  throw new Error(
    "Missing VITE_API_URL. In production you must set VITE_API_URL (e.g. https://workout-db-l3gc.onrender.com)."
  );
}

const normalizedBaseUrl = BASE_URL.replace(/\/+$/, "");

if (import.meta.env.DEV) {
  console.log("[API] BASE_URL =", BASE_URL);
}

async function readJsonSafely(res) {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export class ApiError extends Error {
  constructor(message, { status, body } = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

function readAuthToken() {
  try {
    if (typeof window === "undefined") return null;
    const t = window.localStorage.getItem("authToken");
    return t && t.trim() ? t.trim() : null;
  } catch {
    return null;
  }
}

export async function http(path, { method = "GET", body, headers, credentials = "include" } = {}) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const url = `${normalizedBaseUrl}${normalizedPath}`;

  const token = readAuthToken();

  const res = await fetch(url, {
    method,
    credentials,
    headers: {
      ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(headers || {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const data = await readJsonSafely(res);

  if (!res.ok) {
    const skipGlobalUnauthorized =
      res.status === 401 && method === "GET" && path === "/auth/me";
    if (
      res.status === 401 &&
      typeof window !== "undefined" &&
      !skipGlobalUnauthorized
    ) {
      window.dispatchEvent(new Event("auth:unauthorized"));
    }
    const message =
      (data && data.error) || `Request failed (${res.status} ${res.statusText})`;
    throw new ApiError(message, { status: res.status, body: data });
  }

  return data;
}

