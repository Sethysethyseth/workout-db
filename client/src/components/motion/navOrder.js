/**
 * The shell's spatial model (MX5, "Shared axis A"): the five nav sections
 * sit left-to-right in nav order, and inside a section deeper routes sit to
 * the right of shallower ones. A route change slides the page along that
 * axis; anything the model cannot place (coach, hello, dev tools) fades.
 *
 * Pure functions, no DOM, so they can be unit-tested the day the client
 * gets a runner.
 */

export const NAV_SECTIONS = [
  { key: "home", label: "Home", to: "/", end: true },
  { key: "analytics", label: "Analytics", to: "/analytics", end: true },
  { key: "history", label: "History", to: "/sessions", end: true },
  { key: "library", label: "Library", to: "/templates", end: false },
  { key: "profile", label: "Profile", to: "/profile", end: false },
];

const LIBRARY_PREFIXES = ["/templates", "/create-template", "/blocks"];

/** Index into NAV_SECTIONS for a pathname, or -1 when the path is off-axis. */
export function sectionIndexOf(pathname) {
  const p = String(pathname || "/");
  if (p === "/") return 0;
  if (p === "/analytics") return 1;
  if (p === "/sessions" || p.startsWith("/sessions/")) return 2;
  if (LIBRARY_PREFIXES.some((x) => p === x || p.startsWith(x + "/") || p.startsWith(x + "?"))) return 3;
  if (p === "/profile" || p.startsWith("/profile/")) return 4;
  return -1;
}

function depthOf(pathname) {
  return String(pathname || "/")
    .split("/")
    .filter(Boolean).length;
}

/**
 * "forward" = the new page enters from the right (next section, or deeper
 * in the same section), "back" = from the left, "fade" = no axis.
 */
export function routeDirection(fromPath, toPath) {
  if (!fromPath || fromPath === toPath) return "fade";
  const a = sectionIndexOf(fromPath);
  const b = sectionIndexOf(toPath);
  if (a === -1 || b === -1) return "fade";
  if (a !== b) return b > a ? "forward" : "back";
  const da = depthOf(fromPath);
  const db = depthOf(toPath);
  if (da === db) return "fade";
  return db > da ? "forward" : "back";
}
