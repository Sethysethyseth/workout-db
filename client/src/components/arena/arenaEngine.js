/* Arena view (beta) - the stage. One low-res canvas draws a continuous
 * arena; the camera sits on the place that matches the current route.
 * Ported from docs/design/mocks/motion/arena-draft-3.html (round 1).
 *
 * - One motion: the canvas is always the full-view frame and the camera's
 *   height never changes - the floor sits FLOOR_MARGIN rows above the
 *   canvas's bottom edge. The stage element rides the sheet's edge; the
 *   camera only walks sideways.
 * - The strip: the room cut close to the scoreboard (same lighting, same
 *   board). The rail: the room cut at the balcony front (11 rows).
 * - Colours: a 9-step ramp mixed from --color-interactive at runtime, so
 *   every palette (and a custom one) relights the same room. No literals.
 * - Cost: nothing runs at rest. A frame loop exists only while the camera
 *   walks, the lights ease or a flash runs; a clock redraws once a second.
 *   Hidden tab or covered stage = no room drawing; a hidden strip = none.
 * - A closer look: every world coordinate goes through one scale (`zz`), so
 *   detail authored in thirds of a pixel resolves only when zoomed in. The
 *   lighting is sampled per canvas pixel, so the dither stays fine.
 * - Reduced motion: the camera and the zoom cut, lights switch, nothing flickers.
 */

import { banners, boardFace, PILE_WEEKS, PLACE_BALCONY, railFace } from "../../lib/arenaBoards.js";
import { ARENA_RAIL_ROWS, ARENA_ZOOM, clampFocus, ledFit, zoomView } from "../../lib/arenaSheet.js";
import { prefersReducedMotion } from "../../lib/useReducedMotion.js";

const FLOOR = 150;
const FLOOR_MARGIN = 7;
const TRUSS = 22;
const FACE_MS = 4200;
const ZOOM_MS = 520;
/** How long the Log cheers. */
export const CHEER_MS = 2600;
const RAIN_MS = 3200;
const BLINK_MS = 3400;
const BLINK_SHUT_MS = 150;
const THUD_MS = 180;
/* Lamp cans under the truss: column, place. Two over the platform. */
const CANS = [
  [50, "history"],
  [112, "home"],
  [188, "home"],
  [254, "coach"],
  [350, "library"],
  [450, "profile"],
];
/* Balcony lettering x (world). */
const BALCONY_SX = {
  history: 50,
  home: 150,
  analytics: 150,
  coach: 254,
  library: 350,
  profile: 450,
};
/* The Log: front row of the far stands, in thirds of a pixel. */
const LOG = ["..#..#..#..", "..#######..", ".ooooooooo.", "obbbbbbbbbo", "obbwbbbwbbo", "obbbbbbbbbo", "obbbmmmbbbo", "obsbbbbbsbo", "obbbbbbbbbo", ".ooooooooo.", "..d.....d.."];
const LOG_INK = { "#": 8, o: 4, b: 6, w: 8, m: 1, s: 5, d: 4 };
const LOG_AT = { x: 178, y: 135 };
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => (v + 0.5) / 16);
const CROWN = ["....#....", "#...#...#", "##.###.##", "#########", "#########", ".#######."];
const FONT = {
  0: "111101101101111", 1: "010110010010111", 2: "111001111100111", 3: "111001111001111", 4: "101101111001001",
  5: "111100111001111", 6: "111100111101111", 7: "111001001001001", 8: "111101111101111", 9: "111101111001111",
  A: "111101111101101", B: "110101110101110", C: "111100100100111", D: "110101101101110", E: "111100111100111",
  F: "111100111100100", G: "111100101101111", H: "101101111101101", I: "111010010010111", J: "001001001101111",
  K: "101101110101101", L: "100100100100111", M: "101111111101101", N: "111101101101101", O: "111101101101111",
  P: "111101111100100", Q: "111101101111001", R: "111101110101101", S: "111100111001111", T: "111010010010010",
  U: "101101101101111", V: "101101101101010", W: "101101111111101", X: "101101010101101", Y: "101101010010010",
  Z: "111001010100111", ":": "000010000010000", "+": "000010111010000", ".": "000000000000010",
  "-": "000000111000000", "\u00b7": "000000010000000", "'": "010010000000000",
  /* Curly apostrophe (same glyph as ASCII) - balcony "COACH'S CORNER". */
  "\u2019": "010010000000000",
};
/* The chalkboard's thinking dots step this often while an answer streams. */
const DOTS_MS = 280;
/* The Analytics board's views, in the page's tab order. */
const VIEW_TITLES = ["MUSCLES", "STRENGTH", "EXERCISES", "EXECUTION"];

/** Where each place sits in the world: the x of its centre. The camera never moves vertically. */
export const ARENA_PLACES = {
  history: { x: 46 },
  home: { x: 150 },
  analytics: { x: 150 },
  coach: { x: 254 },
  library: { x: 358 },
  profile: { x: 450 },
};

const hash = (x, y) => {
  const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return n - Math.floor(n);
};

/* The log pile (History): one column per week, the newest nearest the
   platform; every workout that week is one log on its stack. */
const PILE_HIGH = 7;
const PILE_X = 2;
const PILE_PITCH = 11;
/* A log seen end-on: bark, wood, growth ring, heart. */
const LOG_END = [
  "..oooooo..",
  ".owwwwwwo.",
  "owwrrrrwwo",
  "owrwwwwrwo",
  "owrwhhwrwo",
  "owrwhhwrwo",
  "owrwwwwrwo",
  "owwrrrrwwo",
  ".owwwwwwo.",
  "..oooooo..",
];

function readRamp() {
  const probe = document.createElement("span");
  probe.style.cssText = "position:absolute;visibility:hidden;pointer-events:none";
  document.body.appendChild(probe);
  const mix = (pct, into) => {
    probe.style.color = `color-mix(in srgb, var(--color-interactive) ${pct}%, ${into})`;
    return getComputedStyle(probe).color;
  };
  const ramp = [5, 9, 14, 21, 31, 45, 64, 100].map((p) => mix(p, "black"));
  ramp.push(mix(30, "white"));
  probe.remove();
  return ramp;
}

