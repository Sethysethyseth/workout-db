/**
 * Small stroke icons in the bottom-nav pattern: 24 box, round caps, stroke
 * sized so it paints about 1.8px at the display size. Centred on (12, 12).
 */
const PATHS = {
  close: "M6.5 6.5 L17.5 17.5 M17.5 6.5 L6.5 17.5",
  minus: "M6 12 H18",
  plus: "M12 6 V18 M6 12 H18",
  chevron: "M9 6.5 L15.5 12 L9 17.5",
};

export function GlyphIcon({ name, size = 24 }) {
  const stroke = (1.8 * 24) / size;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={stroke}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={PATHS[name]} />
    </svg>
  );
}
