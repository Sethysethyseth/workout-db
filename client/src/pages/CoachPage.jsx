import { useEffect, useRef } from "react";
import { CoachPanel } from "../components/coach/CoachPanel.jsx";
import "../styles/coach-page.css";

export function CoachPage() {
  const pageRef = useRef(null);

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
      <CoachPanel layout="page" defaultOpen />
    </div>
  );
}
