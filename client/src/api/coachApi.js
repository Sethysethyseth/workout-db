import { API_BASE_URL, http, readAuthToken } from "./http.js";

/**
 * In-app coach client (ai-layer.md Lane B). `getCoachStatus` is plain JSON;
 * `askCoachStream` reads the server's Server-Sent Events so the answer
 * renders as it is written instead of after a long silence.
 */

/** Hard client timeout for non-streaming AI calls (block draft, import map, palette). */
export const AI_CALL_TIMEOUT_MS = 120_000;

export const AI_TIMEOUT_MESSAGE =
  "The coach took too long. Try again in a moment.";

export class CoachError extends Error {
  constructor(code, message, { status = null, limit = null, used = null, nextAvailableAt = null } = {}) {
    super(message);
    this.name = "CoachError";
    this.code = code;
    this.status = status;
    this.limit = limit;
    this.used = used;
    this.nextAvailableAt = nextAvailableAt;
  }
}

/** Plain-language copy per failure code; the UI never shows a raw code. */
export function coachErrorMessage(code, fallback) {
  switch (code) {
    case "rate_limited":
      return "The coach is taking a breather. Try again in a few minutes.";
    case "invalid_key":
      return "Anthropic rejected that key. Check it under Profile, AI access.";
    case "bad_key_format":
      return "That key doesn't look right. Anthropic keys start with sk-ant-.";
    case "overloaded":
      return "The model is busy right now. Try again in a moment.";
    case "refusal":
      return "The coach can't answer that one.";
    case "no_consent":
      return "AI access is off. Turn it on under Profile, AI access.";
    case "coach_unavailable":
      return "The coach isn't available on this server yet.";
    case "session_not_found":
      return "That workout isn't available to debrief.";
    case "weekly_limit":
      return "You've used this week's questions.";
    case "block_invalid":
      return "The coach's draft wasn't a valid block. Try again or paste it yourself.";
    case "block_truncated":
      return "The coach ran out of room drafting that block. Try a shorter description.";
    case "block_refused":
      return "The coach can't draft that one.";
    case "block_not_found":
      return "That block isn't available to ask about.";
    case "import_map_invalid":
      return "The coach couldn't map that layout. Try again or rename a few headers.";
    case "import_map_truncated":
      return "The coach ran out of room reading that layout. Try a shorter sample.";
    case "import_map_refused":
      return "The coach can't read that layout.";
    case "network":
      return "Couldn't reach LogChamp. Check your connection and try again.";
    default:
      return fallback || "The coach couldn't reach its model. Try again.";
  }
}

/**
 * Status JSON. `weeklyCap` is set when the hosted weekly limit applies, else null.
 * `help.available` is true when a provider key resolves, whether or not AI access is on.
 * `available` stays consent plus a resolved key.
 */
export function getCoachStatus() {
  return http("/coach/status");
}

/** Store the user's Anthropic key. The server encrypts it and returns { saved, last4 }. */
export function saveCoachKey(key) {
  return http("/coach/key", { method: "PUT", body: { key } });
}

/** Forget the stored key. Resolves with an empty body (204). */
export function deleteCoachKey() {
  return http("/coach/key", { method: "DELETE" });
}

/** Generate a palette from a description; resolves { palette, source }. */
export function generatePalette({ description, signal } = {}) {
  return http("/coach/palette", {
    method: "POST",
    body: { description },
    signal,
  });
}

/**
 * Draft or convert a block via the coach. Resolves { block, stats, source }.
 * mode: "convert" | "generate"; unit: "lb" | "kg".
 */
export function coachBlockDraft({ mode, text, unit, signal } = {}) {
  return http("/coach/block-draft", {
    method: "POST",
    body: { mode, text, unit },
    signal,
  });
}

/**
 * Ask the coach to map a spreadsheet layout to an import recipe.
 * Resolves { recipe }. Costs 3 weekly coach questions when hosted-capped.
 */
export function coachImportMap({ text, unit, signal } = {}) {
  return http("/coach/import-map", {
    method: "POST",
    body: unit ? { text, unit } : { text },
    signal,
  });
}

/**
 * Saved coach conversations. These read the user's own text and do not
 * require an AI provider call.
 */
