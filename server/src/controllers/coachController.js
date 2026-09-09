const { parseCoachRequest } = require("../coach/coachRequest");
const { getCoachConfig } = require("../coach/config");
const {
  loadCoachAccess,
  resolveCoachProvider,
  loadCoachData,
  buildCoachPrompt,
  openCoachStream,
} = require("../coach/askCoach");
const { CoachProviderError } = require("../coach/provider");

const BYO_KEY_HEADER = "x-coach-key";

function readByoKey(req) {
  const raw = req.get(BYO_KEY_HEADER);
  return typeof raw === "string" && raw.trim() ? raw.trim() : null;
}

/**
 * GET /coach/status - what the client needs to render the right state.
 * Never echoes a key. `source` is "mock" | "hosted" | "byo" | null.
 */
async function getCoachStatus(req, res, next) {
  try {
    const access = await loadCoachAccess(req.authUserId);
    if (!access) return res.status(404).json({ error: "User not found" });

    const config = getCoachConfig();
    const resolved = resolveCoachProvider({
      byoKey: readByoKey(req),
      entitled: access.entitled,
      config,
    });

    return res.json({
      consentGranted: access.consentGranted,
      entitled: access.entitled,
      available: access.consentGranted && resolved.ok,
      source: resolved.ok ? resolved.keyInfo.source : null,
      reason: access.consentGranted ? (resolved.ok ? null : resolved.reason) : "no_consent",
      provider: config.provider,
      model: config.provider === "mock" ? "mock" : config.model,
    });
  } catch (err) {
    return next(err);
  }
}

function writeSse(res, event, data) {
  res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
}

/**
 * POST /coach/ask - streams the answer as Server-Sent Events:
 *   meta  { model, source, range, effortCoverage, workoutCount }
 *   delta { text }
 *   done  { stopReason }
 *   error { code, message }
 * Refusals and provider failures arrive as `error` events so the client
 * always gets a terminal frame.
 */
async function askCoach(req, res, next) {
  try {
    const parsed = parseCoachRequest(req.body);
    if (!parsed.ok) return res.status(parsed.status).json({ error: parsed.error });
    const request = parsed.value;

    const access = await loadCoachAccess(req.authUserId);
    if (!access) return res.status(404).json({ error: "User not found" });
    if (!access.consentGranted) {
      return res.status(403).json({ error: "forbidden", reason: "no_consent" });
    }

    const resolved = resolveCoachProvider({
      byoKey: readByoKey(req),
      entitled: access.entitled,
    });
    if (!resolved.ok) {
      return res.status(resolved.status).json({
        error: resolved.error,
        reason: resolved.reason,
      });
    }

    const data = await loadCoachData({ userId: req.authUserId, request });
    if (!data.ok) return res.status(data.status).json({ error: data.error });

    const { system, messages } = buildCoachPrompt({ request, data });

    const controller = new AbortController();
    res.on("close", () => controller.abort());

    res.status(200).set({
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    });
    res.flushHeaders();

    writeSse(res, "meta", {
      model: resolved.config.provider === "mock" ? "mock" : resolved.config.model,
      source: resolved.keyInfo.source,
      range: { from: data.range.fromLabel, to: data.range.toLabel },
      effortCoverage: data.meta ? (data.meta.effortCoverage ?? null) : null,
      workoutCount: data.workoutCount ?? 0,
    });

    let stopReason = null;
    try {
      const stream = openCoachStream({
        keyInfo: resolved.keyInfo,
        config: resolved.config,
        system,
        messages,
        request,
        data,
        signal: controller.signal,
      });
      for await (const item of stream) {
        if (controller.signal.aborted) break;
        if (item.type === "text") {
          writeSse(res, "delta", { text: item.text });
        } else if (item.type === "stop") {
          stopReason = item.stopReason ?? null;
        } else if (item.type === "error") {
          writeSse(res, "error", { code: item.code, message: item.message });
          return res.end();
        }
      }
      if (stopReason === "refusal") {
        writeSse(res, "error", {
          code: "refusal",
          message: "The coach can't answer that one.",
        });
        return res.end();
      }
      writeSse(res, "done", { stopReason });
      return res.end();
    } catch (err) {
      if (controller.signal.aborted) return res.end();
      const code = err instanceof CoachProviderError ? err.code : "provider_error";
      const message =
        err instanceof CoachProviderError ? err.message : "The coach could not reach its model.";
      console.error("[coach] stream failed", code, err && err.message);
      writeSse(res, "error", { code, message });
      return res.end();
    }
  } catch (err) {
    if (res.headersSent) {
      console.error("[coach] failed after headers were sent", err);
      return res.end();
    }
    return next(err);
  }
}

module.exports = { getCoachStatus, askCoach, BYO_KEY_HEADER };
