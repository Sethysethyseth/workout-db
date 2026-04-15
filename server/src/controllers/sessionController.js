const prisma = require("../lib/prisma");
const { defaultWorkoutSessionName } = require("../lib/defaultWorkoutSessionName");

const FULL_SESSION_RELATIONS = {
  workoutTemplate: {
    select: {
      id: true,
      name: true,
      description: true,
      isPublic: true,
      userId: true,
    },
  },
  sessionExercises: {
    orderBy: {
      order: "asc",
    },
  },
  sets: {
    orderBy: {
      order: "asc",
    },
    include: {
      sessionExercise: true,
    },
  },
};

function parsePositiveInt(value) {
  if (value == null || value === "") return null;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) return null;
  return parsed;
}

function parseNullableInt(value) {
  if (value == null || value === "") return null;
  const parsed = Number(value);
  if (!Number.isInteger(parsed)) return NaN;
  return parsed;
}

function parseNullableFloat(value) {
  if (value == null || value === "") return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return NaN;
  return parsed;
}

async function startSession(req, res, next) {
  try {
    const userId = req.session && req.session.userId;

    if (!userId) {
      return res.status(401).json({
        error: "Authentication required",
      });
    }

    const templateId = parsePositiveInt(req.params && req.params.templateId);

    if (!templateId) {
      return res.status(400).json({
        error: "Template id must be a positive integer",
      });
    }

    const session = await prisma.$transaction(async (tx) => {
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
        throw Object.assign(new Error("Template not found"), {
          statusCode: 404,
          code: "TEMPLATE_NOT_FOUND",
        });
      }

      const isOwner = template.userId === userId;

      if (!template.isPublic && !isOwner) {
        throw Object.assign(
          new Error("You do not have permission to start a session from this template"),
          {
            statusCode: 403,
            code: "FORBIDDEN_TEMPLATE",
          }
        );
      }

      const createdSession = await tx.workoutSession.create({
        data: {
          userId,
          workoutTemplateId: template.id,
        },
      });

      if (template.exercises.length > 0) {
        await tx.sessionExercise.createMany({
          data: template.exercises.map((exercise) => ({
            order: exercise.order,
            exerciseName: exercise.exerciseName,
            targetSets: exercise.targetSets,
            targetReps: exercise.targetReps,
            notes: exercise.notes,
            workoutSessionId: createdSession.id,
            templateExerciseId: exercise.id,
          })),
        });
      }

      const fullSession = await tx.workoutSession.findUnique({
        where: {
          id: createdSession.id,
        },
        include: {
          workoutTemplate: {
            select: {
              id: true,
              name: true,
              description: true,
              isPublic: true,
              userId: true,
            },
          },
          sessionExercises: {
            orderBy: {
              order: "asc",
            },
          },
          sets: {
            orderBy: {
              order: "asc",
            },
            include: {
              sessionExercise: true,
            },
          },
        },
      });

      return fullSession;
    });

    return res.status(201).json({
      session,
    });
  } catch (err) {
    if (err && err.statusCode === 404 && err.code === "TEMPLATE_NOT_FOUND") {
      return res.status(404).json({
        error: "Template not found",
      });
    }

    if (err && err.statusCode === 403 && err.code === "FORBIDDEN_TEMPLATE") {
      return res.status(403).json({
        error: "You do not have permission to start a session from this template",
      });
    }

    return next(err);
  }
}

async function createAdHocSession(req, res, next) {
  try {
    const userId = req.session && req.session.userId;

    if (!userId) {
      return res.status(401).json({
        error: "Authentication required",
      });
    }

    const createdSession = await prisma.workoutSession.create({
      data: {
        userId,
      },
    });

    const session = await prisma.workoutSession.findUnique({
      where: {
        id: createdSession.id,
      },
      include: FULL_SESSION_RELATIONS,
    });

    return res.status(201).json({
      session,
    });
  } catch (err) {
    return next(err);
  }
}

