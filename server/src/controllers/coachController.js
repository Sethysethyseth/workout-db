const prisma = require("../lib/prisma");
const { parseCoachRequest } = require("../coach/coachRequest");
const { deriveConversationTitle } = require("../coach/conversationTitle");
const conversationStore = require("../coach/conversationStore");
const { getCoachConfig, getCoachKeySecret } = require("../coach/config");
const { KEY_FORMAT_RE } = require("../coach/keyResolver");
const { encryptCoachKey, decryptCoachKey } = require("../coach/keyVault");
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
  IMPORT_MAP_COST,
  IMPORT_FIX_MAX_COST,
  PALETTE_COST,
  ASK_COST,
  DRAFT_COST,
  weeklyCapApplies,
  evaluateWeeklyCap,
  capFromEvaluation,
} = require("../coach/weeklyCap");
const {
  chooseImportFixPath,
  importFixCostForTokens,
  resolveImportFixTokens,
  parseImportFixRequest,
  formatProblemsForPrompt,
} = require("../coach/importFix");
const { reserveUses, settleUses, refundUses } = require("../coach/usageLedger");
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
  isOffTopicDraft,
  OFF_TOPIC_DRAFT_MESSAGE,
  MAX_TEXT_CHARS: BLOCK_DRAFT_MAX_TEXT_CHARS,
} = require("../coach/blockDraft");
const { mockBlockDraftFor, mockImportRecipeFor } = require("../coach/mockProvider");
const {
  IMPORT_MAP_MAX_TOKENS,
  importMapErrorForStopReason,
  parseImportMapRequest,
  buildImportMapSystemPrompt,
  buildImportMapMessages,
  buildCursorImportMapSystem,
  parseImportMapCandidate,
  validateImportMapCandidate,
  sampleForRecipe,
} = require("../coach/importMap");
const { compactSummaryForCoach, OFF_TOPIC_MARKER } = require("../coach/prompt");
const { loadSummary } = require("../ai/analyticsAccess");

/** A real decline is two sentences; anything longer is charged as an answer. */
const OFF_TOPIC_DECLINE_MAX_CHARS = 400;
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

/**
 * Decrypted BYO key for this user, or null when there is no row, no vault
 * secret, or the blob does not open. A failure logs one line and nothing else.
 */
async function loadStoredByoKey(userId, db = prisma) {
  const secret = getCoachKeySecret();
  if (!secret || userId == null || userId === "") return null;
  if (!db || !db.userCoachKey || typeof db.userCoachKey.findUnique !== "function") {
    return null;
  }
  const row = await db.userCoachKey.findUnique({
    where: { userId },
    select: { ciphertext: true },
  });
  if (!row || typeof row.ciphertext !== "string" || !row.ciphertext) return null;
  try {
    return decryptCoachKey(row.ciphertext, secret, userId);
  } catch {
    console.error(`byo key decrypt failed ${userId}`);
    return null;
  }
}

/** PUT /coach/key { key } - encrypt and upsert. Never echoes the key. */
async function putCoachKey(req, res, next) {
  try {
    const raw = req.body && typeof req.body.key === "string" ? req.body.key.trim() : "";
    if (!KEY_FORMAT_RE.test(raw)) {
      return res.status(400).json({
        error: "That doesn't look like an Anthropic API key.",
      });
    }
    if (!getCoachConfig().byoStorageAvailable) {
      return res.status(503).json({ error: "byo_unavailable" });
    }
    const secret = getCoachKeySecret();
    const ciphertext = encryptCoachKey(raw, secret, req.authUserId);
    const last4 = raw.slice(-4);
    await prisma.userCoachKey.upsert({
      where: { userId: req.authUserId },
      create: { userId: req.authUserId, ciphertext, last4 },
      update: { ciphertext, last4 },
    });
    return res.json({ saved: true, last4 });
  } catch (err) {
    return next(err);
  }
}

/** DELETE /coach/key - 204 whether or not a row existed. */
async function deleteCoachKey(req, res, next) {
  try {
    await prisma.userCoachKey.deleteMany({ where: { userId: req.authUserId } });
    return res.status(204).end();
  } catch (err) {
    return next(err);
  }
}

function capAppliesToAccess(source, email) {
  return weeklyCapApplies(source, email, process.env.COACH_UNCAPPED_EMAILS);
}

