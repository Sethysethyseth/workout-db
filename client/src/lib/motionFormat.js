/**
 * Pure helpers for the motion layer - no React, no DOM - so they can be
 * unit-tested the day the client gets a test runner (IDEAS.md #9).
 */

/** The reveal curve (--mx-ease-out-expo) as a function, for rAF loops. */
export function easeOutExpo(t) {
  if (t >= 1) return 1;
  if (t <= 0) return 0;
  return 1 - Math.pow(2, -10 * t);
}

/** Decimal places a number is displayed with (0 for integers, else the
    length of its fractional part, capped at 2). */
export function decimalsOf(n) {
  if (!Number.isFinite(n)) return 0;
  const s = String(n);
  const dot = s.indexOf(".");
  if (dot === -1) return 0;
  return Math.min(2, s.length - dot - 1);
}

/** Format a rolling value with fixed decimals and a thousands separator,
    so "1,770" never flickers to "1770" mid-roll. */
export function formatRolling(value, decimals = 0, group = true) {
  if (!Number.isFinite(value)) return "";
  const fixed = Math.abs(value).toFixed(decimals);
  const [intPart, frac] = fixed.split(".");
  const grouped = group ? intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",") : intPart;
  const sign = value < 0 ? "-" : "";
  return frac != null ? `${sign}${grouped}.${frac}` : `${sign}${grouped}`;
}

/**
 * Split a display string like "157.5 lbs × 4" or "+47 lbs" into the leading
 * number (as a float), its decimals, a sign/prefix, and the remainder, so a
 * count-up can roll the number and leave the rest of the string alone.
 * Returns null when the string does not start with a number ("—", "n/a").
 */
export function splitLeadingNumber(str) {
  if (typeof str !== "string") return null;
  const m = str.match(/^([+\-−~]?)(\d[\d,]*)(\.\d+)?(.*)$/s);
  if (!m) return null;
  const [, prefix, intPart, fracPart = "", rest] = m;
  const num = Number(`${intPart.replace(/,/g, "")}${fracPart}`);
  if (!Number.isFinite(num)) return null;
  return {
    prefix,
    value: num,
    decimals: fracPart ? Math.min(2, fracPart.length - 1) : 0,
    grouped: intPart.includes(","),
    rest,
  };
}
