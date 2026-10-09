/**
 * Coach orchestrator: consent + entitlement, data loading through the SAME
 * analytics path the Analytics page and the MCP tools use, prompt assembly,
 * then the provider stream. Cross-user isolation happens in loadSummary
 * (every set is reached through a session scoped by userId) and in the
 * session lookup below (findFirst with userId).
 */

const prisma = require("../lib/prisma");
const { isConsentActive } = require("../ai/consent");
const { loadSummary } = require("../ai/analyticsAccess");
const { resolveCoachKey } = require("./keyResolver");
const { getCoachConfig, DEFAULT_MODEL } = require("./config");
const {
  compactSummaryForCoach,
  buildCoachSystemBlocks,
  buildCoachMessages,
} = require("./prompt");
const { streamAnthropic } = require("./provider");
const { streamMock } = require("./mockProvider");
const { streamCursor } = require("./cursorProvider");
const { blockToCompactText } = require("./blockDraft");
const { blockTreeToFormat } = require("../blocks/blockFormatMapping");
const { blockWeekInclude } = require("../blocks/blockTemplateStore");

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const DEFAULT_WEEKS = 4;
const CONTEXT_WEEKS = 4;

function dateLabelUtc(date) {
  return date.toISOString().slice(0, 10);
}

/** Default window when the client sends none: today back N*7-1 days, UTC. */
function defaultRange(now = new Date(), weeks = DEFAULT_WEEKS) {
  const toLabel = dateLabelUtc(now);
  const to = new Date(`${toLabel}T23:59:59.999Z`);
  const from = new Date(to.getTime() - (weeks * 7 - 1) * MS_PER_DAY);
  const fromLabel = dateLabelUtc(from);
  return {
    from: new Date(`${fromLabel}T00:00:00.000Z`),
    to,
    fromLabel,
    toLabel,
  };
}

function weeksInRange(range) {
  return Math.max(1, Math.ceil((range.to - range.from) / (7 * MS_PER_DAY)));
}

async function loadCoachAccess(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { aiConnectorEnabled: true, aiConsent: true, email: true },
  });
  if (!user) return null;
  return {
    consentGranted: isConsentActive(user.aiConsent),
    entitled: Boolean(user.aiConnectorEnabled),
    email: user.email,
  };
}

/**
 * Resolve the provider + key for this request without doing any data work.
 * `byoKey` is the decrypted vault plaintext from loadStoredByoKey, or null.
 * Mock still short-circuits. Otherwise a stored BYO key wins and forces
 * Anthropic; the hosted key applies when there is no stored key.
 * Returns { ok: true, keyInfo, config } or { ok: false, status, error, reason }.
 */
function resolveCoachProvider({ byoKey, entitled, config = getCoachConfig() }) {
  if (config.provider === "mock") {
    return {
      ok: true,
      config,
      keyInfo: { source: "mock", key: null, reason: null },
      provider: "mock",
    };
  }
  const keyInfo = resolveCoachKey({
    byoKey,
    hostedKey: config.hostedKey,
    entitled,
    hostedProvider: config.provider,
  });
  if (!keyInfo.source) {
    return {
      ok: false,
      status: 409,
      error: "coach_unavailable",
      reason: keyInfo.reason,
      config,
      provider: null,
    };
  }
  // BYO is always the Anthropic path, even when the hosted provider is cursor.
  // COACH_MODEL names the HOSTED provider's model, so BYO honors it only when
  // that provider is anthropic too - otherwise a cursor `COACH_MODEL=auto`
  // would be sent to Anthropic and every BYO request would fail.
  if (keyInfo.source === "byo") {
    const model =
      config.provider === "anthropic" && config.modelExplicit ? config.model : DEFAULT_MODEL;
    const resolvedConfig = { ...config, provider: "anthropic", model };
    return {
      ok: true,
      config: resolvedConfig,
      keyInfo,
      provider: "anthropic",
    };
  }
  return { ok: true, config, keyInfo, provider: config.provider };
}

/**
 * Load the data blocks for a request. For a session debrief the primary
 * block is exactly that session (from = to = performedAt, which the engine's
 * inclusive filter reads as "this session only") and the context block is
 * the trailing four weeks ending that day.
 */
