# TASK L6: Logging focus interruptions - draft promotion, resync echo, pill reflow

STATUS: QUEUED
MODEL: sonnet
MODE: 1-relay

CONTEXT:
Seth's smoke report, July 5: (a) while the app is resolving whether an
exercise is tracked, a tap into the Weight/Reps inputs can be
interrupted; (b) the same interruption sometimes happens when moving from
the Weight field to the Reps field. Root-caused by Fable to three
independent mechanisms in the live-logging flow - all three are fixed by
this unit. These are surgical fixes to existing code paths; do not
restructure the components.

ROOT CAUSES (read before coding):

1. **Draft-row unmount mid-interaction (the weight->reps case).** When an
   exercise has 0 sets, the sets area renders one draft `SessionSetRow`
   (SessionDetailPage.jsx ~line 1265). Typing a weight and tapping Reps
   blurs the weight field, which fires `tryPromote` -> POST. When the
   POST resolves, `sets.length` flips 0 -> 1 and the ternary swaps
   branches: the draft row UNMOUNTS and a new keyed row mounts. The reps
   input the user is now typing in is destroyed - focus lost, keyboard
   closed. Data survives (the in-flight-keystroke patch at ~line 611);
   the interaction does not. Timing-dependent, hence "sometimes".

2. **Server-echo resync in the blur gap (real rows).** The resync effect
   (~line 574) skips while the row contains `document.activeElement`, but
   between blurring Weight and focusing Reps there is a moment where
   activeElement is `body`. If the PATCH response lands in that gap, the
   effect calls `setDraft(next)` even though `next` is just the server
   echoing exactly what was flushed - a pointless re-render at the worst
   possible moment.

3. **Tracked-pill reflow under the finger.** `ExerciseTrackedIndicator`
   renders `null` until the async resolve lands, then a pill appears on
   the heading line (and at narrow widths can re-wrap the heading),
   shifting the Weight/Reps inputs below it mid-tap. Status can also
   later swap between labels of different widths ("Tracked" vs "Not
   tracked").

FILES TO TOUCH:
- client/src/pages/SessionDetailPage.jsx
- client/src/index.css
Do NOT modify anything else. No server changes, no new components, no
new files.

CHANGE:

1. **Focus handoff on draft promotion** (fix for root cause 1), inside
   `tryPromote` in `SessionSetRow`:
   - Field ids are already deterministic: draft fields are
     `log-draft-${sessionExerciseId}-<field>` and real-row fields are
     `log-set-${set.id}-<field>` (see `fieldIds`, ~line 531).
   - After `await onPromoteDraft(cur)` returns a `created` row with an
     id: check `document.activeElement?.id`. If it starts with
     `log-draft-${sessionExerciseId}-`, take the field suffix and hand
     focus to `log-set-${created.id}-<suffix>`.
   - The new row has not committed to the DOM yet when the await
     returns. Attempt the handoff in a `requestAnimationFrame`; if the
     element is not there yet, retry once on the next frame; then give
     up silently. Never throw, never loop indefinitely.
   - Do the handoff check AFTER the await (focus at completion time is
     what matters - at promotion start the user may be mid-tap with
     nothing focused).
   - Do not touch the existing in-flight-keystroke patch logic (~lines
     611-625); it already preserves the data.

2. **No-op resync suppression** (fix for root cause 2), in the resync
   effect (~line 574): after building `next`, compute
   `payloadKey(payloadFromDraft(next))` and compare it against
   `payloadKey(payloadFromDraft(draftRef.current))`. If equal, set
   `lastSentKeyRef.current` to that key and return WITHOUT calling
   `setDraft` - the server is echoing what the row already holds, so
   there is nothing to sync and no reason to re-render. Keep the
   existing focused-row guard after this check, unchanged, for the
   genuinely-different-values case.

3. **Layout-stable tracked pill** (fix for root cause 3):
   - `ExerciseTrackedIndicator` always renders a wrapper element
     `<span className="session-exercise-tracked-slot">` - including when
     `status` is null - so the heading occupies its final layout from
     first render and the resolve landing never reflows it.
   - Inside the slot, stack two children on the same grid cell
     (`display: inline-grid`, both children `grid-area: 1 / 1`):
     (a) an invisible SIZER: the widest state's pill markup ("Not
         tracked" + its 12px svg), `visibility: hidden`, `aria-hidden`,
         no title attribute - it exists only to lock the slot's width
         and height across all states;
     (b) the real pill for the current status (exact markup and classes
         as today: `session-exercise-tracked-pill--resolved` /
         `--unresolved`), `justify-self: start`; when status is null,
         render no visible pill (sizer only).
   - Move the existing `margin-left: 8px` from
     `.session-exercise-tracked-pill` to the slot so spacing is
     identical in all states.
   - CSS: structural properties only (display, grid-area, visibility,
     justify-self, margin). NO new colors, no hex - the pill's existing
     token-based rules are untouched.
   - Net effect: null -> "Not tracked" -> "Tracked" transitions change
     pixels inside a fixed-size slot; nothing below or beside it moves.

4. **Reps decimal-step fix** (pre-existing Open TODO folded in - same
   inputs): the Reps `<input type="number">` in `SessionSetRow`
   (~line 875) has `step="0.01"` copied from the Weight field. Change to
   `step="1"` on the REPS input only. Weight keeps `step="0.01"`
   (fractional plates are real). Do not change `inputMode` or any other
   attribute on either field.

ACCEPTANCE CRITERIA (machine-checkable):
- `npm run build` green from client/.
- `grep -n "session-exercise-tracked-slot" client/src/index.css
  client/src/pages/SessionDetailPage.jsx` hits both files.
- `grep -c 'step="0.01"' client/src/pages/SessionDetailPage.jsx` -> 1
  (weight only; was 2).
- `grep -n "log-set-" client/src/pages/SessionDetailPage.jsx` shows the
  focus-handoff construction inside `tryPromote`.
- No new hex colors anywhere in the diff; no new dependencies;
  `client/package.json` byte-identical.
- `git status` shows only the two specced files changed.
- Manual verification notes for the reviewer (do not automate): with
  DevTools network throttled to Slow 3G on a fresh 0-set exercise, type
  a weight, immediately click into Reps, keep typing - focus must land
  in (or be handed to) the reps field of the promoted row and keystrokes
  must persist. Rename an exercise, immediately click Weight - the pill
  appearing must not move the inputs.

STOP CONDITION (standing footer - keep verbatim in every block):
Stop when the acceptance criteria are met. If a criterion cannot be met,
stop and explain why instead of guessing.
- Do NOT commit, push, or touch git in any way - leave the working tree
  for review.
- Do NOT edit docs/HANDOFF.md, AGENTS.md, CLAUDE.md, this task file, or
  anything under docs/tasks/ - state is the reviewer's job.
- Do NOT add dependencies or refactor unrelated code.
- Do NOT start another task file when done - end your turn.
