# HANDOFF ARCHIVE — session-log history (append-only)

**What this is:** the big-picture tier of the two-tier state channel
(relay v4, July 6, 2026). When `docs/HANDOFF.md` is rewritten at the end
of a session, aged session logs move HERE verbatim — newest first, nothing
summarized, nothing lost. Fable/Opus greps this file for pre-main review
and big-picture planning (decision rationale, sequencing-flag precedents,
accepted deviations and nits, incident history). Sonnet and Cursor never
load it. Single writer: Claude Code, same rule as HANDOFF.

History older than this file: `WORKOUTDB_MASTER_PROMPT_17.md` (stable
context) and the git history of `docs/HANDOFF.md`.

---

## Superseded current-state entries (July 6, 2026)

**Updated:** July 6, 2026 late night (Fable — two Seth-directed direct UX
fixes landed off-queue on `logging-ux-wave`, disjoint from all L-wave
files; origin confirmed at `c0d37fb`.)** (1) `3a530a7`: logged-out
first-open no longer sits on the "Loading session…" boot spinner waiting
for a cold server - no stored `authToken` means ProtectedRoute redirects
straight to `/login` (the form renders instantly; `/auth/me` still fires
and warms the server in the background). `/login` now bounces
already-signed-in users onward (covers the valid-cookie/cleared-storage
edge), and a definitive `/auth/me` 401 clears the dead stored token.
(2) `c0d37fb`: finishing (or deleting) a workout now dispatches a
`sessions:changed` window event from `sessionApi`; `ActiveSessionContext`
applies it locally at once and re-fetches - the home "Resume workout"
hero/persistent bar clear immediately instead of surviving until the 20s
poll or a manual refresh. Both verified end-to-end (Playwright against a
local server on the staging DB; register -> start -> finish -> home flip,
plus logout/reload/login-visit probes; throwaway staging account
`smoke_fable_jul6` created in the process). This session was the "second
agent" flagged in QUEUE's L5-audit warning - flag resolved in QUEUE, the
L5 audit's leave-it-out call was correct. **Add to Seth's combined smoke:
open the app logged-out (should land on login instantly) and finish a
workout (Resume hero should vanish on return to Home).** Next unchanged:
Seth's combined smoke -> Fable pre-main branch-diff review -> merge.
Previous entry retained below for continuity.

**Updated:** July 6, 2026 (Fable — relay v4: two-tier state channel +
Cursor rebalance. Docs-only session, no app code touched.)** HANDOFF is now
CAPPED: current state, repo/deploy state, the latest 1-2 session entries,
Open TODOs / Next up, and the short reference sections. Everything older
moved VERBATIM to `docs/HANDOFF-ARCHIVE.md` (append-only, newest first —
Fable greps it for pre-main review and big-picture work; Sonnet and Cursor
never load it). Workflow changes codified in CLAUDE.md ("v4"), AGENTS.md,
`cursor-task-block-template.md`, and `docs/tasks/` (template + README):
Cursor now self-verifies and writes a `DELIVERY.md` report (repo root,
gitignored) before stopping; Sonnet AUDITS that report against the tree and
re-runs only the cheap lanes fresh (unit + client build — never trusts the
report for green tests) instead of re-deriving the whole delivery; bugs get
a Cursor DIAGNOSIS block first (root cause + evidence + proposed fix, no
code); the direct-fix exception is now stated (when diagnosis was ~95% of
the work and the fix is trivial, the diagnosing agent ships it — everything
else goes to Cursor, however small); non-colliding units may batch two
Cursor blocks per review session. All gates unchanged: single git/state
writer, migration track, pre-main Fable review, "push to main" verbatim.
**Next: unchanged from the entry below** — Seth's smoke of
`/analytics/summary` end-to-end, then the combined
L1+L2+L2B+A6+L6+wheel-fix backlog, then L4 dispatches.
Previous entry retained below for continuity.

**Updated:** July 6, 2026 (Sonnet — L3's CRITICAL SEQUENCING FLAG resolved:
migration applied to STAGING, independently verified.)** Seth applied the
`UserExercise` migration to staging manually per RUNBOOK "Schema-change
deploy" (same precedent as L1). Independently re-verified this session
(verify-before-trust): `npx prisma migrate status` against staging -
Datasource resolved to `ep-bitter-breeze-am81izlh` (confirmed correct
staging host, never `ep-solitary-sea-an56mioq` prod) - "Database schema is
up to date!", 14 migrations, zero drift. Direct `information_schema.columns`
query confirms the `UserExercise` table exists with the exact columns L3
shipped (`id`, `userId` **text** - matching the deliberate String-not-Int
deviation from the block, `name`, `normalizedName`, `muscles` jsonb,
`createdAt`). Staging Render root (`https://workout-db-staging.onrender.com/`)
responds 200 `{"message":"WorkoutDB API running"}` - not crash-looping, so
the feared app-wide `/analytics/summary` 500 (every user, not just
custom-exercise users, per the flag) is no longer live now that the table
exists ahead of/alongside the deploy. **Not independently verified this
session (needs Seth):** the exact deploy SHA in Render's Events tab (should
read `fbb054b` or later - confirm before treating this as fully live), and
an authenticated end-to-end hit on `/analytics/summary` (root health alone
doesn't exercise the `userExercise.findMany` code path the flag was about).
**Next: Seth's smoke** - `/analytics/summary` end-to-end first (the specific
path the flag threatened), then the still-pending combined
L1+L2+L2B+A6+L6+wheel-fix backlog (custom-exercise CRUD has no UI yet - L4
builds that) - then L4 dispatches.
Previous entry retained below for continuity.

## Superseded current-state entries (July 5, 2026)

**Updated:** July 5, 2026 latest+4 (Sonnet — L3 landed `fbb054b`, pushed to
`origin/logging-ux-wave`. CRITICAL SEQUENCING FLAG, unresolved.)**
Cursor executed `l3-custom-exercises-server.md`; reviewed and committed (12
files, +830/-65). Scope exact match to the block's FILES TO TOUCH. One
deliberate correct deviation from spec: `UserExercise.userId` is `String`,
not the block's stated `Int` - the block's schema snippet was wrong,
`User.id` is `String @default(cuid())`; `Int` would have been a broken FK.
Delivered: `UserExercise` model + migration (hand-authored, matches
existing migration rendering); `GET /api/exercises/muscles` (17-muscle
vocabulary, catalog-derived, not hardcoded); custom-exercise CRUD (POST
rejects catalog/alias-resolvable names and duplicate normalizedNames,
GET/DELETE both userId-scoped, DELETE 404s in the standard
not-found-shape on not-own-or-missing, matching the existing pattern used
across every other controller); `resolveExercise` gained an optional
third `userIndex` arg, catalog+alias still wins on collision, then the
user overlay, `source: "userExercise"` threaded through
`/exercises/resolve`; `userExercises.js` (pure, no Prisma) has
`buildUserExerciseIndex` + `userExerciseWeights` (primary 1.0/secondary
0.5, same fallback convention as `attribution.js`); `enrichSet` gives a
user-exercise resolution a synthetic `catalogEntry.id = user:<id>` so
`aggregateExerciseMetrics`'s existing id-keyed grouping works unmodified;
`analyticsController.getSummary` now also fetches the caller's
`UserExercise` rows and builds the overlay index. Server unit lane
119/119 (new pure tests: weights math, catalog-beats-user precedence,
unresolved-stays-unresolved-with-overlay, a user-exercise set landing
fractional volume in `perMuscle`). Purity grep
(`prisma\|@prisma` under `server/src/analytics/`) - zero hits. Client
untouched, `server/package.json` byte-identical. Integration tests
WRITTEN (custom CRUD happy path, cross-user isolation 404, catalog-name
rejection, resolve endpoint's `userExercise` source, summary
end-to-end volume) but deliberately NOT RUN - `npm test` would
auto-apply the parked migration, exactly the gate the block specified.
**CRITICAL SEQUENCING FLAG (same class as L1's, caught in review before
any further action):** `analyticsController.getSummary` now
unconditionally runs `prisma.userExercise.findMany({ where: { userId } })`
on EVERY summary request, not just when a custom exercise is involved.
Staging Render is repointed to `logging-ux-wave` and auto-deploys on
push - once it redeploys at `fbb054b`, `/analytics/summary` will 500 for
ALL users (not just custom-exercise users) until the `UserExercise`
migration is applied, because the regenerated Prisma client will expect a
table that doesn't exist yet on staging. **Not yet done: apply the
migration to STAGING per RUNBOOK "Schema-change deploy" (confirm
`noisy-surf`/`ep-bitter-breeze-am81izlh` host, same as L1 - never prod)
before or immediately after this redeploys; verify `npx prisma migrate
status` clean afterward, same as the L1 precedent.** Only after that:
Seth's smoke (custom exercise CRUD via API/client is not built yet - L4
is the UI - so this session's smoke is really "does the rest of the app,
especially analytics, still work" - the summary endpoint end-to-end is
the thing to check first) - then L4 dispatches (custom-exercise UI,
builds on this).

