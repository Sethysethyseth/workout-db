# TASK T3: dynamic loading screens - the animated/visual layer

STATUS: QUEUED
MODEL: fable
MODE: 1-relay

CONTEXT:
U5 plan item T3 (see `docs/HANDOFF.md` "U5 - UI overhaul": T1 tokens -> T2
palettes -> T3 dynamic loading screens -> T4 motion; T3 is next). The app
runs on free-tier servers (Render) that cold-start slowly (staging ~50s) -
see `WORKOUTDB_MASTER_PROMPT_17.md` section "Motion / loading" for the
product spec this implements.

The TIMING skeleton is already built and reviewed - do not redesign it:
`client/src/components/LoadingState.jsx` has a `useDelayedReveal` hook that
(a) only shows anything after a 400ms delay, so fast/cached loads never
flash a loader, and (b) swaps the displayed text to an optional `slowLabel`
prop after ~4s more, for the honest "still waking up" case. Every call site
across the app already renders through this ONE shared component - your job
is to make what it renders look nice and satisfying, not to change when or
why it renders.

FILES TO TOUCH:
- client/src/components/LoadingState.jsx   (JSX markup INSIDE the existing
  `tone === "page"` and default/"soft" branches only - add wrapper elements,
  an animated icon/mark, etc. Do NOT touch `useDelayedReveal`, the
  `SHOW_DELAY_MS`/`SLOW_DELAY_MS` constants, the component's props, or the
  `tone === "card"` branch.)
- client/src/index.css   (the `.loading-state`, `.loading-state__text`,
  `.loading-page`, `.loading-page__text` rules + whatever new classes/
  `@keyframes` you add for them)
- client/src/pages/StartLogWorkoutPage.jsx
- client/src/components/programs/CommunityProgramsSection.jsx
- client/src/pages/SessionsPage.jsx
- client/src/pages/SessionDetailPage.jsx
- client/src/pages/EditTemplatePage.jsx
- client/src/pages/DevFeedbackPage.jsx
- client/src/pages/MyTemplatesPage.jsx
- client/src/pages/AnalyticsPage.jsx
- client/src/pages/EditBlockTemplatePage.jsx
(in the 9 page/component files above: ONLY add the `slowLabel` prop to the
existing `<LoadingState ... />` call - no other change in those files.)
Do NOT modify anything outside these files. Do NOT touch
`client/src/components/ProtectedRoute.jsx` - its cold-start `tone="page"`
call already has `slowLabel="Waking up the server…"` wired.

CHANGE:

### 1. Animate the two tones LoadingState renders
Two distinct moments, both already token-driven (no hex, all 4 palettes x
2 modes must read correctly - light/dark x champ/iron/chill/forest/crimson):

- **`tone="soft"`** (`.loading-state`, ~9 call sites - a compact inline card
  shown while a page's data is fetching): add a small, subtle animated
  element next to the text - e.g. a pulsing dot trio, a soft shimmer sweep,
  or a thin animated underline. Keep it restrained per the project's
  anti-goal on "over-built motion" (`AGENTS.md`) - this is a waiting
  indicator, not a hero moment. Derive any accent color from
  `--color-interactive` (the existing accent-adjacent-state pattern used
  for rings/nav-active/pills elsewhere in `index.css` - grep
  `color-mix(in srgb, var(--color-interactive)` for examples), never a
  hardcoded color.
- **`tone="page"`** (`.loading-page`, the cold-start moment on first app
  load / any full-tab wait): a bigger but still tasteful treatment - this
  is the screen a user watching a slow Render cold-start actually sits on,
  so it should feel alive rather than frozen, but must not look like a
  spinner-heavy loading-screen cliche. Your call on the concrete visual
  (breathing accent mark, animated ring, etc.) within these constraints.
  When the text swaps from `label` to `slowLabel` (the 4s escalation),
  cross-fade it (use the existing `--motion-base`/`--ease-standard` tokens
  for the fade) rather than an abrupt text swap/layout jump.
- Looping animations need their own duration/easing (the existing
  `--motion-fast`/`--motion-base`/`--motion-slow` tokens are one-shot
  transition durations, not loop periods) - pick something in the
  0.8-1.6s per-cycle range so it reads as calm, not busy.

### 2. Wire the honest cold-start copy through the rest of the app
In each of the 9 files listed under FILES TO TOUCH, add
`slowLabel="Waking up the server…"` (exact string, matches
`ProtectedRoute.jsx`'s existing copy) to the existing `<LoadingState .../>`
call, alongside whatever `label`/`tone` prop it already passes. Do not
change any other prop or any surrounding logic in these files.

ACCEPTANCE CRITERIA (machine-checkable):
- `npm run build` from `client/` compiles with no errors.
- `LoadingState.jsx`'s exported function signature
  (`{ label, slowLabel, tone, delayed }`) and the `useDelayedReveal` hook
  body are byte-identical to before your change - only JSX inside the
  render branches differs.
- `grep -rn "slowLabel=\"Waking up the server…\"" client/src` matches
  exactly 10 files: the 9 listed above plus the existing
  `ProtectedRoute.jsx`.
- No hex colors (`#[0-9a-fA-F]{3,8}`) introduced in any touched CSS.
- No new npm dependencies (check `client/package.json` is unchanged).
- Every new `@keyframes` / animated rule works in BOTH `html[data-theme="dark"]`
  and light (default) - if a rule needs a dark-specific override, follow the
  existing `.loading-state` / `html[data-theme="dark"] .loading-state`
  pairing pattern already in the file.

STOP CONDITION (standing footer - keep verbatim in every block):
Stop when the acceptance criteria are met. If a criterion cannot be met,
stop and explain why instead of guessing.
- Do NOT commit, push, or touch git in any way - leave the working tree
  for review.
- Do NOT edit docs/HANDOFF.md, AGENTS.md, CLAUDE.md, this task file, or
  anything under docs/tasks/ - state is the reviewer's job.
- Do NOT add dependencies or refactor unrelated code.
- Do NOT start another task file when done - end your turn.
