/* The crown intro, drawn on one canvas (MX: app-open + first-login moment).
 *
 * Beats: pixel ribbons swirl in and build the crown -> it locks with a flash
 * and a pixel shock ring -> the crown is tossed and spins like an 8-bit coin
 * -> it drops into the wordmark lockup as the letters step in -> the whole
 * screen dithers away from the crown outward, revealing the app.
 *
 * Tokens-only: every colour is read from the live CSS custom properties, so
 * all palettes x both modes (and a custom palette) are right for free.
 * No React in here - the component owns mounting, this owns the frames.
 */

/* The brand crown on a 25 x 17 grid (sampled from wordmark_crown_mask.png,
   mirrored so the spin reads clean). */
export const CROWN = [
  "...........###...........",
  "...........###...........",
  "###......#######......###",
  "###......#######......###",
  "#####...#########...#####",
  "#####...#########...#####",
  "#########################",
  "#########################",
  "#########################",
  "#########################",
  "#########################",
  "#########################",
  ".#######################.",
  "..#####################..",
  "..#####################..",
  "..#####################..",
  "..#####################..",
];
const COLS = 25;
const ROWS = 17;

/* Where things sit in the 1024 x 231 wordmark art. */
const ART_W = 1024;
const ART_H = 231;
const ART_CROWN = { x: 438, y: 8, w: 100, h: 66 };
/* L O G C H A M P - each letter's [start, end) column in the art, so a
   letter is never cut in half as it steps in. */
const ART_LETTERS = [
  [96, 200],
  [200, 298],
  [298, 396],
  [396, 496],
  [496, 591],
  [591, 685],
  [685, 852],
  [852, 948],
];

const BAYER = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
];

const TIMING = {
  /* The showpiece: plays once, right after signing in. */
  login: { cover: 220, gather: 900, turns: 2, spin: 1000, settle: 460, hold: 300, dissolve: 380 },
  /* Every cold app open: same beats, tighter. The spin repeats while the
     session check is still out, so it doubles as the boot loader. */
  boot: { cover: 0, gather: 620, turns: 1, spin: 640, settle: 360, hold: 120, dissolve: 300 },
};
const SKIP_DISSOLVE_MS = 180;
const SPIN_STEPS = 24;

