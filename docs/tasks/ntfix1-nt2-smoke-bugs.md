# TASK NTFIX1: NT2 smoke-test bug fixes (E/F/B/C/D) + one diagnosis

STATUS: QUEUED
MODEL: opus            <!-- Part 2 (as-you-type resolution wiring) and Part 3
                           (Failed-to-fetch diagnosis) are judgment-heavy;
                           Parts 1a/1b/1c are mechanical. -->
MODE: cloud-branch     <!-- Cursor runs in a cloud workspace synced from
                           GitHub, NOT in the reviewer's local tree. Commit to
                           a NEW branch `cursor/ntfix1-nt2-smoke-bugs` off
                           `not-tracked-ux-wave` and push it; open a PR into
                           `not-tracked-ux-wave`. Do NOT push to or merge
                           `not-tracked-ux-wave` directly - the reviewer
                           fetches your branch, audits, and lands it. Full
                           handoff steps in the STOP CONDITION footer. -->

CONTEXT:
Fixes the five findings Seth's staging smoke of NT2 (`f26e783`,
AddExerciseToLibrarySheet rebuild) surfaced, all logged in `docs/HANDOFF.md`
(top entry: findings E/F; ninth-session entry: findings B/C/D). Branch
`not-tracked-ux-wave`. This unit lands BEFORE NT3 - it shares both client
files with NT3 (`nt3-entry-deferability-polish.md`), which stays QUEUED
behind it (serialize; do not run them together).

Four are code fixes with understood mechanisms (B, C, D, E). One - F,
"Failed to fetch" creating an exercise from scratch - has NO confirmed root
cause and is a DIAGNOSE-FIRST item (Part 3): reproduce and report, fix ONLY
if the root cause turns out to be a clear client-code defect; otherwise stop
and report candidates. Do not guess a fix for F.

FILES TO TOUCH:
- client/src/components/workout/AddExerciseToLibrarySheet.jsx
                                        (Parts 1a/1b/1c: B, C, D)
- client/src/pages/SessionDetailPage.jsx
                                        (Part 2: E - as-you-type tracked
                                         feedback)
- client/src/api/exerciseApi.js AND/OR client/src/api/http.js
                                        (Part 3 ONLY, and ONLY if F's
                                         confirmed root cause is a client-code
                                         defect - otherwise leave untouched)
Do NOT modify anything outside these files. Do NOT touch index.css (none of
these fixes need a token or style change; Part 1c is ARIA-attribute-only).

---

CHANGE:

## Part 1 - three fixes in AddExerciseToLibrarySheet.jsx

### 1a (finding B) - dead ternary in `goBack`
`goBack` (~line 420) has `setStep(hadSuggestStep ? "seed" : "seed")` - both
arms are `"seed"`. Collapse to `setStep("seed")`. Leave `hadSuggestStep`
itself alone - it is still read in the same function (the `step === "seed"`
branch) and in `showBack`. No behavior change; this is a dead-code tidy.

### 1b (finding C) - create-succeeds-but-stamp-fails shows a false error
In `handleSubmit` (~line 397): `createCustomExercise` runs, then
`onCreateCommitted({ name, userExerciseId })` runs (that callback does the
session-row `userExerciseId` stamp in SessionDetailPage). Both are inside one
`try`, so if the CREATE succeeds but the STAMP throws, the `catch` shows a
submit error and leaves the user stranded on `curate` - even though the
exercise WAS created in the library and name-based resolution will attribute
it regardless.

Fix: the post-create stamp is best-effort. Once `createCustomExercise`
resolves, the library entry exists and the flow MUST advance to `done`
(create variant). Only a failure of `createCustomExercise` itself is a real
submit error worth surfacing. Concretely: keep the `createCustomExercise`
call in the outer `try` (its throw still sets `submitError` + re-enables the
button as today), but wrap the `onCreateCommitted(...)` call in its own inner
`try/catch` that swallows the stamp failure (the row lights up by name on the
next resolve), then fall through to `setDoneVariant("create")` +
`setStep("done")`. Do not show an error for a stamp-only failure.

### 1c (finding D) - broken tablist ARIA on the Main/Assists toggle
The role toggle (~lines 602-629) is marked `role="tablist"` with two
`role="tab"` + `aria-selected` buttons, but there is no tabpanel and no
roving tabindex / arrow-key handling - an incomplete, misleading tab
contract. This control is a mutually-exclusive MODE toggle, not tab
navigation. Convert it to honest toggle-button semantics, matching the
`aria-pressed` idiom the muscle chips in this same file already use
(~line 661):
- Remove `role="tablist"` from the container and `role="tab"` +
  `aria-selected` from both buttons.
- Give each button `aria-pressed={pickerMode === "main"}` /
  `aria-pressed={pickerMode === "assist"}` respectively.
- Keep everything else (classes, `--active` modifier, onClick, labels)
  exactly as-is. No visual change, no CSS change.

