const prisma = require("../lib/prisma");

async function createTemplate(req, res, next) {
  try {
    const userId = req.session && req.session.userId;

    if (!userId) {
      return res.status(401).json({
        error: "Authentication required",
      });
    }

    const { name, description, isPublic, exercises } = req.body || {};

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

    if (!Array.isArray(exercises) || exercises.length === 0) {
      return res.status(400).json({
        error: "Template must include at least one exercise",
      });
    }

    const normalizedExercises = [];
    const seenOrders = new Set();

    for (let index = 0; index < exercises.length; index += 1) {
      const raw = exercises[index] || {};
      const exerciseName =
        typeof raw.exerciseName === "string" ? raw.exerciseName.trim() : "";

      if (!exerciseName) {
        return res.status(400).json({
          error: "Each exercise must have an exerciseName",
        });
      }

      let order = raw.order;
      if (order == null) {
        order = index + 1;
      }

      if (!Number.isInteger(order) || order <= 0) {
        return res.status(400).json({
          error: "Exercise order must be a positive integer",
        });
      }

      if (seenOrders.has(order)) {
        return res.status(400).json({
          error: "Exercise order values must be unique within the template",
        });
      }
      seenOrders.add(order);

      const targetSets =
        raw.targetSets == null ? null : Number(raw.targetSets);

      if (targetSets != null) {
        if (!Number.isInteger(targetSets) || targetSets <= 0) {
          return res.status(400).json({
            error: "targetSets must be a positive integer when provided",
          });
        }
      }

      const notes =
        typeof raw.notes === "string" && raw.notes.trim()
          ? raw.notes.trim()
          : null;

      const targetReps =
        raw.targetReps == null ? null : String(raw.targetReps).trim();

      const exercise = {
        order,
        exerciseName,
        notes,
      };

      if (targetSets != null) {
        exercise.targetSets = targetSets;
      }

      if (targetReps) {
        exercise.targetReps = targetReps;
      }

      normalizedExercises.push(exercise);
    }

    const template = await prisma.workoutTemplate.create({
      data: {
        name: trimmedName,
        description: trimmedDescription,
        isPublic: Boolean(isPublic),
        userId,
        exercises: {
          create: normalizedExercises,
        },
      },
      include: {
        exercises: {
          orderBy: {
            order: "asc",
          },
        },
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
        exercises: {
          orderBy: {
            order: "asc",
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
        exercises: {
          orderBy: {
            order: "asc",
          },
        },
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
        exercises: {
          orderBy: {
            order: "asc",
          },
        },
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
        userId,
        exercises: {
          create: existingTemplate.exercises.map((exercise) => ({
            order: exercise.order,
            exerciseName: exercise.exerciseName,
            targetSets: exercise.targetSets,
            targetReps: exercise.targetReps,
            notes: exercise.notes,
          })),
        },
      },
      include: {
        exercises: {
          orderBy: {
            order: "asc",
          },
        },
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
  cloneTemplate,
};

