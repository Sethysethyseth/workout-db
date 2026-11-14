/**
 * Arena view: how much of the screen the stage gets, and how it rides the
 * page scroll. Pure - no DOM, no React, no imports.
 *
 * - tour: the arena has the screen; the sheet keeps one line and the nav.
 * - open: arrival size on the browsing routes.
 * - strip: the scoreboard strip (18svh) - live Home, and the live logger
 *   while the rest timer is switched on.
 * - rail: 11 room rows - every other folded state (Coach, past workout,
 *   scrolled open routes, unlisted routes).
 */

export const ARENA_STRIP_SVH = 18;
export const ARENA_RAIL_ROWS = 11;

/* The room's share at the open size: what the prototype's sheet leaves
   (arena-draft-3.html / ARENA-ROUND-1.md). */
const OPEN_SVH = {
  "/": 58,
  "/analytics": 62,
  "/sessions": 56,
  "/templates": 54,
  "/profile": 58,
};

/**
 * @param {{ pathname: string, tour?: boolean, live?: boolean, activeId?: string | number | null, restOn?: boolean }} args
 * @returns {{ mode: "tour" | "open" | "strip" | "rail", svh?: number, rows?: number }}
 */
export function arenaSize({ pathname, tour, live, activeId, restOn = true }) {
  if (tour) return { mode: "tour", svh: 100 };
  const path = String(pathname || "/").replace(/\/+$/, "") || "/";
  const liveOn = Boolean(live);
  const active = activeId == null ? null : String(activeId);

  /* Strip only: live Home, and the live logger for the active workout. */
  if (liveOn && path === "/") return { mode: "strip", svh: ARENA_STRIP_SVH };
  const session = path.match(/^\/sessions\/([^/]+)$/);
  if (session) {
    /* The live logger: the scoreboard is its rest timer. With the rest timer
       switched off the logger gets the whole screen under the rail (Seth,
       Nov 14). */
    if (liveOn && active != null && session[1] === active && restOn) {
      return { mode: "strip", svh: ARENA_STRIP_SVH };
    }
    return { mode: "rail", rows: ARENA_RAIL_ROWS };
  }

  const open = OPEN_SVH[path];
  if (open) return { mode: "open", svh: open };
  return { mode: "rail", rows: ARENA_RAIL_ROWS };
}

/** Whether this route folds to the strip (scoreboard) rather than the rail. */
export function stripPlace({ pathname, live, activeId, restOn }) {
  return arenaSize({ pathname, live, activeId, restOn }).mode === "strip";
}

/**
 * A name for the LED board: uppercase, only A-Z 0-9 : and spaces, cut at a
 * word to fit `max` characters. A first word longer than `max` is cut at `max`.
 */
export function ledFit(value, max) {
  const clean = String(value ?? "")
    .toUpperCase()
    .replace(/[^A-Z0-9: ]/g, " ")
    .replace(/ +/g, " ")
    .trim();
  if (clean.length <= max) return clean;
  const words = clean.split(" ");
  if (words[0].length > max) return words[0].slice(0, max);
  let out = words[0];
  for (const word of words.slice(1)) {
    if (out.length + 1 + word.length > max) break;
    out += ` ${word}`;
  }
  return out;
}

/** Px the stage has moved up with the sheet: 1:1 with the scroll, holding at fold-end height. */
export function stageRide({ scrollY, openPx, stripPx }) {
  const room = openPx - stripPx;
  if (!(room > 0)) return 0;
  return Math.max(0, Math.min(scrollY, room));
}

/** The strip/rail opacity: 0 until 70% of the ride, linear to 1 at the end. A folded route is always 1. */
export function stripReveal({ ride, openPx, stripPx }) {
  const room = openPx - stripPx;
  if (!(room > 0)) return 1;
  const f = ride / room;
  if (!(f > 0.7)) return 0;
  return Math.min(1, (f - 0.7) / 0.3);
}

/* A closer look: how far the full view zooms in, and where it may centre. World units. */
export const ARENA_ZOOM = 3;

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

/** Keeps a closer look inside the room. */
export function clampFocus({ x, y }) {
  return { x: clamp(x, 20, 480), y: clamp(y, 48, 152) };
}

/** The world coordinate at the view's top-left: the camera's frame at 1x, centred on `focus` at ARENA_ZOOM. */
export function zoomView({ camX, camY, viewW, viewH, focus, zoom }) {
  const t = (zoom - 1) / (ARENA_ZOOM - 1);
  const mx = camX + viewW / 2;
  const my = camY + viewH / 2;
  return {
    x: mx + (focus.x - mx) * t - viewW / 2 / zoom,
    y: my + (focus.y - my) * t - viewH / 2 / zoom,
  };
}