## Part 2 (finding E) - as-you-type tracked/untracked feedback

WHAT'S WRONG: on a live session, the tracked/untracked pill for an exercise
row reflects the COMMITTED name only. `SessionExerciseBlock` (~line 1200)
renders the pill via `ExerciseTrackedIndicator status={trackedStatus}`
(~line 1349), and `trackedStatus` comes from the page-level
`trackedStatusByExerciseId` memo (~line 1841), which keys off
`se.exerciseName` (the stored name). The user's typed value lives in the
`name` state inside `SessionExerciseFields` (~line 365) and only reaches the
pill after `onBlur` -> `commitName` -> `commitExercise` ->
`onExerciseCommitted` (`mergeSessionExerciseRow`) -> `refreshExerciseResolution`.
So typing an exact exercise name by hand shows no tracked feedback until the
field loses focus and the blur write round-trips. Seth wants near-immediate
as-you-type feedback, DECOUPLED from the commit-on-blur write.

DESIRED BEHAVIOR: while editing a live-session exercise-name field, the pill
reflects the resolution of the CURRENTLY TYPED name, updating within about
one debounce interval of the last keystroke, WITHOUT any session-exercise
write firing on keystroke.

IMPLEMENTATION CONTRACT (mirror the pattern this codebase already uses; pick
the exact wiring, the reviewer will check the criteria below):
- Add a debounced, WRITE-FREE resolve of the typed name in
  `SessionExerciseFields`. Mirror the sheet's own already-tracked pattern in
  AddExerciseToLibrarySheet.jsx (~lines 236-270): a `setTimeout`-debounced
  (~300ms) `exerciseApi.resolveExerciseNames([typedStoredName])` call with a
  cancel/sequence guard, gated on the field not being `disabled` and the name
  being long enough (reuse the >= 2 char threshold the existing suggestions
  effect at ~line 407 uses). Convert the input value to its stored form with
  the existing `inputToSessionExerciseName` helper before resolving, so it
  matches how the committed pill is keyed.
- This resolve MUST NOT call `sessionApi.updateSessionExercise` or any other
  mutation. The only network call typing may trigger is the read-only
  `resolveExerciseNames` (and the pre-existing `searchExercises` typeahead).
- Surface the typed name's resolution to the pill. Recommended shape: have
  `SessionExerciseFields` report a draft status ("resolved" | "unresolved" |
  null) up to `SessionExerciseBlock` via a new callback prop;
  `SessionExerciseBlock` holds it in state and renders
  `ExerciseTrackedIndicator status={draftStatus ?? trackedStatus}`. Fall
  back to the committed `trackedStatus` (draft = null) when the typed stored
  name equals `sessionExercise.exerciseName` (no edit) or is too short. You
  may instead reuse the module-level `exerciseResolutionCache` +
  `lookupExerciseTrackedStatus` if that yields a cleaner wiring - either is
  acceptable as long as the criteria hold.
- Live sessions only. The completed/read-only path (`disabled` /
  `isCompleted`) must be untouched - completed rows render the read-only
  block, not `SessionExerciseFields`, so an early return on `disabled` is
  sufficient.
- No regression to commit-on-blur: `commitName` / `commitExercise` /
  `applySuggestion` / `selectSuggestion` behavior stays exactly as today
  (single write on blur or suggestion pick; no double-write).

## Part 3 (finding F) - "Failed to fetch" creating an exercise from scratch - DIAGNOSE FIRST

SYMPTOM: in the sheet's `curate` step with NO seed selected ("Start from
scratch"), submitting throws a raw "Failed to fetch" instead of a handled
API error. Path: `handleSubmit` (~line 397) -> `exerciseApi.createCustomExercise`
-> `http("/exercises/custom", { method: "POST", ... })`.

WHAT IS ALREADY KNOWN (do not re-derive, build on it):
- `http()` (client/src/api/http.js) throws a typed `ApiError` for ANY HTTP
  response, including 4xx/5xx. A raw "Failed to fetch" is a native `fetch()`
  TypeError, meaning the request never received a response at all
  (network-level: DNS/connection, CORS/preflight rejection, or an edge/proxy
  failure such as a Render cold-start 502 that carries no CORS headers).
- It is NOT a blanket origin/CORS/unreachable problem: on the same screen,
  GET `/exercises/search` (typeahead) AND POST `/exercises/resolve` (the
  already-tracked check, also a JSON POST through the same `http()` wrapper)
  both reach the server successfully. So a simple "wrong API origin" or
  "CORS blocks all POSTs" theory is already contradicted - say so if your
  evidence agrees, and look for what is different about `/exercises/custom`
  specifically.

