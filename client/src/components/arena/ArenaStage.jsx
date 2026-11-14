import { useEffect, useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { useLocation } from "react-router-dom";
import { useActiveSession } from "../../context/ActiveSessionContext.jsx";
import { useCoachSession } from "../../context/CoachSessionContext.jsx";
import { loadAnalyticsWeeks } from "../../lib/analyticsRangePref.js";
import { countCompleted, weekStreak } from "../../lib/profileStats.js";
import {
  analyticsFaces,
  banners,
  blockBoard,
  chalkLines,
  chalkSentence,
  historyStrip,
  libraryStrip,
  profileStrip,
  PILE_WEEKS,
  pileSpot,
  seatIndex,
  weekFaces,
} from "../../lib/arenaBoards.js";
import { resetArenaFacts, useArenaFacts } from "../../lib/arenaFacts.js";
import {
  ARENA_RAIL_ROWS,
  ARENA_STRIP_SVH,
  arenaSize,
  stageRide,
  stripPlace,
  stripReveal,
} from "../../lib/arenaSheet.js";
import { noteArenaFold, setArenaFoldRoom } from "../../lib/arenaFold.js";
import { setArenaTour, useArenaTour } from "../../lib/arenaTour.js";
import { REST_TIMER_EVENT, readRestRun } from "../../lib/restTimer.js";
import { SCENE_SIGNAL_EVENT } from "../../lib/sceneSignal.js";
import { sessionDisplayTitle } from "../../lib/sessionDisplay.js";
import { prefersReducedMotion } from "../../lib/useReducedMotion.js";
import { loadWeightUnit } from "../../lib/weightUnitPref.js";
import { CHEER_MS, createArena } from "./arenaEngine.js";
import "./arena.css";

const DAY_MS = 86400000;
/* Matches the stage's 440ms size change in arena.css. */
const SETTLE_MS = 460;

/* Route -> place in the arena (where the camera stands), and what the strip reads. */
function placeFor(pathname, activeId) {
  if (pathname === "/") return ["home", "home"];
  if (pathname.startsWith("/analytics")) return ["analytics", "analytics"];
  if (pathname.startsWith("/coach")) return ["coach", "coach"];
  if (pathname.startsWith("/profile")) return ["profile", "profile"];
  if (pathname.startsWith("/sessions/")) {
    const live = activeId != null && pathname === `/sessions/${activeId}`;
    return live ? ["home", null] : ["history", "history"];
  }
  if (pathname.startsWith("/sessions")) return ["history", "history"];
  if (pathname.startsWith("/log-workout")) return ["home", null];
  return ["library", "library"];
}

/* The workout a History route has open: `/sessions/:id`, not the live one. */
function selectedIdFor(pathname, activeId) {
  const m = pathname.match(/^\/sessions\/([^/]+)/);
  if (!m || (activeId != null && m[1] === String(activeId))) return null;
  return m[1];
}

const setsOf = (session) => session?._count?.sets ?? (Array.isArray(session?.sets) ? session.sets.length : 0);
const doneAt = (session) => {
  const t = new Date(session?.completedAt || NaN).getTime();
  return Number.isNaN(t) ? null : t;
};

/* The next local midnight - the week's edge. A store, so render stays pure; it checks once a minute. */
const nextMidnight = () => new Date().setHours(24, 0, 0, 0);
function subscribeDay(onChange) {
  const id = window.setInterval(onChange, 60000);
  return () => window.clearInterval(id);
}
function subscribeStorage(onChange) {
  window.addEventListener("storage", onChange);
  return () => window.removeEventListener("storage", onChange);
}

/** What the room shows from real training: the week, eight weeks of sets, the log pile (workouts per week). */
function roomFacts(sessions, midnight) {
  const days = [0, 0, 0, 0, 0, 0, 0];
  const bars = [0, 0, 0, 0, 0, 0, 0, 0];
  let weekSets = 0;
  let weekWorkouts = 0;
  let seats = 0;
  const pile = Array(PILE_WEEKS).fill(0);
  for (const session of sessions || []) {
    const at = doneAt(session);
    if (at == null) continue;
    seats += 1;
    const dayAgo = Math.floor((midnight - at) / DAY_MS);
    if (dayAgo >= 0 && dayAgo < 7) {
      days[6 - dayAgo] = 1;
      weekSets += setsOf(session);
      weekWorkouts += 1;
    }
    const weekAgo = Math.floor(dayAgo / 7);
    if (weekAgo >= 0 && weekAgo < 8) bars[7 - weekAgo] += setsOf(session);
    if (weekAgo >= 0 && weekAgo < PILE_WEEKS) pile[PILE_WEEKS - 1 - weekAgo] += 1;
  }
  return { week: { days, sets: weekSets, workouts: weekWorkouts }, bars, seats, pile };
}

const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;

/* The Analytics page's views, in its tab order, as its tabs name them. */
const ANALYTICS_VIEWS = ["muscles", "strength", "exercises", "execution"];
const VIEW_LABELS = ["Muscles", "Strength", "Exercises", "Execution"];
const viewIndex = (search) => Math.max(0, ANALYTICS_VIEWS.indexOf(new URLSearchParams(search).get("view")));

/** The coach's latest finished answer, or "". */
function latestAnswer(thread) {
  for (let i = (thread?.length ?? 0) - 1; i >= 0; i -= 1) {
    const m = thread[i];
    if (m?.role === "assistant" && !m.pending && !m.error && String(m.content ?? "").trim()) return m.content;
  }
  return "";
}

/** The one line the full view keeps on screen, per place, from the same facts as the strip. */
function peekLine(place, facts, live, weeks, here) {
  if (live && place === "home") return `In progress · ${plural(live.sets, "set", "sets")} logged`;
  if (place === "history" && here.selected) {
    return `${here.selected.title} · log ${here.seat + 1} of ${facts.seats}`;
  }
  if (place === "library" && here.block) {
    return `${here.block.name || "Your block"} · week ${here.block.week} of ${here.block.weeks}`;
  }
  if (place === "profile") {
    const lead = here.streak >= 1 ? `${here.streak} week streak` : `${plural(facts.seats, "workout", "workouts")} logged`;
    return `${lead} · ${here.hung} of 3 banners hung`;
  }
  if (place === "home") {
    return `Last 7 days: ${plural(facts.week.workouts, "workout", "workouts")} · ${plural(facts.week.sets, "set", "sets")}`;
  }
  if (place === "analytics") {
    const n = Math.min(weeks, facts.bars.length);
    return `Last ${n} weeks: ${plural(facts.bars.slice(-n).reduce((a, b) => a + b, 0), "set", "sets")}`;
  }
  if (place === "history") return `${plural(facts.seats, "workout", "workouts")} · one log each, stacked by week`;
  if (place === "coach") return "Ask the coach anything";
  if (place === "library") return "Your workouts and blocks";
  return `${plural(facts.seats, "workout", "workouts")} logged`;
}

/* The strip's opacity follows the scroll exactly. A route's size change
   fades it in place instead (route = true); it never slides. */
function applyStrip(st, route) {
  const { geom, strip } = st;
  const ride = stageRide({ scrollY: window.scrollY, openPx: geom.openPx, stripPx: geom.stripPx });
  const reveal = stripReveal({ ride, openPx: geom.openPx, stripPx: geom.stripPx });
  const reduced = prefersReducedMotion();
  if (reveal !== geom.reveal) {
    if (route && !reduced) strip.dataset.fade = reveal > geom.reveal ? "in" : "out";
    else delete strip.dataset.fade;
    geom.reveal = reveal;
    strip.style.opacity = String(reduced ? (reveal >= 1 ? 1 : 0) : reveal);
    strip.classList.toggle("arena-strip--full", reveal >= 1);
  }
  const showStrip = reveal > 0;
  const covered = reveal >= 1;
  window.clearTimeout(st.coverTimer);
  const push = (patch) => {
    Object.assign(geom, patch);
    st.arena.set(patch);
  };
  if (showStrip !== geom.strip) push({ strip: showStrip });
  if (covered !== geom.covered) {
    // A route shrinking to the strip keeps drawing the room until the stage has settled.
    if (covered && route && !reduced) st.coverTimer = window.setTimeout(() => push({ covered: true }), SETTLE_MS);
    else push({ covered });
  }
}

/* Target sizes in px, read only on a route change or a resize - never per scroll. */
function measureStage(st) {
  const root = document.documentElement.style;
  /* Fold end: strip (18svh) on live logger / live Home; rail (11 room px) elsewhere. */
  if (st.foldStrip) root.setProperty("--arena-strip-h", `${ARENA_STRIP_SVH}svh`);
  else root.setProperty("--arena-strip-h", `calc(${ARENA_RAIL_ROWS} * var(--arena-px, 4px))`);
  st.geom.openPx = st.probe.offsetHeight || 0;
  st.geom.stripPx = st.stripProbe.offsetHeight || 0;
  const nav = document.querySelector(".app > .nav");
  const top = nav && getComputedStyle(nav).display !== "none" ? nav.offsetHeight : 0;
  root.setProperty("--arena-top", `${top}px`);
  /* Coach (and other rail-first pages) size against the stage's real height. */
  root.setProperty("--arena-stage-h", st.geom.openPx ? `${st.geom.openPx}px` : `var(--arena-h)`);
  setArenaFoldRoom(st.mode === "open" ? Math.ceil(st.geom.openPx - st.geom.stripPx) : 0);
}

const HOLD_MS = 480;
/* Css px a press may wander and still count as a tap or a hold. */
const TAP_PX = 10;

/* Look closer. Hold or pinch out to zoom in where you pressed (it turns the
   full view on first); drag to look around; a tap steps back, unless it
   lands on the Log; pinch in steps back. A tap at 1x is left to the button's
   click, which toggles the full view. Returns the cleanup. */
function bindLook(st, stage, canvas) {
  const ptrs = new Map();
  let press = null;
  let pinch = null;
  let hold = 0;
  const at = (e) => {
    const r = canvas.getBoundingClientRect();
    return st.arena.toWorld((e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height);
  };
  const zoomIn = (point) => {
    setArenaTour(true);
    st.look(point);
  };
  const down = (e) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    ptrs.set(e.pointerId, e);
    window.clearTimeout(hold);
    if (ptrs.size === 1) st.swallow = false;
    if (ptrs.size >= 2) {
      const [a, b] = [...ptrs.values()];
      pinch = pinch || { d0: Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY) || 1, done: false };
      press = null;
      st.swallow = true;
      return;
    }
    press = { x0: e.clientX, y0: e.clientY, from: st.arena.focus(), moved: 0, dead: false, point: at(e) };
    if (st.arena.zoomed()) {
      try {
        stage.setPointerCapture(e.pointerId);
      } catch {
        /* already released */
      }
      return;
    }
    hold = window.setTimeout(() => {
      if (!press || press.moved >= TAP_PX) return;
      press.dead = true;
      st.swallow = true;
      zoomIn(press.point);
      try {
        navigator.vibrate?.(12);
      } catch {
        /* no haptics here - fine */
      }
    }, HOLD_MS);
  };
  const move = (e) => {
    if (!ptrs.has(e.pointerId)) return;
    ptrs.set(e.pointerId, e);
    if (pinch) {
      if (ptrs.size < 2 || pinch.done) return;
      const [a, b] = [...ptrs.values()];
      const k = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY) / pinch.d0;
      if (k > 1.3 && !st.arena.zoomed()) {
        pinch.done = true;
        zoomIn(at({ clientX: (a.clientX + b.clientX) / 2, clientY: (a.clientY + b.clientY) / 2 }));
      } else if (k < 0.77 && st.arena.zoomed()) {
        pinch.done = true;
        st.back();
      }
      return;
    }
    if (!press) return;
    const dx = e.clientX - press.x0;
    const dy = e.clientY - press.y0;
    press.moved = Math.max(press.moved, Math.hypot(dx, dy));
    if (press.dead || !st.arena.zoomed()) return;
    const r = canvas.getBoundingClientRect();
    st.arena.pan(press.from, dx / r.width, dy / r.height);
  };
  const up = (e) => {
    const had = ptrs.delete(e.pointerId);
    window.clearTimeout(hold);
    if (pinch) {
      if (ptrs.size === 0) pinch = null;
      press = null;
      return;
    }
    const p = press;
    press = null;
    if (!had || !p || p.dead || !st.arena.zoomed()) return;
    // Up close a tap never toggles the full view: the Log answers it, anything else steps back.
    st.swallow = true;
    if (e.type === "pointerup" && p.moved < TAP_PX) {
      if (st.arena.tapLog(p.point)) st.onCheer();
      else st.back();
    }
  };
  const block = (e) => e.preventDefault();
  stage.addEventListener("pointerdown", down);
  stage.addEventListener("pointermove", move);
  stage.addEventListener("pointerup", up);
  stage.addEventListener("pointercancel", up);
  stage.addEventListener("contextmenu", block);
  stage.addEventListener("selectstart", block);
  return () => {
    window.clearTimeout(hold);
    stage.removeEventListener("pointerdown", down);
    stage.removeEventListener("pointermove", move);
    stage.removeEventListener("pointerup", up);
    stage.removeEventListener("pointercancel", up);
    stage.removeEventListener("contextmenu", block);
    stage.removeEventListener("selectstart", block);
  };
}