export function listCoachConversations({ before } = {}) {
  const query = before ? `?before=${encodeURIComponent(before)}` : "";
  return http(`/coach/conversations${query}`);
}

export function getCoachConversation(id) {
  return http(`/coach/conversations/${id}`);
}

export function deleteCoachConversation(id) {
  return http(`/coach/conversations/${id}`, { method: "DELETE" });
}

export function deleteAllCoachConversations() {
  return http("/coach/conversations", { method: "DELETE" });
}

/**
 * Have AI fix an import file (bkr3). Table text -> recipe; prose -> block.
 * Resolves { kind, recipe|block, stats?, cost, remaining }. Costs 1-4 uses.
 */
export function coachImportFix({ text, unit, problems, signal } = {}) {
  const body = { text };
  if (unit) body.unit = unit;
  if (Array.isArray(problems) && problems.length > 0) body.problems = problems;
  return http("/coach/import-fix", {
    method: "POST",
    body,
    signal,
  });
}

function parseSseBlock(raw) {
  let event = null;
  const dataLines = [];
  for (const line of raw.split(/\r?\n/)) {
    if (line.startsWith("event:")) event = line.slice(6).trim();
    else if (line.startsWith("data:")) dataLines.push(line.slice(5).trimStart());
  }
  if (!event || dataLines.length === 0) return null;
  try {
    return { event, data: JSON.parse(dataLines.join("\n")) };
  } catch {
    return null;
  }
}

async function readErrorBody(res) {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

/**
 * Stream one coach answer. Resolves with { text, meta, stopReason }; rejects
 * with a CoachError whose `code` maps to copy via coachErrorMessage.
 */
export async function askCoachStream({
  question,
  range,
  unit,
  focus,
  history,
  conversationId,
  signal,
  onMeta,
  onDelta,
}) {
  const token = readAuthToken();
  let res;
  try {
    res = await fetch(`${API_BASE_URL}/coach/ask`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        Accept: "text/event-stream",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        question,
        range,
        unit,
        focus,
        history,
        ...(conversationId != null ? { conversationId } : {}),
      }),
      signal,
    });
  } catch (err) {
    if (err && err.name === "AbortError") throw err;
    throw new CoachError("network", coachErrorMessage("network"));
  }

  if (!res.ok) {
    const data = await readErrorBody(res);
    if (res.status === 401 && typeof window !== "undefined") {
      window.dispatchEvent(new Event("auth:unauthorized"));
    }
    const code =
      (data && (data.reason || data.error)) ||
      (res.status === 429 ? "rate_limited" : "provider_error");
    throw new CoachError(code, coachErrorMessage(code, data && data.message), {
      status: res.status,
      limit: data && data.limit,
      used: data && data.used,
      nextAvailableAt: data && data.nextAvailableAt,
    });
  }
  if (!res.body) {
    throw new CoachError("provider_error", coachErrorMessage("provider_error"));
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let text = "";
  let meta = null;
  let stopReason = null;

  const handle = (evt) => {
    if (evt.event === "meta") {
      meta = { ...(meta || {}), ...(evt.data || {}) };
      if (onMeta) onMeta(meta);
    } else if (evt.event === "delta") {
      const piece = typeof evt.data.text === "string" ? evt.data.text : "";
      text += piece;
      if (onDelta) onDelta(piece, text);
    } else if (evt.event === "done") {
      stopReason = evt.data ? (evt.data.stopReason ?? null) : null;
    } else if (evt.event === "error") {
      const code = evt.data && evt.data.code ? evt.data.code : "provider_error";
      throw new CoachError(code, coachErrorMessage(code, evt.data && evt.data.message));
    }
  };

  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    let idx;
    while ((idx = buffer.indexOf("\n\n")) !== -1) {
      const raw = buffer.slice(0, idx);
      buffer = buffer.slice(idx + 2);
      const evt = parseSseBlock(raw);
      if (evt) handle(evt);
    }
  }
  buffer += decoder.decode();
  if (buffer.trim()) {
    const evt = parseSseBlock(buffer);
    if (evt) handle(evt);
  }

  return { text, meta, stopReason };
}
