import "../../../styles/blocks/bk-ui.css";

export function Disclosure({ summary, children, className = "", ...rest }) {
  const cls = className ? `bk-disclosure ${className}` : "bk-disclosure";
  return (
    <details className={cls} {...rest}>
      <summary className="bk-disclosure__summary">
        <span className="bk-disclosure__glyph" aria-hidden="true" />
        {summary}
      </summary>
      <div className="bk-disclosure__body">{children}</div>
    </details>
  );
}
