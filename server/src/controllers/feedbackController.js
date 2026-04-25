const prisma = require("../lib/prisma");

const CATEGORIES = new Set(["Bug", "Confusing", "Idea"]);
const MESSAGE_MAX = 10000;
const PAGE_PATH_MAX = 512;
const THEME_MAX = 32;

function normalizeOptionalString(value, maxLen) {
  if (value === undefined || value === null) return null;
  if (typeof value !== "string") return null;
  const t = value.trim();
  if (!t) return null;
  return t.length > maxLen ? t.slice(0, maxLen) : t;
}

async function createFeedback(req, res, next) {
  try {
    const userId = req.authUserId;
    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const body = req.body || {};
    const categoryRaw = typeof body.category === "string" ? body.category.trim() : "";
    const messageRaw = typeof body.message === "string" ? body.message.trim() : "";

    if (!CATEGORIES.has(categoryRaw)) {
      return res.status(400).json({
        error: "Category must be Bug, Confusing, or Idea",
      });
    }

    if (!messageRaw) {
      return res.status(400).json({
        error: "Message is required",
      });
    }

    if (messageRaw.length > MESSAGE_MAX) {
      return res.status(400).json({
        error: `Message must be at most ${MESSAGE_MAX} characters`,
      });
    }

    const pagePath = normalizeOptionalString(body.pagePath, PAGE_PATH_MAX);
    const theme = normalizeOptionalString(body.theme, THEME_MAX);

    const feedback = await prisma.feedback.create({
      data: {
        userId,
        category: categoryRaw,
        message: messageRaw,
        pagePath,
        theme,
      },
    });

    return res.status(201).json({ feedback });
  } catch (err) {
    return next(err);
  }
}

async function listFeedback(req, res, next) {
  try {
    const rows = await prisma.feedback.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: { id: true, email: true },
        },
      },
    });

    const feedbackItems = rows.map((row) => {
      const { user, ...rest } = row;
      return {
        ...rest,
        user,
      };
    });

    return res.json({ feedbackItems });
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  createFeedback,
  listFeedback,
};
