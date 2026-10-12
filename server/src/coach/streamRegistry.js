/**
 * In-memory registry of in-flight POST /coach/ask streams.
 * Keyed by user id + client streamId so one user cannot stop another's
 * answer, and a miss looks the same as an unknown id.
 * Entries are removed when the ask finishes or the owner stops it.
 *
 * A Stop can reach the server before its ask registers (the ask is still
 * loading data). That stop is remembered briefly, under the same user +
 * streamId key, and the ask aborts the moment it registers.
 */

const STREAM_ID_RE = /^[A-Za-z0-9_-]{8,80}$/;
const EARLY_STOP_TTL_MS = 2 * 60 * 1000;
const EARLY_STOP_MAX = 1000;

const entries = new Map();
const earlyStops = new Map();

function streamKey(userId, streamId) {
  return `${String(userId)}:${streamId}`;
}

function normalizeStreamId(raw) {
  if (typeof raw !== "string") return null;
  const id = raw.trim();
  if (!STREAM_ID_RE.test(id)) return null;
  return id;
}

function pruneEarlyStops(now) {
  for (const [key, expiresAt] of earlyStops) {
    if (expiresAt <= now) earlyStops.delete(key);
  }
  // Map keeps insertion order: drop the oldest past the cap.
  while (earlyStops.size > EARLY_STOP_MAX) {
    earlyStops.delete(earlyStops.keys().next().value);
  }
}

function register(userId, streamId, controller) {
  const id = normalizeStreamId(streamId);
  if (userId == null || userId === "" || !id || !controller || typeof controller.abort !== "function") {
    return false;
  }
  const key = streamKey(userId, id);
  pruneEarlyStops(Date.now());
  if (earlyStops.has(key)) {
    earlyStops.delete(key);
    try {
      controller.abort();
    } catch {
      /* already settled */
    }
    return true;
  }
  entries.set(key, {
    controller,
    userId: String(userId),
    streamId: id,
  });
  return true;
}

function finish(userId, streamId) {
  const id = normalizeStreamId(streamId);
  if (userId == null || userId === "" || !id) return;
  entries.delete(streamKey(userId, id));
}

/**
 * Abort the owner's stream. Unknown ids and other users' ids both return
 * `{ stopped: false }` and do not abort anything that is running. An
 * unknown id is remembered for this user only, in case its ask has not
 * registered yet.
 */
function stop(userId, streamId) {
  const id = normalizeStreamId(streamId);
  if (userId == null || userId === "" || !id) return { stopped: false };
  const key = streamKey(userId, id);
  const entry = entries.get(key);
  if (!entry || entry.userId !== String(userId)) {
    const now = Date.now();
    earlyStops.set(key, now + EARLY_STOP_TTL_MS);
    pruneEarlyStops(now);
    return { stopped: false };
  }
  try {
    entry.controller.abort();
  } catch {
    /* already settled */
  }
  entries.delete(key);
  return { stopped: true };
}

function resetForTests() {
  entries.clear();
  earlyStops.clear();
}

module.exports = {
  normalizeStreamId,
  register,
  finish,
  stop,
  resetForTests,
};
