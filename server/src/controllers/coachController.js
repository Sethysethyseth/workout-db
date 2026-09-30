const prisma = require("../lib/prisma");
const { parseCoachRequest } = require("../coach/coachRequest");
const { getCoachConfig } = require("../coach/config");
const {
  loadCoachAccess,
  resolveCoachProvider,
  loadCoachData,
  buildCoachPrompt,
  openCoachStream,
  defaultRange,
} = require("../coach/askCoach");
const {
  WEEKLY_LIMIT,
  WINDOW_MS,
  weeklyCapApplies,
  evaluateWeeklyCap,
} = require("../coach/weeklyCap");
const { CoachProviderError, completeAnthropic } = require("../coach/provider");
const { completeCursor, extractFirstJsonText } = require("../coach/cursorProvider");
const {
  PALETTE_JSON_SCHEMA,
  PALETTE_SYSTEM_PROMPT,
  parseDescription,
  validatePalette,
  mockPaletteFor,
} = require("../coach/palette");
const {
  BLOCK_DRAFT_MAX_TOKENS,
  BLOCK_FORMAT_JSON_SCHEMA,
  blockErrorForStopReason,
  parseBlockDraftRequest,
  buildBlockDraftSystemPrompt,
  buildBlockDraftMessages,
  buildCursorBlockDraftSystem,
  parseBlockCandidate,
  validateDraftCandidate,
} = require("../coach/blockDraft");
const { mockBlockDraftFor } = require("../coach/mockProvider");
const { compactSummaryForCoach } = require("../coach/prompt");
const { loadSummary } = require("../ai/analyticsAccess");

const BYO_KEY_HEADER = "x-coach-key";
// Same shared thinking+response budget as MAX_TOKENS. A complete JSON
// palette is a few hundred tokens; 3000 leaves room for thinking so
// stop_reason: max_tokens does not become a 502. Do not lower this.
const PALETTE_MAX_TOKENS = 3000;

/**
 * Palette completions that did not finish cleanly. Shape matches the
 * existing palette_refused branch: 422 + { error }. max_tokens is its
 * own code so a truncated record is never mistaken for palette_invalid.
 */
function paletteErrorForStopReason(stopReason) {
  if (stopReason === "refusal") {
    return { status: 422, body: { error: "palette_refused" } };
  }
  if (stopReason === "max_tokens") {
    return {
      status: 422,
      body: {
        error: "palette_truncated",
        message: "The model ran out of room.",
      },
    };
  }
  return null;
}

function readByoKey(req) {
  const raw = req.get(BYO_KEY_HEADER);
  return typeof raw === "string" && raw.trim() ? raw.trim() : null;
}

function capAppliesToAccess(source, email) {
  return weeklyCapApplies(source, email, process.env.COACH_UNCAPPED_EMAILS);
}

async function loadWeeklyCap(userId, now = new Date()) {
  const windowStart = new Date(now.getTime() - WINDOW_MS);
  const rows = await prisma.coachUsage.findMany({
    where: { userId, createdAt: { gt: windowStart } },
    select: { createdAt: true },
  });
  const evaluated = evaluateWeeklyCap(
    rows.map((row) => row.createdAt),
    now
  );
  return {
    limit: WEEKLY_LIMIT,
    used: evaluated.used,
    remaining: evaluated.remaining,
    nextAvailableAt: evaluated.nextAvailableAt,
    allowed: evaluated.allowed,
  };
}

