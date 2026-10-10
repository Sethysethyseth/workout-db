/** Coach mark: a bubble with the crown inside. No dots, so it never reads as a loading ellipsis. */
export function CoachMarkIcon({ size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M7 16.2 4.8 20l3.6-1.4A8.2 8.2 0 1 0 7 16.2Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      {/* Filled, the same silhouette as the app's crown (AiWait mask): an
          open zigzag read as an "M" at 22px. */}
      <path d="M8.6 14.2V9.9l2 1.5L12 8.7l1.4 2.7 2-1.5v4.3Z" fill="currentColor" />
    </svg>
  );
}
