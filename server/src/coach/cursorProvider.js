/**
 * Cursor-hosted coach adapter. Same stream item contract as streamAnthropic
 * / streamMock (start / text / stop / error). The SDK is loaded lazily
 * inside a call so server boot never depends on it or its Node floor.
 *
 * Security properties: apiKey is passed in (never read from process env
 * here), tools is [], cwd is a fresh empty tmp dir, no settingSources,
 * no mcpServers, store under os.tmpdir().
 */

const fs = require("fs");
const os = require("os");
const path = require("path");
const { CoachProviderError } = require("./provider");

function loadCursorSdk(sdkImpl) {
  if (sdkImpl) return sdkImpl;
  try {
    return require("@cursor/sdk");
  } catch (err) {
    throw new CoachProviderError(
      "provider_error",
      err && err.message ? err.message : "Cursor SDK is not available."
    );
  }
}

function flattenSystemBlocks(system) {
  if (typeof system === "string") return system.trim();
  if (!Array.isArray(system)) return "";
  return system
    .map((block) => (block && typeof block.text === "string" ? block.text : ""))
    .filter((text) => text.trim())
    .join("\n\n");
}

function formatMessages(messages) {
  if (!Array.isArray(messages) || messages.length === 0) return "";
  const parts = messages.map((turn) => {
    const role = turn && turn.role === "assistant" ? "Assistant" : "User";
    const content = turn && typeof turn.content === "string" ? turn.content : "";
    return { role, content };
  });
  if (parts.length === 1) return parts[0].content;
  const prior = parts.slice(0, -1);
  const current = parts[parts.length - 1];
  const lines = ["Prior turns:"];
  for (const turn of prior) {
    lines.push(`${turn.role}: ${turn.content}`);
  }
  lines.push("");
  lines.push("Current question:");
  lines.push(current.content);
  return lines.join("\n");
}

function textFromDelta(update) {
  if (!update || typeof update !== "object") return null;
  if (update.type !== "text-delta") return null;
  return typeof update.text === "string" ? update.text : null;
}

function errorName(err) {
  if (!err) return "";
  if (typeof err.name === "string" && err.name) return err.name;
  if (err.constructor && typeof err.constructor.name === "string") return err.constructor.name;
  return "";
}

function isSystemPromptGateError(err) {
  if (!err) return false;
  const message = String(err.message || "");
  const code = String(err.code || "");
  const name = errorName(err);
  const namesSystem =
    /system[- ]prompt|--system-prompt/i.test(message) ||
    /system[- ]prompt|--system-prompt/i.test(code);
  if (namesSystem) return true;
  const invalidArg =
    code === "InvalidArgument" ||
    name === "InvalidArgument" ||
    /InvalidArgument/i.test(message);
  return invalidArg && /system/i.test(message);
}

function mapThrownCursorError(err) {
  if (err instanceof CoachProviderError) return err;
  const name = errorName(err);
  const message = (err && err.message) || "The coach could not reach its model.";
  if (name === "RateLimitError") {
    return new CoachProviderError("rate_limited", message);
  }
  if (name === "AuthenticationError" || name === "NetworkError") {
    return new CoachProviderError("provider_error", message);
  }
  return new CoachProviderError("provider_error", message);
}

function makeScratch() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "logchamp-coach-"));
  const cwd = path.join(root, "cwd");
  const storeDir = path.join(root, "store");
  fs.mkdirSync(cwd);
  fs.mkdirSync(storeDir);
  return { root, cwd, storeDir };
}

function cleanupScratch(root) {
  if (!root) return;
  try {
    fs.rmSync(root, { recursive: true, force: true });
  } catch {
    // tmp leftovers are acceptable
  }
}

function createStore(sdk, storeDir) {
  if (sdk && typeof sdk.JsonlLocalAgentStore === "function") {
    return new sdk.JsonlLocalAgentStore(storeDir);
  }
  return { rootDir: storeDir };
}

async function disposeAgent(agent) {
  if (!agent) return;
  try {
    if (typeof agent[Symbol.asyncDispose] === "function") {
      await agent[Symbol.asyncDispose]();
      return;
    }
    if (typeof agent.close === "function") {
      agent.close();
    }
  } catch {
    // dispose must not mask the original error
  }
}

function makeDeltaPump() {
  const pending = [];
  let wake = null;
  let finished = false;
  let finishErr = null;
  let finishVal = null;
  function signal() {
    if (wake) {
      const w = wake;
      wake = null;
      w();
    }
  }
  return {
    push(text) {
      pending.push(text);
      signal();
    },
    finish(err, val) {
      finished = true;
      finishErr = err || null;
      finishVal = val;
      signal();
    },
    async *texts() {
      while (true) {
        if (pending.length) {
          yield pending.shift();
          continue;
        }
        if (finished) {
          if (finishErr) throw finishErr;
          return finishVal;
        }
        await new Promise((resolve) => {
          wake = resolve;
        });
      }
    },
  };
}

/**
 * First JSON object in `raw`, as a string. Tolerates an optional ```json
 * fence. Returns null when nothing parse-shaped is present.
 */
function extractFirstJsonText(raw) {
  if (typeof raw !== "string" || !raw.trim()) return null;
  let text = raw.trim();
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) text = fence[1].trim();
  const start = text.indexOf("{");
  if (start === -1) return null;
  let depth = 0;
  let inStr = false;
  let escape = false;
  for (let i = start; i < text.length; i += 1) {
    const ch = text[i];
    if (inStr) {
      if (escape) escape = false;
      else if (ch === "\\") escape = true;
      else if (ch === '"') inStr = false;
      continue;
    }
    if (ch === '"') {
      inStr = true;
      continue;
    }
    if (ch === "{") depth += 1;
    else if (ch === "}") {
      depth -= 1;
      if (depth === 0) return text.slice(start, i + 1);
    }
  }
  return null;
}

