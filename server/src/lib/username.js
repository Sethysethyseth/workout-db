function collapseInternalWhitespace(value) {
  return value.replace(/\s+/g, " ");
}

/** Trim, collapse internal spaces, NFKC, lowercase — used for uniqueness and login lookup. */
function normalizeUsername(raw) {
  if (raw == null || typeof raw !== "string") return "";
  let s = raw.trim();
  s = collapseInternalWhitespace(s);
  s = s.normalize("NFKC");
  return s.toLowerCase();
}

/** Trim and collapse spaces; preserve case for display. */
function prepareDisplayName(raw) {
  if (raw == null || typeof raw !== "string") return "";
  let s = raw.trim();
  s = collapseInternalWhitespace(s);
  return s;
}

const USERNAME_ALLOWED = /^[a-zA-Z0-9\s_.-]+$/;

/**
 * Server-authoritative username validation.
 * @returns {{ ok: true, displayName: string, usernameKey: string } | { ok: false, error: string }}
 */
function validateUsername(raw) {
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

module.exports = {
  normalizeUsername,
  prepareDisplayName,
  validateUsername,
};
