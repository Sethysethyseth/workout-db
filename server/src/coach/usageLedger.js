/**
 * Coach weekly-usage reservation ledger. DB-touching reserve / settle /
 * refund against CoachUsage. Prisma client is injected so the unit lane
 * can fake transactions and assert lock ordering.
 */

const {
  WINDOW_MS,
  evaluateWeeklyCap,
  capFromEvaluation,
  clampSettleCost,
} = require("./weeklyCap");

/**
 * Reserve `n` uses for userId inside one transaction that takes a
 * per-user advisory lock, then counts and inserts. Serializes concurrent
 * reservations for the same user.
 *
 * @returns {{ ok: true, ids: number[], cap } | { ok: false, cap }}
 */
async function reserveUses(prisma, userId, n, now = new Date()) {
  const count = typeof n === "number" && n > 0 ? Math.floor(n) : 0;
  return prisma.$transaction(async (tx) => {
    // Transaction-scoped lock keyed on the user id (hashtext -> int4).
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${userId}))`;

    const windowStart = new Date(
      (now instanceof Date ? now.getTime() : new Date(now).getTime()) - WINDOW_MS
    );
    const rows = await tx.coachUsage.findMany({
      where: { userId, createdAt: { gt: windowStart } },
      select: { createdAt: true },
    });
    const evaluated = evaluateWeeklyCap(
      rows.map((row) => row.createdAt),
      now
    );
    const cap = capFromEvaluation(evaluated);

    if (count <= 0 || evaluated.remaining < count) {
      return { ok: false, cap };
    }

    const ids = [];
    for (let i = 0; i < count; i += 1) {
      const row = await tx.coachUsage.create({ data: { userId } });
      ids.push(row.id);
    }

    const after = evaluateWeeklyCap(
      [
        ...rows.map((row) => row.createdAt),
        ...ids.map(() => (now instanceof Date ? now : new Date(now))),
      ],
      now
    );
    return { ok: true, ids, cap: capFromEvaluation(after) };
  });
}

/**
 * Keep the first `actualCost` reserved rows (clamped to 0..ids.length);
 * delete the rest. P2025-tolerant.
 */
async function settleUses(prisma, ids, actualCost) {
  if (!Array.isArray(ids) || ids.length === 0) return;
  const keep = clampSettleCost(actualCost, ids.length);
  const toDelete = ids.slice(keep);
  for (const id of toDelete) {
    if (id == null) continue;
    try {
      await prisma.coachUsage.delete({ where: { id } });
    } catch (err) {
      if (err && err.code === "P2025") continue;
      console.error(
        "[coach] failed to settle unused reservation row",
        err && err.message
      );
    }
  }
}

/**
 * Delete every reserved row (full refund). P2025-tolerant, logs like
 * removeUsageRow.
 */
async function refundUses(prisma, ids) {
  if (!Array.isArray(ids) || ids.length === 0) return;
  for (const id of ids) {
    if (id == null) continue;
    try {
      await prisma.coachUsage.delete({ where: { id } });
    } catch (err) {
      if (err && err.code === "P2025") continue;
      console.error(
        "[coach] failed to uncount unused question",
        err && err.message
      );
    }
  }
}

module.exports = {
  reserveUses,
  settleUses,
  refundUses,
};