/**
 * Abort an in-flight provider call when the client disconnects (bkr-d2): a
 * draft or recipe the phone never receives must not finish and stay charged.
 */
function abortOnClientClose(res) {
  const controller = new AbortController();
  if (res && typeof res.on === "function") {
    res.on("close", () => {
      if (!res.writableEnded) controller.abort();
    });
  }
  return controller;
}

function weeklyLimitBody(cap, needed) {
  return {
    error: "weekly_limit",
    limit: cap.limit,
    used: cap.used,
    remaining: cap.remaining,
    needed,
    nextAvailableAt: cap.nextAvailableAt,
  };
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
  return capFromEvaluation(evaluated);
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
 * Strip the off-topic marker from a streaming ask reply. Buffers until the
 * marker is confirmed or ruled out so it never appears in an SSE delta.
 */
function createOffTopicStreamFilter(marker) {
  let buffer = "";
  let resolved = false;
  let offTopic = false;
  let trimLead = false;

  function push(piece) {
    const text = typeof piece === "string" ? piece : "";
    if (!text && resolved) return { deltas: [], offTopic };
    if (resolved) {
      let out = text;
      if (trimLead) {
        out = out.replace(/^\s+/, "");
        if (out) trimLead = false;
      }
      return { deltas: out ? [out] : [], offTopic };
    }
    buffer += text;
    if (buffer.startsWith(marker)) {
      resolved = true;
      offTopic = true;
      // The model often puts a space after the marker; never start the
      // decline with whitespace.
      const rest = buffer.slice(marker.length).replace(/^\s+/, "");
      buffer = "";
      trimLead = rest === "";
      return { deltas: rest ? [rest] : [], offTopic };
    }
    if (buffer.length >= marker.length || !marker.startsWith(buffer)) {
      resolved = true;
      const rest = buffer;
      buffer = "";
      return { deltas: rest ? [rest] : [], offTopic: false };
    }
    return { deltas: [], offTopic: false };
  }

  function flush() {
    if (resolved || !buffer) return { deltas: [], offTopic };
    resolved = true;
    const rest = buffer;
    buffer = "";
    return { deltas: rest ? [rest] : [], offTopic };
  }

  return {
    push,
    flush,
    isOffTopic: () => offTopic,
  };
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
      byoKey: await loadStoredByoKey(req.authUserId),
      entitled: access.entitled,
      config,
    });

    const provider = resolved.ok ? resolved.provider : config.provider;
    const model = resolved.ok ? resolved.config.model : config.model;
    const source = resolved.ok ? resolved.keyInfo.source : null;
    const keyRow = await prisma.userCoachKey.findUnique({
      where: { userId: req.authUserId },
      select: { last4: true },
    });
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
      help: { available: resolved.ok },
      source,
      reason: access.consentGranted ? (resolved.ok ? null : resolved.reason) : "no_consent",
      provider,
      model: provider === "mock" ? "mock" : model,
      weeklyCap,
      byoKey: {
        saved: Boolean(keyRow),
        last4: keyRow ? keyRow.last4 : null,
        storageAvailable: config.byoStorageAvailable,
      },
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
 *   meta  { conversationId }  (second meta, only after a successful save)
 *   done  { stopReason }
 *   error { code, message }
 * Refusals and provider failures arrive as `error` events so the client
 * always gets a terminal frame.
 */
