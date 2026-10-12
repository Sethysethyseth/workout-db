import { useEffect, useRef } from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import { CoachPanel } from "../components/coach/CoachPanel.jsx";
import { useCoachSession } from "../context/CoachSessionContext.jsx";
import { coachKeyboardCorrection, coachKeyboardFit } from "../lib/coachKeyboardFit.js";
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

const FIT_GAP_PX = 2;

function fieldInside(page, el) {
  if (!page || !el || !page.contains(el)) return false;
  return el.matches("input, textarea, select, [contenteditable='true']");
}

export function CoachPage() {
  const pageRef = useRef(null);
  const debugTextRef = useRef(null);
  const safeRef = useRef(null);
  const vkPrevRef = useRef(undefined);
  const session = useCoachSession();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const resumeConversationId = parseConversationParam(searchParams.get("c"));
  const kbdebug = searchParams.get("kbdebug") === "1";

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

    if (!stillOnCoach()) {
      document.documentElement.classList.remove("coach-kbd");
      page.style.height = "";
      const vk = navigator.virtualKeyboard;
      if (vk && vkPrevRef.current !== undefined) vk.overlaysContent = vkPrevRef.current;
      return undefined;
    }

    let raf = 0;
    let wasOpen = false;
    let nudge = 0;
    let nudgeForTop = null;
    let fitToken = 0;
    let baseline = null;
    let baselineWidth = null;
    let boundVk = null;
    let composerEl = null;
    const ro = new ResizeObserver(() => schedule());

    function watchComposer() {
      const next = page.querySelector(".coach-page__composer");
      if (next === composerEl) return;
      if (composerEl) ro.unobserve(composerEl);
      composerEl = next;
      if (composerEl) ro.observe(composerEl);
    }

    function bindVk(vk) {
      if (vk === boundVk) return;
      if (boundVk) boundVk.removeEventListener("geometrychange", schedule);
      boundVk = vk || null;
      if (boundVk) boundVk.addEventListener("geometrychange", schedule);
    }

    function syncVirtualKeyboard() {
      const vk = navigator.virtualKeyboard;
      bindVk(vk);
      if (!vk) return null;
      if (vkPrevRef.current === undefined) vkPrevRef.current = vk.overlaysContent === true;
      if (stillOnCoach()) {
        if (!vk.overlaysContent) vk.overlaysContent = true;
      } else if (vk.overlaysContent !== vkPrevRef.current) {
        vk.overlaysContent = vkPrevRef.current;
      }
      if (!stillOnCoach()) return null;
      const rect = vk.boundingRect;
      if (!rect || !(rect.height > 0) || !Number.isFinite(rect.top)) return null;
      return { top: rect.top, height: rect.height, left: rect.left, width: rect.width };
    }

    function clearFit() {
      document.documentElement.classList.remove("coach-kbd");
      page.style.height = "";
      wasOpen = false;
      nudge = 0;
      nudgeForTop = null;
    }

    function overlaps(a, b) {
      if (!a || !b || a.width === 0 || a.height === 0 || b.width === 0 || b.height === 0) return false;
      return a.left < b.right && a.right > b.left && a.top < b.bottom && b.top < a.bottom;
    }

    function placeKbDebug() {
      const el = page.querySelector(".coach-kbdebug");
      if (!el) return;
      const vvTop = vv.offsetTop;
      el.style.right = "8px";
      el.style.left = "auto";
      el.style.top = `${Math.round(vvTop + 8)}px`;
      const title = page.querySelector(".coach-page__title");
      const composer = page.querySelector(".coach-page__composer");
      let rect = el.getBoundingClientRect();
      const titleRect = title ? title.getBoundingClientRect() : null;
      if (overlaps(rect, titleRect)) {
        el.style.top = `${Math.round(Math.max(vvTop, titleRect.bottom) + 8)}px`;
        rect = el.getBoundingClientRect();
      }
      const composerRect = composer ? composer.getBoundingClientRect() : null;
      if (overlaps(rect, composerRect)) {
        el.style.top = `${Math.round(composerRect.top - rect.height - 8)}px`;
        rect = el.getBoundingClientRect();
      }
      if (rect.top < vvTop) el.style.top = `${Math.round(vvTop + 8)}px`;
    }

    function writeDebug(reading) {
      const node = debugTextRef.current;
      if (!node) return;
      const vk = reading.virtualKeyboard;
      const vkText = vk
        ? `${Math.round(vk.left)},${Math.round(vk.top)} ${Math.round(vk.width)}x${Math.round(vk.height)}`
        : "none";
      const safe = safeRef.current ? safeRef.current.getBoundingClientRect().height : 0;
      const lines = [
        `dpr ${window.devicePixelRatio} innerWidth ${window.innerWidth}`,
        `innerHeight ${reading.innerHeight}`,
        `vv.height ${reading.vvHeight}`,
        `vv.offsetTop ${reading.vvOffsetTop}`,
        `virtualKeyboard ${vkText}`,
        `safe-bottom ${Math.round(safe)}`,
        `pageTop ${reading.pageTop == null ? "none" : reading.pageTop.toFixed(1)}`,
        `composerBottom ${reading.composerBottom == null ? "none" : reading.composerBottom.toFixed(1)}`,
        `keyboardTop ${reading.keyboardTop == null ? "none" : reading.keyboardTop.toFixed(1)}`,
        `source ${reading.source}`,
      ];
      node.textContent = lines.join("\n");
      placeKbDebug();
    }

    function fit() {
      if (!stillOnCoach()) {
        clearFit();
        const vk = navigator.virtualKeyboard;
        if (vk && vkPrevRef.current !== undefined) vk.overlaysContent = vkPrevRef.current;
        return;
      }
      watchComposer();
      const virtualKeyboard = syncVirtualKeyboard();
      const focused = fieldInside(page, document.activeElement);
      const vvHeight = vv.height;
      const vvOffsetTop = vv.offsetTop;
      /* A rotation changes the no-keyboard height, so the baseline is per width. */
      if (baseline == null || baselineWidth !== window.innerWidth) {
        baseline = vvHeight;
        baselineWidth = window.innerWidth;
      } else if (!(baseline - vvHeight > 80) && !virtualKeyboard) baseline = Math.max(baseline, vvHeight);

      const pageTop = page.getBoundingClientRect().top;
      const result = coachKeyboardFit({
        focused,
        innerHeight: window.innerHeight,
        vvHeight,
        vvOffsetTop,
        baselineHeight: baseline,
        virtualKeyboard,
        pageTop,
        gap: FIT_GAP_PX,
      });

      const composer = page.querySelector(".coach-page__composer");
      document.documentElement.classList.toggle("coach-kbd", result.open);

      if (!result.open) {
        page.style.height = "";
        nudge = 0;
        nudgeForTop = null;
        wasOpen = false;
        writeDebug({
          innerHeight: window.innerHeight,
          vvHeight,
          vvOffsetTop,
          virtualKeyboard,
          pageTop,
          composerBottom: composer ? composer.getBoundingClientRect().bottom : null,
          keyboardTop: null,
          source: "none",
        });
        return;
      }

      if (nudgeForTop == null || Math.abs(nudgeForTop - result.keyboardTop) > 2) {
        nudge = 0;
        nudgeForTop = result.keyboardTop;
      }
      const height = Math.round(result.pageHeight - nudge);
      page.style.height = `${height}px`;

      if (!wasOpen) {
        const scroller = page.querySelector(".coach-page__scroll");
        if (scroller) scroller.scrollTop = scroller.scrollHeight;
      }
      wasOpen = true;

      const token = ++fitToken;
      const keyboardTop = result.keyboardTop;
      const source = result.source;
      requestAnimationFrame(() => {
        if (token !== fitToken || !stillOnCoach()) return;
        const live = page.querySelector(".coach-page__composer");
        if (!live) return;
        const composerBottom = live.getBoundingClientRect().bottom;
        const corrected = coachKeyboardCorrection({
          pageHeight: page.getBoundingClientRect().height,
          composerBottom,
          keyboardTop,
          gap: FIT_GAP_PX,
        });
        if (corrected.corrected && corrected.pageHeight != null) {
          nudge += page.getBoundingClientRect().height - corrected.pageHeight;
          page.style.height = `${Math.round(corrected.pageHeight)}px`;
        }
        writeDebug({
          innerHeight: window.innerHeight,
          vvHeight: vv.height,
          vvOffsetTop: vv.offsetTop,
          virtualKeyboard: syncVirtualKeyboard(),
          pageTop: page.getBoundingClientRect().top,
          composerBottom: live.getBoundingClientRect().bottom,
          keyboardTop,
          source,
        });
      });
    }

    function schedule() {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        fit();
      });
    }

    schedule();
    vv.addEventListener("resize", schedule);
    vv.addEventListener("scroll", schedule);
    window.addEventListener("resize", schedule);
    page.addEventListener("focusin", schedule);
    page.addEventListener("focusout", schedule);
    return () => {
      if (raf) cancelAnimationFrame(raf);
      fitToken += 1;
      vv.removeEventListener("resize", schedule);
      vv.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      page.removeEventListener("focusin", schedule);
      page.removeEventListener("focusout", schedule);
      if (boundVk) boundVk.removeEventListener("geometrychange", schedule);
      ro.disconnect();
      document.documentElement.classList.remove("coach-kbd");
      page.style.height = "";
      const vk = navigator.virtualKeyboard;
      if (vk && vkPrevRef.current !== undefined) vk.overlaysContent = vkPrevRef.current;
    };
  }, [location.pathname]);

  return (
    <div className="coach-page" ref={pageRef}>
      <CoachPanel
        layout="page"
        defaultOpen
        resumeConversationId={resumeConversationId}
        onConversationId={onConversationId}
      />
      {kbdebug ? (
        <div className="coach-kbdebug" aria-hidden="true">
          <span className="coach-kbdebug__safe" ref={safeRef} />
          <span className="coach-kbdebug__text" ref={debugTextRef} />
        </div>
      ) : null}
    </div>
  );
}
