import "../../../styles/blocks/bk-ui.css";

/** Condensed display title; optional `sub` renders as an inline accent label. */
export function DisplayTitle({ children, sub, className = "", ...rest }) {
  const cls = className ? `bk-display-title ${className}` : "bk-display-title";
  return (
    <h1 className={cls} {...rest}>
      {children}
      {sub != null && sub !== "" ? <em className="bk-display-title__sub">{sub}</em> : null}
    </h1>
  );
}
