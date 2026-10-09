const crypto = require("node:crypto");
const {
  parseVaultSecret,
  encryptCoachKey,
  decryptCoachKey,
} = require("../../src/coach/keyVault");

const PLAIN = "sk-ant-api03-abcdefghijklmnopqrstuvwxyz0123456789";
const USER = "user_vault_aad_1";

function secret() {
  return crypto.randomBytes(32);
}

function flipByte(b64) {
  const buf = Buffer.from(b64, "base64");
  buf[0] ^= 0xff;
  return buf.toString("base64");
}

describe("coach key vault", () => {
  test("round-trip", () => {
    const key = secret();
    const blob = encryptCoachKey(PLAIN, key, USER);
    expect(blob.startsWith("v1:")).toBe(true);
    expect(decryptCoachKey(blob, key, USER)).toBe(PLAIN);
  });

  test("two encryptions of the same key differ", () => {
    const key = secret();
    const a = encryptCoachKey(PLAIN, key, USER);
    const b = encryptCoachKey(PLAIN, key, USER);
    expect(a).not.toBe(b);
    expect(decryptCoachKey(a, key, USER)).toBe(PLAIN);
    expect(decryptCoachKey(b, key, USER)).toBe(PLAIN);
  });

  test("a flipped ciphertext byte throws", () => {
    const key = secret();
    const blob = encryptCoachKey(PLAIN, key, USER);
    const parts = blob.split(":");
    parts[3] = flipByte(parts[3]);
    const tampered = parts.join(":");
    expect(() => decryptCoachKey(tampered, key, USER)).toThrow();
  });

  test("a flipped tag byte throws", () => {
    const key = secret();
    const blob = encryptCoachKey(PLAIN, key, USER);
    const parts = blob.split(":");
    parts[2] = flipByte(parts[2]);
    expect(() => decryptCoachKey(parts.join(":"), key, USER)).toThrow();
  });

  test("the wrong secret throws", () => {
    const blob = encryptCoachKey(PLAIN, secret(), USER);
    expect(() => decryptCoachKey(blob, secret(), USER)).toThrow();
  });

  test("the wrong userId throws", () => {
    const key = secret();
    const blob = encryptCoachKey(PLAIN, key, USER);
    expect(() => decryptCoachKey(blob, key, "someone-else")).toThrow();
  });

  test("an unknown version throws", () => {
    expect(() => decryptCoachKey("v2:aa:bb:cc", secret(), USER)).toThrow();
  });

  test("parseVaultSecret rejects 31- and 33-byte inputs and non-base64", () => {
    expect(parseVaultSecret(crypto.randomBytes(32).toString("base64"))).toBeInstanceOf(Buffer);
    expect(parseVaultSecret(crypto.randomBytes(31).toString("base64"))).toBeNull();
    expect(parseVaultSecret(crypto.randomBytes(33).toString("base64"))).toBeNull();
    expect(parseVaultSecret("not base64!!!")).toBeNull();
    expect(parseVaultSecret("@@@@")).toBeNull();
    expect(parseVaultSecret(null)).toBeNull();
  });

  test("thrown messages contain neither the plaintext nor the blob", () => {
    const key = secret();
    const blob = encryptCoachKey(PLAIN, key, USER);
    const cases = [
      () => decryptCoachKey(blob, secret(), USER),
      () => decryptCoachKey(blob, key, "other-user"),
      () => decryptCoachKey(`v2:${blob}`, key, USER),
      () => {
        const parts = blob.split(":");
        parts[3] = flipByte(parts[3]);
        decryptCoachKey(parts.join(":"), key, USER);
      },
      () => {
        const parts = blob.split(":");
        parts[2] = flipByte(parts[2]);
        decryptCoachKey(parts.join(":"), key, USER);
      },
      () => decryptCoachKey("v1:not-a-blob", key, USER),
    ];
    for (const run of cases) {
      try {
        run();
        throw new Error("expected decrypt to throw");
      } catch (err) {
        expect(err.message).not.toContain(PLAIN);
        expect(err.message).not.toContain(blob);
        expect(err.message).not.toContain("v2:");
      }
    }
  });
});
