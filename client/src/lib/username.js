function collapseInternalWhitespace(value) {
  return value.replace(/\s+/g, " ");
}

export function normalizeUsername(raw) {
  if (raw == null || typeof raw !== "string") return "";
  let s = raw.trim();
  s = collapseInternalWhitespace(s);
  s = s.normalize("NFKC");
  return s.toLowerCase();
}

export function prepareDisplayName(raw) {
  if (raw == null || typeof raw !== "string") return "";
  let s = raw.trim();
  s = collapseInternalWhitespace(s);
  return s;
}

const USERNAME_ALLOWED = /^[a-zA-Z0-9\s_.-]+$/;

/** Mirrors server rules for client-side UX; server is authoritative. */
export function validateUsername(raw) {
  const displayName = prepareDisplayName(raw);
  if (!displayName) {
    return { ok: false, error: "Username is required" };
  }
  if (displayName.length < 3 || displayName.length > 30) {
    return { ok: false, error: "Username must be 3–30 characters" };
  }
  if (!USERNAME_ALLOWED.test(displayName)) {
    return {
      ok: false,
      error: "Username may only use letters, numbers, spaces, and _ - .",
    };
  }
  const usernameKey = normalizeUsername(displayName);
  if (!usernameKey) {
    return { ok: false, error: "Username is required" };
  }
  return { ok: true, displayName, usernameKey };
}