async function removeUsageRow(usageId) {
  if (usageId == null) return;
  try {
    await prisma.coachUsage.delete({ where: { id: usageId } });
  } catch (err) {
    if (err && err.code === "P2025") return;
    console.error("[coach] failed to uncount unused question", err && err.message);
  }
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

    const provider = resolved.ok ? resolved.provider : config.provider;
    const model = resolved.ok ? resolved.config.model : config.model;
    const source = resolved.ok ? resolved.keyInfo.source : null;
    let weeklyCap = null;
    if (source && capAppliesToAccess(source, access.email)) {
      const cap = await loadWeeklyCap(req.authUserId);
      weeklyCap = {
        limit: cap.limit,
        used: cap.used,
        remaining: cap.remaining,
        nextAvailableAt: cap.nextAvailableAt,
      };
    }
    return res.json({
      consentGranted: access.consentGranted,
      entitled: access.entitled,
      available: access.consentGranted && resolved.ok,
      source,
      reason: access.consentGranted ? (resolved.ok ? null : resolved.reason) : "no_consent",
      provider,
      model: provider === "mock" ? "mock" : model,
      weeklyCap,
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
  let usageId = null;
  let deliveredAnswer = false;
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

    const capApplies = capAppliesToAccess(resolved.keyInfo.source, access.email);
    if (capApplies) {
      const cap = await loadWeeklyCap(req.authUserId);
      if (!cap.allowed) {
        return res.status(429).json({
          error: "weekly_limit",
          limit: cap.limit,
          used: cap.used,
          nextAvailableAt: cap.nextAvailableAt,
        });
      }
    }

    const data = await loadCoachData({ userId: req.authUserId, request });
    if (!data.ok) return res.status(data.status).json({ error: data.error });

    const { system, messages } = buildCoachPrompt({ request, data });

    if (capApplies) {
      const row = await prisma.coachUsage.create({
        data: { userId: req.authUserId },
      });
      usageId = row.id;
    }

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
        provider: resolved.provider,
      });
      for await (const item of stream) {
        if (controller.signal.aborted) break;
        if (item.type === "text") {
          const piece = typeof item.text === "string" ? item.text : "";
          if (piece) deliveredAnswer = true;
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
  } finally {
    if (!deliveredAnswer) await removeUsageRow(usageId);
  }
}

/**
 * POST /coach/palette { description } - ai-theming.md. The model returns a
 * fixed-shape token record (structured output, never CSS); the server-side
 * validator is authoritative and rejects rather than repairs. Nothing is
 * persisted here: the client keeps the palette per device.
 */
async function generatePalette(req, res, next) {
  try {
    const description = parseDescription(req.body && req.body.description);
    if (!description) {
      return res.status(400).json({ error: "description is required" });
    }

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
      return res.status(resolved.status).json({ error: resolved.error, reason: resolved.reason });
    }

    let candidate;
    if (resolved.keyInfo.source === "mock") {
      candidate = mockPaletteFor(description);
    } else if (resolved.provider === "cursor") {
      const raw = await completeCursor({
        apiKey: resolved.keyInfo.key,
        model: resolved.config.model,
        system: [
          {
            type: "text",
            text: [
              PALETTE_SYSTEM_PROMPT,
              "",
              "Return ONLY one JSON object matching this schema. No prose before or after. A ```json fence is allowed.",
              JSON.stringify(PALETTE_JSON_SCHEMA),
            ].join("\n"),
          },
        ],
        messages: [{ role: "user", content: `Design a palette for: ${description}` }],
      });
      const jsonText = extractFirstJsonText(raw);
      try {
        if (!jsonText) throw new Error("no json");
        candidate = JSON.parse(jsonText);
      } catch {
        return res.status(502).json({ error: "palette_invalid", errors: ["The model did not return a palette."] });
      }
    } else {
      const message = await completeAnthropic({
        apiKey: resolved.keyInfo.key,
        model: resolved.config.model,
        system: [{ type: "text", text: PALETTE_SYSTEM_PROMPT }],
        messages: [{ role: "user", content: `Design a palette for: ${description}` }],
        effort: resolved.config.effort,
        maxTokens: PALETTE_MAX_TOKENS,
        outputFormat: { type: "json_schema", schema: PALETTE_JSON_SCHEMA },
      });
      const stopErr = paletteErrorForStopReason(message && message.stop_reason);
      if (stopErr) {
        return res.status(stopErr.status).json(stopErr.body);
      }
      const text = (Array.isArray(message && message.content) ? message.content : [])
        .filter((block) => block && block.type === "text" && typeof block.text === "string")
        .map((block) => block.text)
        .join("");
      try {
        candidate = JSON.parse(text);
      } catch {
        return res.status(502).json({ error: "palette_invalid", errors: ["The model did not return a palette."] });
      }
    }

    const validated = validatePalette(candidate);
    if (!validated.ok) {
      return res.status(422).json({ error: "palette_invalid", errors: validated.errors.slice(0, 6) });
    }
    return res.json({ palette: validated.palette, source: resolved.keyInfo.source });
  } catch (err) {
    if (err instanceof CoachProviderError) {
      return res.status(502).json({ error: err.code, message: err.message });
    }
    return next(err);
  }
}

/**
 * POST /coach/block-draft { mode, text, unit } - blocks-v2.md section 9.
 * Same palette pipeline (structured output / extractFirstJsonText -> parse ->
 * validateBlockDraft -> reject, never repair). Counts one weekly question;
 * persists nothing. Optional deps let the unit lane inject fetchImpl / fakes.
 */
