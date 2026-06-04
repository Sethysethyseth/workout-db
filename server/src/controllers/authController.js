const bcrypt = require("bcrypt");
const prisma = require("../lib/prisma");
const { signAuthToken } = require("../lib/jwt");
const { normalizeUsername, validateUsername } = require("../lib/username");

const SALT_ROUNDS = 10;

function sanitizeUser(user) {
  if (!user) {
    return null;
  }

  const { passwordHash, ...safeUser } = user;
  return safeUser;
}

async function findUserByLoginInput(loginInput) {
  const trimmed = typeof loginInput === "string" ? loginInput.trim() : "";
  if (!trimmed) return null;

  const email = trimmed.toLowerCase();
  const usernameKey = normalizeUsername(trimmed);

  return prisma.user.findFirst({
    where: {
      OR: [{ email }, { usernameKey }],
    },
  });
}

async function assertUsernameAvailable(usernameKey, excludeUserId) {
  const existing = await prisma.user.findUnique({
    where: { usernameKey },
  });
  if (existing && existing.id !== excludeUserId) {
    return false;
  }
  return true;
}

function conflictMessage(err) {
  const target = err?.meta?.target;
  if (Array.isArray(target) && target.includes("usernameKey")) {
    return "Username is already taken";
  }
  return "Email is already in use";
}

async function register(req, res, next) {
  try {
    const email = req.body?.email?.trim().toLowerCase();
    const password = req.body?.password;
    const usernameRaw = req.body?.username;

    if (!email || !password) {
      return res.status(400).json({
        error: "Email and password are required",
      });
    }

    const usernameResult = validateUsername(usernameRaw);
    if (!usernameResult.ok) {
      return res.status(400).json({ error: usernameResult.error });
    }

    const { displayName, usernameKey } = usernameResult;

    if (typeof password !== "string" || password.length < 8) {
      return res.status(400).json({
        error: "Password must be at least 8 characters long",
      });
    }

    const available = await assertUsernameAvailable(usernameKey);
    if (!available) {
      return res.status(409).json({
        error: "Username is already taken",
      });
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        displayName,
        usernameKey,
      },
    });

    req.session.regenerate((err) => {
      if (err) {
        return next(err);
      }

      req.session.userId = user.id;
      const token = signAuthToken({ userId: user.id });

      return res.status(201).json({
        user: sanitizeUser(user),
        token,
      });
    });
  } catch (err) {
    if (err && err.code === "P2002") {
      return res.status(409).json({
        error: conflictMessage(err),
      });
    }

    return next(err);
  }
}

async function login(req, res, next) {
  try {
    const loginInput = req.body?.login ?? req.body?.email;
    const password = req.body?.password;

    if (!loginInput || !password) {
      return res.status(400).json({
        error: "Email or username and password are required",
      });
    }

    const user = await findUserByLoginInput(loginInput);

    if (!user) {
      return res.status(401).json({
        error: "Invalid email or password",
      });
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);

    if (!isValid) {
      return res.status(401).json({
        error: "Invalid email or password",
      });
    }

    req.session.regenerate((err) => {
      if (err) {
        return next(err);
      }

      req.session.userId = user.id;
      const token = signAuthToken({ userId: user.id });

      return res.status(200).json({
        user: sanitizeUser(user),
        token,
      });
    });
  } catch (err) {
    return next(err);
  }
}

async function setUsername(req, res, next) {
  try {
    const userId = req.authUserId;

    if (!userId) {
      return res.status(401).json({
        error: "Authentication required",
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({
        error: "User not found",
      });
    }

    if (user.usernameKey) {
      return res.status(400).json({
        error: "Username is already set",
      });
    }

    const usernameResult = validateUsername(req.body?.username);
    if (!usernameResult.ok) {
      return res.status(400).json({ error: usernameResult.error });
    }

    const { displayName, usernameKey } = usernameResult;

    const available = await assertUsernameAvailable(usernameKey, userId);
    if (!available) {
      return res.status(409).json({
        error: "Username is already taken",
      });
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { displayName, usernameKey },
    });

    return res.status(200).json({
      user: sanitizeUser(updated),
    });
  } catch (err) {
    if (err && err.code === "P2002") {
      return res.status(409).json({
        error: "Username is already taken",
      });
    }
    return next(err);
  }
}

function logout(req, res, next) {
  try {
    if (!req.session) {
      return res.sendStatus(204);
    }

    req.session.destroy((err) => {
      if (err) {
        return next(err);
      }

      const isProduction = process.env.NODE_ENV === "production";
      // Must match cookie attributes so browsers actually clear it in production.
      res.clearCookie("workoutdb.sid", {
        path: "/",
        secure: isProduction,
        sameSite: isProduction ? "none" : "lax",
        partitioned: isProduction ? true : undefined,
      });
      return res.sendStatus(204);
    });
  } catch (err) {
    return next(err);
  }
}

async function me(req, res, next) {
  try {
    const userId = req.authUserId;

    if (!userId) {
      return res.status(401).json({
        error: "Authentication required",
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({
        error: "User not found",
      });
    }

    return res.status(200).json({
      user: sanitizeUser(user),
    });
  } catch (err) {
    return next(err);
  }
}

async function changePassword(req, res, next) {
  try {
    const userId = req.authUserId;

    if (!userId) {
      return res.status(401).json({
        error: "Authentication required",
      });
    }

    const currentPassword = req.body?.currentPassword;
    const newPassword = req.body?.newPassword;

    if (
      typeof currentPassword !== "string" ||
      typeof newPassword !== "string"
    ) {
      return res.status(400).json({
        error: "currentPassword and newPassword are required",
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        error: "New password must be at least 8 characters long",
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({
        error: "User not found",
      });
    }

    const currentOk = await bcrypt.compare(currentPassword, user.passwordHash);

    if (!currentOk) {
      return res.status(400).json({
        error: "Current password is incorrect",
      });
    }

    const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);

    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });

    return res.status(200).json({
      ok: true,
    });
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  register,
  login,
  setUsername,
  logout,
  me,
  changePassword,
};