/** Parsed first JSON object, or null. */
function extractFirstJsonObject(raw) {
  const jsonText = extractFirstJsonText(raw);
  if (!jsonText) return null;
  try {
    const parsed = JSON.parse(jsonText);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

async function cancelRun(run) {
  if (!run) return;
  try {
    if (typeof run.supports === "function" && !run.supports("cancel")) return;
    if (typeof run.cancel === "function") await run.cancel();
  } catch {
    // ignore cancel races
  }
}

async function* runOneAttempt({
  sdk,
  apiKey,
  model,
  systemPrompt,
  message,
  signal,
  scratch,
  systemPromptMode,
}) {
  const store = createStore(sdk, scratch.storeDir);
  const createOpts = {
    apiKey,
    model: { id: model },
    tools: [],
    local: { cwd: scratch.cwd, store },
  };
  if (systemPrompt) createOpts.systemPrompt = systemPrompt;

  let agent = null;
  let run = null;
  const pump = makeDeltaPump();
  const onAbort = () => {
    cancelRun(run);
    pump.finish(null, { status: "cancelled" });
  };

  if (signal && signal.aborted) {
    throw Object.assign(new Error("aborted"), { name: "AbortError" });
  }

  agent = await sdk.Agent.create(createOpts);
  try {
    if (signal) signal.addEventListener("abort", onAbort, { once: true });

    run = await agent.send(message, {
      onDelta({ update }) {
        const text = textFromDelta(update);
        if (text) pump.push(text);
      },
    });

    const waitDone = Promise.resolve()
      .then(() => run.wait())
      .then(
        (result) => pump.finish(null, result),
        (err) => pump.finish(err)
      );

    yield { type: "start", model, usage: null, systemPromptMode };

    const gen = pump.texts();
    let streamed = "";
    while (true) {
      const next = await gen.next();
      if (signal && signal.aborted) {
        await cancelRun(run);
        yield { type: "stop", stopReason: "cancelled" };
        await waitDone.catch(() => {});
        return;
      }
      if (next.done) {
        const result = next.value || { status: "error" };
        if (!streamed && result.status === "finished" && typeof result.result === "string" && result.result) {
          yield { type: "text", text: result.result };
          streamed = result.result;
        }
        if (result.status === "finished") {
          yield { type: "stop", stopReason: "end_turn", systemPromptMode };
        } else if (result.status === "cancelled") {
          yield { type: "stop", stopReason: "cancelled" };
        } else {
          const messageText =
            result.error && typeof result.error.message === "string"
              ? result.error.message
              : "The Cursor run failed.";
          // Installed @cursor/sdk@1.0.32 delivers the account-gated
          // systemPrompt failure as wait() { status: "error" }, not a
          // throw from send(). Re-throw so streamCursor can retry once.
          const waitErr = Object.assign(new Error(messageText), {
            name: (result.error && result.error.code) || "Error",
            code: result.error && result.error.code,
          });
          if (systemPrompt && isSystemPromptGateError(waitErr)) {
            throw waitErr;
          }
          yield { type: "error", code: "provider_error", message: messageText };
        }
        await waitDone.catch(() => {});
        return;
      }
      streamed += next.value;
      yield { type: "text", text: next.value };
    }
  } finally {
    if (signal) signal.removeEventListener("abort", onAbort);
    await disposeAgent(agent);
  }
}

/**
 * Stream a coach completion from a Cursor local agent.
 * Yields { type: "start" | "text" | "stop" | "error" }.
 * Accepts `sdk` for tests; production loads the package inside the call.
 */
async function* streamCursor({ apiKey, model, system, messages, signal, sdk: sdkImpl }) {
  let sdk;
  try {
    sdk = loadCursorSdk(sdkImpl);
  } catch (err) {
    throw mapThrownCursorError(err);
  }
  if (!sdk || !sdk.Agent || typeof sdk.Agent.create !== "function") {
    throw new CoachProviderError("provider_error", "Cursor SDK is not available.");
  }

  const systemText = flattenSystemBlocks(system);
  const userMessage = formatMessages(messages);
  const scratch = makeScratch();
  let usedInline = false;

  try {
    try {
      yield* runOneAttempt({
        sdk,
        apiKey,
        model,
        systemPrompt: systemText || undefined,
        message: userMessage,
        signal,
        scratch,
        systemPromptMode: "accepted",
      });
      return;
    } catch (err) {
      if (systemText && isSystemPromptGateError(err)) {
        usedInline = true;
      } else if (err && err.name === "AbortError") {
        return;
      } else {
        throw mapThrownCursorError(err);
      }
    }

    if (usedInline) {
      const inlined = `${systemText}\n\n${userMessage}`;
      try {
        yield* runOneAttempt({
          sdk,
          apiKey,
          model,
          systemPrompt: undefined,
          message: inlined,
          signal,
          scratch,
          systemPromptMode: "inline",
        });
      } catch (err) {
        if (err && err.name === "AbortError") return;
        throw mapThrownCursorError(err);
      }
    }
  } finally {
    cleanupScratch(scratch.root);
  }
}

/**
 * Non-streaming completion. Returns the concatenated visible text.
 */
async function completeCursor(args) {
  let text = "";
  for await (const item of streamCursor(args)) {
    if (item.type === "text") text += item.text;
    if (item.type === "error") {
      throw new CoachProviderError(item.code || "provider_error", item.message);
    }
  }
  return text;
}

module.exports = {
  streamCursor,
  completeCursor,
  flattenSystemBlocks,
  formatMessages,
  extractFirstJsonText,
  extractFirstJsonObject,
  isSystemPromptGateError,
};