async function draftBlock(req, res, next, deps = {}) {
  let usageId = null;
  let deliveredBlock = false;
  const completeAnthropicFn = deps.completeAnthropic || completeAnthropic;
  const completeCursorFn = deps.completeCursor || completeCursor;
  const loadAccess = deps.loadCoachAccess || loadCoachAccess;
  const resolveProvider = deps.resolveCoachProvider || resolveCoachProvider;
  const prismaClient = deps.prisma || prisma;
  const loadSummaryFn = deps.loadSummary || loadSummary;
  const removeUsage = deps.removeUsageRow || removeUsageRow;
  const loadCap = deps.loadWeeklyCap || loadWeeklyCap;

  try {
    const parsed = parseBlockDraftRequest(req.body);
    if (!parsed.ok) return res.status(parsed.status).json({ error: parsed.error });
    const { mode, text, unit } = parsed.value;

    const access = await loadAccess(req.authUserId);
    if (!access) return res.status(404).json({ error: "User not found" });
    if (!access.consentGranted) {
      return res.status(403).json({ error: "forbidden", reason: "no_consent" });
    }

    const resolved = resolveProvider({
      byoKey: readByoKey(req),
      entitled: access.entitled,
    });
    if (!resolved.ok) {
      return res.status(resolved.status).json({
        error: resolved.error,
        reason: resolved.reason,
      });
    }

    const capApplies = capAppliesToAccess(resolved.keyInfo.source, access.email);
    if (capApplies) {
      const cap = await loadCap(req.authUserId);
      if (!cap.allowed) {
        return res.status(429).json({
          error: "weekly_limit",
          limit: cap.limit,
          used: cap.used,
          nextAvailableAt: cap.nextAvailableAt,
        });
      }
    }

    let trainingSummary = null;
    if (mode === "generate") {
      const range = defaultRange(new Date());
      const summaryRaw = await loadSummaryFn(req.authUserId, {
        from: range.from,
        to: range.to,
      });
      trainingSummary = compactSummaryForCoach(summaryRaw);
    }

    if (capApplies) {
      const row = await prismaClient.coachUsage.create({
        data: { userId: req.authUserId },
      });
      usageId = row.id;
    }

    let candidate;
    if (resolved.keyInfo.source === "mock") {
      candidate = mockBlockDraftFor(mode, unit);
    } else if (resolved.provider === "cursor") {
      const raw = await completeCursorFn({
        apiKey: resolved.keyInfo.key,
        model: resolved.config.model,
        system: buildCursorBlockDraftSystem({ mode, unit, trainingSummary }),
        messages: buildBlockDraftMessages({ mode, text }),
        ...(deps.fetchImpl ? { fetchImpl: deps.fetchImpl } : {}),
      });
      const parsedCandidate = parseBlockCandidate(raw, { provider: "cursor" });
      if (!parsedCandidate.ok) {
        return res.status(502).json({
          error: "block_invalid",
          errors: [{ path: "", message: parsedCandidate.error }],
        });
      }
      candidate = parsedCandidate.candidate;
    } else {
      const message = await completeAnthropicFn({
        apiKey: resolved.keyInfo.key,
        model: resolved.config.model,
        system: [
          {
            type: "text",
            text: buildBlockDraftSystemPrompt({ mode, unit, trainingSummary }),
          },
        ],
        messages: buildBlockDraftMessages({ mode, text }),
        effort: resolved.config.effort,
        maxTokens: BLOCK_DRAFT_MAX_TOKENS,
        outputFormat: { type: "json_schema", schema: BLOCK_FORMAT_JSON_SCHEMA },
        ...(deps.fetchImpl ? { fetchImpl: deps.fetchImpl } : {}),
      });
      const stopErr = blockErrorForStopReason(message && message.stop_reason);
      if (stopErr) {
        return res.status(stopErr.status).json(stopErr.body);
      }
      const parsedCandidate = parseBlockCandidate(message && message.content, {
        provider: "anthropic",
      });
      if (!parsedCandidate.ok) {
        return res.status(502).json({
          error: "block_invalid",
          errors: [{ path: "", message: parsedCandidate.error }],
        });
      }
      candidate = parsedCandidate.candidate;
    }

    const validated = validateDraftCandidate(candidate, unit);
    if (!validated.ok) {
      return res.status(validated.status).json(validated.body);
    }
    deliveredBlock = true;
    return res.json({
      block: validated.block,
      stats: validated.stats,
      source: resolved.keyInfo.source,
    });
  } catch (err) {
    if (err instanceof CoachProviderError) {
      return res.status(502).json({ error: err.code, message: err.message });
    }
    return next(err);
  } finally {
    if (!deliveredBlock) await removeUsage(usageId);
  }
}

module.exports = {
  getCoachStatus,
  askCoach,
  generatePalette,
  draftBlock,
  BYO_KEY_HEADER,
  paletteErrorForStopReason,
  blockErrorForStopReason,
};
