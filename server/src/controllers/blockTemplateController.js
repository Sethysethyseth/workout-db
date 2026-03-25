const prisma = require("../lib/prisma");
const {
  normalizeBlockWorkoutsArray,
  parseOptionalDurationWeeks,
  parsePositiveInt,
} = require("../lib/templateExerciseNormalize");

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

async function createBlockTemplate(req, res, next) {
  try {
    const userId = req.session && req.session.userId;

    if (!userId) {
      return res.status(401).json({
        error: "Authentication required",
      });
    }

    const { name, description, isPublic, durationWeeks, workouts } = req.body || {};

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

    const dur = parseOptionalDurationWeeks(durationWeeks);
    if (!dur.ok) {
      return res.status(dur.status).json({ error: dur.error });
    }

    const norm = normalizeBlockWorkoutsArray(workouts);
    if (!norm.ok) {
      return res.status(norm.status).json({ error: norm.error });
    }

    const data = {
      name: trimmedName,
      description: trimmedDescription,
      isPublic: Boolean(isPublic),
      userId,
      workouts: {
        create: norm.value,
      },
    };

    if (dur.value !== undefined) {
      data.durationWeeks = dur.value;
    }

    const blockTemplate = await prisma.blockTemplate.create({
      data,
      include: {
        workouts: blockWorkoutInclude,
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
    const userId = req.session && req.session.userId;

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
        workouts: blockWorkoutInclude,
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
    const userId = req.session && req.session.userId;

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
        workouts: blockWorkoutInclude,
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

    const userId = req.session && req.session.userId;

    const blockTemplate = await prisma.blockTemplate.findUnique({
      where: {
        id: templateId,
      },
      include: {
        workouts: blockWorkoutInclude,
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
    const userId = req.session && req.session.userId;

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

    const { name, description, isPublic, durationWeeks, workouts } = req.body || {};

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

    if (durationWeeks !== undefined) {
      const dur = parseOptionalDurationWeeks(durationWeeks);
      if (!dur.ok) {
        return res.status(dur.status).json({ error: dur.error });
      }
      data.durationWeeks = dur.value;
    }

    if (workouts !== undefined) {
      const norm = normalizeBlockWorkoutsArray(workouts);
      if (!norm.ok) {
        return res.status(norm.status).json({ error: norm.error });
      }
      data.workouts = {
        deleteMany: {},
        create: norm.value,
      };
    }

    if (Object.keys(data).length === 0) {
      return res.status(400).json({
        error: "No fields to update",
      });
    }

    const blockTemplate = await prisma.blockTemplate.update({
      where: {
        id: templateId,
      },
      data,
      include: {
        workouts: blockWorkoutInclude,
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
    const userId = req.session && req.session.userId;

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
    const userId = req.session && req.session.userId;

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
        workouts: blockWorkoutInclude,
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
        userId,
        workouts: {
          create: existing.workouts.map((w) => ({
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
      },
      include: {
        workouts: blockWorkoutInclude,
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