DO THIS:
1. Reproduce locally FIRST: run the client dev server against a local server
   (see AGENTS.md "How to run / test"; do NOT point the client at prod -
   VITE_API_URL override only), open a live session, add an unresolved
   exercise, open the sheet, "Start from scratch", fill name + at least one
   Main muscle, submit. Capture the Network-tab entry for the
   `/exercises/custom` request: request method, whether an OPTIONS preflight
   preceded it, the status (or "(failed)"/"(canceled)"), and any console/CORS
   error text.
2. Write the finding to DELIVERY.md: whether it reproduced locally, the exact
   Network-tab evidence, and the ranked candidate root cause(s) - e.g. server
   controller/route error on `/exercises/custom` that responds without CORS
   headers; preflight (OPTIONS) handled differently for this route; a
   staging-only edge/cold-start 502 (the staging Render-repoint caveat in
   HANDOFF is a candidate for the staging-only case); or a genuine client
   defect.
3. FIX ONLY IF the confirmed root cause is a clear CLIENT-CODE defect inside
   the allowed files (e.g. malformed request the wrapper builds wrong). In
   that case fix it and note it. If the root cause is server-side, an
   environment/deploy issue, or you could not reproduce it locally, STOP -
   report the diagnosis and candidates in DELIVERY.md and do NOT change code
   for F. (A cosmetic "friendlier message for network TypeErrors" is NOT a
   fix and is out of scope - it would mask the real failure.)

---

ACCEPTANCE CRITERIA (machine-checkable):

Build / lanes:
- Client `npm run build` green.
- `npm run test:unit` green from `server/` (tripwire - no server code touched
  unless Part 3 forces a client-only fix; there is no server change in this
  block regardless).

Part 1a (B):
- Grep: no `hadSuggestStep ? "seed" : "seed"` remains; `goBack` sets `"seed"`
  directly. `hadSuggestStep` is still referenced elsewhere in the file.

Part 1b (C):
- Code-path evidence: in `handleSubmit`, a throw from `onCreateCommitted`
  (post-create stamp) does NOT set `submitError` and does NOT leave the step
  on `curate`; the flow reaches `setStep("done")` with `doneVariant="create"`.
  A throw from `createCustomExercise` itself still surfaces the error and
  re-enables the button (unchanged).

Part 1c (D):
- Grep: `role="tablist"` and `role="tab"` no longer appear in
  AddExerciseToLibrarySheet.jsx; both toggle buttons carry `aria-pressed`
  bound to `pickerMode`. No CSS/class changes (index.css untouched; button
  classNames unchanged).

Part 2 (E):
- Code-path evidence: typing in a live-session exercise-name field triggers a
  debounced `resolveExerciseNames` (read-only) and updates the pill from the
  typed name; grep confirms NO `updateSessionExercise` (or other mutation) is
  reachable from the keystroke/`onChange` path - the only write remains
  commit-on-blur / suggestion-pick.
- Behavioral (reviewer will drive it): in a live session, hand-typing an
  exact library exercise name flips the pill to "Tracked" without blurring
  the field; typing a novel name shows "Not tracked"; the committed pill
  behavior after blur is unchanged.
- The completed-session (read-only) render path is untouched.

Part 3 (F):
- DELIVERY.md contains the local-repro result + Network-tab evidence + ranked
  root-cause candidates. Code for F changed ONLY if the confirmed root cause
  is a client-code defect in the allowed files; otherwise no F code change and
  DELIVERY.md says why.

STOP CONDITION (cloud-branch handoff - read carefully, this differs from the
usual "don't touch git" footer because you run in a cloud workspace, not the
reviewer's local tree):
Stop when the acceptance criteria are met. If a criterion cannot be met,
stop and explain why instead of guessing.
- Before stopping, run every lane this block allows and write the delivery
  report to DELIVERY.md at the repo root (files touched; verbatim test
  output; each acceptance criterion with the evidence that proved it; the
  Part 3 (F) diagnosis in full; any deviations from this block, with reasons).
- HANDOFF: commit ALL your code changes to a NEW branch
  `cursor/ntfix1-nt2-smoke-bugs` created off `not-tracked-ux-wave`, and push
  that branch to origin. Do NOT commit to, push to, or merge
  `not-tracked-ux-wave` itself - the reviewer fetches your branch, audits,
  and lands it.
- Open a PR from `cursor/ntfix1-nt2-smoke-bugs` into `not-tracked-ux-wave`
  and paste the FULL delivery report into the PR description. DELIVERY.md is
  gitignored and will NOT travel with the branch push, so the report - and
  especially the Part 3 (F) diagnosis, which may be text-only with no code -
  MUST live in the PR body. If you cannot open a PR, put the full report in
  your final message instead.
- Do NOT edit docs/HANDOFF.md, docs/tasks/QUEUE.md, AGENTS.md, CLAUDE.md,
  this task file, or anything else under docs/tasks/ - state is the
  reviewer's job.
- Do NOT add dependencies or refactor unrelated code.
- Do NOT start another task file when done - end your turn.
