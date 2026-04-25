const prisma = require("../lib/prisma");
const {
  normalizeBlockWeeksArray,
  parseOptionalBoolean,
  parseOptionalDurationWeeks,
  parsePositiveInt,
} = require("../lib/templateExerciseNormalize");

function blockWeeksDurationConflictMessage(weekCount, durationEnabled, durationWeeksValue) {
  if (!durationEnabled || durationWeeksValue == null) return null;
  if (weekCount > durationWeeksValue) {
    return `This block has ${weekCount} weeks but duration is set to ${durationWeeksValue}. Remove weeks or increase duration before saving.`;
  }
  return null;
}

const blockExerciseInclude = {
  orderBy: {
    order: "asc",
  },
  include: {
    blockWorkoutSets: {
      orderBy: {
        order: "asc",
      },
    },
  },
};

const blockWorkoutInclude = {
  orderBy: {
    order: "asc",
  },
  include: {
    exercises: blockExerciseInclude,
  },
};

const blockWeekInclude = {
  orderBy: {
    order: "asc",
  },
  include: {
    workouts: blockWorkoutInclude,
  },
};

async function createBlockTemplate(req, res, next) {
  try {
    const userId = req.authUserId;

    if (!userId) {
      return res.status(401).json({
        error: "Authentication required",
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

    const trimmedName = typeof name === "string" ? name.trim() : "";
    const trimmedDescription =
      typeof description === "string" && description.trim()
        ? description.trim()
        : null;

    if (!trimmedName) {
      return res.status(400).json({
        error: "Block template name is required",
      });
    }

    const useDurParsed = parseOptionalBoolean(useDuration);
    if (!useDurParsed.ok) {
      return res.status(useDurParsed.status).json({ error: useDurParsed.error });
    }

    const hasWeeksPayload =
      durationWeeks !== undefined &&
      durationWeeks !== null &&
      !(typeof durationWeeks === "string" && durationWeeks.trim() === "");

    const durationEnabled =
      useDurParsed.value !== undefined ? useDurParsed.value : hasWeeksPayload;

    let weeksValue = null;
    if (durationEnabled) {
      const dur = parseOptionalDurationWeeks(durationWeeks);
      if (!dur.ok) {
        return res.status(dur.status).json({ error: dur.error });
      }
      weeksValue = dur.value !== undefined ? dur.value : null;
    }

    const norm = normalizeBlockWeeksArray(weeks);
    if (!norm.ok) {
      return res.status(norm.status).json({ error: norm.error });
    }

    const durationConflict = blockWeeksDurationConflictMessage(
      norm.value.length,
      durationEnabled,
      weeksValue
    );
    if (durationConflict) {
      return res.status(400).json({ error: durationConflict });
    }

    const data = {
      name: trimmedName,
      description: trimmedDescription,
      isPublic: Boolean(isPublic),
      userId,
      weeks: {
        create: norm.value,
      },
      useDuration: durationEnabled,
      durationWeeks: durationEnabled ? weeksValue : null,
    };

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

    const blockTemplate = await prisma.blockTemplate.create({
      data,
      include: {
        weeks: blockWeekInclude,
      },
    });

    return res.status(201).json({
      blockTemplate,
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
      data.isPublic = Boolean(isPublic);
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
      normalizedWeeksForCount = norm.value;
      data.weeks = {
        deleteMany: {},
        create: norm.value,
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

    const cloned = await prisma.blockTemplate.create({
      data: {
        name: `${existing.name} (Copy)`,
        description: existing.description,
        isPublic: false,
        durationWeeks: existing.durationWeeks,
        useRIR: Boolean(existing.useRIR),
        useRPE: Boolean(existing.useRPE),
        useDuration: Boolean(existing.useDuration),
        userId,
        weeks: {
          create: existing.weeks.map((week) => ({
            order: week.order,
            workouts: {
              create: week.workouts.map((w) => ({
                order: w.order,
                name: w.name,
                exercises: {
                  create: w.exercises.map((exercise) => {
                    const base = {
                      order: exercise.order,
                      exerciseName: exercise.exerciseName,
                      targetSets: exercise.targetSets,
                      targetReps: exercise.targetReps,
                      notes: exercise.notes,
                    };
                    const sets = exercise.blockWorkoutSets || [];
                    if (sets.length > 0) {
                      return {
                        ...base,
                        blockWorkoutSets: {
                          create: sets.map((s) => ({
                            order: s.order,
                            reps: s.reps,
                            weight: s.weight,
                            rpe: s.rpe,
                            rir: s.rir,
                            notes: s.notes,
                          })),
                        },
                      };
                    }
                    return base;
                  }),
                },
              })),
            },
          })),
        },
      },
      include: {
        weeks: blockWeekInclude,
      },
    });

    return res.status(201).json({
      blockTemplate: cloned,
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
};
