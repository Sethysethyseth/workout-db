# TASK NT2: rebuild AddExerciseToLibrarySheet as the catalog-seeded stepped flow

STATUS: LANDED f26e783
MODEL: opus   <!-- Seth's call July 11: Opus, not Fable - precedent: the
                   July 10 weekly-volume visual rebuild (Opus) landed
                   clean; this block's fuller spec detail closes the rest
                   of the gap. Fable reserved for the pre-main review. -->
MODE: 1-relay

CONTEXT:
Centerpiece of the not-tracked-ux wave (branch `not-tracked-ux-wave`).
Design source: `docs/design/not-tracked-add-flow-brainstorm.md` - direction
A with direction B's explicit-role picker as its final step (settled with
Seth July 11: full flow incl. variant seeding in scope; pain confirmed BOTH
structural and visual, so the rebuilt sheet must also look
frontier-standard, not merely work). Depends on NT1 (search rows carry
`secondaryMuscles`) - NT1 must be landed or in the same batch. This is the
judgment-heavy visual unit of the wave: the design contract below is
deliberately fuller than contract-first normal (the CLAUDE.md carve-out).

FILES TO TOUCH:
- client/src/components/workout/AddExerciseToLibrarySheet.jsx  (rebuild: stepped flow)
- client/src/pages/SessionDetailPage.jsx   (pass sessionExercise id into the sheet;
                                            new link handler; extended success handler)
- client/src/index.css                     (rework the add-exercise-library-sheet
                                            block ~4580-4743 + new step/picker classes)
Do NOT modify anything outside these files. In SessionDetailPage.jsx touch
ONLY the sheet-related code paths (openAddToLibrarySheet / sheet props /
the new handlers) - the typeahead, set rows, and everything else stay
byte-identical.

CHANGE:

The sheet becomes a stepped flow with four states: `suggest` -> `seed` ->
`curate` -> `done`. One step visible at a time inside the same
portaled dialog card (portal + z-tier + body-scroll-lock + Escape/backdrop
close + focus behavior all preserved from the current implementation).
Steps have a visible back affordance (except `suggest`/entry) and never
trap the user; closing at ANY step costs nothing (the "Not tracked - add?"
pill persists - deferability principle from the design doc).

