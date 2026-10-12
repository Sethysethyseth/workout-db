import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useCoachSession } from "../../context/CoachSessionContext.jsx";
import { GlyphIcon } from "../GlyphIcon.jsx";
import "../../styles/coach-working-bar.css";

function fieldIsFocused(root) {
  const active = document.activeElement;
  if (!active || !active.matches("input, textarea, select")) return false;
  if (root && root.contains(active)) return false;
  return true;
}

/**
 * Where the bar sits. Bottom matches the resume-workout bar on a phone.
 * Top (under the masthead, or at the top of the page when the phone nav
 * hides the masthead) when the bottom is already taken: a live workout,
 * the workout bar, or a focused field.
 */
function preferredPlace() {
  const narrow = window.matchMedia("(max-width: 719px)").matches;
  const live = Boolean(document.querySelector(".session-detail-page--live"));
  const workout = Boolean(document.querySelector(".persistent-workout-bar"));
  const focused = fieldIsFocused(document.querySelector(".coach-working-bar"));
  if (live || workout || focused) return "top";
  return narrow ? "bottom" : "top";
}

export function CoachWorkingBar() {
  const navigate = useNavigate();
  const location = useLocation();
  const session = useCoachSession();
  const { bar, conversationId, dismissBar, noteAskFinished, armAnswerStart } = session;
  const onCoach = location.pathname === "/coach";
  const [place, setPlace] = useState("bottom");
  const [present, setPresent] = useState(false);
  const [motion, setMotion] = useState("closed");
  const presentRef = useRef(false);
  const visibleRef = useRef(false);

  const visible =
    !onCoach && bar.phase && !bar.dismissed && (bar.phase === "working" || bar.phase === "finished" || bar.phase === "error");
  visibleRef.current = visible;

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (visible) {
      presentRef.current = true;
      setPresent(true);
      if (reduce) {
        setMotion("open");
        return undefined;
      }
      setMotion("closed");
      let frame2 = 0;
      const frame1 = requestAnimationFrame(() => {
        frame2 = requestAnimationFrame(() => {
          if (visibleRef.current) setMotion("open");
        });
      });
      return () => {
        cancelAnimationFrame(frame1);
        if (frame2) cancelAnimationFrame(frame2);
      };
    }
    if (!presentRef.current) return undefined;
    if (reduce) {
      presentRef.current = false;
      setPresent(false);
      setMotion("closed");
      return undefined;
    }
    setMotion("closed");
    const timer = window.setTimeout(() => {
      if (!visibleRef.current) {
        presentRef.current = false;
        setPresent(false);
      }
    }, 260);
    return () => window.clearTimeout(timer);
  }, [visible]);

  useEffect(() => {
    if (!onCoach) return;
    if (bar.phase === "finished" || bar.phase === "error") {
      noteAskFinished("clear");
    }
  }, [onCoach, bar.phase, noteAskFinished]);

  useEffect(() => {
    if (!present) return undefined;
    function fit() {
      setPlace(preferredPlace());
      const barEl = document.querySelector(".coach-working-bar");
      const active = document.activeElement;
      if (!barEl || !active || !active.matches("input, textarea, select")) return;
      if (barEl.contains(active)) return;
      const a = barEl.getBoundingClientRect();
      const b = active.getBoundingClientRect();
      const overlap = a.left < b.right && a.right > b.left && a.top < b.bottom && b.top < a.bottom;
      if (overlap) active.scrollIntoView({ block: "center", inline: "nearest" });
    }
    fit();
    // The route layer commits the new page AFTER this effect runs (view
    // transition), so a placement taken here can describe the old page - a
    // live workout's "top" stuck on Home. Re-fit when the page tree changes
    // (route commit, workout bar mounting or leaving), once per frame.
    let frame = 0;
    const observer = new MutationObserver(() => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        fit();
      });
    });
    const root = document.getElementById("root");
    if (root) observer.observe(root, { childList: true, subtree: true });
    window.addEventListener("resize", fit);
    document.addEventListener("focusin", fit);
    document.addEventListener("focusout", fit);
    return () => {
      observer.disconnect();
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener("resize", fit);
      document.removeEventListener("focusin", fit);
      document.removeEventListener("focusout", fit);
    };
  }, [present, location.pathname]);

  useLayoutEffect(() => {
    const root = document.documentElement;
    if (!present || place !== "top") {
      root.style.removeProperty("--coach-working-chip-h");
      return undefined;
    }
    const wrap = document.querySelector('.coach-working-bar-wrap[data-place="top"]');
    if (!wrap) {
      root.style.removeProperty("--coach-working-chip-h");
      return undefined;
    }
    const write = () => {
      const h = Math.ceil(wrap.getBoundingClientRect().height);
      if (h > 0) root.style.setProperty("--coach-working-chip-h", `${h}px`);
    };
    write();
    const observer = new ResizeObserver(write);
    observer.observe(wrap);
    return () => {
      observer.disconnect();
      root.style.removeProperty("--coach-working-chip-h");
    };
  }, [present, place, bar.phase, bar.snippet, bar.beat]);

  const frozenBarRef = useRef(bar);
  if (visible) frozenBarRef.current = bar;
  const viewBar = visible ? bar : frozenBarRef.current;

  if (!present) return null;

  const finished = viewBar.phase === "finished";
  const errored = viewBar.phase === "error";
  // Short enough to fit beside the action and the dismiss at 390px.
  const title = errored ? "Coach could not answer" : finished ? "Coach answered" : "Coach is working on it";
  const cta = errored ? "Open" : finished ? "Read" : "View";

  function openCoach() {
    if (finished && conversationId) armAnswerStart(conversationId);
    navigate(conversationId ? `/coach?c=${conversationId}` : "/coach");
  }

  return (
    <div className="coach-working-bar-wrap container" data-place={place}>
      <div
        className={`coach-working-bar card${finished && viewBar.beat > 0 ? " coach-working-bar--beat" : ""}${place === "top" ? " coach-working-bar--chip" : ""}`}
        data-coach-bar={viewBar.phase}
        data-motion={motion}
      >
        <button type="button" className="coach-working-bar__main" onClick={openCoach}>
          <span className="coach-msg__crown" aria-hidden="true" key={viewBar.beat} />
          <span className="coach-working-bar__copy">
            <span className="coach-working-bar__title">{title}</span>
            {viewBar.snippet && viewBar.phase === "working" ? (
              <span className="coach-working-bar__snippet muted small">{viewBar.snippet}</span>
            ) : null}
          </span>
          <span className="coach-working-bar__cta">{cta}</span>
        </button>
        {finished || errored ? (
          <button type="button" className="coach-working-bar__dismiss" aria-label="Dismiss" onClick={dismissBar}>
            <GlyphIcon name="close" size={20} />
          </button>
        ) : null}
      </div>
    </div>
  );
}