**Updated:** July 5, 2026 latest+3 (Sonnet — root-caused + fixed the
weight->reps promotion glitch that survived L6, `ae49cbe`, pushed to
`origin/logging-ux-wave`.** Seth reported it was "still a little glitchy
sometimes when switching from weight to reps" even after L6 + the
wheel-scroll fix. Root cause was structural, not timing: `SessionExerciseBlock`
rendered the 0-sets branch as a bare `<div>` wrapping the draft
`SessionSetRow`, and the >0-sets branch as a `<>` Fragment wrapping the row
list + add-set footer. Switching element TYPE (div vs Fragment) at that one
JSX position forces React to unmount the entire old subtree on every
draft->real promotion, no matter what key the inner row carries - so the
Weight/Reps `<input>` was destroyed and recreated mid-keystroke every single
time an exercise's first set was logged, regardless of L6's rAF
focus-search hack (which could only refocus a NEW element, not prevent the
old one's destruction). Fixed by unifying both branches under one
persistent Fragment/div shell (branching only INSIDE it) and giving the
row that transitions from draft to real (index 0, non-per-side) a stable
key (`session-set-slot-${se.id}`) shared across both states. React now
reuses the same fiber/DOM node across the transition, so the pre-existing
echo-suppressing resync effect (from L6) picks up the handoff for free -
focus and cursor position are never disturbed, no hack needed. Removed the
now-dead id-search-and-refocus block in `tryPromote` (the draft row never
unmounts anymore, so it had nothing left to do). Client build + lint
verified clean (one pre-existing unrelated `sessionExerciseId`
exhaustive-deps warning fixed as a trivial side effect of the removal; all
other lint errors on the file predate this change and are untouched).
**Not yet smoked by Seth** - fold into the next combined smoke pass.
Previous entry retained below for continuity.

**Updated:** July 5, 2026 latest+2 (Sonnet — L6 landed `cac5999`, then a
follow-up wheel-scroll fix `4d82311`, both pushed to
`origin/logging-ux-wave`.** Seth's report right after the L6 push ("weight
adds a decimal randomly when I move fast, same for tracked/untracked") is
a DIFFERENT bug, not a regression in L6: Chrome/Edge nudge a focused
`type="number"` input by its `step` on wheel/trackpad scroll — Weight's
`step="0.01"` means scrolling past a still-focused field silently appends
a decimal, independent of tracked status (matches the report exactly).
Same root cause as the old reps decimal bug (`9112eda7`, May); L6's
`step="1"` change only shrank reps' exposure, it didn't stop the wheel
from acting on either field. Fixed directly (mechanical, 1-line-per-field):
`onWheel={(e) => e.currentTarget.blur()}` added to both Weight and Reps
inputs (the only two `type="number"` inputs in the file) so scrolling
defocuses instead of mutating the value. Build re-verified green. All three root-cause mechanisms fixed exactly
per the block: focus handoff from the draft row to the promoted real row
(`document.activeElement` check right after the `await` resolves, before
React's unmount/remount commits, then a `requestAnimationFrame` retry-once
to find the new field once it has), an echo-equality check in the resync
effect that skips `setDraft` when the server's PATCH response matches the
draft already held (no more pointless re-render in the blur gap), and the
tracked pill now rendering inside a fixed-size `inline-grid` slot (hidden
sizer + stacked pill, `grid-area: 1/1`) so its null -> pill transition
never reflows the heading. Reps `step="0.01"` -> `step="1"` folded in
(weight untouched). Reviewed clean: client build green, all acceptance
greps pass (`session-exercise-tracked-slot` in both files, `step="0.01"`
count now 1, `log-set-` handoff construction present), no new hex, no new
deps, `package.json` byte-identical, scope exactly the 2 specced files
(usual stray unrelated `.claude/settings.json` permission edit left
uncommitted). No bounces. **Next: Seth's combined smoke of
L1+L2+L2B+A6+L6 (+ the wheel fix)** (verify staging Render redeployed at
`4d82311` first; the L6 block's own manual-verification notes — Slow-3G
weight-to-reps typing test, and pill-appearing-must-not-move-inputs on a
rename — plus a scroll-past-a-focused-Weight/Reps-field check for the new
fix, are the smoke's focus), then L3 -> L4 -> L5, strictly serialized. Release copy in `client/src/data/whatsNew.js` still DRAFT.
**`ui-nav-overhaul` still CLEARED FOR MERGE awaiting Seth's "push to main"
trigger phrase** — the L-wave branch stacks on top of it; reconcile
`logging-ux-wave` after that merge lands.)

---

## Session log (July 5 latest+3 — weight->reps promotion glitch root-caused + fixed, Sonnet)

- **Seth's report:** "still is a little glitchy sometimes when switching
  from weight to reps" - after both L6 (focus handoff, resync echo, pill
  reflow) and the wheel-scroll fix had already landed, so this was a
  residual symptom, not a fresh regression.
- **Root-caused by reading the render branch, not by live repro:**
  `SessionExerciseBlock`'s sets area had two top-level branches at the same
  JSX position - `sets.length === 0` rendered a bare `<div
  className="session-set-rows">` wrapping the draft `SessionSetRow`;
  `sets.length > 0` rendered a `<>` Fragment wrapping the row list plus the
  add-set footer. React's reconciler keys off element TYPE at a given tree
  position before it ever looks at a child's `key` - div vs Fragment is a
  type change, so EVERY draft->real promotion unmounted the whole subtree
  and mounted a fresh one, destroying and recreating the Weight/Reps
  `<input>` out from under the user's keystrokes. L6's rAF
  id-search-and-refocus hack could only refocus a brand-new element after
  the fact; it could never stop the old one from being destroyed first -
  that destruction (not a focus race) was the residual "glitchy" feel.
- **Fixed structurally:** unified both branches under one persistent
  Fragment/div shell (the `sets.length` check now only decides what renders
  INSIDE it), and gave the row that transitions from draft to real (index 0
  of `renderUnits`, non-per-side only - per-side sets never go through a
  draft) a stable key, `session-set-slot-${se.id}`, shared by both its
  draft and real-set renders. Same key + same position + now-same wrapper
  type = React reuses the existing fiber and DOM node across the
  transition instead of remounting. The pre-existing echo-suppressing
  resync effect (added in L6, previously only exercised on later edits)
  now also naturally absorbs the draft->real handoff: it sees the draft
  already matches what the server just echoed back and returns without
  calling `setDraft`, so focus/cursor position are never touched - no hack
  needed at all.
- **Removed the now-dead code in `tryPromote`** (the
  `document.activeElement` id-search + double-`requestAnimationFrame`
  refocus block from L6): with the row never unmounting, it had nothing
  left to do. Left the OTHER piece of L6's promotion logic untouched (the
  in-flight-keystroke patch onto the newly-created set) - that one is
  about syncing the SERVER's copy across the async gap, unrelated to
  DOM/focus identity, still needed regardless of remounting.
- **Verified:** client `npm run build` green; `npm run lint` clean on this
  file except pre-existing, unrelated errors/warnings that predate this
  change (confirmed by their line numbers sitting in untouched code -
  `ActiveSessionContext.jsx`, `ThemeContext.jsx`, `DashboardPage.jsx`, and
  three `set-state-in-effect` findings elsewhere in this same file, none
  touched by this diff). One lint warning WAS caused by this edit
  (`sessionExerciseId` became an unused `useCallback` dependency once the
  dead block was removed) and was fixed by dropping it from the deps
  array.
- **Committed `ae49cbe`** (1 file, +49/-71), pushed, confirmed on
  `origin/logging-ux-wave`. No live browser repro was done this session
  (no staging URL/credentials in hand) - the diagnosis and fix are from
  direct code/render-semantics reading, same precedent as L6's own
  no-repro-needed diagnosis.
- **Not yet done:** Seth's smoke - specifically, re-run the L6 smoke notes
  (Slow-3G weight-to-reps typing test) on `ae49cbe` and confirm the
  glitch is gone; fold into the same pending combined
  L1+L2+L2B+A6+L6+wheel-fix smoke below.

## Session log (July 5 latest+2 — wheel-scroll decimal bug fixed, Sonnet)

- **Seth's report immediately after the L6 push:** "when i go to weight
  too fast it will add a decimal randomly, same for tracked and untracked
  exercises" — the "same for tracked/untracked" phrasing ruled out the
  pill work, pointing at something field-level and independent of L6's
  actual changes.
- **Root cause (code read, no live repro needed):** Chrome/Edge's native
  behavior for a FOCUSED `<input type="number">` is to nudge the value by
  `step` on mouse-wheel/trackpad scroll. Weight (`step="0.01"`) and Reps
  (`step="1"` as of L6) are the only two `type="number"` inputs in
  `SessionDetailPage.jsx` (grep-confirmed). Scrolling the page while one
  of these is still focused (e.g., right after tapping it, mid-flick to
  see more of the screen) silently mutates the value — for Weight this
  reads exactly as "a random decimal appears." This is the same
  underlying mechanism as the old reps decimal bug (`9112eda7`, May,
  logged July 4 latest+10) — that fix only changed reps' `step`, which
  narrowed its exposure but never addressed the wheel behavior itself, and
  never touched Weight at all.
- **Fixed directly** (mechanical one-liner per field, no relay needed):
  `onWheel={(e) => e.currentTarget.blur()}` added to both inputs — a
  scroll over a focused Weight/Reps field now defocuses it instead of
  changing its value. Client build re-verified green. Committed
  (`4d82311`, 1 file, +2), pushed to `origin/logging-ux-wave`.
- **Not yet done:** folded into the same pending combined smoke as L6 (see
  above) — Seth should also try scrolling/flicking past a focused
  Weight/Reps field and confirm the value no longer moves.

## Session log (July 5 latest+1 — L6 landed, Sonnet)

- **Cursor executed `l6-logging-focus-interruptions.md`; Sonnet reviewed
  and committed (`cac5999`, 2 files, +113/-49), pushed to
  `origin/logging-ux-wave`.** Scope exact (the 2 specced files; usual
  stray unrelated `.claude/settings.json` permission edit left
  uncommitted). Client build green. Verified all three fixes by direct
  diff read against the block's root-cause writeup:
  - Focus handoff (`tryPromote`): the `document.activeElement?.id`
    prefix check runs synchronously right after the `await` resolves —
    before React's scheduler actually commits the unmount/remount, so
    the draft field is still focused at check time — then a
    `requestAnimationFrame` (retry once on the next frame, silent
    give-up, never throws) does the actual `getElementById` + `.focus()`
    once the promoted row has committed. `sessionExerciseId` correctly
    added to the callback's dependency array.
  - Resync echo suppression: `echoedKey` computed once, compared against
    the current draft's key; equal -> set `lastSentKeyRef` and return
    with no `setDraft` call; the pre-existing focused-row guard is kept
    unchanged immediately after, for the genuinely-different case.
  - Tracked pill: `session-exercise-tracked-slot` (`inline-grid`) wraps
    an always-rendered hidden sizer (widest "Not tracked" markup,
    `aria-hidden`, no title) plus the real pill, both `grid-area: 1/1`;
    `margin-left: 8px` moved from the pill class to the slot. CSS diff
    is structural-only, no new hex.
  - Reps `step="0.01"` -> `step="1"` confirmed the only such change
    (grep count 1, weight untouched).
  All acceptance-criteria greps re-run and passed; `package.json`
  byte-identical. Clean delivery — no bounces, no reviewer fixes needed.
- **Not yet done:** Seth's combined smoke of L1+L2+L2B+A6+L6 on
  `cac5999` (verify staging Render redeployed at that SHA first) — for
  L6 specifically, the block's manual notes: Slow-3G throttle, type a
  weight on a fresh 0-set exercise, click straight into Reps and keep
  typing (focus/keystrokes must survive the promotion), and rename an
  exercise then click Weight (the pill landing must not shift the
  inputs). L3 dispatches after sign-off (carries the `UserExercise`
  migration — Cursor must NOT run `npm test`).

## Session log (July 5 latest — A6 designed + landed, Fable)

- **Design settled (the escalation's question):** aliases live in VENDORED
  DATA (`server/data/exercise-aliases.json`, alias -> catalog id), not a
  DB table/column (the catalog itself is a vendored file that never
  touches the DB — a migration would be wrong-layer and drags in the
  gated migration track for nothing) and not client-side (L2 already
  enforces no client catalog duplication). Curated + deterministic, NO
  fuzzy matching: a fuzzy false positive silently books volume against
  the wrong muscles; the honesty principle prefers a true "Not tracked".
  One mechanical rule rides along: a trailing-s plural fold (guarded
  against "ss" endings so "press"/"leg press" are safe, and against
  <=3-char strings), applied to catalog names at load AND queries at
  lookup — buys "squats", "push ups", "chin ups", and singular queries
  against plural catalog entries ("seated cable row" -> "Seated Cable
  Rows") without curating every plural.
- **Executed directly by Fable, no relay** (hybrid precedent from July 4:
  block-authoring would cost the same Fable tokens as just doing it, and
  the alias curation is itself the judgment work). 92 aliases, every
  target validated against the catalog by the authoring script (which
  also caught that "Seated Calf Raise" exists verbatim and would have
  been shadowed); `loadCatalog()` re-validates at load with warn-and-skip
  (unknown target / shadows-real-name / duplicate), matching the existing
  collision pattern. `resolveExercise` precedence: exerciseId > exact
  normalized name > alias/fold > unresolved; alias hits report
  `source: "alias"` and carry the target `catalogEntry`, so attribution,
  the resolve endpoint, and the L2B pill all work unchanged.
- **Ambiguity calls recorded in `server/data/exercise-aliases-rationale.md`**
  (same-commit rule, like muscle-weights): "bench press" -> Barbell Bench
  Press - Medium Grip; OHP family -> Standing Military Press; "dip" ->
  Dips - Triceps Version; "pec deck" -> Butterfly; "lunge" -> Dumbbell
  Lunges; etc. Deliberately NOT aliased: bulgarian split squat, pendlay
  row — genuinely missing upstream, aliasing to a neighbor would
  misattribute; they're the motivating cases for L3 custom exercises.
- **Verified:** unit lane 111/111 (8 new resolve tests incl. the pinned
  10-name smoke list at 10/10 and a no-alias-shadows-real-name sweep);
  direct node check: all 10 smoke names + 26 broader colloquial spellings
  resolve to the right canonical ids, gibberish still false. Integration
  lane deliberately NOT run: the endpoint is untouched (pure-function
  change) and `npm test` resets the staging DB — would wipe smoke
  accounts right before Seth's pending sign-off.
- **Committed `3f7fe14`** (6 files: 2 new data/doc, 3 engine, 1 test),
  pushed, confirmed on `origin/logging-ux-wave`. Stray
  `.claude/settings.json` edit left uncommitted per standing precedent.
- **L3/L4/L5 dispatch UNPAUSED** (QUEUE.md updated; A6 NOTE added to the
  L3 block: "resolves against the catalog" now includes alias/fold hits,
  no spec change needed). A6 QUEUE candidate closed out as a pointer.
- **Same session, second ask — L6 authored from Seth's follow-up smoke
  report** ("tracked check can interrupt tapping weight/reps; same thing
  sometimes going weight -> reps"). Fable root-caused three independent
  mechanisms, all in SessionDetailPage.jsx: (1) the 0-set DRAFT set row
  unmounts mid-interaction when its promotion POST resolves (`sets.length`
  0 -> 1 swaps the ternary at ~line 1265 and destroys the reps input the
  user just tapped — data survives via the in-flight-keystroke patch,
  focus does not); (2) the real-row resync effect fires on the server
  ECHO of a flush if the PATCH lands in the blur gap between weight and
  reps (activeElement is body, so the focused-row guard misses); (3) the
  tracked pill renders null -> pill when the async resolve lands,
  reflowing the heading (and re-wrapping it at narrow widths) under the
  user's finger. `l6-logging-focus-interruptions.md` authored + QUEUED
  (MODEL sonnet, 2 files): focus handoff draft -> promoted row via the
  deterministic field ids, echo-equality skip in the resync effect,
  always-rendered fixed-size pill slot (inline-grid + hidden sizer), and
  the pre-existing decimal-reps `step="0.01"` Open TODO folded in (reps
  -> `step="1"`, weight untouched). Dispatch order now L6 -> L3 -> L4 ->
  L5 (L6 collides with L4 on both files, none with L3; landing L6 first
  lets one smoke pass cover the whole stack).
- **Not yet done:** dispatch L6 (Seth points Cursor at it); Seth's
  combined smoke of L1+L2+L2B+A6+L6 once L6 lands (verify staging Render
  redeployed at the reviewed SHA first); then L3 dispatches (carries the
  UserExercise migration — Cursor must NOT run `npm test`; Seth applies
  per RUNBOOK before L4).

## Session log (July 5 earlier — resolution gap found, escalated to Fable, Sonnet)

- **Seth smoked L2B via two phone screenshots** (dropped as Discord-CDN
  `.url` shortcuts in `claudefiledrop/`, fetched directly since the
  folder held only shortcuts, not the actual images): a live session with
  a real "Bench press" exercise showed the dashed "Not tracked" pill —
  same as a gibberish-named exercise ("Sheghdjksishbe") in the same
  session. Visually the pill itself renders correctly for both states;
  the problem is which state "Bench press" gets assigned.
- **Root-caused by reading the resolve chain end to end** (client cache ->
  `POST /exercises/resolve` -> `resolveExercise` -> `loadCatalog`): all of
  it behaves correctly per its own contract. `resolveExercise`
  (`server/src/analytics/resolve.js`) does exact
  `normalizeExerciseName` match against `catalog.byNormalizedName`, built
  straight off `entry.name` in `server/data/exercises.json` with zero
  alias/fuzzy layer. That catalog (873 entries, vendored free-exercise-db)
  simply has no bare "Bench Press" record — only qualified variants
  ("Barbell Bench Press - Medium Grip", "Dumbbell Bench Press", "Machine
  Bench Press", "Bench Press - Powerlifting", etc.).
- **Confirmed the blast radius with a direct node check** against 10
  common colloquial lift names: bench press, squat, deadlift, overhead
  press, pull up, push up, bent-over row, curl, lat pulldown all resolve
  `false`; only "leg press" happened to match a verbatim entry. 9/10
  failure rate on exactly the names a real user types — this is not an
  edge case, it's the common case.
- **This is the standing A6 candidate** ("name-resolution
  backfill/aliasing", QUEUE.md Candidates section, previously noted as
  needing A4 first) — it was already known-missing, just not yet visible
  because L2B is what made the resolved/unresolved status legible enough
  to notice from a screenshot.
- **Put the fork to Seth directly** (escalate now vs. quick alias patch
  vs. continue L-wave and fix later): **Seth chose escalate to Fable now.**
  Per CLAUDE.md's model-split rules this is squarely Fable-tier (data-
  model/matching-strategy judgment, not mechanical) — Sonnet does not
  design the resolution strategy, only flags it clearly and stops.
- **L3 dispatch PAUSED.** L3 (custom-exercises server, `UserExercise`
  table + resolver/attribution overlay) is exactly the kind of unit that
  would compound this gap if built on top of it unresolved — worth
  having Fable weigh in on whether A6 should land before or alongside L3.
- **Not yet done:** a Fable session to design A6 (likely: alias table or
  fuzzy/normalized-substring matching over the existing catalog — schema
  question is whether aliases live in new rows, a new column, or a
  client-side synonym map; Fable's call). Once that's designed and
  queued, L3/L4/L5 dispatch resumes. Seth's L1+L2+L2B mechanical smoke
  sign-off is otherwise clear to give independently of this finding.

## Session log (July 5 later — L2B landed, Sonnet)

- **Cursor executed `l2b-tracked-indicator-visibility.md`; Sonnet reviewed
  and committed (`ef4ac98`, 2 files, +27/-17), pushed to
  `origin/logging-ux-wave`.** Scope exact (the 2 specced files; the usual
  stray unrelated `.claude/settings.json` edit left uncommitted). Client
  build green, server unit lane 103/103 (no server touch, as expected).
  `grep session-exercise-tracked-badge` -> zero hits (old classes fully
  replaced). Package.json byte-identical both sides, no new hex - the
  resolved pill uses the success-token family exactly as specified
  (`--color-success-bg/border/text`, defined for both light and dark),
  the unresolved pill keeps the dashed-border pattern via `color-mix` off
  `--color-text-secondary`. Placement matches spec exactly: indicator
  moved out of the muted `session-exercise-heading-meta` span, now a
  direct sibling before `summaryLine`. **One acceptance-criterion grep
  didn't literally match** (`>Tracked<`/`>Not tracked<` assumes compiled-
  HTML shape; the JSX source has `Tracked`/`Not tracked` as plain text
  children on their own line, not wrapped in `>...<`) — verified by direct
  read instead (both labels present, correctly gated per status), same
  precedent as N1's `tryNavigate` grep-wording mismatch. Not bounced.
  Clean delivery otherwise - no reviewer fixes needed.
- **Not yet done:** Seth's combined smoke of L1 + L2 + L2B on `ef4ac98`
  (per-side toggle, tracked-exercise resolution, and now the pill's
  legibility across palettes x light/dark on both collapsed and expanded
  headings, plus ~360px width wrap behavior). L3 dispatches after
  sign-off — it carries the `UserExercise` migration, so Cursor must NOT
  run `npm test` on it.

## Session log (July 5 — L2B + What's New: skeleton built, two blocks authored, Fable)

- **Seth's two asks this session:** (1) the tracked checkmark AND the
  not-in-database state must be far more obvious to the user; (2) a
  "What's New" feature joins this cycle before anything merges to main —
  Overwatch-patch-notes feel (release date + what changed) but in the
  LogChamp aesthetic/theme, skeleton built now, and Fable personally owns
  the checkmark design (still executed via a Cursor block, per the relay).
- **L2B block authored (`l2b-tracked-indicator-visibility.md`, MODEL
  sonnet):** the 14px glyph tucked in the muted "· N sets" meta text
  becomes labeled status pills rendered as their own element on the
  heading line — "Tracked" (success-token family: bg/border/text, NOT
  accent, so it reads as status rather than something selectable) and
  "Not tracked" (dashed border, muted text — the dashed semantics carry
  over from the old hollow circle). Exact placement, classes, CSS values,
  and the success-vs-accent rationale are written into the block so
  Cursor implements rather than improvises. L4 compatibility preserved:
  all pill markup stays inside `ExerciseTrackedIndicator`, and L4's
  entry-point wording was amended in place to build on the pill.
- **What's New SKELETON built directly by Fable (T3 pattern - structure/
  behavior in-session, visuals to a block), client build green:**
  - `client/src/data/whatsNew.js` — versioned releases array (newest
    first), `LATEST_RELEASE`, `formatReleaseDate`; bumping the top entry's
    `id` is what re-fires the modal per device. Seeded with DRAFT copy for
    this merge train (analytics/logging/navigation/look-and-feel sections)
    — Seth finalizes wording + date at merge time.
  - `client/src/lib/whatsNewStorage.js` — `workoutdb-whats-new-seen`
    localStorage key (rename-boundary compliant; accessor pattern copied
    from `weightUnitPref.js` for later account-level promotion).
  - `client/src/components/whatsnew/` — `WhatsNewGate` (logged-in only,
    fires once per device per release, mounted in `Layout.jsx`),
    `WhatsNewModal` (fixed-overlay pattern from `UsernameRequiredModal`,
    inside #root so no portal/stacking hazard; dismiss = Got it, backdrop,
    Escape, or the see-all link; role=dialog + aria wiring),
    `WhatsNewContent` (one release: date kicker/title/tagline/sections —
    shared by modal + archive page).
  - `client/src/pages/profile/WhatsNewPage.jsx` at `/profile/whats-new` —
    full archive, newest first, profile sub-page pattern (back pill,
    settings-page-title); visiting marks the latest release seen. New
    "What's new" settings row on the Profile hub.
  - `client/src/index.css` — structural rules only under a comment
    explicitly marking them SKELETON for L5 to replace/extend.
- **L5 block authored (`l5-whats-new-visuals.md`, MODEL fable —
  judgment-heavy visual design, same reasoning as T3's visual block):**
  the Overwatch translation — announcement-poster header band, strong
  accent-derived section headers, bullet rhythm, ONE restrained entrance
  (150-250ms, ease-out), archive page as a changelog of posters. Gate/
  storage/dismiss/a11y/data all explicitly off-limits.
- **Dispatch order updated in QUEUE.md: L2B -> L3 -> L4 -> L5, strictly
  serialized** (index.css + SessionDetailPage collisions; L2B before L4
  because L4's entry point builds on the pill). U11 candidate closed out
  as promoted into the wave.
- **Not yet done:** dispatch L2B (Seth points Cursor at it); Seth's
  combined smoke of L1 + L2 + L2B once L2B lands (supersedes the pending
  `0ee1a51` re-smoke — one pass covers all three); everything else in
  Open TODOs unchanged.

## Session log (July 4 latest+10 — L1 blank-toggle bug found + fixed, Sonnet)

- **Seth reported L1 + L2 "changes aren't showing" on the `logging-ux-wave`
  staging deploy**, with two screenshots showing the session-edit form
  displaying `9.98`/`9.99` in the Reps field (docs/smoke-tests/
  L2-DECIMAL-REPS-SMOKE.md, committed this session alongside the images).
- **Decimal-reps triage (code read, no live repro needed):** the Reps
  `<input type="number">` (SessionDetailPage.jsx ~line 883) has
  `step="0.01"`, copied from the adjacent Weight field which legitimately
  needs decimals. The native spinner/mouse-wheel-over-focused-input
  decrements by 0.01 per tick — two ticks down from 10 gives exactly
  `9.99` then `9.98`, matching both screenshots. `git blame` traces this to
  `9112eda7` (May 5, 2026), ~2 months before L1/L2 — confirmed unrelated to
  either feature, would reproduce on `main` too. **Not fixed yet** (out of
  L-wave scope, low severity) — see Open TODOs.
- **The checkmark badge in the screenshots (next to "Set 1") is also
  unrelated** — it's the pre-existing "Saved" sync badge (`f8f3cb0`, April),
  not L2's tracked-exercise indicator. L2's indicator renders in the
  exercise's collapsed heading line ("· N sets ✓"), never in the open
  edit-form view the screenshots showed — so those screenshots couldn't
  have shown it either way.
- **Live-tested both features directly** (Playwright browser, since reading
  code alone couldn't confirm runtime behavior): the documented staging
  smoke credentials (`smoke_b8` / `SmokeTest-B8-2026`) returned 401 — gone,
  almost certainly wiped by the full `npm test` re-run recorded in the
  latest+9 log below (integration lane resets the staging DB on every run,
  a standing AGENTS.md gotcha). Registered a throwaway account
  (`smoke_lwave`) instead to keep testing unblocked.
  - **L2 confirmed working:** naming an exercise "Barbell curl" and
    blurring the field triggered `POST /exercises/resolve` (200) and the
    heading correctly rendered "Tracked - counts toward your analytics"
    with the check icon.
  - **L1 bug found:** toggling `L/R` on while the exercise still had 0 sets
    made the entire sets area render `null` (SessionDetailPage.jsx line
    ~1266, `perSideMode ? null : (<SessionSetRow isDraft .../>)`) — no
    input fields, no visible affordance, indistinguishable from the
    feature not working. The toolbar's "+ Add set" button was still present
    and functional underneath (clicking it correctly created a real
    Left/Right pair against the migrated `side` column) but nothing in the
    empty state pointed at it.
- **Fix applied and pushed (`0ee1a51`):** the `null` branch now renders a
  one-line hint ("Tap \"+ Add set\" above to log your first left/right
  pair.") using the same `session-empty-sets` class as the existing
  completed-session empty state — no new architecture, no CSS, reuses the
  working "+ Add set" control. Client `npm run build` re-verified green.
  Committed separately from the original L1 unit for a clean scope
  boundary; pushed straight to `origin/logging-ux-wave` (`11a9f0e..0ee1a51`,
  confirmed via `git log origin/logging-ux-wave`).
- **Not yet done:** Seth's re-smoke of L1 (retry the L/R toggle on a fresh
  exercise, confirm the hint + "+ Add set" now reads as working) and L2
  (check the collapsed-heading checkmark, not the open edit form) on
  `0ee1a51`. L3 dispatches after this sign-off, same as before.

## Session log (July 4 latest+9 — L1 landed + migration applied to staging, Sonnet)

- **Cursor executed `l1-unilateral-side-logging.md`; Sonnet reviewed and
  committed (`4ae0fbf`, 6 files, +470/-56), pushed to
  `origin/logging-ux-wave`.** Scope exact (the 6 specced files, plus the
  new hand-authored migration file; same stray unrelated
  `.claude/settings.json` edit left uncommitted as before). Server unit
  103/103, client build green (the only two lanes safe to run before the
  migration existed anywhere - integration deliberately NOT run yet, per
  the block's own gate). Schema diff is exactly the one `side String?`
  line; migration.sql is exactly one `ALTER TABLE` statement. Delivered:
  `validateOptionalSide` follows the codebase's existing optional-field
  validator pattern; per-side mode derives reactively from
  `manualOverride ?? (anySetHasSide || /\bsingle\b/i.test(name))` so the
  name-based trigger re-derives for free on every name commit with no
  special-case code; set-count control and add/remove operate on L/R
  pairs (`groupSetsIntoRenderUnits` degrades an odd trailing row to a
  plain labeled row rather than crashing); the Right-weight autofill on
  Left blur reuses the PRE-EXISTING focus-guard effect (row skips
  resyncing from the `set` prop while it contains focus) - so "must not
  steal focus" came for free from infrastructure already in place, not
  new code. CSS tokens-only, no hex. Clean delivery - no bounces, no
  reviewer fixes needed.
- **CRITICAL SEQUENCING FLAG caught in review (before any deploy):** the
  controller unconditionally includes `side` (defaulting to `null`) in
  EVERY set-creation call, not just per-side sets. Once `prisma generate`
  regenerates the client with the new field, ANY set creation - not just
  the new feature - would 500 against a database missing the `side`
  column (Postgres "column does not exist"). This is the exact
  code-ahead-of-DB hazard from the June 8 incident, but sharper here:
  normal logging breaks app-wide, not just the new surface. Flagged to
  Seth before any Render repoint.
- **Migration applied to STAGING, done by Seth manually (browser agent,
  RUNBOOK "Schema-change deploy"):** confirmed host `noisy-surf` /
  `ep-bitter-breeze-am81izlh` throughout, never touched
  `snowy-resonance` / `ep-solitary-sea-an56mioq` (prod). `ALTER TABLE
  "WorkoutSet" ADD COLUMN "side" TEXT;` run, `_prisma_migrations` row
  inserted with checksum `0dea47c048f0d8db874880e3a32200d0da46c09e0eac1769e83dbe7eb312308c`
  (SHA-256 of the committed migration.sql, confirmed to be pure-LF/49
  bytes so the hash is checkout-independent), column verified present via
  `information_schema.columns`. Staging Render (`workout-db-staging`)
  repointed from its prior branch to `logging-ux-wave`, redeployed at
  `4ae0fbf`.
- **Independently re-verified by Sonnet after Seth's report (verify-
  before-trust):** `npx prisma migrate status` against staging ->
  "Database schema is up to date!", 13 migrations, zero drift (confirms
  the manually-inserted checksum was accepted cleanly). Full `npm test`
  (both lanes) re-run fresh -> **16 suites / 143 tests, all green**,
  including the L1 side-round-trip integration test (create with
  `side:"L"` round-trips, `side:"X"` -> 400, PATCH `side:null` clears it)
  now running for real against the migrated column, and L2's
  `/exercises/resolve` tests still green alongside it - no regression
  from the schema change.
- **Not yet done:** Seth's visual/manual smoke of L2 (tracked indicator)
  + L1 (per-side logging: name-trigger, L/R toggle both ways, pair
  add/remove, weight autofill L->R, non-per-side flow unchanged) on the
  `logging-ux-wave` Render+Vercel staging deploy. **L3 dispatches only
  after that sign-off** (L3 also carries a migration - `UserExercise`
  table - so the same code-ahead-of-DB discipline applies again).

## Session log (July 4 latest+8 — L2 landed, Sonnet)

- **Cursor executed `l2-tracked-exercise-indicator.md`; Sonnet reviewed and
  committed (`f66f9ea`, 6 files, +293/-12), pushed to
  `origin/logging-ux-wave`.** Scope exact (the 6 specced files; one stray
  unrelated `.claude/settings.json` permission-list edit found in the
  working tree, left uncommitted/unstaged as out of scope, same precedent
  as the N3 stray edit). Server unit lane 103/103, client build green,
  integration lane re-run fresh (3/3: 401 unauthenticated, 400 on
  `names: []`, happy path resolving a real catalog name + rejecting a
  fake one) - confirmed no pending migrations, safe per the block's own
  note. Delivered: `POST /exercises/resolve` (batched, `authRequired`,
  caps at 100 names, imports `resolveExercise` from
  `server/src/analytics/resolve.js` - engine untouched); client
  `exerciseApi.js` mirrors `analyticsApi.js`'s shape; SessionDetailPage
  gained a module-level resolution cache (keyed by trimmed-lowercase
  name, survives session navigation) populated by one batched call per
  session load plus a single-name re-resolve after `onExerciseCommitted`;
  quiet check-circle (resolved) / hollow dashed circle (unresolved)
  indicator via inline SVG, tokens-only color-mix off
  `--color-interactive`/`--color-text-secondary`, network failures render
  no indicator rather than a wrong one. The acceptance grep
  (`normalizeExerciseName\|exercises.json` in `client/src`) found one hit
  in `smartWorkoutName.js` - verified pre-existing and unrelated (a
  different, unchanged helper for smart session-naming, not catalog
  duplication) - not a violation. Clean delivery - no bounces, no
  reviewer fixes needed.
- **Not yet done:** dispatch L1 (`l1-unilateral-side-logging.md`) - Cursor
  must NOT run `npm test` on it (parks an unapplied `WorkoutSet.side`
  migration that pretest would silently apply).

## Session log (July 4 latest+7 — L-wave authored + misc fixes, Fable)

- **Seth's batch of five asks, split hybrid at his choice** (Fable does the
  tiny items directly, authors blocks for the big ones - cheaper than
  full-relay for small items since block-authoring costs ~the same Fable
  tokens as just doing them):
  1. Unilateral "single" logging -> L1 block
  2. Tracked-workout indicator -> L2 block
  3. Custom exercise creation (name + per-muscle intensity) -> L3+L4 blocks
  4. Profile sub-page back button too small -> fixed directly
  5. "Is feedback actually going somewhere?" -> audited directly
- **New branch `logging-ux-wave`** off `ui-nav-overhaul` HEAD (`516d249`) -
  NOT off main, because the fixes touch N2's profile sub-pages which don't
  exist on main yet. After the pending ui-nav-overhaul -> main merge, this
  branch fast-forwards cleanly over it.
- **Back-link fix (direct):** `.settings-page-back` restyled from a muted
  small text link to a tappable pill chip (border + `--color-nav-active-bg`
  fill + focus ring off `--color-interactive`, matching the range-chip
  pattern); dropped the `muted small` classes on the three profile
  sub-pages. Tokens only. Client build green.
- **Feedback pipeline audit (no code change needed):** submissions POST to
  `/api/feedback` -> `Feedback` table in whichever DB the deployed server
  points at; reviewers read them at `/dev/feedback` (reviewer-gated both
  ends). Code is sound. THE GAP IS CONFIG, not code: `client/.env` (which
  holds `VITE_FEEDBACK_REVIEWER_EMAILS`) is NOT committed, so the Vercel
  build only shows Seth the Dev feedback row if that var is set in the
  Vercel dashboard; likewise the server check needs
  `FEEDBACK_REVIEWER_EMAILS` set in Render's env (both prod + staging
  services). 30-second self-test for Seth on prod: open Profile - if the
  "Dev feedback" row is visible, the Vercel var is set; click it - if
  entries load (not a 403), the Render var is set too. Both vars =
  `sethjknisel@gmail.com` (matching is case-insensitive).
- **L-wave authored + QUEUED (all MODEL: sonnet, MODE: 1-relay), dispatch
  strictly serialized L2 -> L1 -> L3 -> L4** (order rationale + per-unit
  scope in QUEUE.md). Two gated migrations ride this wave: L1 adds
  nullable `WorkoutSet.side` ("L"/"R"), L3 adds the `UserExercise` table
  (per-user custom exercises with primary/secondary muscle designations
  feeding the engine's existing fallback attribution math). Cursor is
  forbidden from running `npm test` in L1/L3 (pretest would auto-apply
  the parked migrations to staging); Seth applies each per RUNBOOK before
  the next unit needs it. Seth settled the "single" ambiguity: it means
  UNILATERAL per-side L/R entry (not 1-rep singles), right side defaults
  its weight from the left.
- **Not yet done:** dispatch (starts with L2 once Seth points Cursor at
  it); Seth's visual smoke of the back-link pill on the branch Vercel
  deploy; the two env-var checks above; and the still-pending
  ui-nav-overhaul merge (item 0 below).

## Session log (July 4 latest+6 — Fable pre-main review of ui-nav-overhaul)

- **Seth smoked N3 on the branch Vercel deploy — passed** (with N1/N1b/N2
  already passed, the whole N-wave has visual sign-off).
- **Fable pre-main branch-diff review DONE (the v3 mandated gate).** Full
  `main...ui-nav-overhaul` diff (20 files, +1490/-380) read against all four
  task blocks. Verified: N1 guard extraction is behavior-identical (every
  Navbar per-link handler maps exactly onto `guardedClick`'s end/prefix
  short-circuits); N2 sub-pages are verbatim extractions (markup, state,
  API calls) and `profileStats` matches its weekStreak contract; N3 is a
  pure JSX reorg with the fetch effect untouched (`[weeks]` deps). Cross-
  cutting: zero hex in added CSS (the one rgba box-shadow matches 12
  pre-existing occurrences); `.workout-tab::before` exists ONLY as a
  dark-theme rule, so N1b's single dark override is complete scene-lift
  coverage; both `body::before` base rules precede the lift override (and
  `:has` outranks them on specificity anyway); the sticky-top override
  correctly follows its base rule; all Layout routes are ProtectedRoute
  (Login/Register live under AuthLayout), so the mobile chrome rules are
  effectively logged-in-only. Re-ran both lanes fresh: client build green,
  server unit 103/103.
- **One reviewer fix (`3a1a7fc`, pushed):** the profile hub gated its
  stat-tile em-dash placeholder on bare `sessionsLoading`, but
  ActiveSessionContext re-enters loading on every 20s background poll —
  all three tiles flashed to dashes every 20 seconds while sitting on
  /profile. Now gated on loading AND `sessions.length === 0` (initial load
  only). Root cause was the N2 block's own wording ("while loading render
  an em dash"), not a Cursor error.
- **Two accepted nits, recorded not fixed:** (1) on the live session detail
  page `.app:has(.persistent-workout-bar) .main` still adds its +64px pill
  clearance even though the pill itself is hidden there (the bar is in the
  DOM inside the display:none wrap, so `:has` matches) — ~64px of extra
  scroll headroom above the finish dock, invisible in practice; (2) a
  cold direct load of /profile can paint one frame of "0" before the
  provider's effect flips loading true — unreachable in practice since the
  provider fetches at app mount, well before /profile can be visited.
- **VERDICT: cleared for merge.** Nothing ships to main without this pass;
  it has now happened. Merge stays gated on Seth's "push to main" verbatim
  (then one command at a time per the gate). No schema/migration coupling
  anywhere in the N-wave (client + docs only).

## Session log (July 4 latest+5 — N2 smoked, N3 landed, Sonnet)

- **Seth smoked N2 on the `ui-nav-overhaul` Vercel deploy — passed.**
  Confirmed N3 does not touch analytics engine/data, only page layout. N3
  dispatched immediately after.
- **Cursor executed `n3-analytics-subviews.md`; Sonnet reviewed and
  committed (`f5767f8`, 3 files, +102/-4), pushed to
  `origin/ui-nav-overhaul`.** Scope exact (the 3 specced files, nothing
  extra - one unrelated stray edit to `.claude/settings.json` found in the
  working tree, left uncommitted/unstaged as out of scope, flagged to
  Seth separately); client build green; no new hex in the CSS diff; the
  fetch `useEffect`'s dependency array confirmed still `[weeks]` only (grep
  verified) so switching views triggers no refetch; `client/package.json`
  and every other file under `client/src/components/analytics/` untouched.
  Delivered: `AnalyticsViewTabs.jsx` (page-level segmented control, same
  aria pattern as `ChartTableToggle`, active cell via `--color-nav-active-bg`
  / `color-mix`); `AnalyticsPage.jsx` restructured so `view` lives in
  `?view=` via `useSearchParams` (`parseAnalyticsView` defaults any
  unknown/absent value to `muscles`, `setSearchParams(..., { replace: true
  })` so switching tabs doesn't spam history), StatTiles + tabs persistent
  above the swapped body (muscles -> PerMuscleSection + BalanceSection,
  strength -> PerExerciseSection, execution -> ExecutionSection),
  DataQualitySection always last on every view; empty-range state still
  replaces tabs + body with the single empty card. Clean delivery - no
  bounces, no reviewer fixes needed.
- **N-wave is now fully landed on `ui-nav-overhaul`** (N1 `d266242`, N1b
  `b366e17`, N2 `4dcd829`, N3 `f5767f8`) - all four units in, nothing left
  queued for this branch.
- **Not yet done:** Seth's visual smoke of N3 (view switching via tabs,
  `?view=strength`/`?view=execution` deep-links, `?view=bogus` falls back to
  muscles, range-chip refetch preserves the selected view, empty-range state
  still shows no tabs). After sign-off: the Fable/Opus pre-main
  branch-diff review (mandated by the v3 workflow, not optional) before any
  merge to `main` - gated on Seth's "push to main" trigger phrase as always.

## Session log (July 4 latest+4 — N1b smoked, N2 landed, Sonnet)

- **Seth smoked N1b on the `ui-nav-overhaul` Vercel deploy — passed.** No
  critiques recorded; N2 dispatched immediately after.
- **Cursor executed `n2-profile-hub.md`; Sonnet reviewed and committed
  (`4dcd829`, 9 files, +652/-273), pushed to `origin/ui-nav-overhaul`.**
  Scope exact (the 9 specced files, nothing extra); client build green;
  `client/package.json` byte-identical; no new hex in the CSS diff (the one
  `rgba(15, 23, 42, ...)` box-shadow matches the pre-existing established
  pattern used elsewhere in `index.css`, not a new token violation).
  Delivered: `ProfilePage.jsx` is now the hub (initials avatar, name/email,
  "Member since" from `createdAt`, 3 stat tiles wired to
  `useActiveSession()` with em-dash loading placeholders, settings rows to
  the three sub-routes + conditional Dev feedback row, logout footer
  unchanged); `AppearancePage.jsx`/`SecurityPage.jsx`/`FeedbackPage.jsx` are
  verbatim extractions of the old ProfilePage sections (confirmed by diff
  against the pre-N2 file — identical class names, state logic, and API
  calls), each with a `← Profile` back link; `profileStats.js`
  (`countCompleted`/`countThisWeek`/`weekStreak`, Monday-based local weeks)
  verified by direct node eval against all 5 of the block's acceptance
  assertions (3/2/1/0-streak cases + the last-Sunday exclusion), all passed;
  `reviewerEmails.js` centralizes `parseReviewerEmails` — grep confirms it
  only lives there, Navbar's diff is a pure import swap (`canReviewFeedback`
  in, local parser out), zero behavior change. Copy fix verified: "Help
  improve LogChamp." present in `FeedbackPage.jsx`, old "WorkoutDB." string
  gone repo-wide. Clean delivery — no bounces, no reviewer fixes needed.
- **Not yet done:** Seth's visual smoke of N2 on the branch Vercel deploy
  (hub layout, stat tile values against real seeded data, sub-route back
  links, Dev feedback row gating). N3 dispatches after sign-off.

## Session log (July 4 latest+3 — N1b landed, Fable)

- **Cursor executed `n1b-mobile-chrome-fix.md`; Fable reviewed and committed
  (`b366e17`, 5 files, +129/-12), pushed to `origin/ui-nav-overhaul`.**
  Scope exact (the 5 specced files); client build green; no hex in added
  CSS; `client/package.json` untouched; every acceptance grep verified by
  direct diff read. Delivered: scene-band bottom-inset lifts (both placed
  correctly AFTER their inset:0 base rules), `.app:has(.bottom-nav) .nav`
  mobile hide, Home masthead (crown/wordmark/date, mobile-only), shared
  `.settings-page-title, .page-title` declaration on the three tab h1s,
  frosted resume pill + empty-wrap fix + live-session-page hide.
- **One reviewer fix:** the `--session-sticky-top` mobile override was DEAD
  as delivered - placed in the media block at ~line 692, but the base rule
  (`.session-detail-page { --session-sticky-top: 64px }`, ~line 2716) comes
  later in source order at equal specificity, so 64px won. Relocated the
  override to immediately after the base rule with a comment. Root cause
  was the BLOCK's own placement instruction (Fable spec imprecision), not
  a Cursor error - the block even warned about this exact hazard for the
  scene rules but missed it for this one.
- **Not yet done:** Seth's visual smoke of N1b on the branch Vercel deploy.
  Checklist: scene band flush on the tab bar (all palettes x dark, Home +
  a global-scene page like History), no top bar when logged in, masthead
  renders (crown tinted per palette), page titles consistent, resume pill
  while a workout is live (frosted, single line, band reads through),
  desktop unchanged, and the flagged finish-dock-covers-tabs question.

## Session log (July 4 latest+2 — N1 smoke critiques -> N1b authored, Fable)

- **Seth smoked N1 on the ui-nav-overhaul Vercel deploy.** Bottom tab bar
  ACCEPTED as-is ("absolutely beautiful" - do not restyle it). Two
  critiques: (1) the fixed bar buries the palette scene band (every scene
  anchors `center bottom` of the viewport, so the artwork's best part sits
  behind the frosted bar); (2) the slimmed mobile top bar is dead chrome
  (~30px strip, tiny brand, every page already opens with its own h1).
- **Review also found a pre-existing defect:** `.persistent-workout-bar-wrap`
  (index.css ~4098) paints an empty ~19px strip + border on every page even
  with no live workout (the inner bar returns null, the wrap always renders).
- **Three design forks put to Seth and settled:**
  1. Mobile top: NO top bar when logged in (hidden via
     `.app:has(.bottom-nav) .nav` so logged-out Layout pages keep Login/
     Register) + Home masthead (crown + wordmark + date, mobile-only) +
     `.page-title` standardization on History/Programs/Analytics h1s
     (shares the `.settings-page-title` declaration - the one intentional
     desktop-visible change).
  2. Scene band: LIFTED flush above the tab bar on mobile (bottom-inset
     override on both fixed scene pseudo-elements; source-order matters
     since the base rules set `inset: 0` - overrides placed after them).
  3. Live-workout bar: slim frosted single-line pill docked directly above
     the tab bar on mobile (Spotify pattern; translucent so the band reads
     through while live; hidden on the live session detail page where the
     finish dock owns the bottom). Seth specifically flagged the docked bar
     must not re-bury the scenery - hence pill + frost, not a full card.
- **`docs/tasks/n1b-mobile-chrome-fix.md` authored + QUEUED (MODEL: sonnet).
  Dispatch order is now N1b -> N2 -> N3** (all touch index.css, still
  strictly serialized). N2 has no collision with N1b (its only Navbar touch
  is the reviewerEmails import swap; N1b touches Navbar zero - all CSS).
- **Flag for the next smoke, not in N1b's scope:** during live logging the
  `.session-finish-dock` (fixed, z-index 40, bottom 0) fully covers the
  bottom tab bar - plausibly good (focus mode; the nav guard intercepts
  anyway) but Seth should confirm it reads as intended on device.

## Session log (July 4 latest+1 — N1 bottom tab bar landed, Sonnet)

- **Branch `ui-nav-overhaul` created off post-T3 `main` (`47bec4a`), pushed.**
  Also pushed the docs-only `47bec4a` commit itself to `origin/main` at
  Seth's explicit request (N-wave task-block authoring, no functional
  change).
- **Cursor executed `n1-bottom-tab-bar.md`; reviewed and committed
  (`d266242`, 5 files, +238/-88), pushed to `origin/ui-nav-overhaul`.**
  Scope exact match (the 5 expected files, nothing extra); client
  `npm run build` green; no hex in the new CSS; `client/package.json`
  byte-identical; guard logic (`isSessionDetailPath`, `confirmLeaveLiveSession`
  calls) consolidated into exactly one file, `client/src/lib/
  useGuardedNav.js`; Navbar's desktop DOM/behavior confirmed unchanged by
  direct diff read (all five links now route through `guardedClick(...)`
  instead of inline per-link handlers, zero behavior change). `BottomNav.jsx`
  renders the 5 tabs in spec order (Home/Analytics/History/Library/Profile)
  with the exact icon paths and end/prefix matching from the block.
  `.bottom-nav` hidden at `min-width: 720px`, uses
  `env(safe-area-inset-bottom)`, `.main` gets the mobile bottom padding via
  the shared `--bottom-nav-height` custom property; `.workout-tab.stack`'s
  mobile min-height adjusted to account for both bars.
  **One acceptance-criterion string didn't literally match:** the block's
  `grep -n "tryNavigate" client/src/components/layout/Navbar.jsx` expects a
  literal hit, but Navbar only calls `guardedClick` (which internally calls
  `tryNavigate` inside the hook) — the substantive intent (single guard
  location, hook-based extraction, zero behavior change) is satisfied and
  verified independently by reading the diff; treated as spec-wording
  imprecision, not bounced.
- **Not yet done:** Seth's visual smoke on the `ui-nav-overhaul` Vercel
  deploy (mobile bottom bar across viewports/palettes, desktop nav
  untouched) before N2 dispatches — N1/N2/N3 stay strictly serialized since
  all three touch `client/src/index.css`.

## Session log (July 4 latest — N-wave navigation overhaul authored, Fable)

- **Seth's ask: overhaul how the app's tabs/layout are used, rework the
  Profile section, and give the Analytics page real organization.** Four
  design forks put to Seth and settled (all recommended defaults accepted):
  1. **Bottom tab bar on mobile** (< 720px), slim brand-only top bar;
     desktop (>= 720px) top nav unchanged. The app-standard tracker
     pattern (thumb reach mid-set); the anti-goal is out-featuring
     Strong/Hevy on logging UX, not matching table-stakes ergonomics.
  2. **Tab order: Home · Analytics · History · Library · Profile** —
     Analytics promoted to slot 2 (it's the differentiator), Library
     demoted, Profile becomes a first-class 5th tab. "Workout" tab label
     renamed to "Home" (display text only).
  3. **Profile becomes a hub**: identity header (initials avatar, name,
     member-since from `/auth/me` `createdAt` — already in the payload,
     `sanitizeUser` strips only `passwordHash`), stat strip (workouts /
     this week / week streak, all client-derived from `/sessions/mine`),
     drill-in sub-routes for Appearance / Security / Feedback, logout
     footer. NO server changes anywhere in the wave.
  4. **Analytics reorganized into segmented sub-views**: persistent header
     (range chips + StatTiles) + Muscles | Strength | Execution segmented
     control, sub-view in `?view=` for deep-linking, DataQualitySection
     always visible (honesty contract). No "Overview" sub-tab — Home's
     weekly report already is the overview.
- **Three unit-scale task blocks authored and QUEUED** (all MODEL: sonnet,
  MODE: 1-relay): `n1-bottom-tab-bar.md` (BottomNav + shared
  `useGuardedNav` hook extraction + exact inline SVG icon paths provided
  in-block), `n2-profile-hub.md` (hub + 3 extracted sub-pages +
  `profileStats.js` pure helpers with a testable weekStreak contract +
  `reviewerEmails.js` extraction), `n3-analytics-subviews.md`
  (AnalyticsPage JSX reorg + AnalyticsViewTabs component; section
  components untouched). **Dispatch strictly serialized N1 -> N2 -> N3**
  — all three touch `client/src/index.css` (the U-wave lesson). Start the
  wave on a fresh branch off post-T3 `main` (suggest `ui-nav-overhaul`).
- Concurrent-session note: the T3 merge to main (`750c42b`) happened in a
  parallel Sonnet session while this session was authoring; HANDOFF/QUEUE
  edits were reconciled against ground truth (`origin/main` = `3a5e0c0`)
  before committing.

## Session log (July 4 earlier — T3 landed on ui-loading-screens, Sonnet)

- **Cursor executed `t3-dynamic-loading-screens.md`; reviewed and committed
  (`de03801`, 11 files, +162/-10), pushed to `origin/ui-loading-screens`.**
  Scope exact match to the block (the 10 expected files, nothing extra);
  `LoadingState.jsx`'s `useDelayedReveal` hook and props signature
  byte-identical to before (JSX-inside-branches + CSS only, confirmed by
  diff); `grep slowLabel="Waking up the server…"` hits exactly the 10
  expected call sites; no hex introduced; `client/package.json` unchanged;
  `npm run build` re-run green. Delivered: `tone="soft"` gets a subtle
  pulsing three-dot indicator (`loading-state__dots`, 1.2s cycle, color off
  `--color-interactive` via `color-mix`); `tone="page"` gets a breathing
  accent ring (`loading-page__mark`/`__ring`, 1.4s cycle) plus a
  cross-faded swap between `label` and `slowLabel` on the 4s escalation
  (opacity transition via `--motion-base`/`--ease-standard`, no layout
  jump - `loading-page__text-wrap` reserves space for both strings).
  `tone="card"` untouched as instructed. No dark-mode-specific override
  needed - all new colors route through existing theme-aware custom
  properties, so the token indirection alone covers both modes.
- **Seth visually smoked the Vercel preview of `ui-loading-screens` and
  signed off** (pulsing dots / breathing ring / label cross-fade all
  confirmed rendering as intended); triggered "push to main" verbatim.
  Merged fast-forward to `main` at `750c42b` (see Repo/deploy state above)
  - not a worktree merge, no conflicts, ran one command at a time per the
  gate (checkout main -> merge --ff-only -> push, each with explicit
  approval). Branch `ui-loading-screens` is now fully contained in `main`;
  deletable whenever Seth wants to ask for that gated op.
- **Open follow-up:** confirm the prod Render + Vercel deploy SHA reads
  `750c42b` in their Events tabs once they redeploy - not yet verified this
  session (see Open TODOs).

## Session log (July 4 later — T3 dynamic loading screens: skeleton built, Sonnet)

- **Seth's call for this session: Sonnet builds the T3 skeleton directly
  (not Fable) and authors the Cursor task block itself** - an explicit
  one-off departure from the v3 default (Sonnet doesn't normally author
  blocks); T3 was judged easy/mechanical enough not to need Fable's
  judgment pass first.
- **Timing skeleton DONE, build-verified, not yet committed:**
  `client/src/components/LoadingState.jsx` gained a local
  `useDelayedReveal(enabled, delayMs, slowMs)` hook implementing the cold-
  start spec from `WORKOUTDB_MASTER_PROMPT_17.md` ("Motion / loading"):
  nothing renders for the first 400ms (fast/cached loads never flash a
  loader), and after 4s more the displayed text swaps to an optional new
  `slowLabel` prop (the honest "still waking up" case). New `tone="page"`
  branch added (`.loading-page` / `.loading-page__text`, bare/centered,
  structural only - deliberately unstyled beyond layout) for the cold-start
  full-tab case, distinct from the existing compact inline `tone="soft"`
  and the untouched `tone="card"`. `ProtectedRoute.jsx` (the actual
  cold-start gate - first thing a user sits on while Render wakes up) now
  uses `tone="page"` with `slowLabel="Waking up the server…"`. Existing 9
  call sites unchanged/backward-compatible (prop defaults preserve old
  behavior). `client/npm run build` green.
- **Visual/animation layer handed to Cursor:** `docs/tasks/
  t3-dynamic-loading-screens.md` authored and QUEUED (MODEL: fable - this
  is genuinely judgment-heavy visual design, not mechanical). Scope: design
  the actual animated/satisfying treatment for the `soft` and `page` tones
  (token-only, all 4 palettes x 2 modes, restrained per the anti-goal on
  over-built motion), plus wire `slowLabel="Waking up the server…"`
  (exact string) onto the remaining 9 `<LoadingState>` call sites. Timing
  logic (`useDelayedReveal`, the two constants, the component's prop
  signature) is explicitly off-limits to Cursor - JSX-inside-branches and
  CSS only.
- **Not yet done this session:** committing the skeleton changes (3 files:
  `LoadingState.jsx`, `ProtectedRoute.jsx`, `index.css`) - do this before
  dispatching the task block so Cursor's diff lands on top of a clean base.
  QUEUE.md's Active section updated to list T3; moved out of Candidates.
## Session log (July 3 latest+2 — relay v3: model split rebalanced, Fable)

- **Division of labor rebalanced (Seth's call, token-efficiency harmonization),
  now codified in CLAUDE.md ("v3 - Sonnet resident, Fable gated"):**
  - **Sonnet in Claude Code becomes the resident driver:** per-unit light
    review (re-run test lanes + build, scope vs FILES TO TOUCH, acceptance
    spot-checks), commits with SHA verification, staging pushes, HANDOFF +
    QUEUE upkeep, dispatch. Sonnet never authors blocks and never settles
    contract ambiguity — it escalates.
  - **Fable/Opus drops to two jobs:** authoring unit-scale task blocks (a
    wave per session, then drop out), and ONE thorough review of the full
    accumulated branch diff before any merge to main. Standing escalation
    triggers: schema/migration design, security/isolation surfaces, prod
    incidents, root-cause Sonnet can't close, spec-vs-delivery conflicts.
  - **Cursor stays the hands**, now on Sonnet or cheaper per the block's
    MODEL header (Fable-in-Cursor no longer the default).
  - **Accepted trade-off (do not silently "fix"):** deep review moves from
    per-unit to the pre-main gate; Sonnet's per-unit pass is the tripwire,
    Fable's pre-main review is the net. Merge still gated on Seth's
    "push to main" trigger phrase.
- Model facts behind the call (from the API skill, July 3): Fable 5 is a
  Mythos-class tier ABOVE Opus 4.8 ($10/$50 per MTok vs $5/$25); Sonnet 5
  is $3/$15 with near-Opus coding/agentic quality — a Fable session burns
  roughly 3x the quota of the same session on Sonnet. Fable and Sonnet are
  NOT interchangeable; the plan works because judgment stays on Fable and
  well-specified execution + bookkeeping move to Sonnet.
- Workflow-change log appended to `docs/specs/poor-mans-agentic-workflow.md`.
- **Next session should run on Sonnet** (this is the handoff): its first
  jobs are whatever falls out of Seth's U10/U8/U9 staging smoke, under the
  new v3 rules. No code changed this session — docs only.

## Session log (July 3 latest+1 — U10/U8/U9 all landed `d21608c`, Claude Code)

- **Cursor executed U10, U8, AND U9 in one working tree** instead of the
  planned one-at-a-time dispatch. Since the files were already mixed
  (index.css and AnalyticsPage.jsx overlap across units), reviewed the
  combined tree against all three blocks and committed as ONE commit
  (`d21608c`, 8 files, +683/-135), pushed to `origin/analytics-engine`.
  Scope was exact (union of the three FILES TO TOUCH lists, no extra
  files); client build green; no hex in new CSS; no new deps; HOW_BALANCE
  copy verified against the engine's PUSH/PULL/QUAD/HAM group constants.
- **Six reviewer fixes applied on top of Cursor's delivery:**
  1. `formatPlanActual` printed "100.0 lbs" — failed U9's own acceptance
     string ("@ 100 lbs"); weights now go through the strip-trailing-.0
     formatter. (Cursor CLAIMED this criterion passed — it did not.
     Verify-before-trust earns its keep again.)
  2. Verdict clause trimming: newsy clauses now outrank on-plan filler —
     "hit every planned set and on-plan loads" was crowding out a real
     >=1-rep effort drift, the only news in that row.
  3. Sparkline dots: `<circle>` under `preserveAspectRatio="none"`
     stretches into ellipses (only the line had non-scaling-stroke); dots
     are now zero-length round-cap strokes with non-scaling-stroke.
  4. Single-session sparkline: dot centered (was pinned to left edge) and
     the identical first/latest value no longer prints twice.
  5. Volume-trend last-week label was absolutely positioned past the right
     edge of the chart grid (would overhang the card border on every row);
     moved to a fixed 34px third grid column so rows stay aligned and
     nothing overflows.
  6. `EffortDriftCompact` rendered "stopped ~0 reps early sandbagging" for
     sub-rep drifts (e.g. +0.3); those now read "on target (+0.3 RIR)".
     Plus the U10-adjacent tone fix: the sets-delta tone now derives from
     the ROUNDED delta so "+0.04" can't print "same as last week" in green.
- **Acceptance evidence:** all U9 verdict/format strings verified by
  direct node eval (6/6 pass, including the fixed weight case); client
  `npm run build` green; U10's `align-content: start` in place with
  `min-height` byte-identical.
- **Next: Seth smokes the whole wave on the staging Vercel deploy of
  `d21608c`** (home: hero dead space gone, set counts clean; analytics:
  Bars|Trend|Table toggle, sparklines, execution planned-vs-did line +
  verdict, balance zone band + ghost tracks — across palettes x modes).
  After sign-off: the deferred analytics-engine -> main merge decision.

## Session log (July 3 latest — U7 smoke feedback -> U10 queued, Claude Code)

- **Seth smoked U7 on the staging Vercel deploy** (screenshot committed:
  `docs/smoke-tests/images/u7-home-weekly-report-champ-dark-staging.png`).
  Verdict: weekly report band ACCEPTED; two critiques:
  1. **Start Workout hero renders a big dead-space block** inside its
     border. Root-caused by Claude Code (not a hero bug): `.stack` is
     `display: grid`, and `.workout-tab.stack` has
     `min-height: calc(100dvh - 7.5rem)` — grid's default
     `align-content: stretch` distributes the spare viewport height into
     the card rows, and the hero (least content) shows it worst. Fix =
     `align-content: start` so spare space collects at the bottom under
     the scene band. Pre-U7 this stretch existed but read as intentional;
     the third row (weekly report) changed the distribution.
  2. Weekly report set counts print needless decimals ("29.0",
     "-3.0 vs last week") + the accepted "+0.0" tiny-delta nit.
  Both folded into **U10 (`docs/tasks/u10-home-hero-dead-space.md`),
  QUEUED, MODEL auto/cheap** (fully pre-diagnosed, mechanical).
- **Analytics-tab critique ("looks untouched") needs no new authoring** —
  correct observation, U8/U9 simply haven't been dispatched yet; they ARE
  the full analytics update (volume trend view + e1RM sparklines;
  execution concrete-comparison rework + balance polish).
- **Dispatch order set: U10 -> U8 -> U9, strictly serialized** (all three
  touch `client/src/index.css`); Seth smokes each on the staging deploy
  after it lands before dispatching the next.

## Session log (July 3 later — U7 landed + smoke-workflow change, Claude Code)

- **U7 (Home weekly report band) reviewed + committed (`f22989d`) + pushed.**
  Cursor delivered to spec: `WeeklyReport.jsx` self-fetching two parallel
  non-overlapping summary windows (today-6d..today vs today-13d..today-7d),
  mounted on DashboardPage between hero and Recent workouts; `pickTopGain`
  and `toDateOnlyString` extracted verbatim to `client/src/lib/` (StatTiles/
  AnalyticsPage diffs are pure import swaps); all four states implemented
  (loading/error/both-empty render nothing, prior-empty = "first week
  tracked", current-empty = nudge with prior count); CSS tokens-only under
  `weekly-report-` prefix. Reviewer verified: build re-run green, no hex in
  the new CSS block, `/sessions/mine` has no server-side limit so the
  workout counts are trustworthy. Two accepted cosmetic nits: a tiny
  positive sets delta can render "+0.0", and windows compute once at mount
  (stale after midnight until reload).
- **WORKFLOW CHANGE (Seth, standing):** all smoke testing now happens on the
  Vercel deployment built from the staging branch — never local dev (avoids
  the client/.env prod-API trap). Relay order updated: after spec review
  passes, Claude Code commits + pushes to staging IMMEDIATELY so a deploy
  exists to test; Seth's visual sign-off happens on the deployment, after
  the commit. Merge to main still gated on sign-off + trigger phrase.
- **U7 visual sign-off PENDING** — Seth smokes the Vercel build of
  `analytics-engine` @ `f22989d` (login `smoke_b8`, band on Home, palettes x
  modes, narrow-viewport wrap). U8 dispatches only after sign-off.

## Session log (July 3 — analytics polish wave planned, Claude Code)

- **Seth critiqued the B8 analytics screen; five-point polish wave agreed:**
  1. KPI tiles evolve into a "weekly report" — DECIDED: it lives on the HOME
     screen (DashboardPage, under the StartWorkoutHero) as a last-7-days vs
     prior-7-days delta band, so users see stats on login. Range chips keep
     governing only the analytics deep-dive cards.
  2. Volume by muscle: add a time view — extend the Chart|Table toggle to
     Bars|Trend|Table (per-muscle weekly sparklines/small multiples).
  3. Strength trends: replace/augment the first-vs-latest dumbbell with
     per-session e1RM sparklines; the existing Table view stays as the
     raw-data screen.
  4. Execution: comprehension rework — lead with the CONCRETE comparison
     ("Planned 3x8 @ 100 -> Did 2x8 @ 95") + a deterministic plain-language
     verdict line; percentages demoted to annotations; "sandbagging/
     overreaching" demoted to secondary flavor.
  5. Balance: diverging scale with colored deviation fill + shaded
     "balanced zone" band (~0.8-1.3), ghost tracks on degraded rows.
  Seth will critique each visually after it ships (2-5 are "show me" items).
- **Root cause identified:** 1-3 all need TIME SERIES the engine collapses
  away. One engine unit unlocks all three: **B9 task block authored + QUEUED**
  (`docs/tasks/b9-analytics-time-series.md`) — weekly per-muscle volume
  series, per-session e1RM series, execution planned/actual concrete
  summaries. Additive, engine-only, no schema/controller change. UI wave
  U7 (Home weekly report) / U8 (trend view + sparklines) / U9 (execution
  rework + balance polish) listed as QUEUE candidates; U8/U9 blocks get
  authored after B9 lands (they consume its payload shape).
- **Merge to main: DEFERRED by Seth — "i dont think i want to push the
  analytics to main until the visuals are locked in."** The B9/U7-U9 polish
  wave continues on `analytics-engine`; the merge happens after Seth signs
  off on the visuals (still gated on "push to main" verbatim). Pre-merge
  items still open: Seth's personal read of the `analyticsController.js`
  findMany where-clause, and the two open forks below.
- QUEUE.md refreshed: B8 (`00c67dc`) and U6 (`d4b1d72`) moved to Landed.
- Stray smoke screenshots tidied into `docs/smoke-tests/images/`
  (analytics-b8-u6-lbs-default + two smoke-b8 login-error shots) and
  committed.

## Session log (July 2 late — task-queue pilot scaffolding, Claude Code)

- **File-dispatched task queue created (`docs/tasks/`):** README (protocol:
  author -> dispatch-by-pointer-line -> execute -> review/land; Mode 1
  serialized relay first, Mode 2 parallel worktrees after ~3 clean units),
  QUEUE.md (status index, single writer = Claude Code), _TEMPLATE.md
  (unit-scale block with standing no-git/no-state footer + MODEL/MODE
  headers). Replaces chat-pasting task blocks into Cursor; Seth dispatches
  with one pointer line.
- **RUNBOOK section 8 added:** parallel worktree ritual (worktrees under
  `C:\dev\worktrees\`, outside OneDrive; create/review/land/cleanup).
  Old section 8 (safety invariants) renumbered to 9.
- **`docs/specs/poor-mans-agentic-workflow.md` created:** tracking doc for a
  FUTURE public repo (Seth's idea: "$40/mo agentic workflow" - Claude Pro +
  Cursor Pro vs Claude Max). Not publishing yet; append to its log whenever
  the workflow changes so the public repo can be extracted later.
- No task blocks authored yet - next real Cursor-suited units (A5/A6) are
  blocked on A4 FK design; QUEUE.md lists candidates.

## Session log (July 2 evening — B6 built + smoked, Claude Code solo, autonomous)

- **B6 matched-effort progression DONE + committed (`94a1fbf`), pushed, on-device smoked.**
  Details in the track section below. Built directly by Claude Code (not via
  Cursor) under an explicit one-night inversion of the brain/hands split:
  Seth was out, Claude Code tokens were expiring, and running both agents
  unattended on one tree is the known race. The standing division of labor is
  UNCHANGED going forward.
- **Permissions overhaul in `.claude/settings.local.json`:** broad allow rules
  for tonight's lanes (npm/npx/node in PowerShell, curl, more Playwright MCP
  tools, read-only PS cmdlets) PLUS a new `ask` array that force-prompts the
  gate items (git reset/clean/force-push/branch-delete, push to main, merge,
  npm install, prisma migrate). The `ask` list matters beyond tonight: the
  pre-existing `PowerShell(git *)` allow silently covered `git reset --hard`
  etc.; `ask` overrides `allow`, so the gate is now enforced by config, not
  just convention.
- **Staging DB was reset** by tonight's full `npm test` run (expected pretest
  behavior, but easy to forget): the old `smoke-b5` account is GONE. New smoke
  account: `smoke-b6` / `SmokeTest-B6-2026` (email `smoke-b6@example.com`),
  3 completed backdated sessions (Jun 15/22/29) whose data exercises every
  analytics state — bench @ RIR 2 across 3 sessions (matched-effort populated,
  and its plain e1RM trend is deliberately NEGATIVE from a backoff set, the
  honest-vs-dishonest contrast on one row), lat pulldown with no RIR (unlock
  states), rirCoverage 63%.
  **SUPERSEDED (July 3):** `smoke-b6` gone in a later reset. Current smoke
  account: username `smoke_b8` (UNDERSCORE, not hyphen - Cursor created the
  account first and usernames are immutable) / `SmokeTest-B8-2026` (email
  `smoke-b8@example.com`, which also works as the login),
  seeded via the new `scripts/seed-staging-smoke.mjs` (HTTP-only, idempotent,
  re-run after any staging reset): 24 sessions over 8 weeks, 12 muscles / 11
  exercises, matched-effort +39.9, 4 execution rows (template-linked), RIR
  gaps for the honesty states, push:pull 1.01 / quad:ham 0.86.
- **Dev-stack gotcha confirmed:** the long-running nodemon (started Jul 1) did
  NOT pick up the B6 engine changes — OneDrive file-watch flakiness. The
  /analytics endpoint silently served pre-B6 responses (no matchedEffortTrend)
  until the server process was killed and restarted. If a diff looks right but
  the API disagrees, restart the dev server before debugging the code.
- Prisma `generate` also hit the OneDrive/Windows EPERM dll-rename lock (held
  by the running server); worked around by running jest directly — schema is
  unchanged so generate was a no-op requirement. Another point for the
  "move the repo out of OneDrive" issue.

## Session log (July 1 evening — repo hygiene + infra, Claude Code)

- **All untracked critical work committed** onto `analytics-engine` and pushed — closes the "one `git clean` from gone" exposure (master prompt v17, analytics spec, engine code + tests, catalog data, scripts, brand asset).
- **Jest split into `unit` and `integration` projects** (`server/jest.config.js`). `npm run test:unit` runs the pure analytics tests with ZERO DB contact — no `pretest` migrate, no `jest.setup.js` reset (npm pre-hooks are exact-name, so `test:unit` skips `pretest`). `npm test` unchanged (both lanes, staging DB, serialized). This restores the spec's "pure, fixture-tested, no DB" promise, which the old single config silently broke: every test file, including the pure ones, ran `resetDb()` against staging beforeEach.
- **CI cheap lane added** (`.github/workflows/ci.yml`): client build + server unit tests on every push, no secrets, no DB. Integration suite deliberately stays manual/local. First runs green (~34s). Actions pinned at v5 (node-20 runner deprecation).
- **Housekeeping:** export artifacts + `.claude/settings.local.json` gitignored; remaining scene mocks moved `client/src/assets/scenes/` -> `docs/design/mocks/` (references only, never ship from src); `lifter.png` (unused pending brand asset) committed; Claude Code permission allowlist pruned ~50 one-offs -> prefix rules (destructive ops deliberately NOT allowlisted so they always prompt).
- **CLAUDE.md / AGENTS.md consolidated (done last, per instruction):** AGENTS.md is now the single source for shared agent context (conventions, UI architecture, the gate); CLAUDE.md imports it via `@AGENTS.md` and keeps only Claude-Code-specific content. AGENTS.md's "Current state / Next up" sections replaced by a pointer here — **HANDOFF is the only state channel now.** The old gate-sync rule is retired; there is no duplicate to sync.
- **Concurrent-agent note:** a Cursor session executed B2/B3a in the same working tree while this session ran. Its output was reviewed, folded into commits `cd72e9c`/`7192e2c`, and its HANDOFF records are preserved below. See the new gotcha before running two agents on one checkout again.

---

## Open forks — SETTLED (Seth, July 4, pre-merge)

1. **Theme storage** — went with the proposed default: device-local (matches existing appearance setting, zero schema change), all reads through one accessor so account-level promotion later is one swap + an additive migration.
2. **Login tagline** ("Log your shit dog") — went with the proposed default: keep, with a trigger condition: it changes the day a stranger can sign up. One constant either way.

---

## Analytics/catalog track — full build history (B1–B9, Track B v1)

*Archived July 6, 2026; section header below kept verbatim (its status line is stale — Track B v1 merged to main `e9ce82c`, July 4). Live open items stay in HANDOFF.*

## Analytics/catalog track — ACTIVE (B1-B5 committed, B5 smoke + merge decision next)

*Full architecture spec: `docs/specs/analytics-engine.md`. Product-direction rationale:
`analytics-engine-direction` memory.*

**Vision (decided July 1, Opus session):** analytics engine = the wedge. Layered
L0 attribution (fractional weighted sets/muscle) -> L1 descriptive -> L2 diagnostic.
Differentiators flow only from data competitors lack: fractional attribution, per-set
RIR/RPE (already in schema), first-class plan snapshot. RIR near-mandatory (onboarding
nudge); **Stimulating Sets** (attribution x proximity-to-failure) is the headline unit.
v1 L2 = Stimulating Sets + matched-effort progression + execution fidelity. Deferred
(need history): personalized volume landmarks, fatigue signalling. AI coach (Track C,
BYO-key experiment then monetized) is dead-LAST, off the critical path.

**Phased roadmap (full detail in the spec, section 9):** Track A = data plumbing
(catalog merge, FK linkage, backfill). Track B = the engine (resolver -> set metrics
-> aggregation -> API -> screen -> progression -> fidelity). Track C = AI, last.

**B1 attribution resolver DONE + committed (`e4c96be`).** Built via Cursor task block,
verified independently (files read, tests re-run, grep confirms zero Prisma references).
`server/src/analytics/{normalize,catalog,resolve,attribution,index}.js` (all CommonJS,
pure, no DB) + `server/test/analytics/{resolve,attribution}.test.js`. Exact-normalized-
name match only (no fuzzy/alias matching — deferred to A6).

**B2 set-level metrics DONE + committed (`cd72e9c`).** Verified independently.
`stimulusCurve.js` (RIR -> multiplier via named `STIMULUS_CURVE` band array at spec
values, null RIR -> null, never guessed), `server/data/stimulus-curve-rationale.md`
(house-style, matches `muscle-weights-rationale.md`; same-commit update rule),
`setMetrics.js` (`estimateOneRepMax` Epley+Brzycki with the reps>=37 Brzycki-
singularity guard, `computeTonnage`, `computeSetMetrics` returning distinct
`effectiveContribution` (always-on) vs `stimulatingContribution` (RIR-weighted,
null when RIR missing) per muscle).

**B3a weekly per-muscle aggregation DONE + committed (`7192e2c`).** Verified
independently (43 unit tests green via the new DB-free lane). `enrichSet.js`
(composes Stages 1-3 into one call: `{ performedAt, resolution, attribution,
metrics }`; imports underlying modules directly to avoid a require cycle through
`./index`), `aggregate.js` (`computeWeeksInRange` + `aggregateMuscleVolume` —
per-muscle `effectiveSets`/`stimulatingSets`/`frequency`/`daysSinceLast` over a
`[from, to]` range, session-deduped by shared `performedAt`, `stimulatingSets` is
`null` not `0` when a muscle has no RIR data at all, `landmarkBand` correctly
deferred).

**B3b per-exercise aggregation + balance ratios + Stage 6 summary object DONE
+ committed (`c954185`).** Built via Cursor task block, verified independently
(files read, `npm run test:unit` + full `npm test`: 11 suites / 84 tests pass,
grep confirms zero Prisma references). Delivered: `aggregate.js` extended with
`aggregateExerciseMetrics` (per-exercise `e1rmTrend` + `bestSet`, grouped by
resolved catalog id only) and `computeBalanceRatios` (`pushPull`/`quadHam` off
`effectiveSets`, null on zero-denominator; `frontRearDelt` always `null` — the
catalog's muscle taxonomy has no front/rear delt split, verified by inspecting
`exercises.json`'s muscle vocabulary, so this is an honest gap not a bug);
`summary.js` (`buildSummary` — the Stage 6 entrypoint: `range`, `perMuscle`,
`perExercise`, `prs: []` (deferred — needs full history beyond the range, a
separate design problem), `balance`, `execution: []`, `meta.rirCoverage` +
`meta.honestyNotes`). Info equivalent to a `resolutionCoverage` % (an earlier
placeholder note above anticipated this as a separate `meta` field) is instead
surfaced as a prose count in `honestyNotes` when nonzero — not added as its own
numeric field; revisit only if the UI needs it as a number.
**Post-Cursor fix (this session):** `bestSet.weight`/`reps` were `null` in
Cursor's delivery (comment cited "floating-point noise" from reconstructing
them) — actually exactly recoverable via `weight = epley - tonnage/30`, `reps =
tonnage / weight` (algebraic inverse of the formulas that produced them, both
already present on the enriched set), so fixed directly in `aggregate.js` with
a new test assertion; `rir` correctly stays `null` (genuinely unrecoverable,
lossy stimulus-curve mapping). Also committed separately (`98b897e`): the
Fable brain/hands division-of-labor doc update (CLAUDE.md/AGENTS.md/
cursor-task-block-template.md) that had been left uncommitted from the prior
session - Claude Code owns git+state, Cursor stops after tests green, plus
the new unit-scale task-block variant. Both commits pushed to origin
(`analytics-engine`).

**B4 `GET /api/analytics/summary` endpoint DONE + committed (`bb05bc5`).**
Built via Cursor task block (unit-scale), reviewed independently (all four
files read against the spec, both test lanes re-run by the reviewer: unit
55/55 DB-free, full suite 89/89 across 12 suites; engine purity re-verified —
zero Prisma under `server/src/analytics/`). Delivered:
`server/src/controllers/analyticsController.js` (getSummary — from/to
required + validated with descriptive 400s, date-only `to` treated as
inclusive end-of-day `T23:59:59.999Z`, `workoutSession.findMany` scoped to
`{ userId, performedAt: { gte, lte } }` — the single cross-user-isolation
point; sets reach the engine only through user-owned sessions; exerciseName
from sessionExercise ?? templateExercise, `exerciseId` always null until A4,
nulls passed through unfiltered per the engine's degradation contract),
`server/src/routes/analyticsRoutes.js` (one route behind `authRequired`),
mounted at `/analytics` in `routes/index.js`,
`server/test/analytics.integration.test.js` (5 tests: 401 unauth, four 400
cases, cross-user isolation with a non-vacuous sanity check that user B sees
their own data, happy path with exact Epley e1rm + chest effectiveSets +
rirCoverage 1, inclusive date-only `to` at 18:00 on the boundary day).

**B5 analytics screen UI DONE + committed (`e287a29`).** Built via Cursor
task block (unit-scale), reviewed independently (all six files read against
the block, client `npm run build` re-run green, server unit lane re-run
55/55, every referenced CSS token/class grep-verified to exist). Delivered:
`client/src/api/analyticsApi.js` (getSummary via shared `http`),
`client/src/pages/AnalyticsPage.jsx` (SessionsPage pattern; 4/8/12-week
preset chips, date-only from/to with stale-response guard; four card
sections — per-muscle table with "log RIR to unlock" degradation state,
per-exercise best-set/e1RM/trend with null guards, balance ratios with the
Front:Rear delt row visibly "not available" per the honesty contract, data
quality with rirCoverage % + verbatim honestyNotes; single empty-state card
when both tables are empty), `HowCalculatedButton.jsx` (MetricInfoButton
portal-popover pattern copied, props-driven `{title, copy}`, reuses
`metric-info-*` classes so scene-layer stacking is already handled;
MetricInfoButton itself untouched), `/analytics` route + Navbar tab enabled
(same liveSessionGuard pattern as History), tokens-only CSS (chips derive
active/hover/focus from `--color-interactive` via color-mix; v1 is
deliberately chart-free — numbers + degradation states, no viz deps).

**B5 on-device smoke DONE (July 2, Playwright via Claude Code):** /analytics
with real logged data — all four card sections render, chip refetch works
(4wk -> 8wk recomputes), per-muscle RIR-unlock state shows, honestyNotes
verbatim, nav tab active state, HowCalculated portal popover renders above
the scene layer — across all 4 palettes in dark mode (champ/iron/forest/
crimson full-page screenshots reviewed). Light mode not covered (matches the
T2 smoke scope). B5 is visually done.

**B6 matched-effort progression DONE + committed (`94a1fbf`) + smoked.**
Implemented directly by Claude Code (see July 2 session log for why).
Delivered: `server/src/analytics/matchedEffort.js` —
`computeMatchedEffortTrend(enrichedSets)`: buckets a resolved exercise's sets
by EXACT integer RIR (no banding in v1), session-dedupes by shared
`performedAt` (max epley = the session's representative), requires
`MIN_MATCHED_SESSIONS = 2`, picks the bucket with most distinct sessions
(tie-break: LOWER RIR — closer to failure, where e1RM is most accurate),
returns `{ rir, sessions, first, latest, best, delta }` (epley, unrounded)
or null. `enrichSet.js` now carries `input: { weight, reps, rir }` through,
which let `aggregate.js` drop the algebraic bestSet reconstruction AND make
`bestSet.rir` real (was hardcoded null as "unrecoverable" — now recovered
from input). Wired into `aggregateExerciseMetrics` -> flows through
`buildSummary` untouched (no Date fields). UI: "Matched effort" column in
the per-exercise table, `+X.X kg @ N RIR · M sessions` populated state,
"log RIR across 2+ sessions" unlock state, HowCalculated copy. Tests: 12 new
(unit lane 55 -> 67; full suite 89 -> 101, all green); engine purity
re-verified (zero prisma under `server/src/analytics/`). Smoke: live
endpoint + UI verified against seeded staging data; the seeded bench row
shows e1RM trend -12.7 kg next to matched effort +6.3 kg — the exact
dishonesty the metric exists to fix, visible on one row.

**B7 execution fidelity Mechanism A DONE + committed (`9cfe7f0`) + smoked.**
Implemented directly by Claude Code (same inverted-split session as B6).
Delivered: `server/src/analytics/planVsActual.js` —
`computeExecutionFidelity(enrichedSets, planLookup)`: pairs actual sets with
TemplateSet plans ORDER-WISE within each (session, templateExercise) group;
`loadAdherence` = mean(actual/planned weight), `volumeAdherence` =
actual/planned set counts (extra sets raise it, skipped sets lower it),
`effortDrift` = mean(actual RIR - planned RIR, positive = sandbagging);
each null when no pair carries its data; resolved template-linked sets only.
**Design finding baked in: the schema has NO path from a WorkoutSet to a
BlockWorkoutSet** — block plans can't join and are an honest gap stated in
the UI how-calculated copy (frontRearDelt pattern), NOT silently
approximated. Fixing that needs a schema change (fold into A4 FK design).
`enrichSet.input` gained `order` + `templateExerciseId`;
`buildSummary(sets, { from, to, planLookup })` fills `execution` (still `[]`
without planLookup). Controller now includes `templateSets` through BOTH
linkage paths (set.templateExercise and set.sessionExercise.
templateExercise — template-started sessions link sets via the latter) and
builds the planLookup; isolation unchanged (plan data reached only through
user-owned sessions). UI: new Execution card (Load %, Volume %, Effort
drift +N RIR sandbagging / -N RIR overreaching / on target), unlock state
when nothing plan-linked. Tests: 10 new — pairing, drift signs, volume
over/under, null degradations, exclusions, wiring, plus an integration test
driving the real template -> startSession -> log -> summary flow (unit lane
76, full suite 111, all green). Smoked: seeded template session (plan 3x100
@2, actual 2x95 @3) renders 95% / 67% / +1 RIR sandbagging in champ dark.

**TRACK B v1 IS CODE-COMPLETE (B1-B7).** What remains before calling the
analytics wedge shipped: the merge decision (below), Seth's personal read of
the `findMany` where-clause, then Track A data plumbing (A1 catalog merge ->
A4 FK linkage — add set->BlockWorkoutSet linkage to the A4 design — -> A5
picker -> A6 backfill) to make resolution robust for real accounts, and the
standing product asks (charts after algorithms; they're now landed). Track C
(AI coach) stays dead-last. Back to the normal relay (Cursor implements)
unless Seth says otherwise.
