/**
 * Pure title for a new coach conversation. No env, no Prisma.
 * Trim, collapse whitespace, and cut on a word boundary at 80 characters.
 */

const MAX_TITLE_CHARS = 80;

function deriveConversationTitle(question) {
  const collapsed = String(question ?? "")
    .replace(/\s+/g, " ")
    .trim();
  if (!collapsed) return "Coach conversation";
  if (collapsed.length <= MAX_TITLE_CHARS) return collapsed;

  const head = collapsed.slice(0, MAX_TITLE_CHARS);
  const boundary = head.lastIndexOf(" ");
  const cut = boundary > 0 ? head.slice(0, boundary) : head;
  return `${cut}...`;
}

module.exports = {
  deriveConversationTitle,
  MAX_TITLE_CHARS,
};
