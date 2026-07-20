# Not-tracked exercise flow — brainstorm (pre-skeleton)

**Status:** BRAINSTORM ONLY — no code, no task blocks authored yet.
**Session:** July 10, 2026, Fable. Seth stopped the session after the
brainstorm was delivered; the open questions at the bottom are UNANSWERED.
**Next step:** a frontier-seat session (Opus) resumes here, settles the open questions
with Seth, then authors the wave skeleton (unit task blocks) per the
recommendation below.

## Goal

Rework the "not tracked workout" UI. Today, when a logged exercise name
doesn't resolve against the catalog or the user's custom library, the flow
to add a custom exercise is not user friendly. Target: user friendly,
visually appealing, frontier-app standard.

## Grounding — the current surface (verified July 10)

- **Entry point:** `client/src/pages/SessionDetailPage.jsx:101-182` —
  `ExerciseTrackedIndicator`. Name-resolution cache (lines 39-99) calls
  `POST /exercises/resolve`; unresolved names render a "Not tracked -
  add?" pill (interactive variant) that opens the sheet. A crossfade slot
  mechanism already exists for pill state changes (lines 141-180).
- **The sheet:** `client/src/components/workout/AddExerciseToLibrarySheet.jsx`
  — portaled bottom sheet (centered dialog >= 640px). Name input
  (prefilled, debounced already-tracked check at lines 145-173), then 17
  muscle chips in 3 display groups (Upper body / Core / Lower body).
  **Each chip tap CYCLES off -> Main -> Assists -> off** (`CHIP_CYCLE`,
  line 39). Summary sentence (`buildMuscleSummary`), Add/Cancel footer.
  Submit requires >= 1 "main" muscle.
- **CSS:** `client/src/index.css:4580-4743` (`add-exercise-library-sheet`
  block). Tokens-only, already correct on that front.
- **Client API:** `client/src/api/exerciseApi.js` — `searchExercises`
  (GET /exercises/search, the A5 typeahead), `resolveExerciseNames`,
  `getMuscles`, `createCustomExercise({name, muscles})` where muscles is
  `{muscle: "primary"|"secondary"}`.
- **Server:** `server/src/controllers/exerciseController.js` —
  `createCustomExercise` (dup check on normalized name, 17-muscle vocab
  validation), `resolveExerciseNames`, `searchExercises` (searchCatalog
  over catalog + user index). Also `listCustomExercises` +
  `deleteCustomExercise` exist server-side but have **NO client UI**.
- **Key mechanism (verified):** analytics resolution is NAME-BASED at
  read time (`resolveExercise` with the user index per request), so
  creating a custom exercise **retroactively attributes every past
  session logged under that name**. Never surfaced to the user anywhere.

## Diagnosis — why the current sheet fails

1. **The three-state cycling chip is the core failure.** A tap means a
   different thing depending on hidden state; no affordance communicates
   the cycle. Tapping twice to undo a mistake silently lands on
   "Assists"; deselecting requires knowing to tap a third time. Fails
   first contact, and first contact is the only contact (each custom
   exercise is created once).
2. **Curation question at a logging moment.** The pill appears
   mid-workout (between sets, one thumb). The sheet hands the user a
   taxonomy job — classify 17 muscles into 3 roles — when their intent
   was "log Pendlay Row."
3. **Ignores the 675-exercise catalog.** Most "not tracked" names are
   variants/near-misses of catalog entries (the two canonical gaps in
   the issue list ARE Pendlay Row and Bulgarian split squat, both one
   hop from catalog entries). The sheet makes users hand-build from zero
   what the catalog could seed in one tap — and user-guessed
   primary/secondary is WORSE attribution data than inherited curated
   weights. The current UI quietly degrades the analytics layer the app
   differentiates on.
4. **Dead ends and missing moments.** "Already tracked as X" is a
   statement with no action (no "use that name" button). The disabled
   Add button never says why. The retroactive-attribution win (see
   mechanism above) is never told to the user — it is the single most
   compelling sentence available at the success moment.
