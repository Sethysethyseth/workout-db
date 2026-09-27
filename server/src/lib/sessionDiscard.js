/**
 * A workout may be discarded only when it is LIVE (completedAt null)
 * AND was NEVER finished (reopenedAt null). Pure — no Prisma.
 *
 * @param {{ completedAt?: Date | string | null, reopenedAt?: Date | string | null }} session
 * @returns {{ allowed: boolean, reason: string | null }}
 */
function canDiscardSession({ completedAt, reopenedAt } = {}) {
  if (completedAt != null) {
    return { allowed: false, reason: "completed" };
  }
  if (reopenedAt != null) {
    return { allowed: false, reason: "reopened" };
  }
  return { allowed: true, reason: null };
}

module.exports = {
  canDiscardSession,
};