const clamp01 = (n) => Math.min(1, Math.max(0, n));
const easeOutCubic = (t) => 1 - (1 - t) ** 3;
const easeOutExpo = (t) => (t >= 1 ? 1 : 1 - 2 ** (-10 * t));
const easeInOutCubic = (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

/* A tiny seeded PRNG so the choreography is the same every run. */
function mulberry(seed) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function readTokens() {
  const probe = document.createElement("span");
  probe.style.cssText = "position:absolute;visibility:hidden;pointer-events:none";
  document.body.appendChild(probe);
  const read = (token) => {
    probe.style.color = `var(${token})`;
    return getComputedStyle(probe).color;
  };
  const tokens = {
    bg: read("--color-bg"),
    text: read("--color-text"),
    accent: read("--color-interactive"),
  };
  probe.remove();
  return tokens;
}

function loadImage(src) {
  const img = new Image();
  img.decoding = "async";
  img.src = src;
  return img;
}

/* A mask PNG painted in one flat colour. */
function tint(img, color) {
  const c = document.createElement("canvas");
  c.width = img.naturalWidth;
  c.height = img.naturalHeight;
  const g = c.getContext("2d");
  g.drawImage(img, 0, 0);
  g.globalCompositeOperation = "source-in";
  g.fillStyle = color;
  g.fillRect(0, 0, c.width, c.height);
  return c;
}

/**
 * @param {object} o
 * @param {HTMLCanvasElement} o.canvas
 * @param {"login"|"boot"} o.mode
 * @param {{x:number,y:number,w:number,h:number}|null} o.origin  the login
 *   page's own crown (viewport px) - the ribbons lift off from it
 * @param {() => boolean} o.isReady  may the intro end? (boot waits on auth)
 * @param {string} o.wordmarkSrc
 * @param {string} o.crownSrc
 * @param {() => void} [o.onFirstFrame]
 * @param {() => void} [o.onCovered]  the screen is fully hidden
 * @param {() => void} o.onDone
 */
export function startCrownIntro(o) {
  const { canvas, mode, origin, isReady, onFirstFrame, onCovered, onDone } = o;
  const T = TIMING[mode] || TIMING.boot;
  const ctx = canvas.getContext("2d");
  const colors = readTokens();
  const wordmarkImg = loadImage(o.wordmarkSrc);
  const crownImg = loadImage(o.crownSrc);
  let wordmarkTinted = null;
  let crownTinted = null;

  const rand = mulberry(360);
  let G = null; // geometry, rebuilt on resize
  let particles = [];
  let sparks = [];
  let raf = 0;
  let stopped = false;
  let drewOnce = false;
  let coveredSent = false;

  /* Phase machine: cover -> gather -> spin (repeats until ready) -> settle
     -> hold -> dissolve. */
  let phase = T.cover > 0 ? "cover" : "gather";
  let phaseStart = 0;
  let gatherStart = 0;
  let lockAt = 0;
  let landAt = 0;
  let dissolveMs = T.dissolve;

  function layout() {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(vw * dpr);
    canvas.height = Math.round(vh * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.imageSmoothingEnabled = false;

    const unit = Math.min(6, Math.max(3, Math.round(Math.min(vw, vh) / 100)));
    const cell = Math.min(10, Math.max(3, Math.floor(Math.min(vw * 0.42, vh * 0.26) / COLS)));
    const cx = Math.round(vw / 2);
    const cy = Math.round(vh * 0.44);
    const lockW = Math.round(Math.min(280, vw * 0.66));
    const lockH = (lockW * ART_H) / ART_W;
    const lockX = Math.round(cx - lockW / 2);
    const lockY = Math.round(cy - lockH / 2);
    const k = lockW / ART_W;
    const block = Math.max(8, Math.round(Math.max(vw, vh) / 90));
    G = {
      vw,
      vh,
      unit,
      cell,
      cx,
      cy,
      lockW,
      lockH,
      lockX,
      lockY,
      k,
      lockCell: (ART_CROWN.w * k) / COLS,
      lockCrownX: lockX + (ART_CROWN.x + ART_CROWN.w / 2) * k,
      lockCrownY: lockY + (ART_CROWN.y + ART_CROWN.h / 2) * k,
      block,
      bw: Math.ceil(vw / block),
      bh: Math.ceil(vh / block),
      thr: null,
      thrKey: "",
    };
  }

  function buildParticles() {
    const reach = Math.hypot(G.vw, G.vh) * 0.62;
    particles = [];
    for (let row = 0; row < ROWS; row += 1) {
      for (let col = 0; col < COLS; col += 1) {
        if (CROWN[row][col] !== "#") continue;
        /* Three ribbons, one per third of the crown; the base lands first
           and the points last, so it builds from the ground up. */
        const arm = Math.min(2, Math.floor(col / (COLS / 3)));
        const fromBase = (ROWS - 1 - row) / (ROWS - 1);
        const delay = fromBase * 0.42 + rand() * 0.1;
        let sx;
        let sy;
        if (origin) {
          sx = origin.x + ((col + 0.5) / COLS) * origin.w;
          sy = origin.y + ((row + 0.5) / ROWS) * origin.h;
        } else {
          const angle = -Math.PI / 2 + arm * ((Math.PI * 2) / 3) + (rand() - 0.5) * 0.3;
          const r = reach * (0.92 + rand() * 0.22);
          sx = G.cx + Math.cos(angle) * r;
          sy = G.cy + Math.sin(angle) * r;
        }
        particles.push({ col, row, delay, sx, sy, bulge: 0.25 + rand() * 0.3 });
      }
    }
  }

  function burstSparks(now) {
    sparks = [];
    for (let i = 0; i < 16; i += 1) {
      const angle = (i / 16) * Math.PI * 2 + rand() * 0.3;
      sparks.push({ angle, speed: 0.55 + rand() * 0.6, born: now });
    }
  }

  const snap = (n, step) => Math.round(n / step) * step;

  /* The dither threshold of every screen block for a wipe centred on a
     point: distance from the point plus a Bayer cell, so the edge of the
     wipe is a stepped 8-bit fringe instead of a soft fade. */
  function thresholds(fx, fy) {
    const key = `${Math.round(fx)}:${Math.round(fy)}`;
    if (G.thr && G.thrKey === key) return G.thr;
    const far = Math.max(
      Math.hypot(fx, fy),
      Math.hypot(G.vw - fx, fy),
      Math.hypot(fx, G.vh - fy),
      Math.hypot(G.vw - fx, G.vh - fy)
    );
    const thr = new Float32Array(G.bw * G.bh);
    for (let by = 0; by < G.bh; by += 1) {
      for (let bx = 0; bx < G.bw; bx += 1) {
        const d = Math.hypot((bx + 0.5) * G.block - fx, (by + 0.5) * G.block - fy) / far;
        thr[by * G.bw + bx] = 0.62 * d + 0.38 * ((BAYER[by & 3][bx & 3] + 0.5) / 16);
      }
    }
    G.thr = thr;
    G.thrKey = key;
    return thr;
  }

  /* Punch holes through everything drawn so far. `keepInside` true = the
     drawing survives near the focus (covering in); false = it is eaten
     from the focus outward (dissolving away). */
  function erase(progress, fx, fy, keepInside) {
    const thr = thresholds(fx, fy);
    ctx.save();
    ctx.globalCompositeOperation = "destination-out";
    ctx.beginPath();
    for (let by = 0; by < G.bh; by += 1) {
      for (let bx = 0; bx < G.bw; bx += 1) {
        const t = thr[by * G.bw + bx];
        if (keepInside ? t >= progress : t < progress) {
          ctx.rect(bx * G.block, by * G.block, G.block, G.block);
        }
      }
    }
    ctx.fill();
    ctx.restore();
  }

  function drawGlow(x, y, strength) {
    if (strength <= 0) return;
    ctx.fillStyle = colors.accent;
    const base = G.cell * COLS;
    for (let i = 3; i >= 1; i -= 1) {
      ctx.globalAlpha = 0.045 * strength;
      ctx.beginPath();
      ctx.arc(x, y, base * (0.45 + i * 0.3), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  /* The crown as cells, turned `angle` about its vertical axis. Columns
     squeeze toward the axis; an offset copy underneath is the coin's edge;
     the back face is shaded. */
  function drawCrown(x, y, cell, angle, color) {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const flat = Math.abs(cos);
    const left = (col) => x + (col - COLS / 2) * cell * cos;
    const top = y - (ROWS / 2) * cell;
    const colW = Math.max(1, cell * flat);

    const face = (dx) => {
      for (let col = 0; col < COLS; col += 1) {
        const a = left(col);
        const b = left(col + 1);
        const px = Math.round(Math.min(a, b) + dx);
        const w = Math.max(1, Math.round(Math.max(a, b) + dx) - px);
        let run = -1;
        for (let row = 0; row <= ROWS; row += 1) {
          const on = row < ROWS && CROWN[row][col] === "#";
          if (on && run < 0) run = row;
          if (!on && run >= 0) {
            const py = Math.round(top + run * cell);
            ctx.fillRect(px, py, w, Math.round(top + row * cell) - py);
            run = -1;
          }
        }
      }
    };

    const depth = sin * cell * 1.6;
    if (Math.abs(depth) >= 1) {
      /* The edge: the same silhouette pushed back, accent darkened by a
         wash of the page colour. */
      ctx.fillStyle = color;
      face(-depth);
      ctx.globalAlpha = 0.5;
      ctx.fillStyle = colors.bg;
      face(-depth);
      ctx.globalAlpha = 1;
    }
    ctx.fillStyle = color;
    face(0);
    if (cos < 0) {
      ctx.globalAlpha = 0.28;
      ctx.fillStyle = colors.bg;
      face(0);
      ctx.globalAlpha = 1;
    }
    return colW;
  }

  function drawGather(now) {
    const span = T.gather;
    const flight = 0.5; // share of the gather each pixel spends flying
    const sweep = origin ? 3.4 : 2.5;
    ctx.fillStyle = colors.accent;
    const top = G.cy - (ROWS / 2) * G.cell;
    const leftEdge = G.cx - (COLS / 2) * G.cell;
    for (const p of particles) {
      const tx = leftEdge + (p.col + 0.5) * G.cell;
      const ty = top + (p.row + 0.5) * G.cell;
      const local = ((now - gatherStart) / span - p.delay) / flight;
      if (local >= 1) {
        ctx.globalAlpha = 1;
        ctx.fillRect(Math.round(tx - G.cell / 2), Math.round(ty - G.cell / 2), G.cell, G.cell);
        continue;
      }
      if (local <= 0) {
        if (origin) {
          const s = Math.max(1, origin.w / COLS);
          ctx.globalAlpha = 1;
          ctx.fillRect(p.sx - s / 2, p.sy - s / 2, s, s);
        }
        continue;
      }
      /* Head plus a short trail: the same curve sampled a little earlier. */
      for (let ghost = 4; ghost >= 0; ghost -= 1) {
        const t = local - ghost * 0.045;
        if (t <= 0) continue;
        const e = easeOutCubic(t);
        const rot = (1 - e) * sweep;
        const scale = (1 - e) * (1 + p.bulge * Math.sin(Math.PI * t));
        const vx = (p.sx - tx) * scale;
        const vy = (p.sy - ty) * scale;
        const x = tx + vx * Math.cos(rot) - vy * Math.sin(rot);
        const y = ty + vx * Math.sin(rot) + vy * Math.cos(rot);
        const size = ghost === 0 ? Math.max(G.unit, Math.round(G.cell * (0.6 + 0.4 * e))) : G.unit;
        ctx.globalAlpha = ghost === 0 ? 1 : 0.5 - ghost * 0.1;
        ctx.fillRect(snap(x, G.unit) - size / 2, snap(y, G.unit) - size / 2, size, size);
      }
    }
    ctx.globalAlpha = 1;
  }

  /* Two square-pixel rings thrown off the crown when it locks. */
  function drawShock(now) {
    const age = now - lockAt;
    if (lockAt === 0 || age > 700) return;
    ctx.fillStyle = colors.accent;
    const reach = Math.max(G.vw, G.vh) * 0.62;
    for (let ring = 0; ring < 2; ring += 1) {
      const t = clamp01((age - ring * 110) / 560);
      if (t <= 0 || t >= 1) continue;
      const radius = G.cell * 6 + easeOutCubic(t) * reach;
      const dots = 56;
      ctx.globalAlpha = Math.ceil((1 - t) * 4) / 4 * (ring === 0 ? 0.9 : 0.5);
      for (let i = 0; i < dots; i += 1) {
        const a = (i / dots) * Math.PI * 2;
        ctx.fillRect(
          snap(G.cx + Math.cos(a) * radius, G.unit),
          snap(G.cy + Math.sin(a) * radius, G.unit),
          G.unit,
          G.unit
        );
      }
    }
    ctx.globalAlpha = 1;
  }

  function drawSparks(now, x, y) {
    if (!sparks.length) return;
    ctx.fillStyle = colors.text;
    const reach = G.cell * COLS * 0.95;
    for (const s of sparks) {
      const t = (now - s.born) / 420;
      if (t >= 1) continue;
      const r = G.cell * 5 + easeOutCubic(t) * reach * s.speed;
      ctx.globalAlpha = t < 0.6 ? 1 : 0.45;
      ctx.fillRect(
        snap(x + Math.cos(s.angle) * r, G.unit),
        snap(y + Math.sin(s.angle) * r * 0.7, G.unit),
        G.unit,
        G.unit
      );
    }
    ctx.globalAlpha = 1;
  }

  /* The wordmark, one letter at a time: each steps up into place. */
  function drawWordmark(progress) {
    if (!wordmarkImg.complete || !wordmarkImg.naturalWidth) return;
    if (!wordmarkTinted) wordmarkTinted = tint(wordmarkImg, colors.text);
    const n = ART_LETTERS.length;
    for (let i = 0; i < n; i += 1) {
      const t = clamp01(progress * (n + 2) - i);
      if (t <= 0) continue;
      const sx = ART_LETTERS[i][0];
      const sliceW = ART_LETTERS[i][1] - sx;
      const lift = t >= 1 ? 0 : G.unit * 2;
      ctx.globalAlpha = t >= 1 ? 1 : 0.55;
      ctx.drawImage(
        wordmarkTinted,
        sx,
        0,
        sliceW,
        ART_H,
        G.lockX + sx * G.k,
        G.lockY + lift,
        sliceW * G.k,
        G.lockH
      );
    }
    ctx.globalAlpha = 1;
  }

  function drawLockupCrown() {
    if (crownImg.complete && crownImg.naturalWidth) {
      if (!crownTinted) crownTinted = tint(crownImg, colors.accent);
      ctx.drawImage(crownTinted, G.lockX, G.lockY, G.lockW, G.lockH);
    } else {
      drawCrown(G.lockCrownX, G.lockCrownY, G.lockCell, 0, colors.accent);
    }
  }

  function setPhase(next, now) {
    phase = next;
    phaseStart = now;
  }

  function frame(now) {
    if (stopped) return;
    if (!phaseStart) {
      phaseStart = now;
      gatherStart = now + T.cover * 0.55; // ribbons lift off as the cover closes
    }
    let p = 0;

    /* Advance. */
    if (phase === "cover") {
      p = clamp01((now - phaseStart) / T.cover);
      if (p >= 1) setPhase("gather", now);
    }
    if (phase === "gather" && now - gatherStart >= T.gather) {
      lockAt = now;
      setPhase("spin", now);
    }
    if (phase === "spin" && now - phaseStart >= T.spin) {
      if (isReady()) {
        landAt = now;
        burstSparks(now);
        setPhase("settle", now);
      } else {
        phaseStart = now; // still waiting on the session: toss it again
      }
    }
    if (phase === "settle" && now - phaseStart >= T.settle) setPhase("hold", now);
    if (phase === "hold" && now - phaseStart >= T.hold) setPhase("dissolve", now);
    if (phase !== "cover" && !coveredSent) {
      coveredSent = true;
      onCovered?.();
    }

    /* Paint. */
    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = 1;
    ctx.clearRect(0, 0, G.vw, G.vh);
    ctx.fillStyle = colors.bg;
    ctx.fillRect(0, 0, G.vw, G.vh);

    if (phase === "cover" || phase === "gather") {
      const built = clamp01((now - gatherStart) / T.gather);
      drawGlow(G.cx, G.cy, built * 0.7);
      if (now >= gatherStart || origin) drawGather(Math.max(now, gatherStart));
    } else if (phase === "spin") {
      const t = clamp01((now - phaseStart) / T.spin);
      const turned = easeInOutCubic(t) * T.turns * Math.PI * 2;
      const angle = Math.round(turned / ((Math.PI * 2) / SPIN_STEPS)) * ((Math.PI * 2) / SPIN_STEPS);
      const toss = Math.round(Math.sin(Math.PI * t) * G.cell * 3.2);
      const flash = now - lockAt < 90;
      drawGlow(G.cx, G.cy, 1);
      drawShock(now);
      drawCrown(G.cx, G.cy - toss, G.cell, angle, flash ? colors.text : colors.accent);
    } else {
      const t = phase === "settle" ? clamp01((now - phaseStart) / T.settle) : 1;
      const e = easeOutExpo(t);
      const x = G.cx + (G.lockCrownX - G.cx) * e;
      const y = G.cy + (G.lockCrownY - G.cy) * e;
      const cell = G.cell + (G.lockCell - G.cell) * e;
      drawGlow(x, y, 1 - e * 0.65);
      drawShock(now);
      drawSparks(now, G.cx, G.cy);
      drawWordmark(phase === "settle" ? clamp01((t - 0.15) / 0.85) : 1);
      if (t >= 1) drawLockupCrown();
      else drawCrown(x, y, cell, 0, now - landAt < 70 ? colors.text : colors.accent);
    }

    if (phase === "cover") {
      const fx = origin ? origin.x + origin.w / 2 : G.cx;
      const fy = origin ? origin.y + origin.h / 2 : G.cy;
      erase(p, fx, fy, true);
    } else if (phase === "dissolve") {
      const d = clamp01((now - phaseStart) / dissolveMs);
      erase(d, G.lockCrownX, G.lockCrownY, false);
      if (d >= 1) {
        finish();
        return;
      }
    }

    if (!drewOnce) {
      drewOnce = true;
      onFirstFrame?.();
    }
    raf = requestAnimationFrame(frame);
  }

  function finish() {
    if (stopped) return;
    stopped = true;
    cancelAnimationFrame(raf);
    window.removeEventListener("resize", onResize);
    if (!coveredSent) {
      coveredSent = true;
      onCovered?.();
    }
    onDone();
  }

  function onResize() {
    /* The keyboard closing after sign-in resizes the viewport mid-intro:
       re-centre and carry on rather than bail. */
    layout();
  }

  layout();
  buildParticles();
  window.addEventListener("resize", onResize);
  raf = requestAnimationFrame(frame);

  return {
    /* A tap: wipe out now. */
    skip() {
      if (stopped || phase === "dissolve") return;
      dissolveMs = SKIP_DISSOLVE_MS;
      setPhase("dissolve", performance.now());
    },
    /* Unmount: no callbacks, just stop. */
    stop() {
      stopped = true;
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
    },
  };
}
