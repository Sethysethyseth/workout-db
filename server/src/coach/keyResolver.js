/**
 * Coach key resolution - ai-layer.md section 5: "BYO-key and hosted are ONE
 * code path with a different key source." The key resolves, in order, from
 *   1. the caller's own key, sent per request and never stored or logged;
 *   2. the server's hosted key, only for an entitled user;
 *   3. nothing - with a reason the client can explain in plain words.
 *
 * Pure property reads only (no env, no Prisma) so the unit lane can load it.
 */

// Anthropic keys are `sk-ant-<kind>-<body>`. A loose shape check keeps a
// pasted password or a blank from ever reaching the provider.
const KEY_FORMAT_RE = /^sk-ant-[A-Za-z0-9_-]{20,}$/;

function normalizeKey(raw) {
  if (typeof raw !== "string") return null;
  const trimmed = raw.trim();
  return trimmed ? trimmed : null;
}

function resolveCoachKey({ byoKey, hostedKey, entitled }) {
  const byo = normalizeKey(byoKey);
  if (byo) {
    if (!KEY_FORMAT_RE.test(byo)) {
      return { source: null, key: null, reason: "bad_key_format" };
    }
    return { source: "byo", key: byo, reason: null };
  }

  const hosted = normalizeKey(hostedKey);
  if (!hosted) {
    return { source: null, key: null, reason: "no_key" };
  }
  if (!entitled) {
    return { source: null, key: null, reason: "not_entitled" };
  }
  return { source: "hosted", key: hosted, reason: null };
}

module.exports = { resolveCoachKey, KEY_FORMAT_RE };
