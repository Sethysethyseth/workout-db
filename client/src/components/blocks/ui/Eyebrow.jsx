import "../../../styles/blocks/bk-ui.css";

export function Eyebrow({ children, className = "", ...rest }) {
  const cls = className ? `bk-eyebrow ${className}` : "bk-eyebrow";
  return (
    <p className={cls} {...rest}>
      {children}
    </p>
  );
}
