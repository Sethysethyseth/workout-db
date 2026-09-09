/**
 * Thin provider adapter for the coach (ai-layer.md section 5: "deliberately
 * abstracted behind a thin adapter"). Talks to the Claude Messages API over
 * plain HTTPS with streaming, mirroring how workosClient.js talks to WorkOS -
 * no SDK dependency, so gate item 5 (package.json) stays untouched. Swapping
 * to the official SDK later changes this one file.
 *
 * The SSE parsing pieces are pure and exported for the unit lane.
 */

const ANTHROPIC_MESSAGES_URL = "https://api.anthropic.com/v1/messages";
const ANTHROPIC_VERSION = "2023-06-01";

class CoachProviderError extends Error {
  constructor(code, message, { status = null } = {}) {
    super(message);
    this.name = "CoachProviderError";
    this.code = code;
    this.status = status;
  }
}

function mapProviderStatus(status) {
  if (status === 401) return "invalid_key";
  if (status === 403) return "forbidden";
  if (status === 404) return "unknown_model";
  if (status === 429) return "rate_limited";
  if (status === 529) return "overloaded";
  if (status === 400) return "bad_request";
  return "provider_error";
}

function extractProviderMessage(text) {
  try {
    const parsed = JSON.parse(text);
    const msg = parsed && parsed.error && parsed.error.message;
    return typeof msg === "string" && msg ? msg : null;
  } catch {
    return null;
  }
}

/** One raw SSE block ("event: x\ndata: {...}") -> { event, data } or null. */
function parseSseBlock(raw) {
  let event = null;
  const dataLines = [];
  for (const line of raw.split(/\r?\n/)) {
    if (line.startsWith("event:")) event = line.slice(6).trim();
    else if (line.startsWith("data:")) dataLines.push(line.slice(5).trimStart());
  }
  if (dataLines.length === 0) return null;
  let data;
  try {
    data = JSON.parse(dataLines.join("\n"));
  } catch {
    return null;
  }
  return { event: event ?? (data && data.type) ?? null, data };
}

/**
 * One parsed Anthropic stream event -> a coach stream item, or null when
 * the event carries nothing the coach surfaces (pings, block boundaries,
 * thinking deltas).
 */
function interpretAnthropicEvent(data) {
  if (!data || typeof data !== "object") return null;
  switch (data.type) {
    case "content_block_delta":
      if (
        data.delta &&
        data.delta.type === "text_delta" &&
        typeof data.delta.text === "string"
      ) {
        return { type: "text", text: data.delta.text };
      }
      return null;
    case "message_delta":
      return {
        type: "stop",
        stopReason: data.delta ? (data.delta.stop_reason ?? null) : null,
        usage: data.usage ?? null,
      };
    case "message_start":
      return {
        type: "start",
        model: data.message ? (data.message.model ?? null) : null,
        usage: data.message ? (data.message.usage ?? null) : null,
      };
    case "error": {
      const err = data.error || {};
      return {
        type: "error",
        code: err.type === "overloaded_error" ? "overloaded" : "provider_error",
        message:
          typeof err.message === "string" ? err.message : "The provider returned an error.",
      };
    }
    default:
      return null;
  }
}

/** Async-iterate a web ReadableStream (or any async iterable) of bytes as coach items. */
async function* iterateSse(bodyStream) {
  const decoder = new TextDecoder();
  let buffer = "";
  for await (const chunk of bodyStream) {
    buffer += decoder.decode(chunk, { stream: true });
    let idx;
    while ((idx = buffer.indexOf("\n\n")) !== -1) {
      const raw = buffer.slice(0, idx);
      buffer = buffer.slice(idx + 2);
      const block = parseSseBlock(raw);
      if (!block) continue;
      const item = interpretAnthropicEvent(block.data);
      if (item) yield item;
    }
  }
  buffer += decoder.decode();
  if (buffer.trim()) {
    const block = parseSseBlock(buffer);
    if (block) {
      const item = interpretAnthropicEvent(block.data);
      if (item) yield item;
    }
  }
}

/**
 * Stream a coach completion. Yields { type: "start" | "text" | "stop" | "error" }.
 * Throws CoachProviderError on a non-2xx response before any stream starts.
 */
async function* streamAnthropic({
  apiKey,
  model,
  system,
  messages,
  effort,
  maxTokens,
  signal,
  fetchImpl = fetch,
}) {
  const body = {
    model,
    max_tokens: maxTokens,
    stream: true,
    system,
    messages,
  };
  if (effort) body.output_config = { effort };

  const res = await fetchImpl(ANTHROPIC_MESSAGES_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": ANTHROPIC_VERSION,
      Accept: "text/event-stream",
    },
    body: JSON.stringify(body),
    signal,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    const code = mapProviderStatus(res.status);
    throw new CoachProviderError(
      code,
      extractProviderMessage(text) || `Provider responded with HTTP ${res.status}`,
      { status: res.status }
    );
  }
  if (!res.body) {
    throw new CoachProviderError("provider_error", "Provider returned an empty stream.");
  }

  yield* iterateSse(res.body);
}

/**
 * Non-streaming single call used for small structured jobs (palette
 * generation). Returns the parsed message body.
 */
async function completeAnthropic({
  apiKey,
  model,
  system,
  messages,
  effort,
  maxTokens,
  outputFormat,
  signal,
  fetchImpl = fetch,
}) {
  const body = {
    model,
    max_tokens: maxTokens,
    system,
    messages,
  };
  const outputConfig = {};
  if (effort) outputConfig.effort = effort;
  if (outputFormat) outputConfig.format = outputFormat;
  if (Object.keys(outputConfig).length > 0) body.output_config = outputConfig;

  const res = await fetchImpl(ANTHROPIC_MESSAGES_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": ANTHROPIC_VERSION,
    },
    body: JSON.stringify(body),
    signal,
  });

  const text = await res.text().catch(() => "");
  if (!res.ok) {
    throw new CoachProviderError(
      mapProviderStatus(res.status),
      extractProviderMessage(text) || `Provider responded with HTTP ${res.status}`,
      { status: res.status }
    );
  }
  try {
    return JSON.parse(text);
  } catch {
    throw new CoachProviderError("provider_error", "Provider returned invalid JSON.");
  }
}

module.exports = {
  ANTHROPIC_MESSAGES_URL,
  ANTHROPIC_VERSION,
  CoachProviderError,
  mapProviderStatus,
  parseSseBlock,
  interpretAnthropicEvent,
  iterateSse,
  streamAnthropic,
  completeAnthropic,
};
