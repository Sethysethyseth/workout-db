/** Coach mark: a plain chat bubble. Outline only - nothing inside the bubble.
    Stroke is scaled so it paints 1.8px at every display size (the nav weight). */
export function CoachMarkIcon({ size = 22 }) {
  const stroke = (1.8 * 24) / size;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      {/* Body is the rounded rectangle x 3.6..20.4, y 5.28..17.76 (centre 12,
          11.52), sized to sit with the bottom nav icons. The tail drops to
          y 19.92 and stays inside the viewBox; the stroke stays off the
          box edge. */}
      <path
        d="M6.72 5.28H17.28A3.12 3.12 0 0 1 20.4 8.4V14.64A3.12 3.12 0 0 1 17.28 17.76H11.04L8.88 19.92 6.72 17.76A3.12 3.12 0 0 1 3.6 14.64V8.4A3.12 3.12 0 0 1 6.72 5.28Z"
        stroke="currentColor"
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