async function askCoach(req, res, next, deps = {}) {
  let reservedIds = null;
  let deliveredAnswer = false;
  let offTopicDecline = false;
  let declineChars = 0;
  const prismaClient = deps.prisma || prisma;
  const reserve = deps.reserveUses || reserveUses;
  const settle = deps.settleUses || settleUses;
  const refund = deps.refundUses || refundUses;
  const loadAccess = deps.loadCoachAccess || loadCoachAccess;
  const resolveProvider = deps.resolveCoachProvider || resolveCoachProvider;
  const loadData = deps.loadCoachData || loadCoachData;
  const openStream = deps.openCoachStream || openCoachStream;
  const store = deps.conversationStore || conversationStore;

  try {
    const parsed = parseCoachRequest(req.body);
    if (!parsed.ok) return res.status(parsed.status).json({ error: parsed.error });
    const request = parsed.value;

    if (request.conversationId != null) {
      const owned = await store.findOwned(prismaClient, req.authUserId, request.conversationId);
      if (!owned) return res.status(404).json({ error: "not_found" });
    }

    const access = await loadAccess(req.authUserId);
    if (!access) return res.status(404).json({ error: "User not found" });
    const helpFocus = Boolean(request.focus && request.focus.type === "help");
    if (!access.consentGranted && !helpFocus) {
      return res.status(403).json({ error: "forbidden", reason: "no_consent" });
    }

    const resolved = resolveProvider({
      byoKey: await loadStoredByoKey(req.authUserId, prismaClient),
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
      const reserved = await reserve(prismaClient, req.authUserId, ASK_COST, new Date());
      if (!reserved.ok) {
        return res.status(429).json(weeklyLimitBody(reserved.cap, ASK_COST));
      }
      reservedIds = reserved.ids;
    }

    let data;
    if (!access.consentGranted) {
      // No-consent help. loadCoachData and loadSummary are unreachable here.
      const range = request.range ?? defaultRange();
      data = {
        ok: true,
        primary: null,
        context: null,
        range,
        meta: null,
        workoutCount: 0,
      };
    } else {
      data = await loadData({ userId: req.authUserId, request });
    }
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

    const filter = createOffTopicStreamFilter(OFF_TOPIC_MARKER);
    let stopReason = null;
    let streamedAnswer = "";
    try {
      const emitDelta = (delta) => {
        if (delta) {
          deliveredAnswer = true;
          streamedAnswer += delta;
        }
        if (offTopicDecline) declineChars += delta.length;
        writeSse(res, "delta", { text: delta });
      };

      const stream = openStream({
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
          const { deltas, offTopic } = filter.push(item.text);
          if (offTopic) offTopicDecline = true;
          for (const delta of deltas) emitDelta(delta);
        } else if (item.type === "stop") {
          stopReason = item.stopReason ?? null;
        } else if (item.type === "error") {
          writeSse(res, "error", { code: item.code, message: item.message });
          return res.end();
        }
      }
      const flushed = filter.flush();
      if (flushed.offTopic) offTopicDecline = true;
      for (const delta of flushed.deltas) emitDelta(delta);
      if (filter.isOffTopic()) offTopicDecline = true;
      if (stopReason === "refusal") {
        writeSse(res, "error", {
          code: "refusal",
          message: "The coach can't answer that one.",
        });
        return res.end();
      }
      if (!controller.signal.aborted) {
        try {
          const savedId = await store.saveSuccessfulExchange(prismaClient, {
            userId: req.authUserId,
            conversationId: request.conversationId ?? null,
            question: request.question,
            answer: streamedAnswer,
            title: deriveConversationTitle(request.question),
            focus: request.focus,
          });
          if (savedId != null && !controller.signal.aborted) {
            writeSse(res, "meta", { conversationId: savedId });
          }
        } catch (err) {
          console.error("[coach] failed to save conversation", err && err.message);
        }
      }
      if (controller.signal.aborted) return res.end();
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
    if (reservedIds) {
      const shortDecline = offTopicDecline && declineChars <= OFF_TOPIC_DECLINE_MAX_CHARS;
      if (!deliveredAnswer || shortDecline) {
        await refund(prismaClient, reservedIds);
      } else {
        await settle(prismaClient, reservedIds, ASK_COST);
      }
    }
  }
}

/**
 * POST /coach/palette { description } - ai-theming.md. The model returns a
 * fixed-shape token record (structured output, never CSS); the server-side
 * validator is authoritative and rejects rather than repairs. Nothing is
 * persisted here: the client keeps the palette per device.
 */
async function generatePalette(req, res, next, deps = {}) {
  let reservedIds = null;
  let delivered = false;
  const prismaClient = deps.prisma || prisma;
  const reserve = deps.reserveUses || reserveUses;
  const settle = deps.settleUses || settleUses;
  const refund = deps.refundUses || refundUses;
  const loadAccess = deps.loadCoachAccess || loadCoachAccess;
  const resolveProvider = deps.resolveCoachProvider || resolveCoachProvider;
  const completeAnthropicFn = deps.completeAnthropic || completeAnthropic;
  const completeCursorFn = deps.completeCursor || completeCursor;

  try {
    const description = parseDescription(req.body && req.body.description);
    if (!description) {
      return res.status(400).json({ error: "description is required" });
    }

    const access = await loadAccess(req.authUserId);
    if (!access) return res.status(404).json({ error: "User not found" });
    if (!access.consentGranted) {
      return res.status(403).json({ error: "forbidden", reason: "no_consent" });
    }

    const resolved = resolveProvider({
      byoKey: await loadStoredByoKey(req.authUserId, prismaClient),
      entitled: access.entitled,
    });
    if (!resolved.ok) {
      return res.status(resolved.status).json({ error: resolved.error, reason: resolved.reason });
    }

    const capApplies = capAppliesToAccess(resolved.keyInfo.source, access.email);
    if (capApplies) {
      const reserved = await reserve(prismaClient, req.authUserId, PALETTE_COST, new Date());
      if (!reserved.ok) {
        return res.status(429).json(weeklyLimitBody(reserved.cap, PALETTE_COST));
      }
      reservedIds = reserved.ids;
    }

    let candidate;
    if (resolved.keyInfo.source === "mock") {
      candidate = mockPaletteFor(description);
    } else if (resolved.provider === "cursor") {
      const raw = await completeCursorFn({
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
      const message = await completeAnthropicFn({
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
    delivered = true;
    return res.json({ palette: validated.palette, source: resolved.keyInfo.source });
  } catch (err) {
    if (err instanceof CoachProviderError) {
      return res.status(502).json({ error: err.code, message: err.message });
    }
    return next(err);
  } finally {
    if (reservedIds) {
      if (delivered) await settle(prismaClient, reservedIds, PALETTE_COST);
      else await refund(prismaClient, reservedIds);
    }
  }
}

/**
 * POST /coach/block-draft { mode, text, unit } - blocks-v2.md section 9.
 * Same palette pipeline (structured output / extractFirstJsonText -> parse ->
 * validateBlockDraft -> reject, never repair). Counts one weekly question;
 * persists nothing. Optional deps let the unit lane inject fetchImpl / fakes.
 */
async function draftBlock(req, res, next, deps = {}) {
  let reservedIds = null;
  let deliveredBlock = false;
  const clientGone = abortOnClientClose(res);
  const completeAnthropicFn = deps.completeAnthropic || completeAnthropic;
  const completeCursorFn = deps.completeCursor || completeCursor;
  const loadAccess = deps.loadCoachAccess || loadCoachAccess;
  const resolveProvider = deps.resolveCoachProvider || resolveCoachProvider;
  const prismaClient = deps.prisma || prisma;
  const loadSummaryFn = deps.loadSummary || loadSummary;
  const reserve = deps.reserveUses || reserveUses;
  const settle = deps.settleUses || settleUses;
  const refund = deps.refundUses || refundUses;

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
      byoKey: await loadStoredByoKey(req.authUserId, prismaClient),
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
      const reserved = await reserve(prismaClient, req.authUserId, DRAFT_COST, new Date());
      if (!reserved.ok) {
        return res.status(429).json(weeklyLimitBody(reserved.cap, DRAFT_COST));
      }
      reservedIds = reserved.ids;
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

    let candidate;
    if (resolved.keyInfo.source === "mock") {
      candidate = mockBlockDraftFor(mode, unit);
    } else if (resolved.provider === "cursor") {
      const raw = await completeCursorFn({
        apiKey: resolved.keyInfo.key,
        model: resolved.config.model,
        system: buildCursorBlockDraftSystem({ mode, unit, trainingSummary }),
        messages: buildBlockDraftMessages({ mode, text }),
        signal: clientGone.signal,
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
        signal: clientGone.signal,
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

    if (mode === "generate" && isOffTopicDraft(candidate)) {
      return res.status(400).json({ error: OFF_TOPIC_DRAFT_MESSAGE });
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
    if (clientGone.signal.aborted) return res.end();
    if (err instanceof CoachProviderError) {
      return res.status(502).json({ error: err.code, message: err.message });
    }
    return next(err);
  } finally {
    if (reservedIds) {
      if (deliveredBlock) await settle(prismaClient, reservedIds, DRAFT_COST);
      else await refund(prismaClient, reservedIds);
    }
  }
}

/**
 * POST /coach/import-map { text, unit? } - bks1 AI layout recipe.
 * Same access / consent / provider resolution as draftBlock. Reserves
 * IMPORT_MAP_COST (3) CoachUsage rows before the model call; refunds on
 * any failure.
 */
async function importMap(req, res, next, deps = {}) {
  let reservedIds = null;
  let delivered = false;
  const clientGone = abortOnClientClose(res);
  const completeAnthropicFn = deps.completeAnthropic || completeAnthropic;
  const completeCursorFn = deps.completeCursor || completeCursor;
  const loadAccess = deps.loadCoachAccess || loadCoachAccess;
  const resolveProvider = deps.resolveCoachProvider || resolveCoachProvider;
  const prismaClient = deps.prisma || prisma;
  const reserve = deps.reserveUses || reserveUses;
  const settle = deps.settleUses || settleUses;
  const refund = deps.refundUses || refundUses;

  try {
    const parsed = parseImportMapRequest(req.body);
    if (!parsed.ok) return res.status(parsed.status).json({ error: parsed.error });
    const { text, unit } = parsed.value;

    const access = await loadAccess(req.authUserId);
    if (!access) return res.status(404).json({ error: "User not found" });
    if (!access.consentGranted) {
      return res.status(403).json({ error: "forbidden", reason: "no_consent" });
    }

    const resolved = resolveProvider({
      byoKey: await loadStoredByoKey(req.authUserId, prismaClient),
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
      const reserved = await reserve(
        prismaClient,
        req.authUserId,
        IMPORT_MAP_COST,
        new Date()
      );
      if (!reserved.ok) {
        return res.status(429).json(weeklyLimitBody(reserved.cap, IMPORT_MAP_COST));
      }
      reservedIds = reserved.ids;
    }

    const sample = sampleForRecipe(text);

    let candidate;
    if (resolved.keyInfo.source === "mock") {
      candidate = (deps.mockImportRecipeFor || mockImportRecipeFor)(text);
    } else if (resolved.provider === "cursor") {
      const raw = await completeCursorFn({
        apiKey: resolved.keyInfo.key,
        model: resolved.config.model,
        system: buildCursorImportMapSystem({ unit }),
        messages: buildImportMapMessages({ sample }),
        signal: clientGone.signal,
        ...(deps.fetchImpl ? { fetchImpl: deps.fetchImpl } : {}),
      });
      const parsedCandidate = parseImportMapCandidate(raw, { provider: "cursor" });
      if (!parsedCandidate.ok) {
        return res.status(422).json({
          error: "import_map_invalid",
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
            text: buildImportMapSystemPrompt({ unit }),
          },
        ],
        messages: buildImportMapMessages({ sample }),
        effort: resolved.config.effort,
        maxTokens: IMPORT_MAP_MAX_TOKENS,
        signal: clientGone.signal,
        ...(deps.fetchImpl ? { fetchImpl: deps.fetchImpl } : {}),
      });
      const stopErr = importMapErrorForStopReason(message && message.stop_reason);
      if (stopErr) {
        return res.status(stopErr.status).json(stopErr.body);
      }
      const parsedCandidate = parseImportMapCandidate(message && message.content, {
        provider: "anthropic",
      });
      if (!parsedCandidate.ok) {
        return res.status(422).json({
          error: "import_map_invalid",
          errors: [{ path: "", message: parsedCandidate.error }],
        });
      }
      candidate = parsedCandidate.candidate;
    }

    const validated = validateImportMapCandidate(candidate, text);
    if (!validated.ok) {
      return res.status(validated.status).json(validated.body);
    }

    delivered = true;
    return res.json({ recipe: validated.recipe });
  } catch (err) {
    if (clientGone.signal.aborted) return res.end();
    if (err instanceof CoachProviderError) {
      return res.status(502).json({ error: err.code, message: err.message });
    }
    return next(err);
  } finally {
    if (reservedIds) {
      if (delivered) await settle(prismaClient, reservedIds, IMPORT_MAP_COST);
      else await refund(prismaClient, reservedIds);
    }
  }
}

/**
 * Shared import-map recipe completion (used by importMap + importFix).
 * Returns { ok, recipe, usage, promptChars, replyChars } or { ok:false, status, body }.
 */
async function completeImportMapRecipe({
  text,
  unit,
  problems,
  resolved,
  signal,
  deps = {},
}) {
  const completeAnthropicFn = deps.completeAnthropic || completeAnthropic;
  const completeCursorFn = deps.completeCursor || completeCursor;
  const sample = sampleForRecipe(text);
  const problemSuffix = formatProblemsForPrompt(problems);
  const baseMessages = buildImportMapMessages({ sample });
  const messages = problemSuffix
    ? [
        {
          role: "user",
          content: `${baseMessages[0].content}${problemSuffix}`,
        },
      ]
    : baseMessages;
  const systemText = buildImportMapSystemPrompt({ unit });
  const promptChars =
    systemText.length + messages.reduce((n, m) => n + String(m.content || "").length, 0);

  let candidate;
  let usage = null;
  let replyChars = 0;

  if (resolved.keyInfo.source === "mock") {
    candidate = (deps.mockImportRecipeFor || mockImportRecipeFor)(text);
    replyChars = JSON.stringify(candidate).length;
  } else if (resolved.provider === "cursor") {
    const raw = await completeCursorFn({
      apiKey: resolved.keyInfo.key,
      model: resolved.config.model,
      system: buildCursorImportMapSystem({ unit }),
      messages,
      signal,
      ...(deps.fetchImpl ? { fetchImpl: deps.fetchImpl } : {}),
    });
    replyChars = typeof raw === "string" ? raw.length : 0;
    const parsedCandidate = parseImportMapCandidate(raw, { provider: "cursor" });
    if (!parsedCandidate.ok) {
      return {
        ok: false,
        status: 422,
        body: {
          error: "import_map_invalid",
          errors: [{ path: "", message: parsedCandidate.error }],
        },
      };
    }
    candidate = parsedCandidate.candidate;
  } else {
    const message = await completeAnthropicFn({
      apiKey: resolved.keyInfo.key,
      model: resolved.config.model,
      system: [{ type: "text", text: systemText }],
      messages,
      effort: resolved.config.effort,
      maxTokens: IMPORT_MAP_MAX_TOKENS,
      signal,
      ...(deps.fetchImpl ? { fetchImpl: deps.fetchImpl } : {}),
    });
    const stopErr = importMapErrorForStopReason(message && message.stop_reason);
    if (stopErr) {
      return { ok: false, status: stopErr.status, body: stopErr.body };
    }
    usage = message && message.usage ? message.usage : null;
    const parsedCandidate = parseImportMapCandidate(message && message.content, {
      provider: "anthropic",
    });
    if (!parsedCandidate.ok) {
      return {
        ok: false,
        status: 422,
        body: {
          error: "import_map_invalid",
          errors: [{ path: "", message: parsedCandidate.error }],
        },
      };
    }
    candidate = parsedCandidate.candidate;
    replyChars = JSON.stringify(candidate).length;
  }

  const validated = validateImportMapCandidate(candidate, text);
  if (!validated.ok) {
    return { ok: false, status: validated.status, body: validated.body };
  }
  return {
    ok: true,
    recipe: validated.recipe,
    usage,
    promptChars,
    replyChars,
  };
}

/**
 * Shared convert-mode block draft completion (used by draftBlock + importFix).
 * Returns { ok, block, stats, usage, promptChars, replyChars } or failure.
 */
async function completeBlockConvert({
  text,
  unit,
  problems,
  resolved,
  signal,
  deps = {},
}) {
  const completeAnthropicFn = deps.completeAnthropic || completeAnthropic;
  const completeCursorFn = deps.completeCursor || completeCursor;
  const mode = "convert";
  const problemSuffix = formatProblemsForPrompt(problems);
  const baseMessages = buildBlockDraftMessages({ mode, text });
  const messages = problemSuffix
    ? [
        {
          role: "user",
          content: `${baseMessages[0].content}${problemSuffix}`,
        },
      ]
    : baseMessages;
  const systemText = buildBlockDraftSystemPrompt({ mode, unit, trainingSummary: null });
  const promptChars =
    systemText.length + messages.reduce((n, m) => n + String(m.content || "").length, 0);

  let candidate;
  let usage = null;
  let replyChars = 0;

  if (resolved.keyInfo.source === "mock") {
    candidate = mockBlockDraftFor(mode, unit);
    replyChars = JSON.stringify(candidate).length;
  } else if (resolved.provider === "cursor") {
    const raw = await completeCursorFn({
      apiKey: resolved.keyInfo.key,
      model: resolved.config.model,
      system: buildCursorBlockDraftSystem({ mode, unit, trainingSummary: null }),
      messages,
      signal,
      ...(deps.fetchImpl ? { fetchImpl: deps.fetchImpl } : {}),
    });
    replyChars = typeof raw === "string" ? raw.length : 0;
    const parsedCandidate = parseBlockCandidate(raw, { provider: "cursor" });
    if (!parsedCandidate.ok) {
      return {
        ok: false,
        status: 502,
        body: {
          error: "block_invalid",
          errors: [{ path: "", message: parsedCandidate.error }],
        },
      };
    }
    candidate = parsedCandidate.candidate;
  } else {
    const message = await completeAnthropicFn({
      apiKey: resolved.keyInfo.key,
      model: resolved.config.model,
      system: [{ type: "text", text: systemText }],
      messages,
      effort: resolved.config.effort,
      maxTokens: BLOCK_DRAFT_MAX_TOKENS,
      outputFormat: { type: "json_schema", schema: BLOCK_FORMAT_JSON_SCHEMA },
      signal,
      ...(deps.fetchImpl ? { fetchImpl: deps.fetchImpl } : {}),
    });
    const stopErr = blockErrorForStopReason(message && message.stop_reason);
    if (stopErr) {
      return { ok: false, status: stopErr.status, body: stopErr.body };
    }
    usage = message && message.usage ? message.usage : null;
    const parsedCandidate = parseBlockCandidate(message && message.content, {
      provider: "anthropic",
    });
    if (!parsedCandidate.ok) {
      return {
        ok: false,
        status: 502,
        body: {
          error: "block_invalid",
          errors: [{ path: "", message: parsedCandidate.error }],
        },
      };
    }
    candidate = parsedCandidate.candidate;
    replyChars = JSON.stringify(candidate).length;
  }

  const validated = validateDraftCandidate(candidate, unit);
  if (!validated.ok) {
    return { ok: false, status: validated.status, body: validated.body };
  }
  return {
    ok: true,
    block: validated.block,
    stats: validated.stats,
    usage,
    promptChars,
    replyChars,
  };
}

/**
 * POST /coach/import-fix { text, unit?, problems? } - bkr3.
 * Table text -> import-map recipe path; prose -> convert. Reserves
 * IMPORT_FIX_MAX_COST (4), settles 1-4 by tokens, refunds on any failure.
 */
async function importFix(req, res, next, deps = {}) {
  let reservedIds = null;
  let settleCost = null;
  let delivered = false;
  const clientGone = abortOnClientClose(res);
  const loadAccess = deps.loadCoachAccess || loadCoachAccess;
  const resolveProvider = deps.resolveCoachProvider || resolveCoachProvider;
  const prismaClient = deps.prisma || prisma;
  const reserve = deps.reserveUses || reserveUses;
  const settle = deps.settleUses || settleUses;
  const refund = deps.refundUses || refundUses;
  const choosePath = deps.chooseImportFixPath || chooseImportFixPath;
  const runRecipe = deps.completeImportMapRecipe || completeImportMapRecipe;
  const runConvert = deps.completeBlockConvert || completeBlockConvert;

  try {
    const parsed = parseImportFixRequest(req.body);
    if (!parsed.ok) return res.status(parsed.status).json({ error: parsed.error });
    const { text, unit, problems } = parsed.value;
    const path = choosePath(text);
    // Only the recipe path samples the text; the convert path sends all of it,
    // so it keeps block-draft's input cap (seat fix at landing).
    if (path === "convert" && text.length > BLOCK_DRAFT_MAX_TEXT_CHARS) {
      return res.status(400).json({
        error: `That's too long for the AI to rewrite. Paste up to ${BLOCK_DRAFT_MAX_TEXT_CHARS.toLocaleString("en-US")} characters, or a table.`,
      });
    }
    const convertUnit = unit === "kg" || unit === "lb" ? unit : "lb";

    const access = await loadAccess(req.authUserId);
    if (!access) return res.status(404).json({ error: "User not found" });
    if (!access.consentGranted) {
      return res.status(403).json({ error: "forbidden", reason: "no_consent" });
    }

    const resolved = resolveProvider({
      byoKey: await loadStoredByoKey(req.authUserId, prismaClient),
      entitled: access.entitled,
    });
    if (!resolved.ok) {
      return res.status(resolved.status).json({
        error: resolved.error,
        reason: resolved.reason,
      });
    }

    let remainingAfter = null;
    const capApplies = capAppliesToAccess(resolved.keyInfo.source, access.email);
    if (capApplies) {
      const reserved = await reserve(
        prismaClient,
        req.authUserId,
        IMPORT_FIX_MAX_COST,
        new Date()
      );
      if (!reserved.ok) {
        return res
          .status(429)
          .json(weeklyLimitBody(reserved.cap, IMPORT_FIX_MAX_COST));
      }
      reservedIds = reserved.ids;
      remainingAfter = reserved.cap.remaining;
    }

    let result;
    if (path === "recipe") {
      result = await runRecipe({
        text,
        unit,
        problems,
        resolved,
        signal: clientGone.signal,
        deps,
      });
    } else {
      result = await runConvert({
        text,
        unit: convertUnit,
        problems,
        resolved,
        signal: clientGone.signal,
        deps,
      });
    }

    if (!result.ok) {
      return res.status(result.status).json(result.body);
    }

    const { tokens } = resolveImportFixTokens({
      usage: result.usage,
      promptChars: result.promptChars,
      replyChars: result.replyChars,
    });
    const cost = importFixCostForTokens(tokens);
    settleCost = cost;
    if (remainingAfter != null) {
      remainingAfter = remainingAfter + (IMPORT_FIX_MAX_COST - cost);
    }

    delivered = true;
    if (path === "recipe") {
      return res.json({
        kind: "recipe",
        recipe: result.recipe,
        cost,
        remaining: remainingAfter,
      });
    }
    return res.json({
      kind: "block",
      block: result.block,
      stats: result.stats,
      cost,
      remaining: remainingAfter,
    });
  } catch (err) {
    if (clientGone.signal.aborted) return res.end();
    if (err instanceof CoachProviderError) {
      return res.status(502).json({ error: err.code, message: err.message });
    }
    return next(err);
  } finally {
    if (reservedIds) {
      if (delivered && settleCost != null) {
        await settle(prismaClient, reservedIds, settleCost);
      } else {
        await refund(prismaClient, reservedIds);
      }
    }
  }
}

function parseConversationParam(raw) {
  const id = Number(raw);
  if (!Number.isInteger(id) || id <= 0) return null;
  return id;
}

function parseBeforeQuery(raw) {
  if (raw == null || raw === "") return { ok: true, before: null };
  const value = Array.isArray(raw) ? raw[0] : raw;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return { ok: false };
  return { ok: true, before: date };
}

/** GET /coach/conversations - newest updatedAt first, 20 per page. No AI consent. */
async function listCoachConversations(req, res, next) {
  try {
    const parsed = parseBeforeQuery(req.query.before);
    if (!parsed.ok) return res.status(400).json({ error: "before must be a date" });
    const page = await conversationStore.listConversations(prisma, {
      userId: req.authUserId,
      before: parsed.before,
    });
    return res.json(page);
  } catch (err) {
    return next(err);
  }
}

/** GET /coach/conversations/:id - messages oldest first. Another user is 404. */
async function getCoachConversation(req, res, next) {
  try {
    const id = parseConversationParam(req.params.id);
    if (id == null) return res.status(404).json({ error: "not_found" });
    const row = await conversationStore.getConversation(prisma, req.authUserId, id);
    if (!row) return res.status(404).json({ error: "not_found" });
    return res.json(row);
  } catch (err) {
    return next(err);
  }
}

/** DELETE /coach/conversations/:id - 204, or 404 when it is not this user's. */
async function deleteCoachConversation(req, res, next) {
  try {
    const id = parseConversationParam(req.params.id);
    if (id == null) return res.status(404).json({ error: "not_found" });
    const result = await conversationStore.deleteConversation(prisma, req.authUserId, id);
    if (!result.count) return res.status(404).json({ error: "not_found" });
    return res.status(204).end();
  } catch (err) {
    return next(err);
  }
}

/** DELETE /coach/conversations - every conversation this user owns. */
async function deleteAllCoachConversations(req, res, next) {
  try {
    await conversationStore.deleteAllConversations(prisma, req.authUserId);
    return res.status(204).end();
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  getCoachStatus,
  askCoach,
  generatePalette,
  draftBlock,
  importMap,
  importFix,
  listCoachConversations,
  getCoachConversation,
  deleteCoachConversation,
  deleteAllCoachConversations,
  putCoachKey,
  deleteCoachKey,
  loadStoredByoKey,
  paletteErrorForStopReason,
  blockErrorForStopReason,
  importMapErrorForStopReason,
  createOffTopicStreamFilter,
  completeImportMapRecipe,
  completeBlockConvert,
  // Test / status helpers kept for compatibility.
  loadWeeklyCap,
  removeUsageRow,
  WEEKLY_LIMIT,
};
