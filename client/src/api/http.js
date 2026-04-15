const BASE_URL =
  import.meta.env.VITE_API_URL?.trim() || "http://localhost:3000";

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

export async function http(path, { method = "GET", body, headers, credentials = "include" } = {}) {
  const url = `${BASE_URL}${path}`;

  const res = await fetch(url, {
    method,
    credentials,
    headers: {
      ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
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

