import "../../../styles/blocks/bk-ui.css";

const TONES = new Set(["neutral", "accent", "good", "warn", "bad"]);

export function Chip({ children, tone = "neutral", className = "", ...rest }) {
  const safe = TONES.has(tone) ? tone : "neutral";
  const toneClass = safe === "neutral" ? "bk-chip" : `bk-chip bk-chip--${safe}`;
  const cls = className ? `${toneClass} ${className}` : toneClass;
  return (
    <span className={cls} {...rest}>
      {children}
    </span>
  );
}
