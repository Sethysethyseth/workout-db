const { createDraftForUser } = require("../../src/ai/blockDraftAccess");

const NOW = new Date("2026-09-29T12:00:00.000Z");
const HOUR = 60 * 60 * 1000;

const VALID_BLOCK = {
  format: "logchamp.block",
  version: 1,
  name: "Connector Draft",
  unit: "lb",
  effort: "rpe",
  weeks: [
    {
      days: [
        {
          name: "Day A",
          exercises: [
            {
              name: "Bench Press",
              sets: [{ reps: 5, weight: 185, rpe: 8 }],
            },
          ],
        },
      ],
    },
  ],
};

function makeFakePrisma({
  consent = null,
  recentCount = 0,
  openDraftCount = 0,
} = {}) {
  const calls = { update: [], delete: [], deleteMany: [], updateMany: [] };
  return {
    calls,
    aiConsent: {
      findUnique: jest.fn(async () => consent),
    },
    blockTemplate: {
      count: jest.fn(async ({ where }) => {
        if (where && where.isDraft === true) return openDraftCount;
        if (where && where.createdAt) return recentCount;
        return 0;
      }),
      update: jest.fn(async (...args) => {
        calls.update.push(args);
        throw new Error("unexpected prisma.blockTemplate.update");
      }),
      delete: jest.fn(async (...args) => {
        calls.delete.push(args);
        throw new Error("unexpected prisma.blockTemplate.delete");
      }),
      updateMany: jest.fn(async (...args) => {
        calls.updateMany.push(args);
        throw new Error("unexpected prisma.blockTemplate.updateMany");
      }),
      deleteMany: jest.fn(async (...args) => {
        calls.deleteMany.push(args);
        throw new Error("unexpected prisma.blockTemplate.deleteMany");
      }),
    },
  };
}

function activeConsent(overrides = {}) {
  return {
    grantedAt: new Date("2026-09-01T00:00:00.000Z"),
    revokedAt: null,
    blockDraftsAllowedAt: new Date("2026-09-28T00:00:00.000Z"),
    scope: "training:read",
    ...overrides,
  };
}

