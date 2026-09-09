import { API_BASE_URL, http, readAuthToken } from "./http.js";

/**
 * In-app coach client (ai-layer.md Lane B). `getCoachStatus` is plain JSON;
 * `askCoachStream` reads the server's Server-Sent Events so the answer
 * renders as it is written instead of after a long silence.
 */

const BYO_KEY_HEADER = "x-coach-key";

export class CoachError extends Error {
  constructor(code, message, { status = null } = {}) {
    super(message);
    this.name = "CoachError";
    this.code = code;
    this.status = status;
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
    case "network":
      return "Couldn't reach LogChamp. Check your connection and try again.";
    default:
      return fallback || "The coach couldn't reach its model. Try again.";
  }
}

export function getCoachStatus({ byoKey } = {}) {
  return http("/coach/status", {
    headers: byoKey ? { [BYO_KEY_HEADER]: byoKey } : undefined,
  });
}

/** Generate a palette from a description; resolves { palette, source }. */
export function generatePalette({ description, byoKey } = {}) {
  return http("/coach/palette", {
    method: "POST",
    body: { description },
    headers: byoKey ? { [BYO_KEY_HEADER]: byoKey } : undefined,
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
  byoKey,
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
        ...(byoKey ? { [BYO_KEY_HEADER]: byoKey } : {}),
      },
      body: JSON.stringify({ question, range, unit, focus, history }),
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
      meta = evt.data;
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
