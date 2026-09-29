const prisma = require("../lib/prisma");
const { resolveExercise } = require("../analytics/resolve");
const { buildUserExerciseIndex } = require("../analytics/userExercises");
const {
  BLOCK_FORMAT_AI_INSTRUCTIONS,
  BLOCK_FORMAT_EXAMPLE,
  BLOCK_FORMAT_JSON_SCHEMA,
} = require("../blocks/aiFormatPrompt");
const {
  buildImportPreview,
  applyRenames,
  MAX_TEXT_CHARS,
} = require("../blocks/importPreview");
const { validateBlockDraft } = require("../blocks/blockFormat");
const {
  formatToCreatePayload,
  blockTreeToFormat,
} = require("../blocks/blockFormatMapping");
const {
  createBlockTemplateForUser,
  blockWeekInclude,
} = require("../blocks/blockTemplateStore");
const { parsePositiveInt } = require("../lib/templateExerciseNormalize");

function getBlockFormat(_req, res) {
  return res.status(200).json({
    version: 1,
    instructions: BLOCK_FORMAT_AI_INSTRUCTIONS,
    example: BLOCK_FORMAT_EXAMPLE,
    jsonSchema: BLOCK_FORMAT_JSON_SCHEMA,
  });
}

/**
 * Injected resolveName for preview: same resolver path as POST /exercises/resolve.
 */
function makeResolveName(userIndex) {
  return function resolveName(name) {
    const resolution = resolveExercise(
      { exerciseName: name },
      undefined,
      userIndex
    );
    if (resolution.resolved && resolution.source === "userExercise") {
      const display = resolution.userExercise.name;
      return {
        resolved: true,
        exerciseId: null,
        userExerciseId: resolution.userExercise.id,
        matchedName: display !== name ? display : null,
      };
    }
    if (resolution.resolved && resolution.catalogEntry) {
      const display = resolution.catalogEntry.name;
      return {
        resolved: true,
        exerciseId: resolution.catalogEntry.id,
        userExerciseId: null,
        matchedName: display !== name ? display : null,
      };
    }
    return {
      resolved: false,
      exerciseId: null,
      userExerciseId: null,
      matchedName: null,
    };
  };
}

async function previewBlockImport(req, res, next) {
  try {
    const userId = req.authUserId;
    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const body = req.body || {};
    const text = body.text;
    if (typeof text !== "string" || text.length > MAX_TEXT_CHARS) {
      return res.status(400).json({
        error: `text must be a string of at most ${MAX_TEXT_CHARS} characters`,
      });
    }

    const kind = body.kind;
    const options = body.options && typeof body.options === "object"
      ? body.options
      : {};

    const userRows = await prisma.userExercise.findMany({
      where: { userId },
    });
    const userIndex = buildUserExerciseIndex(userRows);
    const resolveName = makeResolveName(userIndex);

    const result = buildImportPreview(
      text,
      kind == null ? "auto" : kind,
      options,
      resolveName
    );

    if (!result.ok) {
      const payload = {
        errors: result.errors,
        warnings: result.warnings || [],
      };
      if (result.kind) payload.kind = result.kind;
      return res.status(422).json(payload);
    }

    return res.status(200).json({
      kind: result.kind,
      block: result.block,
      stats: result.stats,
      warnings: result.warnings,
      notices: result.notices,
      exercises: result.exercises,
    });
  } catch (err) {
    return next(err);
  }
}

async function importBlock(req, res, next) {
  try {
    const userId = req.authUserId;
    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const body = req.body || {};
    const block = body.block;
    const renames = body.renames;

    const targetUnit =
      block && (block.unit === "lb" || block.unit === "kg")
        ? block.unit
        : undefined;

    const validated = validateBlockDraft(block, { targetUnit });
    if (!validated.ok) {
      return res.status(422).json({ errors: validated.errors });
    }

    const renamed = applyRenames(validated.block, renames);
    const payload = formatToCreatePayload(renamed);
    const result = await createBlockTemplateForUser(userId, payload, {
      source: "import",
    });

    if (!result.ok) {
      return res.status(result.status).json({ error: result.error });
    }

    return res.status(201).json({ blockTemplate: result.blockTemplate });
  } catch (err) {
    return next(err);
  }
}

async function exportBlockTemplate(req, res, next) {
  try {
    const templateId = parsePositiveInt(req.params && req.params.id);
    if (!templateId) {
      return res.status(400).json({
        error: "Block template id must be a positive integer",
      });
    }

    let unit = "lb";
    if (req.query && req.query.unit !== undefined && req.query.unit !== "") {
      if (req.query.unit !== "lb" && req.query.unit !== "kg") {
        return res.status(400).json({
          error: 'unit must be "lb" or "kg"',
        });
      }
      unit = req.query.unit;
    }

    const userId = req.authUserId;
    const blockTemplate = await prisma.blockTemplate.findUnique({
      where: { id: templateId },
      include: { weeks: blockWeekInclude },
    });

    if (!blockTemplate) {
      return res.status(404).json({ error: "Block template not found" });
    }

    const isOwner = userId && blockTemplate.userId === userId;
    if (!blockTemplate.isPublic && !isOwner) {
      return res.status(403).json({
        error: "You do not have permission to view this block template",
      });
    }

    return res.status(200).json({
      block: blockTreeToFormat(blockTemplate, { unit }),
    });
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  getBlockFormat,
  previewBlockImport,
  importBlock,
  exportBlockTemplate,
};
