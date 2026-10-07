const prisma = require("../lib/prisma");
const { parsePositiveInt } = require("../lib/templateExerciseNormalize");
const { blockWeekInclude } = require("../blocks/blockTemplateStore");
const {
  computeRunProgress,
  summarizeLeftOff,
} = require("../blocks/blockRunLogic");

const sessionProgressSelect = {
  id: true,
  blockWeekOrder: true,
  blockWorkoutOrder: true,
  completedAt: true,
};

async function createBlockRun(req, res, next) {
  try {
    const userId = req.authUserId;

    if (!userId) {
      return res.status(401).json({
        error: "Authentication required",
      });
    }

    const blockTemplateId = parsePositiveInt(
      req.body && req.body.blockTemplateId
    );

    if (!blockTemplateId) {
      return res.status(400).json({
        error: "blockTemplateId must be a positive integer",
      });
    }

    const resumeRunId = parsePositiveInt(req.body && req.body.resumeRunId);

    const block = await prisma.blockTemplate.findFirst({
      where: {
        id: blockTemplateId,
        userId,
      },
      select: {
        id: true,
        isDraft: true,
      },
    });

    if (!block) {
      return res.status(404).json({
        error: "Block template not found",
      });
    }

    if (block.isDraft) {
      return res.status(409).json({
        error: "Save the draft to your library before starting it.",
      });
    }

    if (resumeRunId) {
      const existing = await prisma.blockRun.findFirst({
        where: {
          id: resumeRunId,
          userId,
        },
        include: {
          blockTemplate: {
            include: {
              weeks: blockWeekInclude,
            },
          },
          sessions: {
            select: sessionProgressSelect,
          },
        },
      });

      if (!existing || existing.blockTemplateId !== blockTemplateId) {
        return res.status(404).json({
          error: "Block run not found",
        });
      }

      const mostRecent = await prisma.blockRun.findFirst({
        where: {
          userId,
          blockTemplateId,
        },
        orderBy: {
          startedAt: "desc",
        },
        select: {
          id: true,
        },
      });

      if (!mostRecent || mostRecent.id !== existing.id) {
        return res.status(409).json({
          error: "A newer run of this block exists.",
        });
      }

      const leftOff = summarizeLeftOff(existing.blockTemplate, existing.sessions);
      if (!leftOff) {
        return res.status(409).json({
          error: "That run is already finished.",
        });
      }

      if (existing.endedAt == null) {
        const { blockTemplate, sessions, ...run } = existing;
        return res.status(200).json({ run });
      }

      const run = await prisma.$transaction(async (tx) => {
        const now = new Date();
        await tx.blockRun.updateMany({
          where: {
            userId,
            endedAt: null,
            id: { not: existing.id },
          },
          data: {
            endedAt: now,
          },
        });

        return tx.blockRun.update({
          where: { id: existing.id },
          data: { endedAt: null },
        });
      });

      return res.status(200).json({ run });
    }

    const run = await prisma.$transaction(async (tx) => {
      const now = new Date();
      await tx.blockRun.updateMany({
        where: {
          userId,
          endedAt: null,
        },
        data: {
          endedAt: now,
        },
      });

      return tx.blockRun.create({
        data: {
          userId,
          blockTemplateId: block.id,
        },
      });
    });

    return res.status(201).json({ run });
  } catch (err) {
    return next(err);
  }
}

async function getActiveBlockRun(req, res, next) {
  try {
    const userId = req.authUserId;

    if (!userId) {
      return res.status(401).json({
        error: "Authentication required",
      });
    }

    const activeRuns = await prisma.blockRun.findMany({
      where: {
        userId,
        endedAt: null,
      },
      orderBy: {
        startedAt: "desc",
      },
      take: 1,
      include: {
        blockTemplate: {
          include: {
            weeks: blockWeekInclude,
          },
        },
        sessions: {
          select: sessionProgressSelect,
        },
      },
    });

    const active = activeRuns[0] || null;

    if (!active) {
      return res.status(200).json({ run: null });
    }

    const { blockTemplate, sessions, ...run } = active;
    const progress = computeRunProgress(blockTemplate, sessions);

    return res.status(200).json({
      run,
      block: blockTemplate,
      progress,
    });
  } catch (err) {
    return next(err);
  }
}

