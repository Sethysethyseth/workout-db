const {
  reserveUses,
  settleUses,
  refundUses,
} = require("../../src/coach/usageLedger");

const NOW = new Date("2026-09-27T12:00:00Z");

function timestampsForUsed(used) {
  const out = [];
  for (let i = 0; i < used; i += 1) {
    out.push(new Date(`2026-09-${21 + (i % 6)}T12:00:00.000Z`));
  }
  return out;
}

function fakePrisma({ used = 0, createFail = false } = {}) {
  const calls = [];
  const rows = [];
  let nextId = 1;
  const existing = timestampsForUsed(used).map((createdAt, i) => ({
    id: 1000 + i,
    createdAt,
  }));

  const tx = {
    $executeRaw: async () => {
      calls.push("lock");
      return 1;
    },
    coachUsage: {
      findMany: async () => {
        calls.push("count");
        return existing.map((r) => ({ createdAt: r.createdAt }));
      },
      create: async ({ data }) => {
        calls.push("insert");
        if (createFail) throw new Error("create failed");
        const row = { id: nextId++, userId: data.userId, createdAt: NOW };
        rows.push(row);
        return row;
      },
    },
  };

  const deleted = [];
  return {
    calls,
    rows,
    deleted,
    $transaction: async (fn) => fn(tx),
    coachUsage: {
      delete: async ({ where }) => {
        deleted.push(where.id);
        return { id: where.id };
      },
    },
  };
}

describe("reserveUses", () => {
  test("remaining 2, n=3 -> ok:false and zero rows inserted", async () => {
    const prisma = fakePrisma({ used: 5 });
    const result = await reserveUses(prisma, "user-1", 3, NOW);
    expect(result.ok).toBe(false);
    expect(result.cap.remaining).toBe(2);
    expect(result.cap.used).toBe(5);
    expect(prisma.rows).toHaveLength(0);
    expect(prisma.calls.filter((c) => c === "insert")).toHaveLength(0);
  });

  test("remaining 7, n=3 -> 3 ids", async () => {
    const prisma = fakePrisma({ used: 0 });
    const result = await reserveUses(prisma, "user-1", 3, NOW);
    expect(result.ok).toBe(true);
    expect(result.ids).toEqual([1, 2, 3]);
    expect(prisma.rows).toHaveLength(3);
    expect(result.cap.used).toBe(3);
    expect(result.cap.remaining).toBe(4);
  });

  test("lock is taken in the same transaction before count + insert", async () => {
    const prisma = fakePrisma({ used: 0 });
    await reserveUses(prisma, "user-1", 2, NOW);
    expect(prisma.calls).toEqual(["lock", "count", "insert", "insert"]);
  });
});

describe("settleUses / refundUses", () => {
  test("settle(ids of 4, actualCost 2) deletes exactly 2", async () => {
    const prisma = fakePrisma();
    await settleUses(prisma, [10, 11, 12, 13], 2);
    expect(prisma.deleted).toEqual([12, 13]);
  });

  test("refund deletes all", async () => {
    const prisma = fakePrisma();
    await refundUses(prisma, [21, 22, 23]);
    expect(prisma.deleted).toEqual([21, 22, 23]);
  });

  test("settle clamps actualCost to 0..ids.length", async () => {
    const prisma = fakePrisma();
    await settleUses(prisma, [1, 2], 99);
    expect(prisma.deleted).toEqual([]);
    await settleUses(prisma, [3, 4], -1);
    expect(prisma.deleted).toEqual([3, 4]);
  });
});
