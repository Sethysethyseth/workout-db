const prisma = require("../lib/prisma");
const { parsePositiveInt } = require("../lib/templateExerciseNormalize");
const { blockWeekInclude } = require("../blocks/blockTemplateStore");
const { computeRunProgress } = require("../blocks/blockRunLogic");

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
          select: {
            id: true,
            blockWeekOrder: true,
            blockWorkoutOrder: true,
            completedAt: true,
          },
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
  endBlockRun,
};
