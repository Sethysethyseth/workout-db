const prisma = require("../lib/prisma");

function parseReviewerEmails(raw) {
  if (!raw || typeof raw !== "string") return [];
  return raw
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

module.exports = async function feedbackReviewerRequired(req, res, next) {
  try {
    const userId = req.session && req.session.userId;
    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const allowed = parseReviewerEmails(process.env.FEEDBACK_REVIEWER_EMAILS);
    if (!allowed.length) {
      return res.status(403).json({
        error: "Feedback review is not configured",
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });

    if (!user || !allowed.includes(user.email.toLowerCase())) {
      return res.status(403).json({
        error: "Not authorized to review feedback",
      });
    }

    next();
  } catch (err) {
    next(err);
  }
};
