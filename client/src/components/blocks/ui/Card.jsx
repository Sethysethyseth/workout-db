import "../../../styles/blocks/bk-ui.css";

export function Card({ children, className = "", ...rest }) {
  const cls = className ? `bk-card ${className}` : "bk-card";
  return (
    <div className={cls} {...rest}>
      {children}
    </div>
  );
}