const count = (n, one, many) => `${n} ${n === 1 ? one : many}`;

const inOut = (p) => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2);

export function createArena(canvas, strip) {
  const roomG = canvas.getContext("2d");
  const stripG = strip ? strip.getContext("2d") : null;
  let g = roomG;
  let RAMP = readRamp();
  let W = 100;
  let H = 80;
  let SH = 30;
  let foldMode = "strip"; // "strip" | "rail" - what the folded canvas draws
  let raf = 0;
  let clock = 0;
  let cycle = 0;
  let lastT = 0;
  let stripSig = "";
  let dead = false;
  let blink = 0;
  let dots = 0;
  let lift = 0;
  const cam = { x: 100, y: 0, ready: false };
  const walk = { from: 0, to: 0, t0: 0, dur: 0 };
  const zoom = { z: 1, from: 1, to: 1, t0: 0, dur: 0, focus: { x: 150, y: 120 } };
  const ease = { power: 0.5, board: 0, wide: 0 };
  const s = {
    place: "home",
    facet: null, // route facet for place faces: home | analytics | history | coach | library | profile | null
    live: null, // { startedAtMs, sets, name?, block?: { done, total } }
    rest: null, // { startedAtMs, durationMs }
    week: { days: [0, 0, 0, 0, 0, 0, 0], sets: 0, workouts: 0 },
    bars: [0, 0, 0, 0, 0, 0, 0, 0],
    weeks: 8, // the Analytics page's range, capped at the bars there are
    seats: 0,
    savedUntil: 0,
    savedName: "",
    flashUntil: 0,
    covered: false,
    strip: false,
    egg: 0, // the Log's cheer started (ms)
    rain: 0, // five crown taps (ms)
    rainTop: 0, // canvas rows above the screen when the rain started
    holding: false, // a Start button is held on Home
    thudUntil: 0,
    towerAt: [0, 0], // a workout start lights the towers one at a time
    homeFaces: null, // [[line1, line2], ...] Home's week faces (arenaBoards.weekFaces); null = sets / workouts
    board: null, // the Analytics view's face (arenaBoards.analyticsFaces); null = the weekly sets chart
    block: null, // the program board (arenaBoards.blockBoard); null = PROGRAMS
    chalk: null, // { thinking, lines } - the coach's chalkboard; null = ASK ME / ANYTHING
    pile: [], // workouts per week, oldest first, PILE_WEEKS long (ArenaStage roomFacts)
    spot: null, // { col, row } the open workout's log in the pile (arenaBoards.pileSpot); null = none
    placeLines: null, // kept for callers; boardFace owns History/Library/Profile lines now
    streak: 0,
  };

  let cx = 0;
  let cy = 0;
  let zz = 1;
  const px = (x, y, c, w = 1, h = 1) => {
    const X = Math.round((x - cx) * zz);
    const Y = Math.round((y - cy) * zz);
    g.fillStyle = c;
    g.fillRect(X, Y, Math.max(1, Math.round((x + w - cx) * zz) - X), Math.max(1, Math.round((y + h - cy) * zz) - Y));
  };
  const text = (str, x, y, c, k = 1) => {
    [...str].forEach((ch, i) => {
      const gl = FONT[ch];
      if (!gl) return;
      for (let n = 0; n < 15; n += 1) {
        if (gl[n] === "1") px(x + (i * 4 + (n % 3)) * k, y + Math.floor(n / 3) * k, c, k, k);
      }
    });
  };
  const mid = (str, m, y, c, k = 1) => text(str, Math.round(m - ((str.length * 4 - 1) * k) / 2), y, c, k);
  const crown = (x, y, c) =>
    CROWN.forEach((row, ry) =>
      [...row].forEach((ch, rx) => {
        if (ch === "#") px(x + rx, y + ry, c);
      })
    );
  const light = (x, y, tx, ty, half, p) => ({ x, y, half, p, ax: tx - x, ay: ty - y, len: Math.hypot(tx - x, ty - y) });

  function field(x, y, lights) {
    let v =
      0.05 +
      0.18 * Math.pow(Math.max(0, Math.min(1, (y - 40) / (FLOOR - 40))), 2) -
      (y > FLOOR ? 0.02 * (y - FLOOR) : 0);
    for (const l of lights) {
      const qx = x - l.x;
      const qy = y - l.y;
      const d = Math.hypot(qx, qy);
      if (d < 1 || d > l.len * 1.3) continue;
      const ang = Math.acos(Math.max(-1, Math.min(1, (qx * l.ax + qy * l.ay) / (d * l.len))));
      if (ang < l.half) v += l.p * 0.7 * Math.pow(1 - ang / l.half, 1.3) * (1 - 0.35 * (d / l.len));
      v += l.p * 0.5 * Math.max(0, 1 - d / 8);
    }
    const ex = (x - 150) / 30;
    const ey = (y - (FLOOR + 3)) / 7;
    return v + Math.max(0, 1 - (ex * ex + ey * ey)) * 0.8 * ease.power;
  }

  function restLeft(now) {
    if (!s.live || !s.rest) return 0;
    return Math.max(0, s.rest.startedAtMs + s.rest.durationMs - now);
  }

  function targetX() {
    const place = ARENA_PLACES[s.place] || ARENA_PLACES.home;
    // Never look past the ends of the room; a view wider than the room centres it.
    return W >= 500 ? 250 - W / 2 : Math.max(-4, Math.min(504 - W, place.x - W / 2));
  }

  /** The world coordinate at the canvas's top-left, for the camera and the zoom as they stand. */
  const view = () => zoomView({ camX: cam.x, camY: cam.y, viewW: W, viewH: H, focus: zoom.focus, zoom: zoom.z });

  const cheering = (now) => now - s.egg < CHEER_MS;

  /* Home's week faces, one at a time every FACE_MS; reduced motion keeps the first. */
  const weekFacesNow = () =>
    s.homeFaces && s.homeFaces.length
      ? s.homeFaces
      : [
          ["7 DAYS", count(s.week.sets || 0, "SET", "SETS")],
          ["7 DAYS", count(s.week.workouts || 0, "WORKOUT", "WORKOUTS")],
        ];
  const weekFace = (now) => {
    const faces = weekFacesNow();
    return faces[prefersReducedMotion() ? 0 : Math.floor(now / FACE_MS) % faces.length];
  };

  /* Thinking dots: 1-3 stepping while an answer streams, 3 steady under reduced motion. */
  const thinking = () => Boolean(s.chalk?.thinking);
  const dotCount = (now, reduced) => (reduced ? 3 : 1 + (Math.floor(now / DOTS_MS) % 3));
  const chalk = () => (s.chalk?.lines?.length ? s.chalk.lines : ["ASK ME", "ANYTHING"]);

  /* The last n weekly bars, n = the Analytics range (at most the eight there are). */
  const shownBars = () => s.bars.slice(-Math.max(1, Math.min(s.bars.length, s.weeks || 8)));

  const wantWide = (now) => {
    const left = restLeft(now);
    if (left > 0) return 1;
    if (s.live && s.place === "home") return 1;
    return 0;
  };

  /** Build the input for boardFace / railFace from live state. */
  function faceInput(now) {
    const left = restLeft(now);
    const rest =
      left > 0 && s.rest
        ? { leftSec: Math.ceil(left / 1000), durationSec: s.rest.durationMs / 1000 }
        : null;
    const saved = now < s.savedUntil ? { name: s.savedName } : null;
    const logging =
      s.live && s.place === "home"
        ? {
            name: s.live.name,
            elapsedSec: Math.floor((now - s.live.startedAtMs) / 1000),
            setsDone: s.live.sets || 0,
            block: s.live.block || null,
          }
        : null;
    const lib = s.block
      ? { label: s.block.label, done: s.block.done, total: s.block.total }
      : s.placeLines?.library
        ? { label: s.placeLines.library[0], workouts: null }
        : { workouts: null };
    return {
      rest,
      saved,
      cheer: cheering(now),
      logging,
      place: s.place,
      week: weekFace(now),
      analytics: s.board?.lines || null,
      history: { count: s.seats },
      library: lib,
      profile: { streak: s.streak || 0, workouts: s.seats },
      chalk: {
        thinking: thinking(),
        lines: chalk(),
        dots: dotCount(now, prefersReducedMotion()),
      },
    };
  }

  /* The house: roof above row 63 - purlins, truss, lamp cans, upper deck, balcony. */
  function house(at, flashing) {
    const x0 = Math.floor(cx) - 2;
    const x1 = Math.ceil(cx + W / zz) + 2;
    const top = Math.floor(cy) - 2;
    for (let y = TRUSS - 7, gap = 7; y > top; y -= gap, gap = Math.max(3, gap - 1)) {
      px(x0, y, RAMP[2], x1 - x0, 1);
    }
    for (let x = Math.ceil(x0 / 25) * 25; x < x1; x += 25) px(x, top, RAMP[2], 1, TRUSS - top);
    px(x0, TRUSS, RAMP[4], x1 - x0, 1);
    px(x0, TRUSS + 6, RAMP[4], x1 - x0, 1);
    for (let x = x0; x < x1; x += 1) {
      const t = ((x % 10) + 10) % 10;
      px(x, TRUSS + 1 + (t < 5 ? t : 9 - t), RAMP[3]);
    }
    for (const [x, p] of CANS) {
      const on = p === "home" ? at("home") || at("analytics") : at(p);
      px(x, TRUSS + 7, RAMP[3], 1, 2);
      px(x - 2, TRUSS + 9, RAMP[4], 5, 4);
      px(x - 1, TRUSS + 13, on ? RAMP[8] : RAMP[5], 3, 1);
    }
    for (let row = 0; row < 4; row += 1) {
      for (let x = Math.ceil(x0 / 2) * 2; x < x1; x += 2) {
        if (((x % 50) + 50) % 50 < 4) continue;
        px(x, 39 + row * 4, flashing && Math.random() < 0.05 ? RAMP[8] : hash(x + 900, row) < 0.25 ? RAMP[4] : RAMP[2]);
      }
    }
    px(x0, 55, RAMP[4], x1 - x0, 1);
    px(x0, 56, RAMP[2], x1 - x0, 7);
    px(x0, 63, RAMP[0], x1 - x0, 1);
    for (let x = Math.ceil(x0 / 100) * 100; x < x1; x += 100) px(x, 56, RAMP[1], 1, 7);
    for (const [k, sign] of Object.entries(PLACE_BALCONY)) {
      if (k === (at("analytics") ? "home" : "analytics")) continue;
      const sx = BALCONY_SX[k] ?? ARENA_PLACES[k]?.x ?? 150;
      mid(sign, sx, 57, at(k) ? RAMP[8] : RAMP[4]);
    }
  }

  function paintFace(f, bx, by, bw, bh) {
    const m = bx + bw / 2;
    const fits = !(f.rest || f.wide) || ease.wide > 0.9;
    if (f.dots) {
      for (let i = 0; i < f.dots; i += 1) px(Math.round(m) - 7 + i * 5, by + 7, RAMP[8], 2, 2);
      return;
    }
    if (!fits) return;
    if (f.rest) {
      const tw = (f.rest.length * 4 - 1) * 2;
      const x0 = Math.round(m - (19 + tw) / 2);
      text("REST", x0, by + 5, RAMP[6]);
      text(f.rest, x0 + 19, by + 2, RAMP[8], 2);
      px(bx + 2, by + 13, RAMP[3], bw - 4, 2);
      px(bx + 2, by + 13, RAMP[7], Math.round((bw - 4) * f.bar), 2);
      return;
    }
    mid(f.l1 || "", m, by + 3, RAMP[f.chalk ? 8 : 6]);
    mid(f.l2 || "", m, by + 10, RAMP[f.chalk ? 7 : 8]);
  }

  /* The app's namesake. From the seats: one fan a little brighter. Up close: the Log. */
  function logChamp(now, reduced) {
    if (zz < 1.8) {
      px(LOG_AT.x - 1, LOG_AT.y, RAMP[5], 3, 2);
      px(LOG_AT.x, LOG_AT.y - 1, RAMP[7]);
      return;
    }
    const on = cheering(now);
    const u = 1 / 3;
    const beat = on && !reduced ? Math.abs(Math.sin((now - s.egg) / 150)) : 0;
    const x0 = 176.3;
    const y0 = 134.3 - beat * 1.1;
    const shut = !on && !reduced && now % BLINK_MS < BLINK_SHUT_MS;
    LOG.forEach((row, ry) =>
      [...row].forEach((ch, rx) => {
        if (ch !== ".") px(x0 + rx * u, y0 + ry * u, RAMP[ch === "w" && shut ? 6 : LOG_INK[ch]], u, u);
      })
    );
    if (!on) return;
    // a tiny bar, pressed overhead
    const by = y0 - 1.4 - beat * 0.7;
    px(x0 - u, by, RAMP[6], u, y0 + 5 * u - by);
    px(x0 + 11 * u, by, RAMP[6], u, y0 + 5 * u - by);
    px(x0 - 1.4, by, RAMP[8], 11 * u + 2.8, u);
    for (const ex of [x0 - 1.4, x0 + 11 * u + 0.8]) px(ex, by - 2 * u, RAMP[7], 2 * u, 5 * u);
  }

  /* The open Analytics board: the view the page is on. `gr` charges bars and columns in as it opens. */
  function viewBoard(face, bx, by, bw, bh, gr) {
    text(face.title, bx + 3, by + 3, RAMP[6]);
    const view = VIEW_TITLES.indexOf(face.title);
    if (view === 0) {
      const peak = Math.max(1e-9, ...face.rows.map((r) => r.value));
      const room = bw - 21;
      face.rows.forEach((r, i) => {
        const y = by + 11 + i * 8;
        text(r.label, bx + 3, y, RAMP[5]);
        px(bx + 17, y, i === 0 ? RAMP[8] : RAMP[6], Math.max(1, Math.round((r.value / peak) * room * gr)), 5);
      });
    } else if (view === 1) {
      if (face.e1rm == null) {
        mid("--", bx + bw / 2, by + 24, RAMP[5]);
        return;
      }
      const head = `E1RM ${face.e1rm}`;
      text(head, bx + bw - 2 - head.length * 4, by + 3, RAMP[8]);
      const lo = Math.min(...face.spark);
      const hi = Math.max(...face.spark);
      const x0 = bx + Math.round((bw - face.spark.length * 7) / 2);
      face.spark.forEach((v, i) => {
        const h0 = hi > lo ? 4 + Math.round(((v - lo) / (hi - lo)) * 23) : 14;
        const h = Math.max(1, Math.round(h0 * gr));
        px(x0 + i * 7, by + bh - 5 - h, RAMP[i === face.spark.length - 1 ? 8 : 7], 7, 1);
        px(x0 + i * 7, by + bh - 4 - h, RAMP[3], 7, h);
      });
    } else if (view === 2) {
      face.rows.forEach((r, i) => {
        const y = by + 12 + i * 9;
        text(ledFit(r.name, Math.floor((bw - 10 - r.set.length * 4) / 4)), bx + 3, y, RAMP[7]);
        text(r.set, bx + bw - 3 - r.set.length * 4, y, RAMP[5]);
      });
      if (!face.rows.length) mid("--", bx + bw / 2, by + 24, RAMP[5]);
    } else if (view === 3) {
      const num = face.pct == null ? "--" : String(face.pct);
      text(num, bx + 6, by + 14, face.pct == null ? RAMP[5] : RAMP[8], 4);
      text("ON PLAN", Math.max(bx + 44, bx + 10 + num.length * 16 - 4), by + 18, RAMP[6]);
      px(bx + 6, by + 40, RAMP[3], bw - 12, 4);
      if (face.pct) px(bx + 6, by + 40, RAMP[7], Math.max(1, Math.round(((bw - 12) * face.pct * gr) / 100)), 4);
    }
  }

  /* The rack's program board: the running block's weeks, done days bright, the next day mid, the rest dark. Steady. */
  function programBoard(block) {
    mid(block.label, 362.5, 93, RAMP[6]);
    const weeks = Math.max(1, block.cells.length);
    const days = Math.max(1, ...block.cells.map((c) => c.length));
    const sx = Math.min(7, Math.floor(41 / weeks));
    const sy = Math.min(5, Math.max(1, Math.floor(15 / days)));
    const ch = Math.max(1, sy - (sy >= 4 ? 2 : 1));
    const x0 = 341 + Math.round((43 - (weeks * sx - 2)) / 2);
    block.cells.forEach((week, w) =>
      week.forEach((cell, d) => px(x0 + w * sx, 100 + d * sy, RAMP[cell === 2 ? 8 : cell === 1 ? 6 : 3], Math.max(1, sx - 2), ch))
    );
  }

  /**
   * Draw the room. `mode`: undefined = full stage; "strip" = scoreboard cut;
   * "rail" = balcony cut. Strip and rail reuse the same lighting and board.
   */
  function draw(now, mode) {
    const reduced = prefersReducedMotion();
    const rail = mode === "rail";
    const strip = mode === "strip";
    const VH = rail ? ARENA_RAIL_ROWS : strip ? SH : H;
    if (rail) {
      const place = ARENA_PLACES[s.place] || ARENA_PLACES.home;
      zz = 1;
      cx = place.x - W / 2;
      cy = 54;
    }     else if (strip) {
      /* Artifact draw(now, "strip"): zoom 1, view locked on the platform
         board (cx = 100 with W = 100 → board at centre). Same room pixel size. */
      zz = 1;
      cx = 150 - W / 2;
      cy = 106 - SH;
    } else {
      const v0 = view();
      cx = v0.x;
      cy = v0.y;
      zz = zoom.z;
    }
    const at = (p) => s.place === p;
    const lights = [
      light(112, 88, 150, 148, 0.44, ease.power),
      light(188, 88, 150, 148, 0.44, ease.power),
      light(60, 62, 40, 150, 0.6, at("history") ? 0.5 : 0.3),
      light(254, 84, 254, 150, 0.62, at("coach") ? 0.85 : 0.4),
      light(358, 84, 358, 150, 0.7, at("library") ? 0.8 : 0.35),
      light(450, 84, 450, 150, 0.7, at("profile") ? 0.8 : 0.35),
      ...CANS.map(([x, p]) =>
        p === "home"
          ? light(x, TRUSS + 14, 150, 148, 0.1, 0.25 * ease.power)
          : light(x, TRUSS + 14, x, 150, 0.13, at(p) ? 0.3 : 0.1)
      ),
    ].filter((l) => l.x > cx - 70 && l.x < cx + W / zz + 70);
    const lit = ease.power > 0.85;
    const flashing = now < s.flashUntil;

    // The light is sampled per canvas pixel, so the dither stays fine at any zoom.
    for (let y = 0; y < VH; y += 1) {
      for (let x = 0; x < W; x += 1) {
        const v = Math.max(0, Math.min(0.999, field(x / zz + cx, y / zz + cy, lights))) * (RAMP.length - 2);
        const lo = Math.floor(v);
        g.fillStyle = RAMP[v - lo > BAYER[(y & 3) * 4 + (x & 3)] ? lo + 1 : lo];
        g.fillRect(x, y, 1, 1);
      }
    }

    if (cy < 64) house(at, flashing);
    if (rail) {
      /* Place name is already on the balcony from house(). REST / SAVED take the line. */
      const input = faceInput(now);
      if (input.rest || input.saved) {
        const face = railFace(input);
        const m = cx + W / 2;
        px(cx, 56, RAMP[2], W, 7);
        mid(face.line, m, 57, RAMP[8]);
        if (input.rest) {
          px(cx, 63, RAMP[3], W, 1);
          px(cx, 63, RAMP[7], Math.round(W * (face.bar || 0)), 1);
        }
      }
      return;
    }

    // far stands behind the platform; when the Log cheers, a wave runs through them twice
    const wave = cheering(now) && !reduced ? 98 + (((now - s.egg) % (CHEER_MS / 2)) / (CHEER_MS / 2)) * 106 : -99;
    for (let row = 0; row < 6; row += 1) {
      for (let x = 98; x < 204; x += 2) {
        const on = hash(x, row) < 0.3;
        const up = Math.abs(x - wave) < 6;
        px(
          x,
          FLOOR - 34 + row * 4 - (up ? 1 : 0),
          up ? RAMP[7] : flashing && Math.random() < 0.07 ? RAMP[8] : on ? RAMP[4] : RAMP[2]
        );
      }
    }
    px(96, FLOOR - 9, RAMP[3], 110, 1);
    logChamp(now, reduced);

    // the log pile (History): a stack per week, this week's bright, the open workout's log lit, the count on top
    const hiH = at("history");
    const pileTop = FLOOR - PILE_HIGH * PILE_PITCH - 3;
    px(0, pileTop, RAMP[3], 1, FLOOR - pileTop);
    px(PILE_X + PILE_WEEKS * PILE_PITCH, pileTop, RAMP[3], 1, FLOOR - pileTop);
    for (let col = 0; col < PILE_WEEKS; col += 1) {
      const total = s.pile[col] || 0;
      const n = Math.min(PILE_HIGH, total);
      const now7 = col === PILE_WEEKS - 1;
      const x = PILE_X + col * PILE_PITCH;
      for (let row = 0; row < PILE_HIGH; row += 1) {
        const y = FLOOR - (row + 1) * PILE_PITCH + 1;
        if (row >= n) {
          px(x + 4, y + 4, RAMP[2], 2, 2); // an empty slot: room for one more
          continue;
        }
        const lit = s.spot && s.spot.col === col && row === Math.min(s.spot.row, PILE_HIGH - 1);
        const ink = lit
          ? { o: RAMP[8], w: RAMP[8], r: RAMP[5], h: RAMP[3] }
          : now7
            ? { o: RAMP[4], w: RAMP[7], r: RAMP[5], h: RAMP[4] }
            : { o: RAMP[3], w: RAMP[hiH ? 5 : 4], r: RAMP[3], h: RAMP[2] };
        LOG_END.forEach((line, j) => {
          for (let i = 0; i < line.length; i += 1) if (line[i] !== ".") px(x + i, y + j, ink[line[i]]);
        });
      }
      if (total > 0) mid(String(total), x + 5, FLOOR - n * PILE_PITCH - 6, now7 ? RAMP[8] : RAMP[hiH ? 6 : 4]);
    }

    px(-400, FLOOR, RAMP[4], 1400, 1);
    // the bar just dropped: the floor under the platform flashes once
    if (now < s.thudUntil) px(128, FLOOR, RAMP[8], 44, 1);

    // platform and bar; plates load as sets are logged; holding Start lifts it off the floor
    px(132, FLOOR - 2, RAMP[5], 36, 2);
    px(134, FLOOR, RAMP[3], 32, 2);
    const up = Math.round(lift * 9 + (s.holding && lift > 0.8 && !reduced ? Math.sin(now / 170) : 0));
    px(134, FLOOR - 6 - up, lit || up ? RAMP[8] : RAMP[6], 32, 1);
    const plates = s.live ? Math.min(4, 1 + Math.floor(s.live.sets / 3)) : 1;
    for (let i = 0; i < plates; i += 1) {
      for (const x of [137 + i * 3, 161 - i * 3]) {
        px(x, FLOOR - 10 + i - up, i ? RAMP[5] : lit ? RAMP[7] : RAMP[5], 2, 9 - i * 2);
      }
    }
    [112, 188].forEach((tx, t) => {
      const on = lit && now >= s.towerAt[t];
      px(tx, 90, RAMP[4], 1, FLOOR - 90);
      px(tx - 3, 86, RAMP[2], 7, 4);
      for (let k = 0; k < 3; k += 1) px(tx - 2 + k * 2, 87, on || k === 1 ? RAMP[8] : RAMP[5], 1, 2);
    });

    // scoreboard hung from the main truss; widens for the live line and REST
    const b = strip ? 0 : ease.board;
    const wd = ease.wide;
    const bw = Math.round(38 + 26 * wd + (46 - 26 * wd) * b);
    const bh = Math.round(17 + 35 * b);
    const bx = Math.round(150 - bw / 2);
    const by = 82 - Math.round(4 * b);
    px(120, TRUSS + 7, RAMP[3], 1, 66 - TRUSS - 7);
    px(180, TRUSS + 7, RAMP[3], 1, 66 - TRUSS - 7);
    px(120, 66, RAMP[3], 61, 1);
    px(135, 67, RAMP[3], 1, by - 67);
    px(164, 67, RAMP[3], 1, by - 67);
    px(bx, by, RAMP[flashing ? 8 : 4], bw, bh);
    px(bx + 1, by + 1, RAMP[0], bw - 2, bh - 2);
    crown(146, by - 7, lit || flashing ? RAMP[8] : RAMP[7]);
    if (b > 0.85 && s.board) {
      viewBoard(s.board, bx, by, bw, bh, reduced ? 1 : Math.min(1, (b - 0.85) / 0.14));
    } else if (b > 0.85) {
      const bars = shownBars();
      const head = `${bars.length} WK`;
      text("SETS", bx + 3, by + 3, RAMP[6]);
      text(head, bx + bw - 2 - head.length * 4, by + 3, RAMP[5]);
      const peak = Math.max(1, ...bars);
      const slot = Math.floor(72 / bars.length);
      const barW = Math.min(12, slot - 3);
      const x0 = bx + Math.round((bw - (bars.length - 1) * slot - barW) / 2);
      bars.forEach((v, i) => {
        const h = Math.round((v / peak) * (bh - 16));
        px(x0 + i * slot, by + bh - 4 - h, i === bars.length - 1 ? RAMP[8] : RAMP[6], barW, h);
      });
      px(bx + 3, by + bh - 4, RAMP[4], bw - 6, 1);
    } else if (b < 0.15) {
      paintFace(boardFace(faceInput(now)), bx, by, bw, bh);
      s.week.days.forEach((on, i) => px(137 + i * 4, by + bh + 2, on ? RAMP[8] : RAMP[3], 2, 2));
    }

    // coach's corner: chalkboard, stool, bottle
    px(238, 124, RAMP[4], 1, 26);
    px(270, 124, RAMP[4], 1, 26);
    px(234, 96, RAMP[at("coach") ? 6 : 4], 41, 29);
    px(235, 97, RAMP[1], 39, 27);
    crown(250, 88, at("coach") ? RAMP[8] : RAMP[6]);
    const chalkLines = thinking() ? [] : chalk();
    if (thinking()) {
      for (let i = 0; i < dotCount(now, reduced); i += 1) px(249 + i * 5, 109, RAMP[8], 2, 2);
    } else {
      const y0 = chalkLines.length === 1 ? 107 : 103;
      chalkLines.forEach((ln, i) => mid(ln, 254.5, y0 + i * 8, i ? RAMP[7] : RAMP[8]));
    }
    if (zz > 2.2 && chalkLines.length < 3) text("LOG IT OR IT DIDNT HAPPEN", 238, 121.4, RAMP[5], 1 / 3);
    px(282, 140, RAMP[5], 9, 2);
    px(283, 142, RAMP[4], 1, 8);
    px(289, 142, RAMP[4], 1, 8);
    px(278, 145, RAMP[7], 2, 5);

    // the rack (Library): plate tree, dumbbells, program board
    const hiR = at("library");
    px(324, 112, RAMP[4], 1, 38);
    px(320, 148, RAMP[4], 9, 2);
    [[118, 11], [128, 9], [137, 7]].forEach(([y, h]) => {
      px(319, y - (h >> 1), hiR ? RAMP[7] : RAMP[5], 3, h);
      px(327, y - (h >> 1), hiR ? RAMP[6] : RAMP[5], 3, h);
      px(322, y, RAMP[4], 5, 1);
    });
    for (const sy of [130, 142]) {
      px(338, sy, RAMP[4], 56, 1);
      px(339, sy, RAMP[3], 1, FLOOR - sy);
      px(392, sy, RAMP[3], 1, FLOOR - sy);
      for (let i = 0; i < 6; i += 1) {
        const x = 342 + i * 8;
        const sz = 3 + (i > 2 ? 1 : 0);
        px(x, sy - sz, hiR ? RAMP[7] : RAMP[5], 2, sz);
        px(x + 2, sy - 2, RAMP[4], 2, 1);
        px(x + 4, sy - sz, hiR ? RAMP[7] : RAMP[5], 2, sz);
      }
    }
    px(340, 90, RAMP[hiR ? 6 : 4], 45, 27);
    px(341, 91, RAMP[1], 43, 25);
    if (s.block) programBoard(s.block);
    else {
      text("PROGRAMS", 347, 93, RAMP[6]);
      for (let wk = 0; wk < 6; wk += 1) for (let d = 0; d < 3; d += 1) px(344 + wk * 7, 101 + d * 5, RAMP[3], 5, 3);
    }

    // the locker room (Profile), banners in the rafters
    const hiP = at("profile");
    for (let i = 0; i < 8; i += 1) {
      const x = 418 + i * 8;
      const mine = i === 3;
      px(x, 112, mine ? RAMP[hiP ? 7 : 5] : RAMP[4], 7, 38);
      px(x + 1, 113, mine ? RAMP[3] : RAMP[2], 5, 36);
      px(x + 2, 116, RAMP[4], 3, 1);
      px(x + 2, 118, RAMP[4], 3, 1);
      px(x + 4, 131, RAMP[6], 1, 2);
      if (mine) {
        px(x + 2, 122, RAMP[8], 3, 3);
        if (zz > 2.2) text("1", x + 3, 122.7, RAMP[1], 1 / 3);
      }
    }
    px(428, 144, RAMP[5], 44, 2);
    px(431, 146, RAMP[4], 1, 4);
    px(468, 146, RAMP[4], 1, 4);
    banners(s.seats).forEach(({ label, earned }, i) => {
      const x = 424 + i * 24;
      const y = 63; // hang from the balcony front
      px(x, y, earned ? RAMP[hiP ? 6 : 4] : RAMP[3], 14, 15);
      px(x + 1, y + 1, RAMP[earned ? 2 : 1], 12, 12);
      px(x + 1, y + 13, RAMP[earned ? 2 : 1], 5, 2);
      px(x + 8, y + 13, RAMP[earned ? 2 : 1], 5, 2);
      if (earned) crown(x + 3, y + 4, hiP ? RAMP[8] : RAMP[7]);
      else mid(label, x + 7.5, y + 5, RAMP[hiP ? 5 : 4]);
    });

    // five taps on the Home crown: it rains crowns in here, and they land on the floor
    if (!strip && !reduced && now - s.rain < RAIN_MS) {
      const top = cy + s.rainTop / zz - 8;
      for (let i = 0; i < 16; i += 1) {
        const t = (now - s.rain - i * 120) / 1100;
        if (t < 0 || t > 1.5) continue;
        crown(cx + 2 + hash(i, 7) * (W / zz - 13), top + Math.min(1, t * t) * (FLOOR - 6 - top), RAMP[t > 1 ? 6 : 8]);
      }
    }
  }

  /* Folded canvas: room cut (strip = scoreboard, rail = balcony). Redraw when face changes. */
  function drawFold(now) {
    if (!stripG) return;
    const input = faceInput(now);
    const face = foldMode === "rail" ? railFace(input) : boardFace(input);
    const hot = now < s.flashUntil;
    const sig = [
      foldMode,
      face.rest || face.line || face.l1 || "",
      face.l2 || "",
      face.bar == null ? -1 : Math.round(face.bar * 100),
      face.dots || 0,
      hot,
      W,
      SH,
      s.place,
      Math.round(ease.wide * 100),
      s.week.days.join(""),
    ].join("|");
    if (sig === stripSig) return;
    stripSig = sig;
    const keep = [g, cx, cy, zz];
    g = stripG;
    draw(now, foldMode === "rail" ? "rail" : "strip");
    [g, cx, cy, zz] = keep;
  }

  function frame(t) {
    raf = 0;
    if (dead) return;
    const now = Date.now();
    const tNow = typeof t === "number" ? t : performance.now();
    const dt = lastT ? Math.min(64, tNow - lastT) : 16;
    lastT = tNow;
    const reduced = prefersReducedMotion();

    // The camera only walks sideways: a time-based tween, one frame per animation frame.
    const tx = targetX();
    if (reduced || !cam.ready || s.covered) {
      cam.x = tx;
      walk.to = tx;
      walk.dur = 0;
    } else if (tx !== walk.to) {
      walk.from = cam.x;
      walk.to = tx;
      walk.t0 = tNow;
      walk.dur = Math.min(900, 380 + Math.abs(tx - cam.x) * 1.2);
    }
    if (walk.dur) {
      const p = Math.min(1, (tNow - walk.t0) / walk.dur);
      cam.x = walk.from + (walk.to - walk.from) * inOut(p);
      if (p >= 1) walk.dur = 0;
    }
    // The zoom eases the way the camera walks; reduced motion or a covered stage cuts.
    const visible = !document.hidden && !s.covered;
    if (reduced || !visible) zoom.dur = 0;
    if (zoom.dur) {
      const p = Math.max(0, Math.min(1, (tNow - zoom.t0) / zoom.dur));
      zoom.z = zoom.from + (zoom.to - zoom.from) * inOut(p);
      if (p >= 1) zoom.dur = 0;
    } else {
      zoom.z = zoom.to;
    }

    const k = reduced || !cam.ready ? 1 : 1 - Math.exp(-dt / 80);
    const wantLift = s.holding ? 1 : 0;
    if (reduced || !visible) lift = wantLift;
    else {
      lift += (wantLift - lift) * (1 - Math.exp(-dt / (s.holding ? 300 : 70)));
      if (Math.abs(wantLift - lift) < 0.01) lift = wantLift;
    }
    const left = restLeft(now);
    const rest = left > 0 && s.rest ? 1 - left / s.rest.durationMs : 1;
    const wantPower = s.live ? 0.3 + 0.7 * rest : now < s.savedUntil ? 0.9 : s.holding ? 1 : 0.5;
    const wantBoard = s.place === "analytics" ? 1 : 0;
    const wideTo = wantWide(now);
    ease.power += (wantPower - ease.power) * k;
    ease.board += (wantBoard - ease.board) * k;
    ease.wide += (wideTo - ease.wide) * Math.min(1, k * 2.4);
    cam.ready = true;
    const easing =
      Math.abs(wantPower - ease.power) > 0.01 ||
      Math.abs(wantBoard - ease.board) > 0.01 ||
      Math.abs(wideTo - ease.wide) > 0.03;
    if (!easing) {
      ease.power = wantPower;
      ease.board = wantBoard;
      ease.wide = wideTo;
    }
    if (visible) draw(now);
    if (!document.hidden && s.strip) drawFold(now);
    const flashing = now < s.flashUntil && !reduced;
    // Zoom, cheer, rain and lift run frames only while something in them moves, and only on screen.
    const moving =
      visible &&
      !reduced &&
      (zoom.dur > 0 ||
        cheering(now) ||
        now - s.rain < RAIN_MS ||
        lift !== wantLift ||
        s.holding ||
        now < s.towerAt[1]);
    if (walk.dur || easing || flashing || moving) raf = window.requestAnimationFrame(frame);
    else lastT = 0;
    syncBlink(now, reduced);
    syncDots();
  }

  /* While an answer streams, the dots step: one redraw per step from a timer, only
     while the chalkboard or the Coach strip is on screen. The only loop at rest. */
  function syncDots() {
    let need = !dead && thinking() && !prefersReducedMotion() && !document.hidden;
    if (need) {
      const v = view();
      const boardSeen = !s.covered && v.x < 275 && v.x + W / zoom.z > 234;
      need = boardSeen || (s.strip && (s.facet === "coach" || s.place === "coach"));
    }
    if (need && !dots) dots = window.setInterval(kick, DOTS_MS);
    else if (!need && dots) {
      window.clearInterval(dots);
      dots = 0;
    }
  }

  function kick() {
    if (!raf && !dead) raf = window.requestAnimationFrame(frame);
  }

  /* Up close, the Log blinks: two redraws per blink from a timer, never a frame loop. */
  function syncBlink(now, reduced) {
    const need = !raf && !dead && !reduced && zoom.to >= 1.8 && !document.hidden && !s.covered;
    if (!need) {
      window.clearTimeout(blink);
      blink = 0;
      return;
    }
    if (blink) return;
    const into = now % BLINK_MS;
    blink = window.setTimeout(
      () => {
        blink = 0;
        if (!raf && !dead) frame(performance.now());
      },
      (into < BLINK_SHUT_MS ? BLINK_SHUT_MS : BLINK_MS) - into + 5
    );
  }

  function zoomTo(z) {
    if (z === zoom.to) return;
    zoom.from = zoom.z;
    zoom.to = z;
    zoom.t0 = performance.now();
    zoom.dur = ZOOM_MS;
    window.clearTimeout(blink);
    blink = 0;
    kick();
  }

  /* The clock, the rest countdown and the SAVED face change once a second;
     Home's board (room or strip) turns to its next week face every FACE_MS while
     it is showing - one direct redraw from a timer, never a frame loop. */
  function syncClock() {
    const now = Date.now();
    const need = Boolean(s.live) || now < s.savedUntil;
    if (need && !clock) {
      clock = window.setInterval(() => {
        if (!s.live && Date.now() >= s.savedUntil) syncClock();
        kick();
      }, 1000);
    } else if (!need && clock) {
      window.clearInterval(clock);
      clock = 0;
    }
    const turn = (s.strip || !s.covered) && !need && s.facet === "home" && !prefersReducedMotion();
    if (turn && !cycle) {
      cycle = window.setTimeout(() => {
        cycle = 0;
        if (!raf && !dead) frame(performance.now());
        syncClock();
      }, FACE_MS - (now % FACE_MS) + 20);
    } else if (!turn && cycle) {
      window.clearTimeout(cycle);
      cycle = 0;
    }
  }

  const later = (ms) => window.setTimeout(kick, ms + 20);

  function resize() {
    const cssW = canvas.clientWidth || 400;
    const cssH = canvas.clientHeight || 600;
    // Phone: 4 css px per pixel. Wide screens: about 190 rows for the full view, so the open sizes keep the board in view.
    const scale = cssW < 720 ? 4 : Math.max(2, Math.round(cssH / 190));
    W = Math.max(40, Math.round(cssW / scale));
    H = Math.max(24, Math.round(cssH / scale));
    canvas.width = W;
    canvas.height = H;
    // Fixed for this frame size: the floor sits just above the stage's bottom edge.
    cam.y = FLOOR + FLOOR_MARGIN - H;
    cam.ready = false;
    if (strip) {
      /* Prefer CSS fold height; for strip mode always derive SH from it so
         room-pixel size matches the open room (4 css px / room px on phone). */
      const foldH = strip.clientHeight || (foldMode === "rail" ? ARENA_RAIL_ROWS * scale : scale * 30);
      SH =
        foldMode === "rail"
          ? ARENA_RAIL_ROWS
          : Math.max(12, Math.round(foldH / scale));
      strip.width = W;
      strip.height = SH;
      stripSig = "";
    }
    document.documentElement.style.setProperty("--arena-px", `${scale}px`);
    kick();
  }

  return {
    set(patch) {
      // A workout starting while the room is up: the towers come on left, then right,
      // both before the logger's strip covers the room (SETTLE_MS in ArenaStage).
      if (patch.live && !s.live && cam.ready && !prefersReducedMotion()) {
        const now = Date.now();
        s.towerAt = [now + 60, now + 300];
      }
      if (patch.foldMode === "rail" || patch.foldMode === "strip") {
        const next = patch.foldMode;
        delete patch.foldMode;
        if (next !== foldMode) {
          foldMode = next;
          stripSig = "";
          /* Bitmap must match the CSS fold height at the room's pixel size
             immediately - waiting for ResizeObserver leaves SH at the old
             rail (11) while CSS is 18svh, and the strip blows up (B1). */
          resize();
        }
      }
      Object.assign(s, patch);
      syncClock();
      syncDots();
      kick();
    },
    flash(ms) {
      s.flashUntil = Date.now() + ms;
      kick();
      // Reduced motion runs no flash frames: one more draw puts the edge back.
      later(ms);
    },
    /** Look closer, centred on a world point. */
    look(point) {
      zoom.focus = clampFocus(point);
      zoomTo(ARENA_ZOOM);
    },
    /** Step back to the full view at 1x. */
    back() {
      zoomTo(1);
    },
    zoomed() {
      return zoom.to > 1;
    },
    focus() {
      return { ...zoom.focus };
    },
    /** Drag while zoomed: the room follows the finger. `dx`/`dy` are fractions of the canvas since `from`. */
    pan(from, dx, dy) {
      zoom.focus = clampFocus({ x: from.x - (dx * W) / zoom.z, y: from.y - (dy * H) / zoom.z });
      kick();
    },
    /** The world point under a spot on the canvas, given as fractions of its size. */
    toWorld(fx, fy) {
      const v = view();
      return { x: v.x + (fx * W) / zoom.z, y: v.y + (fy * H) / zoom.z };
    },
    /** A tap up close: the Log answers it. Returns whether it did. */
    tapLog(point) {
      if (zoom.to <= 1 || Math.abs(point.x - LOG_AT.x) >= 6 || Math.abs(point.y - LOG_AT.y) >= 6) return false;
      s.egg = Date.now();
      try {
        navigator.vibrate?.(20);
      } catch {
        /* no haptics here - fine */
      }
      kick();
      later(CHEER_MS);
      return true;
    },
    /** Five crown taps. `hiddenTop`: the share of the canvas above the screen, so the crowns start where you can see them. */
    rain(hiddenTop = 0) {
      if (prefersReducedMotion()) return;
      s.rain = Date.now();
      s.rainTop = Math.max(0, Math.min(1, hiddenTop)) * H;
      kick();
    },
    /** A Start button held on Home: the bar leaves the floor; letting go drops it with a thud. */
    hold(on) {
      if (Boolean(on) === s.holding) return;
      s.holding = Boolean(on);
      if (!s.holding) {
        s.thudUntil = Date.now() + THUD_MS;
        later(THUD_MS);
      }
      kick();
    },
    resize,
    recolor() {
      RAMP = readRamp();
      stripSig = "";
      kick();
    },
    destroy() {
      dead = true;
      window.cancelAnimationFrame(raf);
      window.clearInterval(clock);
      window.clearTimeout(cycle);
      window.clearTimeout(blink);
      window.clearInterval(dots);
    },
  };
}
