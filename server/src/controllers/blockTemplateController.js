const prisma = require("../lib/prisma");
const {
  normalizeBlockWeeksArray,
  parseOptionalBoolean,
  parseOptionalDurationWeeks,
  parsePositiveInt,
} = require("../lib/templateExerciseNormalize");
const { stampBlockWeeksArray } = require("../lib/exerciseIdentity");
const {
  createBlockTemplateForUser,
  buildClonePayload,
  blockWeekInclude,
  blockWeeksDurationConflictMessage,
} = require("../blocks/blockTemplateStore");

async function createBlockTemplate(req, res, next) {
  try {
    const userId = req.authUserId;

    if (!userId) {
      return res.status(401).json({
        error: "Authentication required",
      });
    }

    const result = await createBlockTemplateForUser(userId, req.body || {}, {
      source: "builder",
      isDraft: false,
    });

    if (!result.ok) {
      return res.status(result.status).json({ error: result.error });
    }

    return res.status(201).json({
      blockTemplate: result.blockTemplate,
    });
  } catch (err) {
    return next(err);
  }
}

async function getMyBlockTemplates(req, res, next) {
  try {
    const userId = req.authUserId;

    if (!userId) {
      return res.status(401).json({
        error: "Authentication required",
      });
    }

    const blockTemplates = await prisma.blockTemplate.findMany({
      where: {
        userId,
      },
      orderBy: {
        createdAt: "desc",
      },
      include: {
        weeks: blockWeekInclude,
      },
    });

    return res.status(200).json({
      blockTemplates,
    });
  } catch (err) {
    return next(err);
  }
}

