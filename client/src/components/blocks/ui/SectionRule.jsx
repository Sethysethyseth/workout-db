import "../../../styles/blocks/bk-ui.css";

export function SectionRule({ label, chip = null, className = "", ...rest }) {
  const cls = className ? `bk-section-rule ${className}` : "bk-section-rule";
  return (
    <div className={cls} {...rest}>
      <h2 className="bk-section-rule__label">{label}</h2>
      <span className="bk-section-rule__rule" aria-hidden="true" />
      {chip != null ? <span className="bk-section-rule__chip">{chip}</span> : null}
    </div>
  );
}