async function addSessionExercise(req, res, next) {
  try {
    const userId = req.session && req.session.userId;

    if (!userId) {
      return res.status(401).json({
        error: "Authentication required",
      });
    }

    const sessionId = parsePositiveInt(req.params && req.params.id);

    if (!sessionId) {
      return res.status(400).json({
        error: "Session id must be a positive integer",
      });
    }

    const {
      exerciseName: rawName,
      notes: rawNotes,
      targetSets: rawTargetSets,
      targetReps: rawTargetReps,
    } = req.body || {};

    const exerciseName =
      typeof rawName === "string" && rawName.trim() ? rawName.trim() : null;

    if (!exerciseName) {
      return res.status(400).json({
        error: "exerciseName is required",
      });
    }

    const notes =
      typeof rawNotes === "string" && rawNotes.trim() ? rawNotes.trim() : null;

    let targetSets = null;
    if (rawTargetSets !== undefined && rawTargetSets !== null && rawTargetSets !== "") {
      const ts = parsePositiveInt(rawTargetSets);
      if (!ts) {
        return res.status(400).json({
          error: "targetSets must be a positive integer when provided",
        });
      }
      targetSets = ts;
    }

    let targetReps = null;
    if (rawTargetReps !== undefined && rawTargetReps !== null) {
      if (typeof rawTargetReps !== "string" || !rawTargetReps.trim()) {
        return res.status(400).json({
          error: "targetReps must be a non-empty string when provided",
        });
      }
      targetReps = rawTargetReps.trim();
    }

    const sessionExercise = await prisma.$transaction(async (tx) => {
      const session = await tx.workoutSession.findUnique({
        where: {
          id: sessionId,
        },
        select: {
          id: true,
          userId: true,
          completedAt: true,
        },
      });

      if (!session) {
        throw Object.assign(new Error("Session not found"), {
          statusCode: 404,
          code: "SESSION_NOT_FOUND",
        });
      }

      if (session.userId !== userId) {
        throw Object.assign(
          new Error("You do not have permission to modify this session"),
          {
            statusCode: 403,
            code: "FORBIDDEN_SESSION",
          }
        );
      }

      if (session.completedAt) {
        throw Object.assign(new Error("Completed sessions cannot be modified"), {
          statusCode: 400,
          code: "SESSION_COMPLETED",
        });
      }

      const agg = await tx.sessionExercise.aggregate({
        where: {
          workoutSessionId: sessionId,
        },
        _max: {
          order: true,
        },
      });

      const nextOrder = (agg._max.order ?? 0) + 1;

      return tx.sessionExercise.create({
        data: {
          workoutSessionId: sessionId,
          order: nextOrder,
          exerciseName,
          notes,
          targetSets,
          targetReps,
        },
      });
    });

    return res.status(201).json({
      sessionExercise,
    });
  } catch (err) {
    if (err && err.statusCode === 404 && err.code === "SESSION_NOT_FOUND") {
      return res.status(404).json({
        error: "Session not found",
      });
    }

    if (err && err.statusCode === 403 && err.code === "FORBIDDEN_SESSION") {
      return res.status(403).json({
        error: "You do not have permission to modify this session",
      });
    }

    if (err && err.statusCode === 400 && err.code === "SESSION_COMPLETED") {
      return res.status(400).json({
        error: "Completed sessions cannot be modified",
      });
    }

    return next(err);
  }
}