async function getPublicBlockTemplates(req, res, next) {
  try {
    const userId = req.authUserId;

    const whereClause = {
      isPublic: true,
    };

    if (userId) {
      whereClause.userId = {
        not: userId,
      };
    }

    const blockTemplates = await prisma.blockTemplate.findMany({
      where: whereClause,
      orderBy: {
        createdAt: "desc",
      },
      include: {
        weeks: blockWeekInclude,
        user: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    });

    return res.status(200).json({
      blockTemplates,
    });
  } catch (err) {
    return next(err);
  }
}

async function getBlockTemplateById(req, res, next) {
  try {
    const templateId = parsePositiveInt(req.params && req.params.id);

    if (!templateId) {
      return res.status(400).json({
        error: "Block template id must be a positive integer",
      });
    }

    const userId = req.authUserId;

    const blockTemplate = await prisma.blockTemplate.findUnique({
      where: {
        id: templateId,
      },
      include: {
        weeks: blockWeekInclude,
      },
    });

    if (!blockTemplate) {
      return res.status(404).json({
        error: "Block template not found",
      });
    }

    const isOwner = userId && blockTemplate.userId === userId;
    if (!blockTemplate.isPublic && !isOwner) {
      return res.status(403).json({
        error: "You do not have permission to view this block template",
      });
    }

    return res.status(200).json({
      blockTemplate,
    });
  } catch (err) {
    return next(err);
  }
}

async function updateBlockTemplate(req, res, next) {
  try {
    const userId = req.authUserId;

    if (!userId) {
      return res.status(401).json({
        error: "Authentication required",
      });
    }

    const templateId = parsePositiveInt(req.params && req.params.id);

    if (!templateId) {
      return res.status(400).json({
        error: "Block template id must be a positive integer",
      });
    }

    const existing = await prisma.blockTemplate.findFirst({
      where: {
        id: templateId,
        userId,
      },
      include: {
        _count: {
          select: { weeks: true },
        },
      },
    });

    if (!existing) {
      return res.status(404).json({
        error: "Block template not found",
      });
    }

    const {
      name,
      description,
      isPublic,
      durationWeeks,
      weeks,
      useRIR,
      useRPE,
      useDuration,
    } = req.body || {};

    const data = {};

    if (name !== undefined) {
      const trimmed = typeof name === "string" ? name.trim() : "";
      if (!trimmed) {
        return res.status(400).json({
          error: "Block template name cannot be empty",
        });
      }
      data.name = trimmed;
    }

    if (description !== undefined) {
      data.description =
        typeof description === "string" && description.trim()
          ? description.trim()
          : null;
    }

    if (isPublic !== undefined) {
      const nextPublic = Boolean(isPublic);
      if (nextPublic && existing.isDraft) {
        return res.status(409).json({
          error: "Save the draft to your library first.",
        });
      }
      data.isPublic = nextPublic;
    }

    if (useRIR !== undefined) {
      const b = parseOptionalBoolean(useRIR);
      if (!b.ok) {
        return res.status(b.status).json({ error: b.error });
      }
      data.useRIR = b.value;
    }
    if (useRPE !== undefined) {
      const b = parseOptionalBoolean(useRPE);
      if (!b.ok) {
        return res.status(b.status).json({ error: b.error });
      }
      data.useRPE = b.value;
    }

    if (useDuration !== undefined) {
      const b = parseOptionalBoolean(useDuration);
      if (!b.ok) {
        return res.status(b.status).json({ error: b.error });
      }
      data.useDuration = b.value;
      if (b.value === false) {
        data.durationWeeks = null;
      }
    }

    if (durationWeeks !== undefined) {
      const dur = parseOptionalDurationWeeks(durationWeeks);
      if (!dur.ok) {
        return res.status(dur.status).json({ error: dur.error });
      }
      if (data.useDuration !== false) {
        data.durationWeeks = dur.value;
        if (dur.value != null && useDuration === undefined) {
          data.useDuration = true;
        }
      }
    }

    let normalizedWeeksForCount = null;
    if (weeks !== undefined) {
      const norm = normalizeBlockWeeksArray(weeks);
      if (!norm.ok) {
        return res.status(norm.status).json({ error: norm.error });
      }
      const userExerciseRows = await prisma.userExercise.findMany({
        where: { userId },
      });
      normalizedWeeksForCount = stampBlockWeeksArray(norm.value, userExerciseRows);
      data.weeks = {
        deleteMany: {},
        create: normalizedWeeksForCount,
      };
    }

    if (Object.keys(data).length === 0) {
      return res.status(400).json({
        error: "No fields to update",
      });
    }

    const weekCountForValidation =
      normalizedWeeksForCount !== null
        ? normalizedWeeksForCount.length
        : existing._count.weeks;

    const mergedUseDuration =
      data.useDuration !== undefined ? data.useDuration : existing.useDuration;
    let mergedDurationWeeks = existing.durationWeeks;
    if (mergedUseDuration === false) {
      mergedDurationWeeks = null;
    } else if (data.durationWeeks !== undefined) {
      mergedDurationWeeks = data.durationWeeks;
    }

    const updateDurationConflict = blockWeeksDurationConflictMessage(
      weekCountForValidation,
      mergedUseDuration,
      mergedDurationWeeks
    );
    if (updateDurationConflict) {
      return res.status(400).json({ error: updateDurationConflict });
    }

    const blockTemplate = await prisma.blockTemplate.update({
      where: {
        id: templateId,
      },
      data,
      include: {
        weeks: blockWeekInclude,
      },
    });

    return res.status(200).json({
      blockTemplate,
    });
  } catch (err) {
    return next(err);
  }
}

async function deleteBlockTemplate(req, res, next) {
  try {
    const userId = req.authUserId;

    if (!userId) {
      return res.status(401).json({
        error: "Authentication required",
      });
    }

    const templateId = parsePositiveInt(req.params && req.params.id);

    if (!templateId) {
      return res.status(400).json({
        error: "Block template id must be a positive integer",
      });
    }

    const result = await prisma.blockTemplate.deleteMany({
      where: {
        id: templateId,
        userId,
      },
    });

    if (result.count === 0) {
      return res.status(404).json({
        error: "Block template not found",
      });
    }

    return res.sendStatus(204);
  } catch (err) {
    return next(err);
  }
}

async function cloneBlockTemplate(req, res, next) {
  try {
    const userId = req.authUserId;

    if (!userId) {
      return res.status(401).json({
        error: "Authentication required",
      });
    }

    const idParam = req.params && req.params.id;
    const templateId = Number(idParam);

    if (!Number.isInteger(templateId) || templateId <= 0) {
      return res.status(400).json({
        error: "Block template id must be a positive integer",
      });
    }

    const existing = await prisma.blockTemplate.findUnique({
      where: {
        id: templateId,
      },
      include: {
        weeks: blockWeekInclude,
      },
    });

    if (!existing) {
      return res.status(404).json({
        error: "Block template not found",
      });
    }

    const isOwner = existing.userId === userId;

    if (!existing.isPublic && !isOwner) {
      return res.status(403).json({
        error: "You do not have permission to clone this block template",
      });
    }

    const payload = buildClonePayload(existing);
    const result = await createBlockTemplateForUser(userId, payload, {
      source: "builder",
      isDraft: false,
    });

    if (!result.ok) {
      return res.status(result.status).json({ error: result.error });
    }

    return res.status(201).json({
      blockTemplate: result.blockTemplate,
    });
  } catch (err) {
    return next(err);
  }
}

async function acceptBlockTemplate(req, res, next) {
  try {
    const userId = req.authUserId;

    if (!userId) {
      return res.status(401).json({
        error: "Authentication required",
      });
    }

    const templateId = parsePositiveInt(req.params && req.params.id);

    if (!templateId) {
      return res.status(400).json({
        error: "Block template id must be a positive integer",
      });
    }

    const existing = await prisma.blockTemplate.findFirst({
      where: {
        id: templateId,
        userId,
      },
    });

    if (!existing) {
      return res.status(404).json({
        error: "Block template not found",
      });
    }

    const blockTemplate = await prisma.blockTemplate.update({
      where: {
        id: templateId,
      },
      data: {
        isDraft: false,
      },
      include: {
        weeks: blockWeekInclude,
      },
    });

    return res.status(200).json({
      blockTemplate,
    });
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  createBlockTemplate,
  getMyBlockTemplates,
  getPublicBlockTemplates,
  getBlockTemplateById,
  updateBlockTemplate,
  deleteBlockTemplate,
  cloneBlockTemplate,
  acceptBlockTemplate,
};
