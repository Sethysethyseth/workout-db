/**
 * The ONLY place the connector writes. Create-only draft blocks for the
 * verified userId - never updates or deletes. Isolation doctrine matches
 * analyticsAccess.js: userId comes from the caller (MCP closure), never
 * from model-supplied arguments.
 *
 * Spec: docs/specs/blocks-v2.md section 8.
 */

const prismaDefault = require("../lib/prisma");
const { isConsentActive } = require("./consent");
const { validateBlockDraft } = require("../blocks/blockFormat");
const { formatToCreatePayload } = require("../blocks/blockFormatMapping");
const {
  createBlockTemplateForUser: createBlockTemplateForUserDefault,
} = require("../blocks/blockTemplateStore");

const DAILY_LIMIT = 10;
const OPEN_DRAFT_LIMIT = 20;
const DAY_MS = 24 * 60 * 60 * 1000;
const MAX_RETURNED_ERRORS = 20;

function collectUnmatchedExercises(blockTemplate) {
  const names = [];
  const weeks = blockTemplate?.weeks || [];
  for (const week of weeks) {
    for (const workout of week.workouts || []) {
      for (const exercise of workout.exercises || []) {
        if (exercise.exerciseId == null && exercise.userExerciseId == null) {
          const name =
            typeof exercise.exerciseName === "string"
              ? exercise.exerciseName
              : null;
          if (name) names.push(name);
        }
      }
    }
  }
  return names;
}

/**
 * @param {string} userId
 * @param {object} block - LogChamp Block Format v1 candidate
 * @param {{ prisma?: object, now?: () => Date, createBlockTemplateForUser?: Function }} [deps]
 * @returns {Promise<object>} success payload or `{ error, ... }`
 */
async function createDraftForUser(userId, block, deps = {}) {
  const prisma = deps.prisma || prismaDefault;
  const now = typeof deps.now === "function" ? deps.now() : new Date();
  const createBlockTemplateForUser =
    deps.createBlockTemplateForUser || createBlockTemplateForUserDefault;

  const consent = await prisma.aiConsent.findUnique({ where: { userId } });
  if (!isConsentActive(consent) || consent.blockDraftsAllowedAt == null) {
    return { error: "block_drafts_off" };
  }

  if (
    block == null ||
    typeof block !== "object" ||
    Array.isArray(block) ||
    block.unit == null ||
    block.unit === ""
  ) {
    return { error: "unit_required" };
  }

  const validated = validateBlockDraft(block, { targetUnit: block.unit });
  if (!validated.ok) {
    return {
      error: "invalid_block",
      errors: (validated.errors || []).slice(0, MAX_RETURNED_ERRORS),
    };
  }

  const since = new Date(now.getTime() - DAY_MS);
  const recentConnectorCount = await prisma.blockTemplate.count({
    where: {
      userId,
      source: "connector",
      createdAt: { gte: since },
    },
  });
  if (recentConnectorCount >= DAILY_LIMIT) {
    return { error: "daily_limit" };
  }

  const openDraftCount = await prisma.blockTemplate.count({
    where: {
      userId,
      source: "connector",
      isDraft: true,
    },
  });
  if (openDraftCount >= OPEN_DRAFT_LIMIT) {
    return { error: "too_many_drafts" };
  }

  const sourceUnit = block.unit === "lb" || block.unit === "kg" ? block.unit : null;
  const payload = formatToCreatePayload(validated.block);
  const result = await createBlockTemplateForUser(userId, payload, {
    source: "connector",
    isDraft: true,
    sourceUnit,
  });

  if (!result.ok) {
    return {
      error: "create_failed",
      message: result.error || "Could not save the draft",
    };
  }

  return {
    blockId: result.blockTemplate.id,
    name: result.blockTemplate.name,
    stats: validated.stats,
    unmatchedExercises: collectUnmatchedExercises(result.blockTemplate),
  };
}

module.exports = {
  createDraftForUser,
  DAILY_LIMIT,
  OPEN_DRAFT_LIMIT,
};
