import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useCoachSession } from "../../context/CoachSessionContext.jsx";
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
  const { bar, conversationId, dismissBar, noteAskFinished } = session;
  const onCoach = location.pathname === "/coach";
  const [place, setPlace] = useState("bottom");

  const visible =
    !onCoach && bar.phase && !bar.dismissed && (bar.phase === "working" || bar.phase === "finished" || bar.phase === "error");

  useEffect(() => {
    if (!onCoach) return;
    if (bar.phase === "finished" || bar.phase === "error") {
      noteAskFinished("clear");
    }
  }, [onCoach, bar.phase, noteAskFinished]);

  useEffect(() => {
    if (!visible) return undefined;
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
  }, [visible, location.pathname]);

  if (!visible) return null;

  const finished = bar.phase === "finished";
  const errored = bar.phase === "error";
  // Short enough to fit beside the action and the dismiss at 390px.
  const title = errored ? "Coach could not answer" : finished ? "Coach answered" : "Coach is working on it";
  const cta = errored ? "Open" : finished ? "Read" : "View";

  function openCoach() {
    navigate(conversationId ? `/coach?c=${conversationId}` : "/coach");
  }

  return (
    <div className="coach-working-bar-wrap container" data-place={place}>
      <div
        className={`coach-working-bar card${finished && bar.beat > 0 ? " coach-working-bar--beat" : ""}${place === "top" ? " coach-working-bar--chip" : ""}`}
        data-coach-bar={bar.phase}
      >
        <button type="button" className="coach-working-bar__main" onClick={openCoach}>
          <span className="coach-msg__crown" aria-hidden="true" key={bar.beat} />
          <span className="coach-working-bar__copy">
            <span className="coach-working-bar__title">{title}</span>
            {bar.snippet && bar.phase === "working" ? (
              <span className="coach-working-bar__snippet muted small">{bar.snippet}</span>
            ) : null}
          </span>
          <span className="coach-working-bar__cta">{cta}</span>
        </button>
        {finished || errored ? (
          <button type="button" className="coach-working-bar__dismiss" aria-label="Dismiss" onClick={dismissBar}>
            <span aria-hidden="true">×</span>
          </button>
        ) : null}
      </div>
    </div>
  );
}
