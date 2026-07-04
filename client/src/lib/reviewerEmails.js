function parseReviewerEmails(raw) {
  if (!raw || typeof raw !== "string") return [];
  return raw
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

export function canReviewFeedback(currentUser) {
  const reviewerEmails = parseReviewerEmails(import.meta.env.VITE_FEEDBACK_REVIEWER_EMAILS);
  return !!currentUser?.email && reviewerEmails.includes(String(currentUser.email).toLowerCase());
}
