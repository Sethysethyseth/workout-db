# TASK qol4: One confirm panel - finish without effort, discard from Home and the bar, browser dialogs out

STATUS: QUEUED
MODEL: auto
MODE: 1-relay

CONTEXT:
Three asks share one mechanism, an in-app confirm:
- **(a) Finish without effort.** Seth, Oct 8: "lets not force rpe rir to
  finish a workout for a block or log, just give a warning that not all
  rpe rirs are logged and allow them to exit". This reverses the Aug 1
  mandate (`docs/specs/quality-of-life-wave.md` ruling 3). The gate is
  client-only: `SessionDetailPage.jsx` ~3211-3217 (`effortMandateOk`,
  `canFinishWorkout`). The server already completes sessions with no
  effort.
- **(b) Discard from the live-workout entry points.** Seth, Sept 29, with
  his screenshot: discard from the Home "In progress" hero
  (`ActiveWorkoutHero.jsx`) and the floating bar
  (`PersistentWorkoutBar.jsx`), with a warning first.
- **(c) The three remaining `window.confirm` calls** in the logger
  (`SessionDetailPage.jsx` ~1671 L/R pair removal, ~2917 per-side
  set-count lowering, ~2962 bilateral set-count lowering).

Recon: `docs/tasks/qol-r1-...-FINDINGS.md` section C and
`docs/tasks/qol-r3-...-FINDINGS.md` sections A and D8. Design rules: spec
section 2.

FILES TO TOUCH:
- client/src/components/ConfirmPanel.jsx          (new)
- client/src/styles/confirm.css                   (new)
- client/src/pages/SessionDetailPage.jsx
- client/src/components/workout/ActiveWorkoutHero.jsx
- client/src/components/workout/PersistentWorkoutBar.jsx
- client/src/pages/DashboardPage.jsx               (discard result handling)
- client/src/styles/blocks/bk-log.css             (only to retire
                                                   `.session-finish-confirm`
                                                   rules this unit replaces)
Do NOT modify anything outside these files. Other callers of
`.session-discard-confirm` (builder, library, `BlockRunPage`) are out of
scope - leave them.

CHANGE:
1. **`ConfirmPanel`** props: `{ open, title, body, confirmLabel,
   cancelLabel, tone: "default" | "danger", busy, onConfirm, onCancel }`.
   - Renders as a bottom sheet over a scrim, portaled to `document.body`
     above the scene layer (AGENTS.md stacking note). It uses the existing
     sheet chrome look - no new sheet style.
   - Behavior: focus trap; Escape and the scrim cancel; focus starts on
     the CANCEL action when `tone="danger"`; focus returns to the trigger
     on close; `aria-modal`; buttons are at least 44px.
   - `busy` disables both buttons and shows the confirm label's progress
     state.
   - Motion: the sheet rises in ~200ms ease-out. Reduced motion means no
     travel.
   - Styles go in `confirm.css`, tokens only.
2. **Finish** (normal workouts AND block days, the same code path):
   - `canFinishWorkout` becomes `totalSetsLogged >= 1`. Effort no longer
     disables the button.
   - Remove the "Add RPE/RIR on N more set(s) to enable Finish workout"
     hint. Keep "Log at least one set anywhere to enable Finish workout."
   - On Finish, if `setsMissingEffort > 0` or `blockUnloggedPlanned > 0`,
     open `ConfirmPanel` (tone default) instead of completing. Copy below;
     use the session's signal name, RIR or RPE, and pluralize correctly.
   - **Effort missing only:**
     - title: "3 sets have no RIR" (singular: "1 set has no RIR")
     - body: "They'll still be saved, but they won't count toward effort
       stats like stimulating sets."
     - confirm: "Finish anyway"
     - cancel: "Add RIR". This closes the panel, scrolls to the first set
       missing effort, and turns on the existing `highlightMissingEffort`
       highlight.
   - **Planned sets unlogged only (block day):**
     - title: "2 of 12 planned sets not logged"
     - body: "Unlogged sets won't count toward this block day."
     - confirm: "Finish anyway"
     - cancel: "Keep logging"
   - **Both:**
     - title: "Finish with gaps?"
     - body: two short lines, one per gap, in the wording above
     - confirm: "Finish anyway"
     - cancel: "Keep logging"
   - Confirm completes exactly as today. Replace the old
     `.session-finish-confirm` panel with this one.
3. **Discard from Home and the bar.** Offer it ONLY under WD1's existing
   predicate: a live session that is not completed and has
   `reopenedAt == null` (`SessionDetailPage.jsx` ~2747, ~3330).
   - `ActiveWorkoutHero` gets a small icon button (x, aria-label "Discard
     workout") in its top-right corner, at least 44px, clearly separated
     from Resume.
   - `PersistentWorkoutBar` gets the same button, placed with at least 8px
     clear of Resume so a thumb can't hit the wrong one.
   - Both open `ConfirmPanel` with `tone="danger"`:
     - title: "Discard this workout?"
     - body: "Your 4 logged sets will be deleted. This can't be undone."
       (With 0 sets: "Nothing has been logged yet.")
     - confirm: "Discard workout"
     - cancel: "Keep workout"
   - Confirm calls the existing `sessionApi.discardSession(id)`
     (`POST /sessions/:id/discard`, race-safe, no server change).
   - On success, Home shows its existing "Workout discarded" flash and the
     hero returns to Start. From the bar on another page, navigate to `/`
     with that same flash.
   - On failure, the panel stays open with an inline error ("Couldn't
     discard. Check your connection and try again.").
4. **Browser dialogs.** Replace the three `window.confirm` calls in
   `SessionDetailPage.jsx` with `ConfirmPanel`, keeping each one's meaning
   and making the copy specific:
   - L/R pair removal: "Remove this left and right pair?" / "Remove pair"
     / "Keep".
   - Set-count lowering: "Remove the last 2 sets?" with the body naming
     that logged values in them will be deleted / "Remove sets" / "Keep".

   Each runs its original action only on confirm.
   `confirmLeaveLiveSession.js` and `HelloPage.jsx` are out of scope.

ACCEPTANCE CRITERIA (machine-checkable):
- Client `npm run build` clean. `npm run test:unit` green from `server/`.
- `node scripts/check-hex.mjs` passes.
- `grep -n "window.confirm" client/src/pages/SessionDetailPage.jsx` returns
  zero hits.
- `effortMandateOk` no longer gates `canFinishWorkout` (quote the new line).
- No server file changed.
- Real-app items for the reviewer:
  - a quick log with 3 sets, 1 with RIR, then Finish -> "2 sets have no
    RIR"; "Add RIR" scrolls and highlights; "Finish anyway" completes
  - a block day with unlogged planned sets AND missing effort -> "Finish
    with gaps?"
  - the Home hero's x -> "Discard workout" -> the hero returns to Start
    with "Workout discarded"
  - a REOPENED session shows no x on the hero or the bar
  - lowering the set count shows the in-app panel, not a browser dialog

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