STEP 1 - `suggest` ("Is it one of these?"):
- On open, run the typed exercise name through
  `exerciseApi.searchExercises` (debounced-sequence idiom as in
  SessionDetailPage's typeahead effect, ~line 394-426) and show the top
  3-5 matches (name + equipment + primaryMuscles as quiet metadata, visual
  register similar to ExercisePickerSuggestions rows but designed for the
  sheet, not a combobox popover).
- Tapping a match is a LINK, not a create: the sheet calls the new
  `onLink({ sessionExerciseId, name, exerciseId, userExerciseId })` prop
  (async), which SessionDetailPage handles by committing
  `sessionApi.updateSessionExercise(sessionId, sessionExerciseId, patch)`
  where patch follows the existing `buildNamePatch` idiom (exerciseName =
  `inputToSessionExerciseName(row.name)`, plus exerciseId OR
  userExerciseId, never both), then `mergeSessionExerciseRow(row)`,
  then invalidate + refresh resolution for BOTH the old and new names
  (existing `invalidateExerciseResolution` / `refreshExerciseResolution` /
  `bumpResolutions` helpers). On resolve, the sheet advances to `done` in
  its LINK variant. On reject, show the error in-sheet (ErrorMessage
  pattern) and stay.
- Escape hatch at the bottom: "None of these - it's its own thing" ->
  `seed`. If the initial search returns ZERO matches, skip `suggest`
  entirely and open at `seed`.

STEP 2 - `seed` ("Start from a similar exercise?"):
- Purpose line makes the payoff explicit: starting from a similar exercise
  copies its muscle profile, so the analytics data is curated-quality.
- A search input (same debounce idiom) seeded with the initial matches;
  the user can search for any base (e.g. type "lunge" for a Bulgarian
  split squat). Tapping a match PRE-FILLS: base primaryMuscles -> Main,
  base secondaryMuscles -> Assists (NT1's payload), custom name KEPT,
  then advance to `curate`.
- Escape hatch: "Start from scratch" -> `curate` with an empty selection.

STEP 3 - `curate` (name + explicit-role muscle picker):
- Name field: keep the current prefill + debounced already-tracked check
  (lines 145-173 of the current sheet), but "Already tracked as X" becomes
  ACTIONABLE: a compact "Use that name" button that routes through the
  same onLink path as step 1 (resolve the row via
  `exerciseApi.resolveExerciseNames` result already in hand: catalogId ->
  exerciseId; source userExercise currently exposes no id, so in that case
  link by name only - patch exerciseName without an identity field).
- THE PICKER (replaces the three-state cycling chip - `CHIP_CYCLE` and
  `nextChipRole` are deleted): a two-mode segmented control, "Main" /
  "Assists", above ONE chip grid (keep the existing
  Upper body / Core / Lower body grouping and the 17-muscle client
  constant). Every chip tap is a PLAIN VISIBLE TOGGLE in the current mode:
  in Main mode, tap toggles main on/off; in Assists mode, tap toggles
  assist on/off. Tapping a chip that holds the OTHER role reassigns it to
  the current mode's role (one tap, visible change). Chips always display
  their role badge regardless of mode (keep the existing badge idiom,
  restyled). aria-pressed reflects selection in the CURRENT mode; each
  chip's aria-label states muscle + current role.
- Keep the live summary sentence (`buildMuscleSummary` - it is good) and
  the >= 1 Main submit requirement, but a DISABLED Add button must say
  why (helper text: e.g. "Pick at least one Main muscle" / name empty).
- Submit maps selections to the existing `createCustomExercise({ name,
  muscles })` API shape ({ muscle: "primary" | "secondary" }) - the server
  contract does NOT change.
- After a successful create in this live-session context, SessionDetailPage
  additionally commits `{ userExerciseId: created.userExercise.id }` on the
  session exercise row via the same updateSessionExercise path (name
  unchanged if it already matches), so the row carries stored identity like
  an A5 typeahead pick would. Then invalidate + refresh resolution as today.

STEP 4 - `done` (the success moment - REQUIRED, fires EVERY time):
- CREATE variant: confirmation with the exercise name + exactly ONE brief
  informative line whose substance is: counts toward your analytics,
  INCLUDING PAST WORKOUTS logged under this name. (This retroactivity is
  true - name-based resolution - and is the moment's whole point. Keep it
  to one line; no paragraph.)
- LINK variant: confirmation that the row now logs as [canonical name] +
  one line: tracked, counts toward your analytics. Do NOT claim
  retroactivity here - a rename affects only this session's row, not past
  sessions logged under the old name.
- A single "Done" button closes. No auto-dismiss timer.

VISUAL BAR (the "make it look better" half of the mandate):
- Tokens-only, zero hex - correct across all 4 palettes x 2 modes. Accent-
  adjacent states derive from `--color-interactive` via color-mix (the
  index.css idiom).
- Step transitions and chip/role changes are motion-restrained: ~150-250ms,
  ease-out, using the existing motion tokens (see L5's whats-new treatment
  for the register), with a `prefers-reduced-motion` opt-out.
- The sheet should read as a designed surface, not a form dump: clear step
  header hierarchy, breathing room, mobile-first (bottom-sheet manner on
  small viewports, centered dialog >= 640px as today), 360px-wide clean.
- Touch targets >= 44px for chips, matches, and segmented control.

ACCEPTANCE CRITERIA (machine-checkable):
- Client `npm run build` green.
- `npm run test:unit` green from `server/` (tripwire - this block touches
  no server files).
- `grep -n "CHIP_CYCLE\|nextChipRole" client/src/components/workout/AddExerciseToLibrarySheet.jsx`
  returns nothing.
- Grep evidence that suggest-step tap and "Use that name" both route
  through `updateSessionExercise` with a patch built like `buildNamePatch`
  (exerciseName + at most one of exerciseId/userExerciseId).
- Grep evidence that create success in live context commits
  `userExerciseId` onto the session exercise row.
- The retroactive line appears in the CREATE done-state only (grep the
  copy; the LINK variant must not contain the past-workouts claim).
- Seeding contract: selecting a base in `seed` yields picker state
  primary->Main / secondary->Assists (cite the code path; a targeted unit
  of evidence in DELIVERY.md, e.g. the mapping function + its call site).
- Zero-match open lands on `seed` (code-path evidence).
- No hex colors in the index.css diff (`grep -E "#[0-9a-fA-F]{3,8}" ` on
  the added lines).
- Dialog semantics preserved: role="dialog", aria-modal, labelled title,
  Escape + backdrop close at every step.
- SessionDetailPage diff limited to the sheet-related paths (typeahead and
  set-row code untouched).

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
