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
 * workoutdb- prefix (rename boundary - see AGENTS.md). Keep copy
 * non-technical - user-facing outcomes, no internal metric names.
 * Plain language only: what changed for the person using the app.
 *
 * Shape:
 * - `sections: [{ heading, items }]` is the concise layer. Five bullets
 *   or fewer across the whole release (count every item, not every
 *   heading). The modal and the first view of a release show only this.
 * - `details` is optional:
 *   `[{ heading, body: string[], where?: string }]`. `body` holds short
 *   paragraphs. `where` is a plain tap path such as "Profile, then
 *   Training". Releases without `details` render exactly as the concise
 *   layer alone.
 *
 * The modal + archive page are PROD-ONLY (gated via isProdEnv); publishing
 * a release still just means prepend an entry here and merge to main.
 * Staging can preview the page and the Profile card with ?preview=1
 * (see isWhatsNewPreview). The modal has no preview path.
 */
export const RELEASES = [
  {
    id: "2026-10-quality-of-life",
    date: "2026-10-09",
    title: "Logging setup, rest, and a coach page",
    tagline: "Set up logging once, rest between sets, and pick up old chats.",
    sections: [
      {
        heading: "Logging",
        items: [
          "Units, effort, notes, repeat last time, and the rest timer now live under Training. A strip on Home shows your setup.",
          "With Repeat last time's numbers on, empty sets show your last weight and reps. Tap the set number to log them.",
          "A rest timer starts when you log a set. Add or take away 15 seconds, or skip it.",
        ],
      },
      {
        heading: "Finishing",
        items: [
          "You can finish when some sets have no effort, after a short warning. Discard a mistaken workout from Home.",
        ],
      },
      {
        heading: "Coach",
        items: [
          "The coach has its own page, including how-to help with AI access off. Chats are saved under Library, then Coach.",
        ],
      },
    ],
    details: [
      {
        heading: "Logging setup in one place",
        body: [
          "Weight unit, effort scale, exercise notes, and set notes moved out of the workout screen. Open them from the strip under Start a workout, or from Profile, then Training. The strip shows lbs or kg, RIR or RPE, and whether notes are on.",
        ],
        where: "Home, the strip under Start a workout, or Profile, then Training",
      },
      {
        heading: "Repeat last time's numbers",
        body: [
          "Turn this on under Training. Every empty set shows what you lifted last time, in grey. Tap the set number to log those numbers, or type your own. Effort is never filled in, and nothing is saved until you log it. On a block day the plan still comes first. Last time only fills a weight the plan left blank.",
        ],
        where: "Profile, then Training, then Repeat last time's numbers",
      },
      {
        heading: "Rest timer",
        body: [
          "After you log a set, a timer sits just above Finish workout. The default is two minutes. Change it under Training, Duration. A block's own rest time wins for that exercise. Use -15s, +15s, or Skip. It keeps counting if you leave and come back, and phones that support it give a short buzz when rest is over.",
        ],
        where: "Any live workout, just above Finish workout",
      },
      {
        heading: "More room while you log",
        body: [
          "Only the exercise name stays pinned while you scroll a workout, and once you log a set the Finish button drops its instructions, so your sets get more of the screen. Remove an exercise from the ... next to its name. Add RIR takes you to the first set that needs it and highlights each one. With Repeat last time's numbers on, the set number you can tap is outlined.",
        ],
        where: "Any live workout",
      },
      {
        heading: "Finish with effort missing",
        body: [
          "Finish workout no longer stops you when a logged set has no RIR or RPE. You get a short warning that those sets will not count toward effort stats, then Finish anyway or go back and add them. The warning names how many sets are missing.",
        ],
        where: "Finish workout, on a live workout",
      },
      {
        heading: "Discard from Home",
        body: [
          "The x on a live workout still throws it away. You can also discard from the In progress card on Home, or from the In progress bar, after a confirm. A notice on Home tells you it's gone. Those confirms now appear inside the app.",
        ],
        where: "Home, the x on the In progress card",
      },
      {
        heading: "A page for the coach",
        body: [
          "Open the coach from the chat bubble at the top of Home, labeled Ask the coach, or from Profile, then Coach. You can ask how to use LogChamp even with AI access off. In that case the coach sees only your question, never your training. With AI access on, ask about your training there too. The first answer shows progress while it thinks.",
        ],
        where: "Home, Ask the coach, or Profile, then Coach",
      },
      {
        heading: "Saved coach conversations",
        body: [
          "Coach conversations are saved to your account. Library has a Coach tab. Open one to pick up where you left off. Delete removes one conversation. Delete all conversations clears the list.",
        ],
        where: "Library, then Coach",
      },
      {
        heading: "Move exercises in the builder",
        body: [
          "In the block builder, press and hold an exercise, then drag it to a new spot in the day. While you move it, the day shrinks to one line per exercise so the list is easier to scan.",
        ],
        where: "Library, then Blocks, then edit a block",
      },
      {
        heading: "Edit exercises you created",
        body: [
          "Library, then Exercises, then tap an exercise you added. Edit exercise lets you rename it or change which muscles it works, then Save changes. Past workouts pick up the new name.",
        ],
        where: "Library, then Exercises, then tap an exercise",
      },
      {
        heading: "A clearer block builder",
        body: [
          "Long block names sit on their own line. Per side shows on the card for one-sided lifts. For any other lift, open Reps / Time and turn on Per side (left and right). Before you type in Add exercise, Recent lists lifts you logged lately.",
        ],
        where: "Library, then Blocks, then edit a block",
      },
      {
        heading: "Importing a long history",
        body: [
          "Turning workout history into a block no longer fails when you have more than seven different workouts. LogChamp keeps your seven most-logged and names the ones it skipped. A very large paste gets a clear message that it is too large, and asks you to send less.",
        ],
        where: "Library, then Import",
      },
      {
        heading: "Your own coach key",
        body: [
          "If you use your own Anthropic key for the coach, LogChamp now saves it encrypted on our server, so you only enter it once. You'll see its last four characters, and Remove key takes it away any time.",
        ],
        where: "Profile, then AI access",
      },
      {
        heading: "Easier release notes",
        body: [
          "Each update leads with a short summary. See the details opens the full guide to what changed and where to find it. Profile also has a card for the latest update, with See what's new.",
        ],
        where: "Profile, the latest update card",
      },
      {
        heading: "Smoother on a phone",
        body: [
          "The In progress bar fits on a phone and just says Resume. Logging setup fits on one screen, and switches that are off are easy to see. The coach page scrolls as one, and new answers come into view on their own. Deleting a saved conversation is one tap, with a confirm. The Strength view on Analytics no longer slides sideways, and saving your own key on AI access works on a small screen.",
        ],
        where: "Home, Analytics, the coach page, and Profile, then AI access",
      },
      {
        heading: "Clearer colors and counts",
        body: [
          "On the Crimson palette, good results show in green. On a computer, the In progress bar lines up with the page. Execution shows whole numbers, such as 3 x 8.",
        ],
        where: "Analytics, then Execution, or Profile, then Appearance, then Crimson",
      },
    ],
  },
  {
    id: "2026-10-blocks-and-coach",
    date: "2026-10-07",
    title: "Training blocks, and a coach",
    tagline: "Build a multi-week plan, log it day by day, and ask about your numbers.",
    sections: [
      {
        heading: "Blocks",
        items: [
          "Build a block of weeks and days, with sets, reps, weight, rest, and effort. Start it from Library and log one day at a time.",
          "On a block day the plan shows as grey hints. Tap the set number to log that set as planned.",
          "Starting a different block pauses the one you are on. Resume or Start over from Library. End block finishes the run.",
        ],
      },
      {
        heading: "Coach and library",
        items: [
          "Ask about your numbers on Analytics, or debrief a finished workout. The coach stays on training and has a weekly limit.",
          "Import a spreadsheet, a file, or old-app history, or have the coach draft a block. Library leads with your blocks.",
        ],
      },
    ],
    details: [
      {
        heading: "Build a training block",
        body: [
          "A block is weeks of planned workouts. From Library, tap New block, then add weeks, days, and exercises. Each exercise can set reps, weight, rest, timed sets, and an effort target. Save it to your library when you are ready.",
        ],
        where: "Library, then Blocks, then New block",
      },
      {
        heading: "Run, pause, or end a block",
        body: [
          "Start a block from its Library card. Home shows the running block under Start a workout. Starting a different block pauses the one you are on, and you can pick it up later. A paused block shows Paused. Resume continues where you left off. Start over begins at the first day. End block, under Block options, ends the run.",
        ],
        where: "Library, then Blocks",
      },
      {
        heading: "Log a block day",
        body: [
          "Open the day and log it like any workout. Each planned set is its own row, with the plan shown as grey hints. Tap the set number to log that set as planned. The header shows the block name and which week you are on.",
        ],
        where: "Home, the running block, then the day",
      },
      {
        heading: "Import a block",
        body: [
          "Library, then Import. Paste a spreadsheet, choose a file, bring in an Old app export, or paste a plan written in sentences under Any AI. If the file will not import, Have AI fix this file can try again. You can also turn recent workout history into a block you can edit.",
        ],
        where: "Library, then Import",
      },
      {
        heading: "Draft a block with the coach",
        body: [
          "In the block builder, Draft with the coach writes a block from a description you give it. Review the draft, then save it to your library when it looks right.",
        ],
        where: "Library, then Blocks, then New block, then Draft with the coach",
      },
      {
        heading: "Ask about your numbers",
        body: [
          "On Analytics, Ask about these numbers explains the window you are looking at. On a finished workout, Debrief this workout walks through what you did. The coach stays on training. You get seven questions a week, and the coach says how many are left.",
        ],
        where: "Analytics, Ask about these numbers, or a finished workout, Debrief this workout",
      },
      {
        heading: "Your own color palette",
        body: [
          "Under Appearance, Accent color, you can describe a look in your own words. The whole app takes it on: surfaces, accent, and the scene. This needs AI access on.",
        ],
        where: "Profile, then Appearance",
      },
      {
        heading: "Library leads with your blocks",
        body: [
          "Library opens on your blocks. New block and Import sit at the top. A running block is first, and a paused one shows Paused with Resume. Yours and Community are still there, with Workouts and Exercises beside Blocks.",
        ],
        where: "Library",
      },
      {
        heading: "Add an exercise to your library",
        body: [
          "If a lift is not in the catalog, search for it in the block builder or while logging, then Add to your library. Name it, pick at least one Main muscle, then Add exercise. It shows up under Library, then Exercises.",
        ],
        where: "Block builder search, then Add to your library",
      },
      {
        heading: "Reorder days and weeks",
        body: [
          "In the block builder, press and hold a day or a week, then drag it into a new order.",
        ],
        where: "Library, then Blocks, then edit a block",
      },
      {
        heading: "Log left and right",
        body: [
          "On an exercise card in the builder, Per side marks the lift as one side at a time, so you log left and right.",
        ],
        where: "Block builder, exercise card, Per side",
      },
      {
        heading: "Discard a mistaken workout",
        body: [
          "The x at the top of a live workout throws it away. Use it when you started by mistake. Finished workouts stay in History.",
        ],
        where: "The x at the top of a live workout",
      },
    ],
  },
  {
    id: "2026-08-ai-assistant",
    date: "2026-08-05",
    title: "Ask your AI assistant about your training",
    sections: [
      {
        heading: "AI access",
        items: [
          "You can now connect LogChamp to Claude and ask about your own training - what's moving, what's stalled, how hard you've actually been working. Only your computed summary is shared, never your individual sets, and it stays off until you turn it on. Find it under Profile, then AI access.",
        ],
      },
    ],
  },
  {
    id: "2026-07-exercises-tab",
    date: "2026-07-10",
    title: "Every exercise, in one place",
    tagline: "Look up any lift and see how it's really going.",
    sections: [
      {
        heading: "New Exercises tab",
        items: [
          "Search any exercise you've logged and open its own page.",
          "Working-weight targets for any rep goal - what to load for a heavy triple, a set of eight, and everything between.",
          "Your best sets, week-by-week volume, and how your strength is trending, together in one view.",
        ],
      },
      {
        heading: "Sharper analytics",
        items: [
          "Strength now leads with your progress on each lift's top set, session over session.",
          "Volume by muscle reads at a glance with a new color-graded heatmap.",
          "Your headline numbers highlight what actually moved - your biggest set and your biggest gain.",
        ],
      },
    ],
  },
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