async function getLeftOffRuns(req, res, next) {
  try {
    const userId = req.authUserId;

    if (!userId) {
      return res.status(401).json({
        error: "Authentication required",
      });
    }

    const templates = await prisma.blockTemplate.findMany({
      where: {
        userId,
        isDraft: false,
      },
      select: {
        id: true,
      },
    });

    const templateIds = templates.map((t) => t.id);
    if (templateIds.length === 0) {
      return res.status(200).json({ runs: [] });
    }

    // Light pass first: only each template's most recent run matters, so
    // block trees load once per candidate template, never per old run.
    const runs = await prisma.blockRun.findMany({
      where: {
        userId,
        blockTemplateId: { in: templateIds },
      },
      orderBy: {
        startedAt: "desc",
      },
      select: {
        id: true,
        blockTemplateId: true,
        endedAt: true,
      },
    });

    const latestEnded = [];
    const seen = new Set();
    for (const row of runs) {
      if (seen.has(row.blockTemplateId)) continue;
      seen.add(row.blockTemplateId);
      // Most recent run is still open - that template is the active block.
      if (row.endedAt != null) latestEnded.push(row);
    }

    if (latestEnded.length === 0) {
      return res.status(200).json({ runs: [] });
    }

    const [trees, sessions] = await Promise.all([
      prisma.blockTemplate.findMany({
        where: { id: { in: latestEnded.map((r) => r.blockTemplateId) } },
        include: { weeks: blockWeekInclude },
      }),
      prisma.workoutSession.findMany({
        where: { blockRunId: { in: latestEnded.map((r) => r.id) } },
        select: { ...sessionProgressSelect, blockRunId: true },
      }),
    ]);
    const treeById = new Map(trees.map((t) => [t.id, t]));

    const leftOff = [];
    for (const row of latestEnded) {
      const tree = treeById.get(row.blockTemplateId);
      if (!tree) continue;
      const runSessions = sessions.filter((s) => s.blockRunId === row.id);
      const summary = summarizeLeftOff(tree, runSessions);
      if (!summary) continue;

      leftOff.push({
        runId: row.id,
        blockTemplateId: row.blockTemplateId,
        endedAt: row.endedAt,
        nextDay: summary.nextDay,
        dayName: summary.dayName,
        doneDays: summary.doneDays,
        totalDays: summary.totalDays,
      });
    }

    return res.status(200).json({ runs: leftOff });
  } catch (err) {
    return next(err);
  }
}

async function endBlockRun(req, res, next) {
  try {
    const userId = req.authUserId;

    if (!userId) {
      return res.status(401).json({
        error: "Authentication required",
      });
    }

    const runId = parsePositiveInt(req.params && req.params.id);

    if (!runId) {
      return res.status(400).json({
        error: "Block run id must be a positive integer",
      });
    }

    const existing = await prisma.blockRun.findFirst({
      where: {
        id: runId,
        userId,
      },
    });

    if (!existing) {
      return res.status(404).json({
        error: "Block run not found",
      });
    }

    let run = existing;
    if (existing.endedAt == null) {
      await prisma.blockRun.updateMany({
        where: {
          id: existing.id,
          userId,
          endedAt: null,
        },
        data: {
          endedAt: new Date(),
        },
      });
      run = await prisma.blockRun.findFirst({
        where: {
          id: existing.id,
          userId,
        },
      });
    }

    return res.status(200).json({ run });
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  createBlockRun,
  getActiveBlockRun,
  getLeftOffRuns,
  endBlockRun,
};
