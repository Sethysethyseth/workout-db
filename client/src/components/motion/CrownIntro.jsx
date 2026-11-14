import { useEffect, useRef, useState } from "react";
import { hasStoredAuthToken, useAuth } from "../../context/AuthContext.jsx";
import wordmarkWhite from "../../assets/brand/wordmark_white.png";
import crownMask from "../../assets/brand/wordmark_crown_mask.png";
import { startCrownIntro } from "./crownIntroEngine.js";
import {
  claimBootIntro,
  prefersReducedMotion,
  registerCrownIntroHost,
} from "./crownIntroStore.js";
import "./crown-intro.css";

const SLOW_MS = 4000;

/* Boot plays for someone who has signed in on this device before - a first
   visitor only ever lands on the login form, and that must not wait. The
   connector hand-off is a utility screen, not an app open. */
function shouldPlayBoot() {
  if (typeof window === "undefined") return false;
  if (prefersReducedMotion() || !hasStoredAuthToken()) return false;
  const { pathname, search } = window.location;
  if (pathname.startsWith("/connector") || search.includes("external_auth_id")) return false;
  return true;
}

/* The login page's own crown, in viewport px - the ribbons lift off it. */
function loginCrownRect() {
  const mark = document.querySelector(".auth-shell .wordmark");
  if (!mark) return null;
  const r = mark.getBoundingClientRect();
  if (!r.width) return null;
  const k = r.width / 1024;
  return { x: r.left + 438 * k, y: r.top + 8 * k, w: 100 * k, h: 66 * k };
}

/**
 * The crown intro overlay (MX). Two triggers, one animation:
 * - "boot": a cold app open on a device that has signed in before. It covers
 *   the session check and its spin repeats until that check answers.
 * - "login": right after a successful sign-in or registration.
 * A tap anywhere skips it. Reduced motion: it never mounts.
 */
export function CrownIntroHost() {
  const { authLoading } = useAuth();
  const [intro, setIntro] = useState(() =>
    shouldPlayBoot() && claimBootIntro() ? { id: 0, mode: "boot", origin: null } : null
  );
  const [slow, setSlow] = useState(false);
  const rootRef = useRef(null);
  const canvasRef = useRef(null);
  const engineRef = useRef(null);
  const coveredRef = useRef(null);
  const readyRef = useRef(false);

  useEffect(() => {
    readyRef.current = !authLoading;
  }, [authLoading]);

  useEffect(
    () =>
      registerCrownIntroHost((onCovered) => {
        document.activeElement?.blur?.(); // drop the keyboard
        coveredRef.current = onCovered;
        setIntro((cur) => ({ id: (cur?.id ?? 0) + 1, mode: "login", origin: loginCrownRect() }));
      }),
    []
  );

  useEffect(() => {
    if (!intro) return undefined;
    const root = rootRef.current;
    const end = () => {
      engineRef.current = null;
      setSlow(false);
      setIntro(null);
    };
    let engine;
    try {
      engine = startCrownIntro({
        canvas: canvasRef.current,
        mode: intro.mode,
        origin: intro.origin,
        isReady: () => intro.mode !== "boot" || readyRef.current,
        wordmarkSrc: wordmarkWhite,
        crownSrc: crownMask,
        onFirstFrame: () => root?.classList.remove("crown-intro--solid"),
        onCovered: () => {
          coveredRef.current?.();
          coveredRef.current = null;
        },
        onDone: end,
      });
    } catch {
      /* A canvas that will not start must never strand the app behind it. */
      coveredRef.current?.();
      coveredRef.current = null;
      end();
      return undefined;
    }
    engineRef.current = engine;
    const slowTimer = setTimeout(() => setSlow(true), SLOW_MS);
    return () => {
      clearTimeout(slowTimer);
      engine.stop();
    };
  }, [intro]);

  if (!intro) return null;
  return (
    <div
      ref={rootRef}
      className={`crown-intro${intro.mode === "boot" ? " crown-intro--solid" : ""}`}
      onPointerDown={() => engineRef.current?.skip()}
      role="presentation"
    >
      <canvas ref={canvasRef} className="crown-intro__canvas" aria-hidden="true" />
      {intro.mode === "boot" && slow ? (
        <p className="crown-intro__slow" role="status">
          Taking longer than usual…
        </p>
      ) : null}
    </div>
  );
}
