/**
 * Release notes for the What's New modal (latest release, once per device)
 * and the Profile > What's new archive page (all releases).
 *
 * Newest release FIRST. Publishing a release = prepend an entry here and
 * commit; the changed `id` is what re-triggers the modal on every device.
 * `id` must be unique and stable (date-based slug by convention). `date`
 * is the release date as YYYY-MM-DD (rendered via formatReleaseDate).
 *
 * Copy is display-layer: say "LogChamp" in text. Identifiers/keys keep the
 * workoutdb- prefix (rename boundary - see AGENTS.md).
 *
 * NOTE: the entry below is DRAFT copy for the upcoming logging-ux-wave /
 * ui-nav-overhaul merge train. Seth finalizes wording + date at merge time.
 */
export const RELEASES = [
  {
    id: "2026-07-logging-analytics",
    date: "2026-07-05",
    title: "Analytics, logging, and a new look",
    tagline: "The biggest LogChamp update yet.",
    sections: [
      {
        heading: "Analytics",
        items: [
          "Weekly report on Home - your last 7 days vs the week before, right on login.",
          "Volume by muscle now has Bars, Trend, and Table views with weekly sparklines.",
          "Strength trends show per-session estimated-1RM sparklines for every exercise.",
          "Execution cards lead with the concrete comparison - planned vs what you did - plus a plain-language verdict.",
          "Muscle balance shows a shaded balanced zone so you can see push/pull drift at a glance.",
        ],
      },
      {
        heading: "Logging",
        items: [
          "Unilateral logging - exercises done one side at a time log as Left/Right pairs, and the right side picks up the left side's weight automatically.",
          "Every exercise now shows whether analytics is tracking it - and if it isn't, you can add it to your library with the muscles it works.",
        ],
      },
      {
        heading: "Navigation",
        items: [
          "Bottom tab bar on mobile - Home, Analytics, History, Library, and Profile within thumb reach.",
          "Profile is now a hub: your stats up top, Appearance / Security / Feedback tucked into sub-pages.",
          "Analytics is organized into Muscles, Strength, and Execution views you can deep-link to.",
        ],
      },
      {
        heading: "Look & feel",
        items: [
          "Five palettes - Champ, Iron, Chill, Forest, and Crimson - each with its own scene.",
          "Loading screens that breathe instead of blank screens that stall.",
        ],
      },
    ],
  },
];

export const LATEST_RELEASE = RELEASES[0] ?? null;

/** "2026-07-05" -> "July 5, 2026" (parsed as local time, not UTC). */
export function formatReleaseDate(date) {
  const d = new Date(`${date}T00:00:00`);
  if (Number.isNaN(d.getTime())) return String(date ?? "");
  return d.toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}