5. **Adjacent gap (NOT this unit's scope, leave a slot):** no client
   library-management UI — mis-create a custom exercise and you cannot
   see or fix it, despite list/delete endpoints existing.

## Directions considered

**A — Catalog-seeded stepped flow (RECOMMENDED).** Progressive
disclosure inside the sheet:

- *Step 1 — "Is it one of these?"* Show 3-5 near-matches from the
  existing `searchCatalog` endpoint for the typed name. Tap one -> it's
  a LINK, not a create: the set row adopts the canonical name, done in
  one tap. Kills the typo/naming-variant class of "not tracked"
  entirely (UI-layer answer to the A4/A6 name-robustness standing ask).
- *Step 2 — "Is it a variant of something?"* Same search, different
  commitment: pick a base exercise -> its muscle profile PRE-FILLS the
  picker, the custom name stays. Two taps to a custom exercise with
  curated-quality attribution. Quiet "It's totally unique ->" link
  falls through to manual.
- *Step 3 — Confirm/edit muscles* with the cycle chip REPLACED by
  direction B's explicit-role picker; pre-filled when seeded; keep the
  summary sentence (it's good).
- *Success moment:* pill crossfades to "Tracked" (slot machinery
  exists) + one line: counts toward analytics, **including past
  workouts with this name**.
- *Server cost:* one small addition — an endpoint (or expanded search
  payload) returning a catalog entry's muscle profile mapped into the
  17-muscle vocabulary, so the client can pre-fill. NO schema change,
  no migration; `createCustomExercise` API unchanged. (A
  `basedOnExerciseId` column would be richer but is schema territory —
  DEFERRED; client-side profile copy gets ~95% of the value free.)

**B — Fix the interaction model only (minimal).** Keep the
single-screen sheet; replace the cycle with explicit roles: either two
sequential questions ("What does it mainly work?" -> "Anything that
assists?") or a Main/Assists segmented control that sets what a tap
means, every chip a plain visible toggle. Cheap and honest, but leaves
catalog leverage + the data-quality win on the table. Fold INTO A as
step 3 rather than ship alone.

**C — Body-map picker (PARKED).** Front/back anatomy silhouette, tap
regions. Visually spectacular, could match the pixel-art chrome — but
the 17-muscle vocab maps badly to tappable regions on a phone
(adductors/abductors, middle back vs lats vs traps), a11y is a real
project, needs bespoke art across palette x mode combos, and it
beautifies the manual path that direction A is designed to make rare.
Possible T4-era flourish. Do not let it block this wave.

**Deferability principle (all directions):** the pill stays as the
tripwire, but closing the sheet must cost nothing — pill persists, and
doing it later from session detail is an equally good path. Step 1 is
light enough between sets; step 3 is a couch task.

## Recommendation

**A, with B's explicit-role picker as its final step, C parked.** Only
direction that makes the flow friendlier AND improves analytics data
quality; the other two trade one against the other.

## Open questions for Seth (UNANSWERED — settle before skeleton)

1. Is the variant-of seeding (step 2 + the small server endpoint)
   in-scope for this wave, or is the first cut just near-match linking
   (step 1) + the fixed picker (step 3)?
2. Does the retroactive-attribution line live in this sheet's success
   moment, in a What's New entry when it ships, or both?
3. Sanity-check the diagnosis: is the pain Seth felt structural (the
   flow, as diagnosed here) or primarily visual (sheet looks
   flat/cramped)? If visual, reweight toward a styling pass over a flow
   rebuild. (Fable's read: structural, per the diagnosis — but this was
   never confirmed.)

## Skeleton-session checklist (once questions settle)

- Author unit blocks per the relay v4 template
  (`cursor-task-block-template.md`, unit-scale contract-first variant);
  step 3's picker is judgment-heavy visual — that one may warrant fuller
  spec detail per the CLAUDE.md carve-out.
- Candidate unit split: (1) server muscle-profile payload + client API,
  (2) sheet restructure steps 1/2, (3) picker replacement + success
  moment, (4) entry-pill/deferability polish. Fold small.
- New branch off `main` (this doc lands on `not-tracked-ux-wave`).
- Tokens-only styling; motion within ~150-250ms ease-out restraint.
