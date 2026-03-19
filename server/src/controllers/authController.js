const bcrypt = require("bcrypt");
const prisma = require("../lib/prisma");

const SALT_ROUNDS = 10;

function sanitizeUser(user) {
  if (!user) {
    return null;
  }

  const { passwordHash, ...safeUser } = user;
  return safeUser;
}

async function register(req, res, next) {
  try {
    const email = req.body?.email?.trim().toLowerCase();
    const password = req.body?.password;

    if (!email || !password) {
      return res.status(400).json({
        error: "Email and password are required",
      });
    }

    if (typeof password !== "string" || password.length < 8) {
      return res.status(400).json({
        error: "Password must be at least 8 characters long",
      });
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
      },
    });

    req.session.regenerate((err) => {
      if (err) {
        return next(err);
      }

      req.session.userId = user.id;

      return res.status(201).json({
        user: sanitizeUser(user),
      });
    });
  } catch (err) {
    if (err && err.code === "P2002") {
      return res.status(409).json({
        error: "Email is already in use",
      });
    }

    return next(err);
  }
}

async function login(req, res, next) {
  try {
    const email = req.body?.email?.trim().toLowerCase();
    const password = req.body?.password;

    if (!email || !password) {
      return res.status(400).json({
        error: "Email and password are required",
      });
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

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

      return res.status(200).json({
        user: sanitizeUser(user),
      });
    });
  } catch (err) {
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

      res.clearCookie("workoutdb.sid");
      return res.sendStatus(204);
    });
  } catch (err) {
    return next(err);
  }
}

async function me(req, res, next) {
  try {
    const userId = req.session && req.session.userId;

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

module.exports = {
  register,
  login,
  logout,
  me,
};