async function updateSessionExercise(req, res, next) {
  try {
    const userId = req.session && req.session.userId;

    if (!userId) {
      return res.status(401).json({
        error: "Authentication required",
      });
    }

    const sessionId = parsePositiveInt(req.params && req.params.id);
    const exerciseId = parsePositiveInt(req.params && req.params.exerciseId);

    if (!sessionId || !exerciseId) {
      return res.status(400).json({
        error: "Session id and exercise id must be positive integers",
      });
    }

    const { exerciseName: rawName, notes: rawNotes } = req.body || {};

    const data = {};

    if (rawName !== undefined) {
      const name = typeof rawName === "string" && rawName.trim() ? rawName.trim() : null;
      if (!name) {
        return res.status(400).json({
          error: "exerciseName cannot be empty",
        });
      }
      data.exerciseName = name;
    }

    if (rawNotes !== undefined) {
      data.notes =
        typeof rawNotes === "string" && rawNotes.trim() ? rawNotes.trim() : null;
    }

    if (Object.keys(data).length === 0) {
      return res.status(400).json({
        error: "No fields to update",
      });
    }

    const sessionExercise = await prisma.$transaction(async (tx) => {
      const existing = await tx.sessionExercise.findUnique({
        where: {
          id: exerciseId,
        },
        include: {
          workoutSession: {
            select: {
              id: true,
              userId: true,
              completedAt: true,
            },
          },
        },
      });

      if (!existing || existing.workoutSessionId !== sessionId) {
        throw Object.assign(new Error("Session exercise not found"), {
          statusCode: 404,
          code: "SESSION_EXERCISE_NOT_FOUND",
        });
      }

      if (!existing.workoutSession || existing.workoutSession.userId !== userId) {
        throw Object.assign(
          new Error("You do not have permission to modify this session exercise"),
          {
            statusCode: 403,
            code: "FORBIDDEN_SESSION",
          }
        );
      }

      if (existing.workoutSession.completedAt) {
        throw Object.assign(new Error("Completed sessions cannot be modified"), {
          statusCode: 400,
          code: "SESSION_COMPLETED",
        });
      }

      return tx.sessionExercise.update({
        where: {
          id: exerciseId,
        },
        data,
      });
    });

    return res.status(200).json({
      sessionExercise,
    });
  } catch (err) {
    if (err && err.statusCode === 404 && err.code === "SESSION_EXERCISE_NOT_FOUND") {
      return res.status(404).json({
        error: "Session exercise not found",
      });
    }

    if (err && err.statusCode === 403 && err.code === "FORBIDDEN_SESSION") {
      return res.status(403).json({
        error: "You do not have permission to modify this session exercise",
      });
    }

    if (err && err.statusCode === 400 && err.code === "SESSION_COMPLETED") {
      return res.status(400).json({
        error: "Completed sessions cannot be modified",
      });
    }

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
            sessionExercises: true,
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

    const sessionId = parsePositiveInt(req.params && req.params.id);

    if (!sessionId) {
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
          select: {
            id: true,
            name: true,
            description: true,
            isPublic: true,
            userId: true,
          },
        },
        sessionExercises: {
          orderBy: {
            order: "asc",
          },
        },
        sets: {
          orderBy: [
            {
              order: "asc",
            },
          ],
          include: {
            sessionExercise: true,
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

    const sessionId = parsePositiveInt(req.params && req.params.id);

    if (!sessionId) {
      return res.status(400).json({
        error: "Session id must be a positive integer",
      });
    }

    const {
      sessionExerciseId: rawSessionExerciseId,
      order: rawOrder,
      reps: rawReps,
      weight: rawWeight,
      rpe: rawRpe,
      rir: rawRir,
      notes: rawNotes,
    } = req.body || {};

    const sessionExerciseId = parsePositiveInt(rawSessionExerciseId);
    if (!sessionExerciseId) {
      return res.status(400).json({
        error: "sessionExerciseId must be a positive integer",
      });
    }

    const order = parsePositiveInt(rawOrder);
    if (!order) {
      return res.status(400).json({
        error: "Set order must be a positive integer",
      });
    }

    const reps = parseNullableInt(rawReps);
    if (Number.isNaN(reps) || (reps !== null && reps <= 0)) {
      return res.status(400).json({
        error: "reps must be a positive integer when provided",
      });
    }

    const weight = parseNullableFloat(rawWeight);
    if (Number.isNaN(weight) || (weight !== null && weight < 0)) {
      return res.status(400).json({
        error: "weight must be a non-negative number when provided",
      });
    }

    const rpe = parseNullableFloat(rawRpe);
    if (Number.isNaN(rpe) || (rpe !== null && rpe < 0)) {
      return res.status(400).json({
        error: "rpe must be a non-negative number when provided",
      });
    }

    const rir = parseNullableInt(rawRir);
    if (Number.isNaN(rir) || (rir !== null && rir < 0)) {
      return res.status(400).json({
        error: "rir must be a non-negative integer when provided",
      });
    }

    const notes =
      typeof rawNotes === "string" && rawNotes.trim() ? rawNotes.trim() : null;

    const set = await prisma.$transaction(async (tx) => {
      const session = await tx.workoutSession.findUnique({
        where: {
          id: sessionId,
        },
        select: {
          id: true,
          userId: true,
          completedAt: true,
        },
      });

      if (!session) {
        throw Object.assign(new Error("Session not found"), {
          statusCode: 404,
          code: "SESSION_NOT_FOUND",
        });
      }

      if (session.userId !== userId) {
        throw Object.assign(
          new Error("You do not have permission to add sets to this session"),
          {
            statusCode: 403,
            code: "FORBIDDEN_SESSION",
          }
        );
      }

      if (session.completedAt) {
        throw Object.assign(new Error("Completed sessions cannot be modified"), {
          statusCode: 400,
          code: "SESSION_COMPLETED",
        });
      }

      const sessionExercise = await tx.sessionExercise.findFirst({
        where: {
          id: sessionExerciseId,
          workoutSessionId: session.id,
        },
        select: {
          id: true,
        },
      });

      if (!sessionExercise) {
        throw Object.assign(new Error("sessionExerciseId does not belong to this session"), {
          statusCode: 400,
          code: "SESSION_EXERCISE_MISMATCH",
        });
      }

      const createdSet = await tx.workoutSet.create({
        data: {
          workoutSessionId: session.id,
          sessionExerciseId,
          order,
          reps,
          weight,
          rpe,
          rir,
          notes,
        },
        include: {
          sessionExercise: true,
        },
      });

      return createdSet;
    });

    return res.status(201).json({
      set,
    });
  } catch (err) {
    if (err && err.statusCode === 404 && err.code === "SESSION_NOT_FOUND") {
      return res.status(404).json({
        error: "Session not found",
      });
    }

    if (err && err.statusCode === 403 && err.code === "FORBIDDEN_SESSION") {
      return res.status(403).json({
        error: "You do not have permission to add sets to this session",
      });
    }

    if (err && err.statusCode === 400 && err.code === "SESSION_COMPLETED") {
      return res.status(400).json({
        error: "Completed sessions cannot be modified",
      });
    }

    if (err && err.statusCode === 400 && err.code === "SESSION_EXERCISE_MISMATCH") {
      return res.status(400).json({
        error: "sessionExerciseId does not belong to this session",
      });
    }

    if (err && err.code === "P2002") {
      return res.status(400).json({
        error: "Set order must be unique within the session",
      });
    }

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

    const setId = parsePositiveInt(req.params && req.params.id);

    if (!setId) {
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

    if (rawOrder !== undefined) {
      const order = parsePositiveInt(rawOrder);
      if (!order) {
        return res.status(400).json({
          error: "order must be a positive integer when provided",
        });
      }
      data.order = order;
    }

    if (rawReps !== undefined) {
      if (rawReps === "" || rawReps === null) {
        data.reps = null;
      } else {
        const reps = parseNullableInt(rawReps);
        if (Number.isNaN(reps) || reps <= 0) {
          return res.status(400).json({
            error: "reps must be a positive integer when provided",
          });
        }
        data.reps = reps;
      }
    }

    if (rawWeight !== undefined) {
      if (rawWeight === "" || rawWeight === null) {
        data.weight = null;
      } else {
        const weight = parseNullableFloat(rawWeight);
        if (Number.isNaN(weight) || weight < 0) {
          return res.status(400).json({
            error: "weight must be a non-negative number when provided",
          });
        }
        data.weight = weight;
      }
    }

    if (rawRpe !== undefined) {
      if (rawRpe === "" || rawRpe === null) {
        data.rpe = null;
      } else {
        const rpe = parseNullableFloat(rawRpe);
        if (Number.isNaN(rpe) || rpe < 0) {
          return res.status(400).json({
            error: "rpe must be a non-negative number when provided",
          });
        }
        data.rpe = rpe;
      }
    }

    if (rawRir !== undefined) {
      if (rawRir === "" || rawRir === null) {
        data.rir = null;
      } else {
        const rir = parseNullableInt(rawRir);
        if (Number.isNaN(rir) || rir < 0) {
          return res.status(400).json({
            error: "rir must be a non-negative integer when provided",
          });
        }
        data.rir = rir;
      }
    }

    if (rawNotes !== undefined) {
      data.notes =
        typeof rawNotes === "string" && rawNotes.trim() ? rawNotes.trim() : null;
    }

    if (Object.keys(data).length === 0) {
      return res.status(400).json({
        error: "No fields to update",
      });
    }

    const set = await prisma.$transaction(async (tx) => {
      const existingSet = await tx.workoutSet.findUnique({
        where: {
          id: setId,
        },
        include: {
          workoutSession: {
            select: {
              id: true,
              userId: true,
              completedAt: true,
            },
          },
        },
      });

      if (!existingSet) {
        throw Object.assign(new Error("Set not found"), {
          statusCode: 404,
          code: "SET_NOT_FOUND",
        });
      }

      if (!existingSet.workoutSession || existingSet.workoutSession.userId !== userId) {
        throw Object.assign(new Error("You do not have permission to modify this set"), {
          statusCode: 403,
          code: "FORBIDDEN_SET",
        });
      }

      if (existingSet.workoutSession.completedAt) {
        throw Object.assign(new Error("Completed sessions cannot be modified"), {
          statusCode: 400,
          code: "SESSION_COMPLETED",
        });
      }

      const updatedSet = await tx.workoutSet.update({
        where: {
          id: setId,
        },
        data,
        include: {
          sessionExercise: true,
        },
      });

      return updatedSet;
    });

    return res.status(200).json({
      set,
    });
  } catch (err) {
    if (err && err.statusCode === 404 && err.code === "SET_NOT_FOUND") {
      return res.status(404).json({
        error: "Set not found",
      });
    }

    if (err && err.statusCode === 403 && err.code === "FORBIDDEN_SET") {
      return res.status(403).json({
        error: "You do not have permission to modify this set",
      });
    }

    if (err && err.statusCode === 400 && err.code === "SESSION_COMPLETED") {
      return res.status(400).json({
        error: "Completed sessions cannot be modified",
      });
    }

    if (err && err.code === "P2002") {
      return res.status(400).json({
        error: "Set order must be unique within the session",
      });
    }

    return next(err);
  }
}

async function updateSession(req, res, next) {
  try {
    const userId = req.session && req.session.userId;

    if (!userId) {
      return res.status(401).json({
        error: "Authentication required",
      });
    }

    const sessionId = parsePositiveInt(req.params && req.params.id);

    if (!sessionId) {
      return res.status(400).json({
        error: "Session id must be a positive integer",
      });
    }

    const { notes: rawNotes, performedAt: rawPerformedAt, name: rawName } = req.body || {};

    const data = {};

    if (rawNotes !== undefined) {
      data.notes =
        typeof rawNotes === "string" && rawNotes.trim() ? rawNotes.trim() : null;
    }

    if (rawName !== undefined) {
      if (typeof rawName !== "string") {
        return res.status(400).json({
          error: "name must be a string when provided",
        });
      }
      data.name = rawName.trim() ? rawName.trim() : null;
    }

    if (rawPerformedAt !== undefined) {
      if (typeof rawPerformedAt !== "string" || !rawPerformedAt.trim()) {
        return res.status(400).json({
          error: "performedAt must be a valid ISO 8601 datetime when provided",
        });
      }

      const performedAtDate = new Date(rawPerformedAt);

      if (Number.isNaN(performedAtDate.getTime())) {
        return res.status(400).json({
          error: "performedAt must be a valid ISO 8601 datetime when provided",
        });
      }

      data.performedAt = performedAtDate;
    }

    if (Object.keys(data).length === 0) {
      return res.status(400).json({
        error: "No fields to update",
      });
    }

    const existingSession = await prisma.workoutSession.findFirst({
      where: {
        id: sessionId,
        userId,
      },
      select: {
        id: true,
        completedAt: true,
        workoutTemplateId: true,
      },
    });

    if (!existingSession) {
      return res.status(404).json({
        error: "Session not found",
      });
    }

    if (existingSession.completedAt) {
      return res.status(400).json({
        error: "Completed sessions cannot be modified",
      });
    }

    if (rawName !== undefined && existingSession.workoutTemplateId != null) {
      delete data.name;
    }

    if (Object.keys(data).length === 0) {
      return res.status(400).json({
        error: "No fields to update",
      });
    }

    const session = await prisma.workoutSession.update({
      where: {
        id: sessionId,
      },
      data,
      include: {
        workoutTemplate: {
          select: {
            id: true,
            name: true,
            description: true,
            isPublic: true,
            userId: true,
          },
        },
        sessionExercises: {
          orderBy: {
            order: "asc",
          },
        },
        sets: {
          orderBy: [
            {
              order: "asc",
            },
          ],
          include: {
            sessionExercise: true,
          },
        },
      },
    });

    return res.status(200).json({
      session,
    });
  } catch (err) {
    return next(err);
  }
}

async function completeSession(req, res, next) {
  try {
    const userId = req.session && req.session.userId;

    if (!userId) {
      return res.status(401).json({
        error: "Authentication required",
      });
    }

    const sessionId = parsePositiveInt(req.params && req.params.id);

    if (!sessionId) {
      return res.status(400).json({
        error: "Session id must be a positive integer",
      });
    }

    const existingSession = await prisma.workoutSession.findFirst({
      where: {
        id: sessionId,
        userId,
      },
      select: {
        id: true,
        completedAt: true,
        workoutTemplateId: true,
        name: true,
        performedAt: true,
        startedAt: true,
      },
    });

    if (!existingSession) {
      return res.status(404).json({
        error: "Session not found",
      });
    }

    if (existingSession.completedAt) {
      return res.status(400).json({
        error: "Session is already completed",
      });
    }

    const body = req.body || {};
    const updateData = {
      completedAt: new Date(),
    };

    if (existingSession.workoutTemplateId == null) {
      const fromBody =
        typeof body.name === "string" && body.name.trim() ? body.name.trim() : "";
      const fromDb =
        existingSession.name != null && String(existingSession.name).trim()
          ? String(existingSession.name).trim()
          : "";
      const chosen = fromBody || fromDb;
      const anchor = existingSession.performedAt || existingSession.startedAt;
      updateData.name = chosen || defaultWorkoutSessionName(anchor);
    }

    const session = await prisma.workoutSession.update({
      where: {
        id: sessionId,
      },
      data: updateData,
      include: {
        workoutTemplate: {
          select: {
            id: true,
            name: true,
            description: true,
            isPublic: true,
            userId: true,
          },
        },
        sessionExercises: {
          orderBy: {
            order: "asc",
          },
        },
        sets: {
          orderBy: [
            {
              order: "asc",
            },
          ],
          include: {
            sessionExercise: true,
          },
        },
      },
    });

    return res.status(200).json({
      session,
    });
  } catch (err) {
    return next(err);
  }
}

async function deleteSession(req, res, next) {
  try {
    const userId = req.session && req.session.userId;

    if (!userId) {
      return res.status(401).json({
        error: "Authentication required",
      });
    }

    const sessionId = parsePositiveInt(req.params && req.params.id);

    if (!sessionId) {
      return res.status(400).json({
        error: "Session id must be a positive integer",
      });
    }

    const result = await prisma.workoutSession.deleteMany({
      where: {
        id: sessionId,
        userId,
      },
    });

    if (result.count === 0) {
      return res.status(404).json({
        error: "Session not found",
      });
    }

    return res.sendStatus(204);
  } catch (err) {
    return next(err);
  }
}

async function deleteSet(req, res, next) {
  try {
    const userId = req.session && req.session.userId;

    if (!userId) {
      return res.status(401).json({
        error: "Authentication required",
      });
    }

    const setId = parsePositiveInt(req.params && req.params.id);

    if (!setId) {
      return res.status(400).json({
        error: "Set id must be a positive integer",
      });
    }

    const deleted = await prisma.$transaction(async (tx) => {
      const existingSet = await tx.workoutSet.findUnique({
        where: {
          id: setId,
        },
        include: {
          workoutSession: {
            select: {
              id: true,
              userId: true,
              completedAt: true,
            },
          },
        },
      });

      if (!existingSet) {
        return { status: 404 };
      }

      if (
        !existingSet.workoutSession ||
        existingSet.workoutSession.userId !== userId
      ) {
        return { status: 403 };
      }

      if (existingSet.workoutSession.completedAt) {
        return { status: 400 };
      }

      await tx.workoutSet.delete({
        where: {
          id: setId,
        },
      });

      return { status: 204 };
    });

    if (deleted.status === 404) {
      return res.status(404).json({
        error: "Set not found",
      });
    }

    if (deleted.status === 403) {
      return res.status(403).json({
        error: "You do not have permission to delete this set",
      });
    }

    if (deleted.status === 400) {
      return res.status(400).json({
        error: "Completed sessions cannot be modified",
      });
    }

    return res.sendStatus(204);
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  startSession,
  createAdHocSession,
  addSessionExercise,
  updateSessionExercise,
  getMySessions,
  getSessionById,
  createSetForSession,
  updateSet,
  updateSession,
  completeSession,
  deleteSession,
  deleteSet,
};