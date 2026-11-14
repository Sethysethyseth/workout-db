import { useEffect, useRef } from "react";
import { prefersReducedMotion } from "../../lib/useReducedMotion.js";

const GRAVITY = 2600; // px / s^2
const RESPAWN_MS = 420;
const MAX_SPEED = 4200;

/**
 * The loading crown's easter egg (Seth, Nov 14): press the spinning crown on
 * the full-page loader, drag it, let go and it flies - bouncing off the sides
 * of the screen, no ceiling - until it falls under the screen, then a fresh
 * one is back spinning where it started. Nothing else on the page moves or
 * waits for it. Reduced motion: inert.
 *
 * Returns a ref for the `.loading-coin` wrapper; `active` is whether the
 * coin is on screen.
 */
export function useCrownThrow(active) {
  const ref = useRef(null);

  useEffect(() => {
    const coin = ref.current;
    const crown = coin?.querySelector(".loading-coin__crown");
    if (!active || !coin || !crown || prefersReducedMotion()) return undefined;

    let raf = 0;
    let timer = 0;
    let toy = null; // { id, home, tx, ty, vx, vy, turn, trail, last }

    const paint = () => {
      crown.style.transform = `translate(${Math.round(toy.tx)}px, ${Math.round(toy.ty)}px) rotateY(${Math.round(toy.turn / 15) * 15}deg)`;
    };

    const reset = () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(timer);
      toy = null;
      crown.style.animation = "";
      crown.style.transform = "";
      crown.style.visibility = "";
      delete coin.dataset.thrown;
    };

    const fly = (now) => {
      const dt = Math.min(0.05, (now - toy.last) / 1000);
      toy.last = now;
      toy.vy += GRAVITY * dt;
      toy.tx += toy.vx * dt;
      toy.ty += toy.vy * dt;
      toy.turn += (toy.vx / 4 + Math.sign(toy.vx || 1) * 240) * dt;
      const left = toy.home.left + toy.tx;
      if (left < 0 && toy.vx < 0) {
        toy.tx = -toy.home.left;
        toy.vx *= -0.7;
      } else if (left + toy.home.width > window.innerWidth && toy.vx > 0) {
        toy.tx = window.innerWidth - toy.home.width - toy.home.left;
        toy.vx *= -0.7;
      }
      if (toy.home.top + toy.ty > window.innerHeight + 24) {
        crown.style.visibility = "hidden";
        timer = window.setTimeout(reset, RESPAWN_MS);
        return;
      }
      paint();
      raf = requestAnimationFrame(fly);
    };

    const onDown = (e) => {
      if (toy || e.button > 0) return;
      const seen = crown.getBoundingClientRect(); // mid-toss, as drawn
      crown.style.animation = "none";
      const home = crown.getBoundingClientRect(); // at rest
      toy = {
        id: e.pointerId,
        home,
        tx: 0,
        ty: seen.top - home.top,
        vx: 0,
        vy: 0,
        turn: 0,
        px: e.clientX,
        py: e.clientY,
        trail: [[performance.now(), 0, seen.top - home.top]],
        last: 0,
      };
      coin.dataset.thrown = "";
      try {
        coin.setPointerCapture(e.pointerId);
      } catch {
        /* the moves still arrive while the finger stays on the coin */
      }
      paint();
      e.preventDefault();
    };

    const onMove = (e) => {
      if (!toy || toy.id !== e.pointerId) return;
      const now = performance.now();
      toy.tx += e.clientX - toy.px;
      toy.ty += e.clientY - toy.py;
      toy.px = e.clientX;
      toy.py = e.clientY;
      toy.trail.push([now, toy.tx, toy.ty]);
      while (toy.trail.length > 2 && now - toy.trail[0][0] > 90) toy.trail.shift();
      paint();
    };

    const onUp = (e) => {
      if (!toy || toy.id !== e.pointerId) return;
      const now = performance.now();
      const [t0, x0, y0] = toy.trail[0];
      const dt = Math.max(0.016, (now - t0) / 1000);
      const cap = (v) => Math.max(-MAX_SPEED, Math.min(MAX_SPEED, v));
      toy.vx = cap((toy.tx - x0) / dt);
      toy.vy = cap((toy.ty - y0) / dt);
      toy.id = null;
      toy.last = now;
      raf = requestAnimationFrame(fly);
    };

    coin.addEventListener("pointerdown", onDown);
    coin.addEventListener("pointermove", onMove);
    coin.addEventListener("pointerup", onUp);
    coin.addEventListener("pointercancel", onUp);
    return () => {
      coin.removeEventListener("pointerdown", onDown);
      coin.removeEventListener("pointermove", onMove);
      coin.removeEventListener("pointerup", onUp);
      coin.removeEventListener("pointercancel", onUp);
      reset();
    };
  }, [active]);

  return ref;
}
