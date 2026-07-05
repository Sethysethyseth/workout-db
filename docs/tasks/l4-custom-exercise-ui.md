# TASK L4: "Add to library" flow - custom exercise creation UI

STATUS: QUEUED
MODEL: sonnet
MODE: 1-relay

CONTEXT:
Final unit of the L-wave (dispatch AFTER L3 lands and its migration is
applied to staging - this UI calls L3's endpoints). When L2's indicator
says an exercise isn't tracked, the user currently hits a dead end. This
unit turns the untracked state into an invitation: a friendly two-step
sheet where they name the movement and tap which muscles it hits and how
hard, then the indicator flips to tracked. This flow must feel effortless
- it is the difference between "my custom movements are invisible to
analytics" and "everything I log counts".

FILES TO TOUCH:
- client/src/api/exerciseApi.js                       (add getMuscles, createCustomExercise)
- client/src/components/workout/AddExerciseToLibrarySheet.jsx  (NEW)
- client/src/pages/SessionDetailPage.jsx              (entry point on the untracked indicator)
- client/src/index.css                                (sheet styles)
Do NOT modify anything outside these files. No new dependencies - the
sheet is a hand-rolled portal like the existing `MetricInfoButton`
popover (copy its portal + stacking approach: portals render OUTSIDE
#root, so the scene-layer z-index fix does not cover them - that pattern
already handles it; verify against `metric-info-*`).

CHANGE:

1. **Entry point**: in a LIVE session, the untracked indicator becomes a
   button opening the sheet prefilled with the exercise's current name.
   NOTE (updated after L2B): the indicator is now a labeled pill
   (`session-exercise-tracked-pill--unresolved`, text "Not tracked",
   rendered inside `ExerciseTrackedIndicator`) - turn THAT pill into the
   button (label becomes "Not tracked - add?", keep the dashed treatment,
   add a small "+"; title "Not tracked - add to library?"). All markup
   stays inside `ExerciseTrackedIndicator` per L2B's compatibility note.
   Completed sessions keep the passive pill (no entry point v1).

2. **The sheet** (`AddExerciseToLibrarySheet`): portal overlay + centered
   card (mobile: bottom-sheet feel, full-width, `max-height` +
   `overflow-y: auto`; desktop: centered modal ~28rem). Dismiss via X
   button, backdrop click, and Escape. Focus the name input on open.
   Structure, top to bottom:
   - Title: "Add to your library". One line of muted copy: "Tell us what
     it works and your analytics will count it."
   - Name input (prefilled, editable).
   - Muscle picker: the 17 muscles from `GET /api/exercises/muscles`,
     rendered as tap chips in three labeled groups (client-side grouping
     constant, display-only): Upper body (chest, shoulders, triceps,
     biceps, forearms, lats, middle back, traps, neck), Core (abdominals,
     lower back), Lower body (quadriceps, hamstrings, glutes, calves,
     abductors, adductors). Tap cycles each chip: off -> "Main" ->
     "Assists" -> off. Main = filled chip (nav-active/color-mix off
     `--color-interactive`, like `range-chip.is-active`), Assists =
     outlined chip with a lighter mix, off = default chip. Each state
     visibly distinct in all palettes x modes - tokens only.
   - A live plain-language summary line under the picker, e.g.
     "Mostly quadriceps and glutes - assists hamstrings" (Main muscles
     joined, then Assists; empty -> "Tap the muscles this movement
     works.").
   - Footer: primary "Add exercise" (disabled until name nonblank AND at
     least one Main muscle - mirrors L3's validation so the server 400s
     are the fallback, not the UX), secondary "Cancel".
3. **Submit**: `createCustomExercise({ name, muscles })` mapping Main ->
   "primary", Assists -> "secondary". On success: close the sheet,
   invalidate the L2 resolve cache for that name, re-resolve so the
   indicator flips to tracked without a reload. On 400/409-style errors
   surface the server message inline in the sheet (ErrorMessage pattern),
   keep state so nothing the user tapped is lost. While submitting:
   button disabled + "Adding...".

4. **Already-tracked guard**: if the (edited) name resolves while the
   sheet is open (user typed a catalog name), show a gentle inline note
   "Already tracked as <canonicalName>" and disable submit - matches the
   server rejection, caught before the round trip.

ACCEPTANCE CRITERIA (machine-checkable):
- Client `npm run build` green; `npm run test:unit` from server/ still
  green (nothing server-side should change).
- Manual contract (reviewer verifies in dev against staging API with L3
  applied): gibberish name -> hollow indicator -> tap -> sheet opens
  prefilled -> tap chest to Main, triceps to Assists -> summary line
  reads correctly -> Add -> sheet closes and the indicator flips to
  tracked WITHOUT a page reload; reopening a session after reload still
  shows tracked (server round trip, not client illusion); Escape and
  backdrop both dismiss; submit stays disabled with zero Main muscles.
- The sheet renders above the scene layer and the bottom tab bar on
  mobile viewports (portal stacking verified like metric-info popovers).
- `grep -n "hex\|#[0-9a-fA-F]\{3,6\}" ` on the new CSS block -> tokens
  only, no new hex.
- `client/package.json` byte-identical.

STOP CONDITION (standing footer - keep verbatim in every block):
Stop when the acceptance criteria are met. If a criterion cannot be met,
stop and explain why instead of guessing.
- Do NOT commit, push, or touch git in any way - leave the working tree
  for review.
- Do NOT edit docs/HANDOFF.md, AGENTS.md, CLAUDE.md, this task file, or
  anything under docs/tasks/ - state is the reviewer's job.
- Do NOT add dependencies or refactor unrelated code.
- Do NOT start another task file when done - end your turn.
