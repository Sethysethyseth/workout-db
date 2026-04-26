const jwt = require("jsonwebtoken");

const isProduction = process.env.NODE_ENV === "production";

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (isProduction && !secret) {
    throw new Error("JWT_SECRET is required in production");
  }
  // Dev/test fallback keeps local setup simple, but production must be explicit.
  return secret || "dev-insecure-jwt-secret";
}

function signAuthToken({ userId }) {
  return jwt.sign({ sub: String(userId) }, getJwtSecret(), {
    expiresIn: "30d",
  });
}

function verifyAuthToken(token) {
  const payload = jwt.verify(token, getJwtSecret());
  const sub = payload && payload.sub;
  const userId = typeof sub === "string" ? sub : null;
  if (!userId || typeof userId !== "string") {
    return null;
  }
  return { userId };
}

module.exports = {
  signAuthToken,
  verifyAuthToken,
};