describe("createDraftForUser", () => {
  test("consent missing -> block_drafts_off", async () => {
    const prisma = makeFakePrisma({ consent: null });
    const result = await createDraftForUser("user-1", VALID_BLOCK, {
      prisma,
      now: () => NOW,
    });
    expect(result).toEqual({ error: "block_drafts_off" });
    expect(prisma.calls.update).toHaveLength(0);
    expect(prisma.calls.delete).toHaveLength(0);
  });

  test("consent granted but opt-in null -> block_drafts_off", async () => {
    const prisma = makeFakePrisma({
      consent: activeConsent({ blockDraftsAllowedAt: null }),
    });
    const result = await createDraftForUser("user-1", VALID_BLOCK, {
      prisma,
      now: () => NOW,
    });
    expect(result).toEqual({ error: "block_drafts_off" });
  });

  test("no unit -> unit_required", async () => {
    const prisma = makeFakePrisma({ consent: activeConsent() });
    const { unit, ...withoutUnit } = VALID_BLOCK;
    const result = await createDraftForUser("user-1", withoutUnit, {
      prisma,
      now: () => NOW,
    });
    expect(result).toEqual({ error: "unit_required" });
  });

  test("invalid block -> invalid_block with a path", async () => {
    const prisma = makeFakePrisma({ consent: activeConsent() });
    const result = await createDraftForUser(
      "user-1",
      { ...VALID_BLOCK, name: "" },
      { prisma, now: () => NOW }
    );
    expect(result.error).toBe("invalid_block");
    expect(Array.isArray(result.errors)).toBe(true);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors[0]).toEqual(
      expect.objectContaining({ path: expect.any(String) })
    );
  });

  test("10 connector blocks in the last 24 h -> daily_limit", async () => {
    const prisma = makeFakePrisma({
      consent: activeConsent(),
      recentCount: 10,
    });
    const result = await createDraftForUser("user-1", VALID_BLOCK, {
      prisma,
      now: () => NOW,
    });
    expect(result).toEqual({ error: "daily_limit" });
  });

  test("10 blocks 25 h old -> allowed (count window uses createdAt gte)", async () => {
    const prisma = makeFakePrisma({
      consent: activeConsent(),
      recentCount: 0,
      openDraftCount: 0,
    });
    const createCalls = [];
    const createBlockTemplateForUser = jest.fn(async (userId, body, opts) => {
      createCalls.push({ userId, body, opts });
      return {
        ok: true,
        blockTemplate: {
          id: 42,
          name: body.name,
          weeks: [
            {
              workouts: [
                {
                  exercises: [
                    {
                      exerciseName: "Bench Press",
                      exerciseId: "ex-1",
                      userExerciseId: null,
                    },
                  ],
                },
              ],
            },
          ],
        },
      };
    });

    // Fake count returns 0 for recent (simulating blocks older than 24h
    // outside the gte window). Assert the count query used a 24h floor.
    const result = await createDraftForUser("user-1", VALID_BLOCK, {
      prisma,
      now: () => NOW,
      createBlockTemplateForUser,
    });

    expect(result.error).toBeUndefined();
    expect(result.blockId).toBe(42);
    const countCalls = prisma.blockTemplate.count.mock.calls;
    const recentCall = countCalls.find(
      (c) => c[0]?.where?.createdAt?.gte instanceof Date
    );
    expect(recentCall).toBeTruthy();
    const floor = recentCall[0].where.createdAt.gte;
    expect(NOW.getTime() - floor.getTime()).toBe(24 * HOUR);
    // 25h-old blocks would fall before this floor and not count.
    const twentyFiveHoursAgo = new Date(NOW.getTime() - 25 * HOUR);
    expect(twentyFiveHoursAgo.getTime()).toBeLessThan(floor.getTime());
  });

  test("20 open drafts -> too_many_drafts", async () => {
    const prisma = makeFakePrisma({
      consent: activeConsent(),
      recentCount: 0,
      openDraftCount: 20,
    });
    const result = await createDraftForUser("user-1", VALID_BLOCK, {
      prisma,
      now: () => NOW,
    });
    expect(result).toEqual({ error: "too_many_drafts" });
  });

  test("success calls create with source connector, isDraft true, same userId, sourceUnit", async () => {
    const prisma = makeFakePrisma({
      consent: activeConsent(),
      recentCount: 0,
      openDraftCount: 0,
    });
    const createBlockTemplateForUser = jest.fn(async (userId, body, opts) => ({
      ok: true,
      blockTemplate: {
        id: 99,
        name: body.name,
        weeks: [
          {
            workouts: [
              {
                exercises: [
                  {
                    exerciseName: "Mystery Lift",
                    exerciseId: null,
                    userExerciseId: null,
                  },
                  {
                    exerciseName: "Bench Press",
                    exerciseId: "catalog-1",
                    userExerciseId: null,
                  },
                ],
              },
            ],
          },
        ],
      },
    }));

    const result = await createDraftForUser("user-abc", VALID_BLOCK, {
      prisma,
      now: () => NOW,
      createBlockTemplateForUser,
    });

    expect(createBlockTemplateForUser).toHaveBeenCalledTimes(1);
    const [userId, , opts] = createBlockTemplateForUser.mock.calls[0];
    expect(userId).toBe("user-abc");
    expect(opts).toEqual({
      source: "connector",
      isDraft: true,
      sourceUnit: "lb",
    });
    expect(result).toEqual({
      blockId: 99,
      name: "Connector Draft",
      stats: expect.objectContaining({
        weeks: 1,
        days: 1,
        exercises: 1,
        sets: 1,
      }),
      unmatchedExercises: ["Mystery Lift"],
    });
    expect(prisma.calls.update).toHaveLength(0);
    expect(prisma.calls.delete).toHaveLength(0);
    expect(prisma.calls.updateMany).toHaveLength(0);
    expect(prisma.calls.deleteMany).toHaveLength(0);
  });

  test("fake Prisma records no update/delete call on error paths", async () => {
    const prisma = makeFakePrisma({
      consent: activeConsent(),
      recentCount: 10,
    });
    await createDraftForUser("user-1", VALID_BLOCK, {
      prisma,
      now: () => NOW,
    });
    expect(prisma.blockTemplate.update).not.toHaveBeenCalled();
    expect(prisma.blockTemplate.delete).not.toHaveBeenCalled();
    expect(prisma.calls.update).toHaveLength(0);
    expect(prisma.calls.delete).toHaveLength(0);
  });
});