async function loadCoachData({ userId, request, now = new Date() }) {
  const { focus } = request;

  // Help mode never computes or loads a summary, a session, or a block.
  if (focus && focus.type === "help") {
    return {
      ok: true,
      primary: null,
      context: null,
      range: request.range ?? defaultRange(now),
      meta: null,
      workoutCount: 0,
    };
  }

  if (focus && focus.type === "session") {
    const session = await prisma.workoutSession.findFirst({
      where: { id: focus.sessionId, userId },
      select: {
        id: true,
        performedAt: true,
        completedAt: true,
        name: true,
        workoutTemplate: { select: { name: true } },
      },
    });
    if (!session) {
      return { ok: false, status: 404, error: "session_not_found" };
    }
    const at = session.performedAt;
    const dayLabel = dateLabelUtc(at);
    const contextTo = new Date(`${dayLabel}T23:59:59.999Z`);
    const contextFrom = new Date(
      `${dateLabelUtc(new Date(contextTo.getTime() - (CONTEXT_WEEKS * 7 - 1) * MS_PER_DAY))}T00:00:00.000Z`
    );
    const [primaryRaw, contextRaw] = await Promise.all([
      loadSummary(userId, { from: at, to: at }),
      loadSummary(userId, { from: contextFrom, to: contextTo }),
    ]);
    const primary = compactSummaryForCoach(primaryRaw);
    primary.session = {
      id: session.id,
      name: session.name ?? session.workoutTemplate?.name ?? null,
      performedAt: at.toISOString(),
      completed: Boolean(session.completedAt),
    };
    return {
      ok: true,
      primary,
      context: compactSummaryForCoach(contextRaw),
      range: {
        from: contextFrom,
        to: contextTo,
        fromLabel: dateLabelUtc(contextFrom),
        toLabel: dayLabel,
      },
      meta: primaryRaw.meta,
      workoutCount: primaryRaw.workoutCount,
    };
  }

  if (focus && focus.type === "block") {
    // Owner-check first - never reveal another user's block (404, no text).
    const blockRow = await prisma.blockTemplate.findFirst({
      where: { id: focus.blockId, userId },
      include: { weeks: blockWeekInclude },
    });
    if (!blockRow) {
      return { ok: false, status: 404, error: "block_not_found" };
    }
    const formatUnit = request.unit === "kg" ? "kg" : "lb";
    const formatBlock = blockTreeToFormat(blockRow, { unit: formatUnit });
    const blockText = blockToCompactText(formatBlock, formatUnit);
    // Attach text onto the focus object the prompt builder already receives.
    focus.blockText = blockText;

    const range = request.range ?? defaultRange(now);
    const primaryRaw = await loadSummary(userId, { from: range.from, to: range.to });
    return {
      ok: true,
      primary: compactSummaryForCoach(primaryRaw),
      context: null,
      range,
      meta: primaryRaw.meta,
      workoutCount: primaryRaw.workoutCount,
      blockText,
    };
  }

  const range = request.range ?? defaultRange(now);
  const primaryRaw = await loadSummary(userId, { from: range.from, to: range.to });
  return {
    ok: true,
    primary: compactSummaryForCoach(primaryRaw),
    context: null,
    range,
    meta: primaryRaw.meta,
    workoutCount: primaryRaw.workoutCount,
  };
}

function buildCoachPrompt({ request, data, now = new Date() }) {
  const weeks = weeksInRange(data.range);
  const focus = request.focus
    ? {
        ...request.focus,
        ...(data.blockText ? { blockText: data.blockText } : {}),
      }
    : null;
  const system = buildCoachSystemBlocks({
    primary: data.primary,
    context: data.context,
    unit: request.unit,
    focus,
    today: dateLabelUtc(now),
    weeks,
    fromLabel: data.range.fromLabel,
    toLabel: data.range.toLabel,
  });
  const messages = buildCoachMessages({
    history: request.history,
    question: request.question,
  });
  return { system, messages, weeks };
}

/** Pick the stream for the resolved provider. */
function openCoachStream({ keyInfo, config, system, messages, request, data, signal, provider }) {
  if (keyInfo.source === "mock") {
    return streamMock({
      primary: data.primary,
      context: data.context,
      question: request.question,
      unit: request.unit,
      focus: request.focus,
    });
  }
  const resolvedProvider = provider || config.provider;
  if (resolvedProvider === "cursor") {
    return streamCursor({
      apiKey: keyInfo.key,
      model: config.model,
      system,
      messages,
      signal,
    });
  }
  return streamAnthropic({
    apiKey: keyInfo.key,
    model: config.model,
    system,
    messages,
    effort: config.effort,
    maxTokens: config.maxTokens,
    signal,
  });
}

module.exports = {
  defaultRange,
  weeksInRange,
  loadCoachAccess,
  resolveCoachProvider,
  loadCoachData,
  buildCoachPrompt,
  openCoachStream,
};
