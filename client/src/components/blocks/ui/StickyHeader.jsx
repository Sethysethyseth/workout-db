import { useLayoutEffect, useRef } from "react";
import "../../../styles/blocks/bk-ui.css";
import { DisplayTitle } from "./DisplayTitle.jsx";
import { Eyebrow } from "./Eyebrow.jsx";

/** App shell top nav (`Navbar` → `<header className="nav">`). */
const APP_NAV_SELECTOR = "header.nav";

function navOffsetPx() {
  const nav = document.querySelector(APP_NAV_SELECTOR);
  if (!nav) return 0;
  const style = getComputedStyle(nav);
  if (style.display === "none" || style.visibility === "hidden") return 0;
  const bottom = nav.getBoundingClientRect().bottom;
  return bottom > 0 ? bottom : 0;
}

export function StickyHeader({
  eyebrow,
  title,
  sub,
  right = null,
  children = null,
  className = "",
  ...rest
}) {
  const ref = useRef(null);
  const cls = className ? `bk-sticky-header ${className}` : "bk-sticky-header";

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    function apply() {
      el.style.setProperty("--bk-sticky-top", `${navOffsetPx()}px`);
    }

    apply();

    const ro = new ResizeObserver(apply);
    const nav = document.querySelector(APP_NAV_SELECTOR);
    if (nav) ro.observe(nav);
    // Catch media-query swaps (top nav ↔ bottom nav) and font/layout shifts.
    ro.observe(document.documentElement);
    window.addEventListener("resize", apply);

    return () => {
      ro.disconnect();
      window.removeEventListener("resize", apply);
      el.style.removeProperty("--bk-sticky-top");
    };
  }, []);

  return (
    <header ref={ref} className={cls} {...rest}>
      <div className="bk-sticky-header__row">
        <div className="bk-sticky-header__left">
          {eyebrow != null && eyebrow !== "" ? <Eyebrow>{eyebrow}</Eyebrow> : null}
          {title != null && title !== "" ? (
            <DisplayTitle sub={sub}>{title}</DisplayTitle>
          ) : null}
        </div>
        {right != null ? <div className="bk-sticky-header__right">{right}</div> : null}
      </div>
      {children != null ? <div className="bk-sticky-header__children">{children}</div> : null}
    </header>
  );
}