/**
 * Arena view (beta). The stage sits in the page flow above the sheet and
 * moves with the sheet's top edge as one piece: the window scroll carries
 * both, and `position: sticky` holds the stage at strip height. A route's
 * size change grows or shrinks the spacer the stage is anchored to, so the
 * room can never move against the sheet's edge. The camera only walks
 * sideways. Nothing inside a page has to know the arena exists.
 */
export function ArenaStage() {
  const canvasRef = useRef(null);
  const stageBtnRef = useRef(null);
  const stripRef = useRef(null);
  const probeRef = useRef(null);
  const stripProbeRef = useRef(null);
  const arenaRef = useRef(null);
  const stageRef = useRef(null);
  const { pathname, search } = useLocation();
  const tour = useArenaTour();
  const { sessions, activeSession } = useActiveSession();
  const activeId = activeSession?.id ?? null;
  const [place, facet] = placeFor(pathname, activeId);
  const live = activeId != null;
  const size = arenaSize({ pathname, tour, live, activeId });
  const toStrip = stripPlace({ pathname, live, activeId });
  const [cheer, setCheer] = useState(false);
  const cheerTimer = useRef(0);

  useLayoutEffect(() => {
    // Facts published before this stage existed may belong to another account; pages publish again on their next load.
    resetArenaFacts();
    const canvas = canvasRef.current;
    const arena = createArena(canvas, stripRef.current);
    const st = {
      arena,
      strip: stripRef.current,
      probe: probeRef.current,
      stripProbe: stripProbeRef.current,
      geom: { openPx: 0, stripPx: 0, reveal: -1, covered: false, strip: false },
      foldStrip: true,
      mode: null,
      coverTimer: 0,
      swallow: false, // the next click belongs to a closer-look gesture, not the full-view toggle
    };
    const stage = stageBtnRef.current;
    st.look = (point) => {
      arena.look(point);
      stage.dataset.zoom = "";
    };
    st.back = () => {
      arena.back();
      delete stage.dataset.zoom;
    };
    // Zoomed in on the Log the scoreboard is off screen: the line carries the cheer.
    st.onCheer = () => {
      window.clearTimeout(cheerTimer.current);
      setCheer(true);
      cheerTimer.current = window.setTimeout(() => setCheer(false), CHEER_MS);
    };
    arenaRef.current = arena;
    stageRef.current = st;
    const unbindLook = bindLook(st, stage, canvas);
    arena.resize();
    const ro = new ResizeObserver(() => {
      arena.resize();
      measureStage(st);
      applyStrip(st, false);
    });
    ro.observe(canvas);
    // The navbar renders only once auth settles; its height sets --arena-top on desktop.
    let nav = null;
    const watchNav = () => {
      const next = document.querySelector(".app > .nav");
      if (next === nav) return;
      if (nav) ro.unobserve(nav);
      nav = next;
      if (nav) ro.observe(nav);
      else measureStage(st);
    };
    watchNav();
    const app = canvas.closest(".app");
    const navMo = new MutationObserver(watchNav);
    if (app) navMo.observe(app, { childList: true });
    const mo = new MutationObserver(() => arena.recolor());
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme", "data-palette", "style"] });
    const onScroll = () => applyStrip(st, false);
    const onVisible = () => arena.set({});
    window.addEventListener("scroll", onScroll, { passive: true });
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      unbindLook();
      ro.disconnect();
      navMo.disconnect();
      mo.disconnect();
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("visibilitychange", onVisible);
      window.clearTimeout(st.coverTimer);
      window.clearTimeout(cheerTimer.current);
      arena.destroy();
      arenaRef.current = null;
      stageRef.current = null;
    };
  }, []);

  /* The stage's height belongs to the route (or the full view); the sheet starts below it. */
  const height =
    size.mode === "tour"
      ? `calc(${size.svh}svh - var(--arena-tour-gap) - var(--arena-top))`
      : size.mode === "rail"
        ? `calc(${size.rows} * var(--arena-px, 4px))`
        : `${size.svh}svh`;
  /* Leaving an open page: remember whether its room was folded, so the next
     page arrives the same way (lib/arenaFold.js). Runs before the effect
     below, while the geometry and the mode are still the old route's. */
  const leftPathRef = useRef(pathname);
  useLayoutEffect(() => {
    const st = stageRef.current;
    if (leftPathRef.current === pathname) return;
    leftPathRef.current = pathname;
    if (!st || st.mode !== "open") return;
    const roomPx = st.geom.openPx - st.geom.stripPx;
    noteArenaFold(roomPx > 0 && window.scrollY >= roomPx - 1);
  }, [pathname]);
  useLayoutEffect(() => {
    const st = stageRef.current;
    document.documentElement.style.setProperty("--arena-h", height);
    document.documentElement.dataset.arenaMode = size.mode;
    if (!st) return;
    st.foldStrip = toStrip;
    st.mode = size.mode;
    measureStage(st);
    applyStrip(st, true);
    st.arena?.set({ foldMode: toStrip ? "strip" : "rail" });
    /* After CSS fold height lands, force the bitmap to rematch (B1). set()
       already resizes on a foldMode change; this covers same-mode remounts
       and the first paint after --arena-strip-h flips to 18svh. */
    st.arena?.resize();
  }, [height, toStrip, size.mode]);
  useEffect(
    () => () => {
      document.documentElement.style.removeProperty("--arena-h");
      document.documentElement.style.removeProperty("--arena-top");
      document.documentElement.style.removeProperty("--arena-strip-h");
      document.documentElement.style.removeProperty("--arena-stage-h");
      document.documentElement.style.removeProperty("--arena-px");
      delete document.documentElement.dataset.arenaMode;
    },
    []
  );

  useEffect(() => {
    arenaRef.current?.set({ place, facet, foldMode: toStrip ? "strip" : "rail" });
  }, [place, facet, toStrip]);

  /* A closer look ends with the full view, and on any change of tab. */
  useEffect(() => {
    stageRef.current?.back();
  }, [pathname]);
  useEffect(() => {
    if (!tour) stageRef.current?.back();
  }, [tour]);

  const midnight = useSyncExternalStore(subscribeDay, nextMidnight, nextMidnight);
  const facts = useMemo(() => roomFacts(sessions, midnight), [sessions, midnight]);
  useEffect(() => {
    arenaRef.current?.set(facts);
  }, [facts]);

  /* Analytics follows the page's range: read on every render (so on entering it) and when another tab changes it. */
  const weeks = useSyncExternalStore(subscribeStorage, loadAnalyticsWeeks, loadAnalyticsWeeks);
  useEffect(() => {
    arenaRef.current?.set({ weeks });
  }, [weeks]);

  /* The boards read what the pages already hold (arenaFacts); until a page publishes, its board keeps today's face. */
  const published = useArenaFacts();
  const unit = loadWeightUnit() === "kg" ? "KG" : "LB";
  const weekSummary = published.week?.summary ?? null;
  const homeFaces = useMemo(
    () => weekFaces({ sets: facts.week.sets, workouts: facts.week.workouts, summary: weekSummary }, { unit }),
    [facts.week.sets, facts.week.workouts, weekSummary, unit]
  );
  useEffect(() => {
    arenaRef.current?.set({ homeFaces });
  }, [homeFaces]);

  // A summary published for another range than the page's is not shown.
  const analytics = published.analytics;
  const faces = useMemo(
    () => (analytics && analytics.weeks === weeks ? analyticsFaces(analytics.summary) : null),
    [analytics, weeks]
  );
  const view = viewIndex(search);
  const board = faces ? faces[view] : null;
  useEffect(() => {
    arenaRef.current?.set({ board });
  }, [board]);

  const block = useMemo(() => blockBoard(published.block), [published.block]);
  useEffect(() => {
    arenaRef.current?.set({ block });
  }, [block]);

  /* History follows the workout you have open; with none, the newest log. */
  const selectedId = selectedIdFor(pathname, activeId);
  const seat = useMemo(() => seatIndex(sessions, selectedId), [sessions, selectedId]);
  const selected = useMemo(() => {
    if (selectedId == null) return null;
    const session = (sessions || []).find((x) => String(x?.id) === selectedId && doneAt(x) != null);
    return session ? { title: sessionDisplayTitle(session), completedAt: session.completedAt } : null;
  }, [sessions, selectedId]);
  const spot = useMemo(() => pileSpot(sessions, selectedId, midnight), [sessions, selectedId, midnight]);
  useEffect(() => {
    arenaRef.current?.set({ spot });
  }, [spot]);

  const streak = useMemo(() => weekStreak(sessions, new Date(midnight - 1)), [sessions, midnight]);
  const workoutCount = useMemo(() => countCompleted(sessions), [sessions]);
  const libraryWorkouts = published.library?.workouts ?? null;
  const placeLines = useMemo(
    () => ({
      history: historyStrip({ seats: facts.seats, selected }),
      library: libraryStrip({ block, workouts: libraryWorkouts }),
      profile: profileStrip({ streak, workouts: workoutCount }),
    }),
    [facts.seats, selected, block, libraryWorkouts, streak, workoutCount]
  );
  useEffect(() => {
    arenaRef.current?.set({ placeLines, streak });
  }, [placeLines, streak]);

  const progress = published.block?.progress;
  const here = {
    selected,
    seat,
    streak,
    hung: banners(workoutCount).filter((b) => b.earned).length,
    block: block
      ? {
          name: published.block?.name,
          week: progress?.currentWeekOrder ?? 1,
          weeks: Array.isArray(progress?.weeks) ? progress.weeks.length : 0,
        }
      : null,
  };

  const { thread, streaming } = useCoachSession();
  const answer = useMemo(() => latestAnswer(thread), [thread]);
  const chalk = useMemo(() => ({ thinking: Boolean(streaming), lines: chalkLines(answer) }), [streaming, answer]);
  useEffect(() => {
    arenaRef.current?.set({ chalk });
  }, [chalk]);

  const liveStart = activeSession ? new Date(activeSession.startedAt || activeSession.performedAt).getTime() : null;
  const liveSets = setsOf(activeSession);
  const publishedLive = published.liveBlock;
  const publishedName = published.liveName;
  const liveName =
    (publishedName &&
      activeId != null &&
      String(publishedName.sessionId) === String(activeId) &&
      publishedName.name) ||
    (publishedLive &&
      activeId != null &&
      String(publishedLive.sessionId) === String(activeId) &&
      publishedLive.name) ||
    (activeSession ? sessionDisplayTitle(activeSession) : "");
  /* Block-day `n OF total`: SessionDetailPage publishes blockProgress via
     publishArenaFacts (liveBlock). Without it the strip falls back to SET n. */
  const liveBlock =
    publishedLive &&
    activeId != null &&
    String(publishedLive.sessionId) === String(activeId) &&
    publishedLive.total != null
      ? publishedLive
      : null;
  const liveStartMs = (() => {
    if (
      publishedLive &&
      activeId != null &&
      String(publishedLive.sessionId) === String(activeId) &&
      publishedLive.startedAt
    ) {
      const t = new Date(publishedLive.startedAt).getTime();
      if (Number.isFinite(t)) return t;
    }
    return liveStart;
  })();
  const lastTitle = useMemo(() => {
    const latest = (sessions || []).filter((x) => doneAt(x) != null).sort((a, b) => doneAt(b) - doneAt(a))[0];
    return latest ? sessionDisplayTitle(latest) : "";
  }, [sessions]);
  const lastTitleRef = useRef(lastTitle);
  useEffect(() => {
    lastTitleRef.current = lastTitle;
    arenaRef.current?.set({ savedName: lastTitle });
  }, [lastTitle]);

  useEffect(() => {
    const arena = arenaRef.current;
    if (!arena) return undefined;
    if (activeId == null || !Number.isFinite(liveStartMs)) {
      arena.set({ live: null, rest: null });
      return undefined;
    }
    let sets = liveSets;
    const push = () =>
      arena.set({
        live: {
          startedAtMs: liveStartMs,
          sets,
          name: liveName,
          block:
            liveBlock?.total != null
              ? { done: liveBlock.logged ?? liveBlock.done ?? 0, total: liveBlock.total }
              : null,
        },
        rest: readRestRun(activeId),
      });
    push();
    const onRest = () => push();
    const onSignal = (event) => {
      if (event?.detail?.kind !== "set") return;
      sets += 1;
      push();
      arena.flash(220);
    };
    window.addEventListener(REST_TIMER_EVENT, onRest);
    window.addEventListener(SCENE_SIGNAL_EVENT, onSignal);
    return () => {
      window.removeEventListener(REST_TIMER_EVENT, onRest);
      window.removeEventListener(SCENE_SIGNAL_EVENT, onSignal);
    };
  }, [activeId, liveStartMs, liveSets, liveName, liveBlock]);

  useEffect(() => {
    const onSignal = (event) => {
      const arena = arenaRef.current;
      const kind = event?.detail?.kind;
      if (!arena) return;
      if (kind === "finish") {
        arena.set({ savedUntil: Date.now() + 5000, savedName: lastTitleRef.current });
        arena.flash(2000);
      } else if (kind === "rest") {
        arena.flash(300);
      } else if (kind === "rain") {
        // The crowns start at the top of what is on screen, below the desktop navbar.
        const r = canvasRef.current?.getBoundingClientRect();
        const top = parseFloat(document.documentElement.style.getPropertyValue("--arena-top")) || 0;
        arena.rain(r && r.height ? (top - r.top) / r.height : 0);
      } else if (kind === "lift") {
        arena.hold(true);
      } else if (kind === "drop") {
        arena.hold(false);
      }
    };
    window.addEventListener(SCENE_SIGNAL_EVENT, onSignal);
    return () => window.removeEventListener(SCENE_SIGNAL_EVENT, onSignal);
  }, []);

  const livePeek = activeId != null ? { sets: liveSets } : null;
  let peek = peekLine(place, facts, livePeek, weeks, here);
  if (cheer) peek = "LOG CHAMP";
  else if (place === "coach" && streaming) peek = "The coach is thinking";
  else if (place === "coach" && answer) peek = chalkSentence(answer, 60);
  else if (place === "analytics" && faces) peek = `${VIEW_LABELS[view]} · last ${weeks} weeks`;

  return (
    <>
      <div className="arena-spacer">
        <button
          ref={stageBtnRef}
          type="button"
          className="arena-stage"
          aria-label="Full view of the arena"
          aria-pressed={tour}
          onClick={(e) => {
            const st = stageRef.current;
            // A keyboard click (detail 0) always toggles.
            if (st?.swallow && e.detail !== 0) {
              st.swallow = false;
              return;
            }
            setArenaTour(!tour);
          }}
        >
          <canvas ref={canvasRef} className="arena-stage__canvas" aria-hidden="true" />
        </button>
        <span ref={probeRef} className="arena-probe" aria-hidden="true" />
        <span ref={stripProbeRef} className="arena-probe arena-probe--strip" aria-hidden="true" />
      </div>
      <canvas ref={stripRef} className="arena-strip" aria-hidden="true" onClick={() => setArenaTour(true)} />
      {tour ? (
        <button type="button" className="arena-peek" onClick={() => setArenaTour(false)}>
          {peek}
        </button>
      ) : null}
    </>
  );
}
