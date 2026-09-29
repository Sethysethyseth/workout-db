import "../../../styles/blocks/bk-ui.css";
import { DisplayTitle } from "./DisplayTitle.jsx";
import { Eyebrow } from "./Eyebrow.jsx";

export function StickyHeader({
  eyebrow,
  title,
  sub,
  right = null,
  children = null,
  className = "",
  ...rest
}) {
  const cls = className ? `bk-sticky-header ${className}` : "bk-sticky-header";
  return (
    <header className={cls} {...rest}>
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
