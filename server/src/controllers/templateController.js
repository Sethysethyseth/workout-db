const prisma = require("../lib/prisma");
const {
  normalizeExercisesArray,
  parseOptionalBoolean,
  parsePositiveInt,
} = require("../lib/templateExerciseNormalize");

const exerciseInclude = {
  orderBy: {
    order: "asc",
  },
  include: {
    templateSets: {
      orderBy: {
        order: "asc",
      },
    },
  },
};

async function createTemplate(req, res, next) {
  try {
    const userId = req.session && req.session.userId;

    if (!userId) {
      return res.status(401).json({
        error: "Authentication required",
      });
    }

    const { name, description, isPublic, exercises, useRIR, useRPE } = req.body || {};

    const trimmedName = typeof name === "string" ? name.trim() : "";
    const trimmedDescription =
      typeof description === "string" && description.trim()
        ? description.trim()
        : null;

    if (!trimmedName) {
      return res.status(400).json({
        error: "Template name is required",
      });
    }

    const norm = normalizeExercisesArray(exercises);
    if (!norm.ok) {
      return res.status(norm.status).json({ error: norm.error });
    }

    const createData = {
      name: trimmedName,
      description: trimmedDescription,
      isPublic: Boolean(isPublic),
      userId,
      exercises: {
        create: norm.value,
      },
    };

    if (useRIR !== undefined) {
      const b = parseOptionalBoolean(useRIR);
      if (!b.ok) {
        return res.status(b.status).json({ error: b.error });
      }
      createData.useRIR = b.value;
    }
    if (useRPE !== undefined) {
      const b = parseOptionalBoolean(useRPE);
      if (!b.ok) {
        return res.status(b.status).json({ error: b.error });
      }
      createData.useRPE = b.value;
    }

    const template = await prisma.workoutTemplate.create({
      data: createData,
      include: {
        exercises: exerciseInclude,
      },
    });

    return res.status(201).json({
      template,
    });
  } catch (err) {
    return next(err);
  }
}

async function getMyTemplates(req, res, next) {
  try {
    const userId = req.session && req.session.userId;

    if (!userId) {
      return res.status(401).json({
        error: "Authentication required",
      });
    }

    const templates = await prisma.workoutTemplate.findMany({
      where: {
        userId,
      },
      orderBy: {
        createdAt: "desc",
      },
      include: {
        exercises: exerciseInclude,
      },
    });

    return res.status(200).json({
      templates,
    });
  } catch (err) {
    return next(err);
  }
}

async function getPublicTemplates(req, res, next) {
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

    const templates = await prisma.workoutTemplate.findMany({
      where: whereClause,
      orderBy: {
        createdAt: "desc",
      },
      include: {
        exercises: exerciseInclude,
        user: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    });

    return res.status(200).json({
      templates,
    });
  } catch (err) {
    return next(err);
  }
}

async function getTemplateById(req, res, next) {
  try {
    const templateId = parsePositiveInt(req.params && req.params.id);

    if (!templateId) {
      return res.status(400).json({
        error: "Template id must be a positive integer",
      });
    }

    const userId = req.session && req.session.userId;

    const template = await prisma.workoutTemplate.findUnique({
      where: {
        id: templateId,
      },
      include: {
        exercises: exerciseInclude,
      },
    });

    if (!template) {
      return res.status(404).json({
        error: "Template not found",
      });
    }

    const isOwner = userId && template.userId === userId;
    if (!template.isPublic && !isOwner) {
      return res.status(403).json({
        error: "You do not have permission to view this template",
      });
    }

    return res.status(200).json({
      template,
    });
  } catch (err) {
    return next(err);
  }
}

async function updateTemplate(req, res, next) {
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
        error: "Template id must be a positive integer",
      });
    }

    const existing = await prisma.workoutTemplate.findFirst({
      where: {
        id: templateId,
        userId,
      },
    });

    if (!existing) {
      return res.status(404).json({
        error: "Template not found",
      });
    }

    const { name, description, isPublic, exercises, useRIR, useRPE } = req.body || {};

    const data = {};

    if (name !== undefined) {
      const trimmed = typeof name === "string" ? name.trim() : "";
      if (!trimmed) {
        return res.status(400).json({
          error: "Template name cannot be empty",
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

    if (exercises !== undefined) {
      const norm = normalizeExercisesArray(exercises);
      if (!norm.ok) {
        return res.status(norm.status).json({ error: norm.error });
      }
      data.exercises = {
        deleteMany: {},
        create: norm.value,
      };
    }

    if (Object.keys(data).length === 0) {
      return res.status(400).json({
        error: "No fields to update",
      });
    }

    const template = await prisma.workoutTemplate.update({
      where: {
        id: templateId,
      },
      data,
      include: {
        exercises: exerciseInclude,
      },
    });

    return res.status(200).json({
      template,
    });
  } catch (err) {
    return next(err);
  }
}

async function deleteTemplate(req, res, next) {
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
        error: "Template id must be a positive integer",
      });
    }

    const result = await prisma.workoutTemplate.deleteMany({
      where: {
        id: templateId,
        userId,
      },
    });

    if (result.count === 0) {
      return res.status(404).json({
        error: "Template not found",
      });
    }

    return res.sendStatus(204);
  } catch (err) {
    return next(err);
  }
}

async function cloneTemplate(req, res, next) {
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
        error: "Template id must be a positive integer",
      });
    }

    const existingTemplate = await prisma.workoutTemplate.findUnique({
      where: {
        id: templateId,
      },
      include: {
        exercises: exerciseInclude,
      },
    });

    if (!existingTemplate) {
      return res.status(404).json({
        error: "Template not found",
      });
    }

    const isOwner = existingTemplate.userId === userId;

    if (!existingTemplate.isPublic && !isOwner) {
      return res.status(403).json({
        error: "You do not have permission to clone this template",
      });
    }

    const clonedTemplate = await prisma.workoutTemplate.create({
      data: {
        name: `${existingTemplate.name} (Copy)`,
        description: existingTemplate.description,
        isPublic: false,
        useRIR: Boolean(existingTemplate.useRIR),
        useRPE: Boolean(existingTemplate.useRPE),
        userId,
        exercises: {
          create: existingTemplate.exercises.map((exercise) => {
            const base = {
              order: exercise.order,
              exerciseName: exercise.exerciseName,
              targetSets: exercise.targetSets,
              targetReps: exercise.targetReps,
              notes: exercise.notes,
            };
            const templateSets = exercise.templateSets || [];
            if (templateSets.length > 0) {
              return {
                ...base,
                templateSets: {
                  create: templateSets.map((s) => ({
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
      },
      include: {
        exercises: exerciseInclude,
      },
    });

    return res.status(201).json({
      template: clonedTemplate,
    });
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  createTemplate,
  getMyTemplates,
  getPublicTemplates,
  getTemplateById,
  updateTemplate,
  deleteTemplate,
  cloneTemplate,
};
