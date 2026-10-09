/**
 * AES-256-GCM vault for a user's bring-your-own coach key.
 * Pure node:crypto. No env, no Prisma, no logging. Callers supply the
 * 32-byte secret and the userId (AAD) so a blob cannot be moved between
 * users or opened with a different secret.
 *
 * Blob: "v1:" + base64(iv) + ":" + base64(tag) + ":" + base64(ciphertext)
 */

const crypto = require("node:crypto");

const VAULT_ERROR = "byo key decrypt failed";
const IV_BYTES = 12;
const TAG_BYTES = 16;
const SECRET_BYTES = 32;

function failDecrypt() {
  throw new Error(VAULT_ERROR);
}

/**
 * A base64 string that decodes to exactly 32 bytes, or null.
 * Rejects a non-canonical encoding so ignored characters cannot sneak in.
 */
function parseVaultSecret(raw) {
  if (typeof raw !== "string") return null;
  const trimmed = raw.trim();
  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(trimmed)) return null;
  const buf = Buffer.from(trimmed, "base64");
  if (buf.length !== SECRET_BYTES) return null;
  if (buf.toString("base64").replace(/=+$/, "") !== trimmed.replace(/=+$/, "")) {
    return null;
  }
  return buf;
}

function encryptCoachKey(plaintext, secret, userId) {
  const iv = crypto.randomBytes(IV_BYTES);
  const cipher = crypto.createCipheriv("aes-256-gcm", secret, iv);
  cipher.setAAD(Buffer.from(String(userId), "utf8"));
  const ciphertext = Buffer.concat([
    cipher.update(String(plaintext), "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return [
    "v1",
    iv.toString("base64"),
    tag.toString("base64"),
    ciphertext.toString("base64"),
  ].join(":");
}

function decryptCoachKey(blob, secret, userId) {
  if (typeof blob !== "string") failDecrypt();
  const parts = blob.split(":");
  if (parts.length !== 4 || parts[0] !== "v1") failDecrypt();
  const iv = Buffer.from(parts[1], "base64");
  const tag = Buffer.from(parts[2], "base64");
  const ciphertext = Buffer.from(parts[3], "base64");
  if (iv.length !== IV_BYTES || tag.length !== TAG_BYTES) failDecrypt();
  if (!Buffer.isBuffer(secret) || secret.length !== SECRET_BYTES) failDecrypt();
  try {
    const decipher = crypto.createDecipheriv("aes-256-gcm", secret, iv);
    decipher.setAAD(Buffer.from(String(userId), "utf8"));
    decipher.setAuthTag(tag);
    const plain = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
    return plain.toString("utf8");
  } catch {
    failDecrypt();
  }
}

module.exports = {
  parseVaultSecret,
  encryptCoachKey,
  decryptCoachKey,
};
