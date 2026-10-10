import { useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { CoachPanel } from "../components/coach/CoachPanel.jsx";
import { useCoachSession } from "../context/CoachSessionContext.jsx";
import "../styles/coach-page.css";

function parseConversationParam(raw) {
  if (raw == null || !/^\d+$/.test(raw)) return null;
  const id = Number(raw);
  if (!Number.isInteger(id) || id <= 0) return null;
  return id;
}

/* The route layer keeps this page mounted until the next one commits, but
   the URL has already moved on - writing ?c= then lands on the NEW page's
   URL (seen in review: /sessions/503?c=7). */
function stillOnCoach() {
  try {
    return window.location.pathname === "/coach";
  } catch {
    return false;
  }
}

export function CoachPage() {
  const pageRef = useRef(null);
  const session = useCoachSession();
  const [searchParams, setSearchParams] = useSearchParams();
  const resumeConversationId = parseConversationParam(searchParams.get("c"));

  /* Reload and a return to /coach with no ?c= reopen the active conversation.
     A ?c= already in the URL wins, so History can open a different thread. */
  useEffect(() => {
    if (resumeConversationId != null) return;
    if (session.conversationId == null) return;
    if (!stillOnCoach()) return;
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.set("c", String(session.conversationId));
        return next;
      },
      { replace: true }
    );
  }, [resumeConversationId, session.conversationId, setSearchParams]);

  function onConversationId(id) {
    if (!stillOnCoach()) return;
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (id == null) next.delete("c");
        else next.set("c", String(id));
        return next;
      },
      { replace: true }
    );
  }

  useEffect(() => {
    const page = pageRef.current;
    const vv = window.visualViewport;
    if (!page || !vv) return undefined;

    function fit() {
      const overlap = Math.max(0, window.innerHeight - vv.offsetTop - vv.height);
      const keyboard = overlap > 80;
      document.documentElement.classList.toggle("coach-kbd", keyboard);
      if (keyboard) {
        const top = page.getBoundingClientRect().top;
        const available = vv.height - Math.max(0, top - vv.offsetTop);
        page.style.height = `${Math.max(280, Math.round(available))}px`;
        const scroller = page.querySelector(".coach-page__scroll");
        if (scroller) scroller.scrollTop = scroller.scrollHeight;
      } else {
        page.style.height = "";
      }
    }

    fit();
    vv.addEventListener("resize", fit);
    vv.addEventListener("scroll", fit);
    return () => {
      vv.removeEventListener("resize", fit);
      vv.removeEventListener("scroll", fit);
      document.documentElement.classList.remove("coach-kbd");
      page.style.height = "";
    };
  }, []);

  return (
    <div className="coach-page" ref={pageRef}>
      <CoachPanel
        layout="page"
        defaultOpen
        resumeConversationId={resumeConversationId}
        onConversationId={onConversationId}
      />
    </div>
  );
}
