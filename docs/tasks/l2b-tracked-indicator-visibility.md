# TASK L2B: Tracked indicator visibility - labeled status pills

STATUS: QUEUED
MODEL: sonnet
MODE: 1-relay

CONTEXT:
Follow-up to L2 from Seth's staging smoke: the tracked/untracked indicator
is a bare 14px glyph tucked inside the muted "· N sets" meta text and is
too easy to miss - Seth looked straight at a session and couldn't tell the
feature existed. Both states must become obvious at a glance: "Tracked"
(analytics counts this) and "Not tracked" (not in the library). Design
direction below is Fable-authored and deliberate - implement it as
specified rather than improvising. No server changes; resolution wiring,
cache, and statuses are already in place from L2 - this unit ONLY changes
how the status renders.

FILES TO TOUCH:
- client/src/pages/SessionDetailPage.jsx   (ExerciseTrackedIndicator + its
                                            placement in headingInner)
- client/src/index.css                     (replace the
                                            session-exercise-tracked-badge
                                            rules with pill rules)
Do NOT modify anything outside these files. Do not touch the resolution
cache, `lookupExerciseTrackedStatus`, `trackedStatusByExerciseId`, or
anything server-side.

CHANGE:

1. **Placement** (SessionDetailPage `headingInner`, ~line 1103): move
   `<ExerciseTrackedIndicator status={trackedStatus} />` OUT of the
   `session-exercise-heading-meta muted` span (it currently inherits muted
   styling and reads as part of the set count) and render it as a direct
   sibling inside `session-exercise-heading-text`, immediately AFTER the
   meta span and BEFORE the `summaryLine` span. The heading line renders in
   both collapsed and expanded states, live and completed sessions - so
   this one placement covers everything; no second render site.

2. **Rework `ExerciseTrackedIndicator` into labeled pills** (same
   component, same `status` prop contract: "resolved" | "unresolved" |
   null; null and blank names still render nothing):
   - Resolved: `<span>` with classes
     `session-exercise-tracked-pill session-exercise-tracked-pill--resolved`,
     containing the EXISTING check-in-circle SVG (keep the same paths,
     rendered at 12x12 via width/height attrs) followed by a text label
     `Tracked`. Keep `title` and `aria-label` exactly
     "Tracked - counts toward your analytics".
   - Unresolved: same structure with
     `session-exercise-tracked-pill--unresolved`, the EXISTING dashed-circle
     SVG at 12x12, label `Not tracked`. Keep `title`/`aria-label` exactly
     "Not in the exercise library yet - analytics can't attribute this one".
   - The label is what does the communicating (titles are hover-only and
     useless on mobile). No motion, no animation.

3. **Pill CSS** (replace the three `session-exercise-tracked-badge` rules;
   grep confirms those classes are used nowhere else once the JSX moves):
   - Base `.session-exercise-tracked-pill`: `display: inline-flex;
     align-items: center; gap: 4px; padding: 2px 8px;
     border-radius: 999px; margin-left: 8px; font-size: 0.72rem;
     font-weight: 600; line-height: 1.2; white-space: nowrap;
     vertical-align: middle;` and `svg { display: block; flex-shrink: 0; }`.
   - Resolved: `background: var(--color-success-bg);
     border: 1px solid var(--color-success-border);
     color: var(--color-success-text);`. Rationale (do not "improve" it to
     accent color): the success token family is the codebase's positive-
     status signal (sync badge, flash states) and is already tuned per
     light/dark; an accent-tinted pill would read as interactive/selected,
     which this is not.
   - Unresolved: `background: transparent;
     border: 1px dashed color-mix(in srgb, var(--color-text-secondary) 45%, var(--color-border));
     color: var(--color-text-secondary);`. The dashed border carries the
     "incomplete/missing" semantics the dashed circle had.
   - Long exercise names on narrow viewports: the pill must wrap to the
     next line as a unit (inline-flex + nowrap inside already gives this),
     never break internally, and never push the heading row into
     horizontal overflow. Verify at ~360px width.

4. **L4 compatibility note (do not build it now):** L4 later turns the
   unresolved pill into a button that opens the add-to-library sheet. Keep
   all pill markup inside `ExerciseTrackedIndicator` so that swap stays a
   one-component change.

ACCEPTANCE CRITERIA (machine-checkable):
- Client `npm run build` green; `npm run test:unit` from server/ still
  green (nothing server-side changes).
- `grep -n "session-exercise-tracked-badge" client/src` -> zero hits (old
  classes fully replaced, JSX and CSS).
- `grep -n ">Tracked<\|>Not tracked<" client/src/pages/SessionDetailPage.jsx`
  -> both labels present.
- Manual contract (reviewer verifies in dev): "Bench press" in a live
  session shows a tinted "Tracked" pill with the check; a gibberish name
  shows the dashed "Not tracked" pill; a blank exercise shows no pill; a
  completed session shows pills too; collapsed and expanded headings both
  show the pill; legible in all 4 palettes x light + dark (tokens only).
- No new hex colors in changed CSS; both `package.json` files
  byte-identical.

STOP CONDITION (standing footer - keep verbatim in every block):
Stop when the acceptance criteria are met. If a criterion cannot be met,
stop and explain why instead of guessing.
- Do NOT commit, push, or touch git in any way - leave the working tree
  for review.
- Do NOT edit docs/HANDOFF.md, AGENTS.md, CLAUDE.md, this task file, or
  anything under docs/tasks/ - state is the reviewer's job.
- Do NOT add dependencies or refactor unrelated code.
- Do NOT start another task file when done - end your turn.
