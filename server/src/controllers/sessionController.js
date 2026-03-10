const prisma = require("../lib/prisma");

async function startSessionFromTemplate(req, res, next) {
  try {
    const userId = req.session && req.session.userId;

    if (!userId) {
      return res.status(401).json({
        error: "Authentication required",
      });
    }

    const idParam = req.params && req.params.templateId;
    const templateId = Number(idParam);

    if (!Number.isInteger(templateId) || templateId <= 0) {
      return res.status(400).json({
        error: "Template id must be a positive integer",
      });
    }

    let session;

    try {
      session = await prisma.$transaction(async (tx) => {
        const template = await tx.workoutTemplate.findUnique({
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

        if (!template) {
          const notFoundError = new Error("Template not found");
          notFoundError.status = 404;
          throw notFoundError;
        }

        const isOwner = template.userId === userId;

        if (!template.isPublic && !isOwner) {
          const forbiddenError = new Error(
            "You do not have permission to start a session from this template"
          );
          forbiddenError.status = 403;
          throw forbiddenError;
        }

        const createdSession = await tx.workoutSession.create({
          data: {
            userId,
            workoutTemplateId: template.id,
          },
          include: {
            workoutTemplate: {
              include: {
                exercises: {
                  orderBy: {
                    order: "asc",
                  },
                },
              },
            },
            sets: {
              orderBy: {
                order: "asc",
              },
            },
          },
        });

        return createdSession;
      });
    } catch (txErr) {
      if (txErr && txErr.status) {
        return res.status(txErr.status).json({
          error: txErr.message,
        });
      }

      throw txErr;
    }

    return res.status(201).json({
      session,
    });
  } catch (err) {
    return next(err);
  }
}

async function getMySessions(req, res, next) {
  try {
    const userId = req.session && req.session.userId;

    if (!userId) {
      return res.status(401).json({
        error: "Authentication required",
      });
    }

    const sessions = await prisma.workoutSession.findMany({
      where: {
        userId,
      },
      orderBy: {
        performedAt: "desc",
      },
      include: {
        workoutTemplate: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
        _count: {
          select: {
            sets: true,
          },
        },
      },
    });

    return res.status(200).json({
      sessions,
    });
  } catch (err) {
    return next(err);
  }
}

async function getSessionById(req, res, next) {
  try {
    const userId = req.session && req.session.userId;

    if (!userId) {
      return res.status(401).json({
        error: "Authentication required",
      });
    }

    const idParam = req.params && req.params.id;
    const sessionId = Number(idParam);

    if (!Number.isInteger(sessionId) || sessionId <= 0) {
      return res.status(400).json({
        error: "Session id must be a positive integer",
      });
    }

    const session = await prisma.workoutSession.findFirst({
      where: {
        id: sessionId,
        userId,
      },
      include: {
        workoutTemplate: {
          include: {
            exercises: {
              orderBy: {
                order: "asc",
              },
            },
          },
        },
        sets: {
          orderBy: {
            order: "asc",
          },
          include: {
            templateExercise: true,
          },
        },
      },
    });

    if (!session) {
      return res.status(404).json({
        error: "Session not found",
      });
    }

    return res.status(200).json({
      session,
    });
  } catch (err) {
    return next(err);
  }
}

async function createSetForSession(req, res, next) {
  try {
    const userId = req.session && req.session.userId;

    if (!userId) {
      return res.status(401).json({
        error: "Authentication required",
      });
    }

    const idParam = req.params && req.params.id;
    const sessionId = Number(idParam);

    if (!Number.isInteger(sessionId) || sessionId <= 0) {
      return res.status(400).json({
        error: "Session id must be a positive integer",
      });
    }

    const {
      templateExerciseId: rawTemplateExerciseId,
      order: rawOrder,
      reps: rawReps,
      weight: rawWeight,
      rpe: rawRpe,
      rir: rawRir,
      notes: rawNotes,
    } = req.body || {};

    const order = rawOrder == null ? null : Number(rawOrder);

    if (order == null || !Number.isInteger(order) || order <= 0) {
      return res.status(400).json({
        error: "Set order must be a positive integer",
      });
    }

    const reps =
      rawReps == null || rawReps === ""
        ? null
        : Number.isNaN(Number(rawReps))
        ? NaN
        : Number(rawReps);
    if (reps !== null && (Number.isNaN(reps) || !Number.isInteger(reps))) {
      return res.status(400).json({
        error: "reps must be an integer when provided",
      });
    }

    const weight =
      rawWeight == null || rawWeight === ""
        ? null
        : Number.isNaN(Number(rawWeight))
        ? NaN
        : Number(rawWeight);
    if (weight !== null && Number.isNaN(weight)) {
      return res.status(400).json({
        error: "weight must be a number when provided",
      });
    }

    const rpe =
      rawRpe == null || rawRpe === ""
        ? null
        : Number.isNaN(Number(rawRpe))
        ? NaN
        : Number(rawRpe);
    if (rpe !== null && Number.isNaN(rpe)) {
      return res.status(400).json({
        error: "rpe must be a number when provided",
      });
    }

    const rir =
      rawRir == null || rawRir === ""
        ? null
        : Number.isNaN(Number(rawRir))
        ? NaN
        : Number(rawRir);
    if (rir !== null && (Number.isNaN(rir) || !Number.isInteger(rir))) {
      return res.status(400).json({
        error: "rir must be an integer when provided",
      });
    }

    const notes =
      typeof rawNotes === "string" && rawNotes.trim()
        ? rawNotes.trim()
        : null;

    const templateExerciseId =
      rawTemplateExerciseId == null || rawTemplateExerciseId === ""
        ? null
        : Number(rawTemplateExerciseId);

    if (
      templateExerciseId != null &&
      (!Number.isInteger(templateExerciseId) || templateExerciseId <= 0)
    ) {
      return res.status(400).json({
        error: "templateExerciseId must be a positive integer when provided",
      });
    }

    let createdSet;

    try {
      createdSet = await prisma.$transaction(async (tx) => {
        const session = await tx.workoutSession.findUnique({
          where: {
            id: sessionId,
          },
        });

        if (!session) {
          const notFoundError = new Error("Session not found");
          notFoundError.status = 404;
          throw notFoundError;
        }

        if (session.userId !== userId) {
          const forbiddenError = new Error(
            "You do not have permission to add sets to this session"
          );
          forbiddenError.status = 403;
          throw forbiddenError;
        }

        if (templateExerciseId != null) {
          if (!session.workoutTemplateId) {
            const badRequestError = new Error(
              "Session is not associated with a template; templateExerciseId is not allowed"
            );
            badRequestError.status = 400;
            throw badRequestError;
          }

          const templateExercise = await tx.templateExercise.findUnique({
            where: {
              id: templateExerciseId,
            },
          });

          if (!templateExercise) {
            const notFoundError = new Error("Template exercise not found");
            notFoundError.status = 404;
            throw notFoundError;
          }

          if (
            templateExercise.workoutTemplateId !== session.workoutTemplateId
          ) {
            const badRequestError = new Error(
              "templateExerciseId does not belong to the session's template"
            );
            badRequestError.status = 400;
            throw badRequestError;
          }
        }

        const set = await tx.workoutSet.create({
          data: {
            workoutSessionId: session.id,
            order,
            reps,
            weight,
            rpe,
            rir,
            notes,
            templateExerciseId: templateExerciseId || null,
          },
          include: {
            templateExercise: true,
          },
        });

        return set;
      });
    } catch (txErr) {
      if (txErr && txErr.status) {
        return res.status(txErr.status).json({
          error: txErr.message,
        });
      }

      throw txErr;
    }

    return res.status(201).json({
      set: createdSet,
    });
  } catch (err) {
    return next(err);
  }
}

async function updateSet(req, res, next) {
  try {
    const userId = req.session && req.session.userId;

    if (!userId) {
      return res.status(401).json({
        error: "Authentication required",
      });
    }

    const idParam = req.params && req.params.id;
    const setId = Number(idParam);

    if (!Number.isInteger(setId) || setId <= 0) {
      return res.status(400).json({
        error: "Set id must be a positive integer",
      });
    }

    const {
      order: rawOrder,
      reps: rawReps,
      weight: rawWeight,
      rpe: rawRpe,
      rir: rawRir,
      notes: rawNotes,
    } = req.body || {};

    const data = {};

    if (rawOrder != null) {
      const order = Number(rawOrder);
      if (!Number.isInteger(order) || order <= 0) {
        return res.status(400).json({
          error: "order must be a positive integer when provided",
        });
      }
      data.order = order;
    }

    if (rawReps != null && rawReps !== "") {
      const reps = Number(rawReps);
      if (!Number.isInteger(reps)) {
        return res.status(400).json({
          error: "reps must be an integer when provided",
        });
      }
      data.reps = reps;
    } else if (rawReps === null) {
      data.reps = null;
    }

    if (rawWeight != null && rawWeight !== "") {
      const weight = Number(rawWeight);
      if (Number.isNaN(weight)) {
        return res.status(400).json({
          error: "weight must be a number when provided",
        });
      }
      data.weight = weight;
    } else if (rawWeight === null) {
      data.weight = null;
    }

    if (rawRpe != null && rawRpe !== "") {
      const rpe = Number(rawRpe);
      if (Number.isNaN(rpe)) {
        return res.status(400).json({
          error: "rpe must be a number when provided",
        });
      }
      data.rpe = rpe;
    } else if (rawRpe === null) {
      data.rpe = null;
    }

    if (rawRir != null && rawRir !== "") {
      const rir = Number(rawRir);
      if (!Number.isInteger(rir)) {
        return res.status(400).json({
          error: "rir must be an integer when provided",
        });
      }
      data.rir = rir;
    } else if (rawRir === null) {
      data.rir = null;
    }

    if (rawNotes !== undefined) {
      data.notes =
        typeof rawNotes === "string" && rawNotes.trim()
          ? rawNotes.trim()
          : null;
    }

    let updatedSet;

    try {
      updatedSet = await prisma.$transaction(async (tx) => {
        const existingSet = await tx.workoutSet.findUnique({
          where: {
            id: setId,
          },
          include: {
            workoutSession: true,
          },
        });

        if (!existingSet) {
          const notFoundError = new Error("Set not found");
          notFoundError.status = 404;
          throw notFoundError;
        }

        if (existingSet.workoutSession.userId !== userId) {
          const forbiddenError = new Error(
            "You do not have permission to modify this set"
          );
          forbiddenError.status = 403;
          throw forbiddenError;
        }

        const set = await tx.workoutSet.update({
          where: {
            id: setId,
          },
          data,
          include: {
            templateExercise: true,
          },
        });

        return set;
      });
    } catch (txErr) {
      if (txErr && txErr.status) {
        return res.status(txErr.status).json({
          error: txErr.message,
        });
      }

      throw txErr;
    }

    return res.status(200).json({
      set: updatedSet,
    });
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  startSessionFromTemplate,
  getMySessions,
  getSessionById,
  createSetForSession,
  updateSet,
};

