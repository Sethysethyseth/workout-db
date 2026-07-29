# TASK E2: effort-logging nudge + why-RIR education at the point of edit

STATUS: QUEUED
MODEL: auto
MODE: 1-relay

CONTEXT:
Second and final unit of the E-wave. E1 makes effort capture default ON for NEW
templates and quick logs, but templates saved before that keep their stored
`useRIR: false` - and E1 is deliberately forbidden from silently rewriting them.
This unit closes that gap the honest way: wherever the RIR/RPE toggles are shown
with BOTH off, explain in plain language what is switched off and why it matters,
so the user chooses. It also absorbs the wave's user-education requirement -
education lands in the logging/editing flow, not a docs page.

Note the analytics side already nudges independently and this must NOT duplicate
it: `client/src/components/analytics/WeeklyReport.jsx:164-165` already surfaces a
note below 60% effort coverage, and `meta.effortCoverage` already drives a
coverage meter on the analytics page. This unit is the point-of-EDIT nudge only.

FILES TO TOUCH:
- client/src/components/templates/RirRpeToggleRow.jsx  (the nudge copy)
- client/src/index.css                                 (any new token-based style)
Do NOT modify anything outside these files.

CHANGE:

`RirRpeToggleRow.jsx` already renders a persistent definition hint in both of its
variants (`RirRpeToggleRow.jsx:40-43` for `variant="compact"`, `:71-74` for the
default `prefs` variant): the "RIR - Reps in Reserve" / "RPE - Rating of Perceived
Exertion" lines. Keep those exactly as they are, in both variants.

ADD a nudge that renders **only when `useRIR` and `useRPE` are BOTH falsy** -
i.e. no effort signal is being captured at all. If EITHER is on, effort is being
captured and the nudge must not appear (RPE-only is fine: `server/src/analytics/
effort.js` pools it into RIR via `RIR = 10 - RPE`).

Because the component owns both flags, drive this off its existing props - do NOT
add a new prop and do NOT change any call site. The nudge must appear in BOTH
variants, so it shows up wherever the toggles already do: `CreateTemplatePage`,
`EditTemplatePage` (`EditTemplatePage.jsx:197-204`), and the quick-log panel in
`SessionDetailPage`.

Use this copy VERBATIM - two lines, in this order. The copy is the spec here;
do not paraphrase, reword, or add to it:

Line 1: `Effort logging off - volume still tracks, but effort-based analytics stay locked.`

Line 2: `Two sets of 10 can be worlds apart: one taken to the limit, one with five reps left. RIR is how LogChamp tells them apart.`

Presentation contract:
- Visually quieter than the toggles themselves and consistent with the existing
  `muted small` hint treatment already used at `RirRpeToggleRow.jsx:40` and
  `:71` - this is a nudge, not an alert. No warning colors, no icon, no banner,
  nothing dismissible, no layout shift that pushes the toggles off screen.
- **Tokens-only.** Any color you need goes through an existing CSS custom
  property in `client/src/index.css`, or a new one defined there. Never a raw
  hex, `rgb()`, or `hsl()` in a component file - `scripts/check-hex.mjs` gates
  this and is an acceptance criterion below.
- It must render correctly in all 4 palettes x 2 modes. Deriving from existing
  muted/border tokens is the way to get that for free; do not hand-pick per
  palette.

Explicitly OUT of scope:
- No changes to `server/`, no schema change, no migration.
- Do NOT write to any template, do NOT auto-enable anything, do NOT persist
  anything new. This unit only renders copy; the user still flips the toggle.
- Do NOT touch the analytics-side coverage notes or `WeeklyReport.jsx`.
- Do NOT add a dismiss/remember mechanism (that would need new persisted state).

ACCEPTANCE CRITERIA (machine-checkable):
- `npm run test:unit` green from `server/` (no server changes expected).
- `npm run build` from `client/` compiles with no errors.
- `node scripts/check-hex.mjs` exits 0 (no raw colors added outside
  `client/src/index.css`).
- `git diff --stat` shows exactly the two files listed above.
- `useRIR: false, useRPE: false` -> both copy lines render, verbatim as given.
- `useRIR: true, useRPE: false` -> neither line renders.
- `useRIR: false, useRPE: true` -> neither line renders (RPE alone is a valid
  effort signal).
- `useRIR: true, useRPE: true` -> neither line renders.
- Both variants covered: the nudge appears with `variant="compact"` AND with the
  default `variant="prefs"`, under the both-off condition.
- The pre-existing "RIR - Reps in Reserve" / "RPE - Rating of Perceived
  Exertion" definition lines still render in both variants, in both the
  nudge-showing and nudge-hidden states.
- An existing template saved with `useRIR: false` opened in EditTemplatePage
  shows the nudge; toggling RIR on makes it disappear without a reload.

STOP CONDITION (standing footer - keep verbatim in every block):
Stop when the acceptance criteria are met. If a criterion cannot be met,
stop and explain why instead of guessing.
- Before stopping, run every lane this block allows and write the delivery
  report to DELIVERY.md at the repo root (files touched; verbatim test
  output; each acceptance criterion with the evidence that proved it; any
  deviations from this block, with reasons). Do not commit it.
- Do NOT commit, push, or touch git in any way - leave the working tree
  for review.
- Do NOT edit docs/HANDOFF.md, AGENTS.md, CLAUDE.md, this task file, or
  anything under docs/tasks/ - state is the reviewer's job.
- Do NOT add dependencies or refactor unrelated code.
- Do NOT start another task file when done - end your turn.
