# HANDOFF ARCHIVE — session-log history (append-only)

**Updated:** July 19, 2026, twenty-eighth session (Sonnet resident —
**FP5 BOUNCE 1 FIX LANDED `9eb7e8d`; FP6 DISPATCHED AND LANDED
`0805064` same session — FP-WAVE CODE-COMPLETE except FP8**).
Continued from the twenty-seventh session's bounce; picked up the SAME
lane (`C:\dev\worktrees\cursor-lane`, branch `cursor/fp5-pr-detection`)
exactly as the handover specified, landed FP5, then dispatched and
landed FP6 (its gate, FP2+FP5, cleared) in the same lane on a fresh
branch, all in one resident session.

**Wave state: 6 of 6 code units landed** — FP1 `8dc799f`, FP2
`056be0c`, FP3 `3de1749`, FP4 `d6180cf`, FP5 `9eb7e8d`, FP6 `0805064`
(plus the FP0 report `137e0ea`). Branch `frontier-parity-wave`, all
pushed to origin, deploys nowhere (staging Render tracks `main`). Only
FP8 remains (DRAFT, blocked on Seth's icon PNGs) — the wave is
code-complete for everything else. **Next gate is the pre-main review
(Opus, per the standing fallback) + Seth's consolidated smoke, not
another dispatch.**

**FP5 re-dispatched on the bounce channel (named rung, `--model
opus`, same lane), then landed after a reviewer-driven live audit.**
Cursor's bounce-fix delivery threaded `setHasPR` through as a real
prop (F1) and re-keyed the chip match to include `exerciseName` (F2
partial); lanes came back fresh and green (195/195 in 15 suites, build
green, check-hex clean). But its OWN evidence for F1 repeated exactly
the mistake the bounce warned against — it claimed "Vite/esbuild catch
undefined variable references at bundle time" (false for plain JS
runtime errors) and punted the actual browser-drive/render-test proof
to Seth as "manual verification steps." Given this is a second
engagement on the same unit, the reviewer did not trust the writeup
and drove the completed view live instead of accepting it or bouncing
a third time: copied the main tree's staging `.env` into the lane's
`server/`, started server + client dev instances there
(`VITE_API_URL` pointed at the local server, not prod), registered a
throwaway test account, and built a two-session fixture via direct API
calls designed to hit exactly the F2 scenario (session A baseline —
Bench 135x5, Curl 200x5, completed; session B — Bench 145x5, a real
weight+e1RM PR, Curl 145x5 sharing that exact weight/reps but NOT a PR
for curl) and loaded session B's completed view in a real browser.
Found the delivery's F2 fix was still built on `exerciseName` alone,
not identity as the block explicitly asked — fixed directly (trivia
tier, not a third bounce): added a `prMatchKey(exerciseId,
userExerciseId, exerciseName)` helper keyed on `se.exerciseId`/
`se.userExerciseId` (confirmed present on the full session-exercise
row) matching `pr.identity` from `summary.js`'s `identityFromKey`, with
a name fallback. Then found a SECOND, undeclared defect only visible by
actually loading the page: the chip could never render at all, because
`setHasPR`'s date-scoping compared `session.performedAt` to each PR's
`performedAt` for EXACT millisecond equality — but `session.performedAt`
reflects the most recently written SET's timestamp, not any specific
PR set's, so the check was always false. Fixed by dropping it (also
trivia tier): the summary fetch's own `from`/`to` window already scopes
PRs to the session's calendar day, so no extra date check was needed.
Re-verified live after both fixes: exactly one PR chip rendered,
correctly attributed to Bench Press and NOT Bicep Curl, zero console
errors. Lanes re-run fresh once more post-fix (195/195, build green,
check-hex clean). Verification servers torn down, the copied `.env`
deleted from the lane afterward; only staging Neon
(`ep-bitter-breeze-am81izlh`) touched, never prod. Lane rebased onto
`d1cd3fb` then ff-merged `9eb7e8d`, pushed, origin HEAD confirmed. Full
narrative (including the kept engine-half audit from bounce 1) in
QUEUE.md's FP5 entry.

**FP6 (weekly digest) dispatched and landed clean same session, no
bounce** — the wave's last code unit, unblocked the moment FP5 landed
(gate was FP2+FP5 both LANDED). Named rung (`--model opus`), fresh lane
branch off the post-FP5 wave tip. Audited per land-unit: scope exact (2
files), lanes fresh (195/195, build green, check-hex clean), no
deviations. Given FP5's lesson that plausible-looking code can silently
never fire, the reviewer went a step further than the report and
verified the digest's data assumptions directly against the real server
shapes rather than trusting the node-eval examples alone: `execution`
array fields (`loadAdherence`/`volumeAdherence`/`effortDrift`) confirmed
exact-match against `planVsActual.js`, `meta.effortCoverage` confirmed
real against `summary.js`, and the empty-week guard confirmed
structurally unreachable-when-empty by reading the surrounding branch
logic (both-empty and nudge-only states both return before the digest
component is ever mounted). Rebased onto `ac9bc69` (routine 1-commit
divergence — the lane branched one docs commit before the FP6-dispatch
flip landed) then ff-merged `0805064`, pushed, origin HEAD confirmed.
Full narrative in QUEUE.md's FP6 entry.

**Standing question Seth raised, still NOT actioned (his call to take
to the frontier seat):** whether big/complicated waves should route
Cursor to frontier models. This session adds a second data point for that
conversation — FP5's bounce-fix delivery itself needed two more
reviewer-caught fixes even after landing on the named rung, both of
the "the block already said what to do, the delivery just didn't do
it or verify it" shape, same as the ambiguity pattern noted last
session. Facts already gathered (last session): `cursor-agent
--list-models` carries `claude-opus-4-8-thinking-high` and
`claude-fable-5-thinking-high` (both 1M, flagged **NO ZDR** on the
Fable variant); `dispatch-unit` passes bare aliases (`--model opus`)
rather than exact ids. Seth owns raising this; no docs changed for it.

Aged out this rewrite, moved verbatim to `docs/HANDOFF-ARCHIVE.md`
(newest first): the July 19 **twenty-seventh** session (Opus resident —
FP4 landed `d6180cf`, FP5 dispatched on the named rung and BOUNCED with
the F1/F2 findings recorded above) and everything older, unchanged from
prior rewrites. Grep the archive by session number or SHA when a
decision's provenance matters; the still-live conclusions are all
carried in QUEUE.md's per-unit records, the `-FINDINGS.md` files, and
the sections below.

---

July 19, 2026, twenty-seventh session (Opus resident — **FP4 LANDED
`d6180cf`; FP5 DISPATCHED on the named rung and BOUNCED on audit — NOT
landed**). This entry covers BOTH July 19 resident sessions; the first
one landed FP2 `056be0c` and FP3 `3de1749` (after one bounce) and
dispatched FP4, then stepped out with the run in flight, leaving a
relay-handover note in QUEUE. That handover worked as written: this
session picked the FP4 delivery straight out of the lane worktree and
landed it.

**Wave state: 4 of 6 code units landed** — FP1 `8dc799f`, FP2
`056be0c`, FP3 `3de1749`, FP4 `d6180cf` (plus the FP0 report
`137e0ea`). Branch `frontier-parity-wave`, all pushed to
origin, deploys nowhere (staging Render tracks `main`).

**FP4 (empty-state ghosts) LANDED `d6180cf`**, audited per land-unit:
lanes fresh in lane (unit 171/171, build green 130 modules, check-hex
clean), scope exact (5 files), every ghost verified aria-hidden +
pointer-events:none with zero interactive elements, CSS diff free of
animation/transition/@keyframes and of raw color, and every class and
token the ghosts lean on verified to pre-exist and behave
(`.analytics-unlock` :5654, `--chart-track` :5682, `.mv-track` IS
`position: relative` so the absolute ghost bar anchors,
`.balance-scale--ghost` :6397). Two declared deviations accepted: view
tabs now render on the page-empty branch (required — three of the four
per-view teases are otherwise unreachable without a URL edit), and the
exercises empty copy split into title + unlock around the ghost.

**FP5 (PR detection) BOUNCED — bounce 1, delivery left uncommitted in
the lane for the fix run.** First named-rung dispatch of the wave
(`--model opus`, no descent). The lanes came back GREEN and stayed
green when re-run fresh in the lane (unit 195/195 in 15 suites incl.
24 new `prs.js` fixtures, build green, check-hex clean, purity grep
clean) — **the bounce is not a lane failure, it is a defect the lanes
structurally cannot see.** The ENGINE HALF passed audit and is kept:
identity keying verified correct by direct read (`enrichSet.js:25`
synthesizes a `user:<id>` catalogEntry for custom exercises, so
`summary.js`'s helpers — copied verbatim from `exerciseDetail.js`'s
landed N5 pattern — cover catalog AND custom), and cross-user
isolation verified (the new all-time fetch reuses the pre-existing
userId-scoped `fetchAllTimeEnrichedSets`, `where: { userId }` on both
queries; no new query written). Two findings, both confined to
`SessionDetailPage.jsx`, written into the block as BOUNCE 1 FINDINGS:
**F1, BLOCKER and UNDECLARED** — `setHasPR` is a `const` inside the
`SessionDetailPage` component (:2036) but is CALLED inside the
top-level `SessionExerciseBlock` (:1709, :1738), which never receives
it (call sites :2914/:2979 pass no such prop), so every COMPLETED
session detail page throws `ReferenceError: setHasPR is not defined`;
live sessions survive only via the `isCompleted &&` short-circuit.
Invisible to both lanes (Vite does not resolve undefined identifiers,
there are no client render tests) while the report claimed the chip
worked — automatic bounce. **F2** — the chip matches PRs to rows by
`weight:reps` alone, so bench 135x5 (a real PR) and curl 135x5 (not)
both light up in the same session; the payload already carries
`identity` + `exerciseName`, so the match must key on exercise
identity. A false PR badge is a honesty-layer violation. Accepted and
explicitly NOT to be "fixed" in the bounce: the extra
`GET /analytics/summary` call on the completed view (the block
permitted extending the response already touched), and `getSummary`
now fetching all-time sets per request (inherent to the contract — PRs
need history beyond the range).

**Standing question Seth raised, deliberately NOT actioned here (his
call to take to a Fable agent):** whether big/complicated waves should
route Cursor to frontier models. Facts gathered for that conversation:
`cursor-agent --list-models` DOES carry the frontier tier —
`claude-opus-4-8-thinking-high` (1M, thinking) and
`claude-fable-5-thinking-high` (1M thinking, flagged **NO ZDR**) —
alongside the Codex/GPT-5.x ladder and Composer. Two observations
worth putting to Fable: (a) `dispatch-unit` passes bare aliases like
`--model opus` rather than exact ids, which resolved fine but is the
same class of papercut as the July 14 "CLI remembers the last model"
lesson; (b) the evidence so far says spend on AMBIGUITY, not size —
MW's deliberate all-auto descent landed 8/8, while this wave's two
bounces (FP3 chart-view partition, FP5's chip) were both places the
block left a judgment call open. Seth owns raising this; no docs were
changed for it.

Previous entry (July 17, twenty-fifth session, Fable — **PRE-MAIN
GATE PASSED + MW-WAVE MERGED TO MAIN `3b325db`**). Seth confirmed the
MW6+MW8 smoke PASSED and gave the trigger phrase; merge ran per the
RUNBOOK ritual one command at a time in a scratch worktree
(`C:\dev\worktrees\merge-main`, per the OneDrive lesson): ff-only
`c473e21..3b325db`, 35 commits, no merge commit, `origin/main` HEAD
verified `3b325db` post-push, worktree removed. NO migration —
code-only deploy. **Seth completed all three post-merge steps same
day: staging Render repointed to `main`, prod deploy SHA verified ==
`3b325db`, prod smoke PASSED (MW pass + the previously-owed NT items
incl. the What's New modal — the NT-wave verification trio is
retired).** `maintenance-wave` is now fully contained in `main` and
staging no longer points at it — a deletion candidate (gated). The wave that just shipped, for the record below: MW1-MW8 +
the CW dev-tooling arc + `a5294e3`. Gate details in the review record
that follows.

Gate record (same session, pre-merge):
Reviewed the full accumulated diff `c473e21..a5294e3` (34 commits:
MW1-MW8 + the CW dev-tooling arc + one post-wave direct fix) against
the blocks, QUEUE's per-unit audit records, and the archived session
logs per the gate ritual. Lanes re-run fresh AT THE GATE: unit 170/170
(14 suites), Vite build green, check-hex clean. Verified by direct
diff read: MW2's guard/identity un-nesting matches the July 16 ruling
exactly (`:531` guard counts `identityParse.provided`, identity arm
wins over name-derivation when both arrive — so the NTFIX2 client's
name+id PATCH is id-authoritative), MW3's reopen ladder is
ownership-correct (userId in the findFirst) with a completedAt-only
flip and completeSession's include shape, MW1's un-nest is
structurally sound (pill/summary are SIBLINGS of the toggle, the
stopPropagation removal is safe because no ancestor handler remains),
MW6's detector table + auto-pair guards (busyRef, sets.length,
setCountBusy, commit-vs-draft, override-false-wins) all hold and the
RIR keystroke gate makes the flush-path integer guards
belt-and-suspenders, MW7/MW8 are surgical, watcher script confirmed
NEVER imported by client or server (dev tooling stays out of runtime).
**`a5294e3` recorded:** an off-flow July 16 evening direct fix (ONE
confirm when deleting a filled L/R pair, no confirm on a blank pair,
singles keep the per-set confirm) — committed outside land-unit during
what was evidently Seth's MW6 smoke; now gate-reviewed directly,
clean, on origin. NO fix blocks needed, nothing bounced, no Cursor
busywork identified. (Both pre-merge conditions were then met same
session: Seth confirmed the MW6+MW8 smoke PASSED and said "push to
main" — see the merge record above.)
Flagged, not blocking: `docs/specs/cursor-token-savings-{stats.md,
data.json}` and `docs/parked/*` sit UNTRACKED since ~July 11-13
(side-project artifacts for the poor-man's-agentic-workflow repo) —
Seth to rule whether they belong in this repo's history or move out.


Previous entry (July 18, 2026, twenty-sixth session (Fable — **FP-WAVE
OPENED: FP0 frontier-parity report authored, dispatched, and LANDED
`137e0ea` in one session; NO implementation blocks yet by design**).
Seth's ask: make the direction calls on the July 17 product-review
findings and have Cursor produce a NOW/CHANGE report he can read
before anything ships. New branch `frontier-parity-wave` off
maintenance-wave HEAD `0206d30` (= main `3b325db` + two post-merge
docs commits). Fable made the calls (baked into
`docs/tasks/fp0-frontier-parity-report.md`, block `a5444b7`): retitle
to LogChamp; interim "LC" monogram PWA icons; ONE window + ONE data
source for the This-week strip; recent workouts go VERTICAL (3 rows,
full titles); empty analytics tease the wedge with static ghost
previews + honesty-voice unlock lines; tagline stays Seth's call
(3 alternatives presented); PR detection as a pure engine module with
quiet chips (no confetti); weekly digest extends the existing
WeeklyReport band; Strength Score flagged NEEDS FABLE DESIGN PASS
jointly with the queued per-side unit; never-gate-history verified
true and becomes product copy. FP0 dispatched Channel B auto rung,
landed same session per land-unit: lane porcelain-EMPTY (report-only
contract held), unit lane fresh 170/170, spot-checks by direct read —
the R3 diagnosis is REAL (Workouts tile counts by `completedAt` in
LOCAL bounds at WeeklyReport.jsx:31-44 while Sets/Top-set ride
/analytics/summary filtered by `performedAt` in UTC bounds — two
clocks, two sources in one strip). Full report preserved verbatim in
`docs/tasks/fp0-frontier-parity-report-FINDINGS.md`; audit record in
QUEUE.md.

**Same session, phase 2 (after Seth's read):** Seth APPROVED the
critiques with riders — icons LAST (needs his intervention), and
everything Fable-gated must be set up for OPUS because **Fable is
unavailable after July 18**. He brought two new insights, both
designed same session: (1) his strength-view screenshot (in
claudefiledrop/) shows single-session/dormant exercises burying the
real trends — became FP3 (active-exercise lens: noteworthy-first sort,
single-session rows collapsed, Active|All roster lens, history never
hidden); (2) different-gym machine variance skews analytics (his
screenshot's "Single arm lat pulldown -52.5 lbs" is the live example)
— his location idea designed into `docs/specs/gym-context.md`
(one-shot opt-in location at session start, Gym entity + session tag,
ANNOTATE-never-adjust analytics + home-only filter; continuous
tracking rejected on PWA/privacy/battery grounds, criteria named in
the spec). The R9 design pass is DONE too:
`docs/specs/strength-score-per-side.md` (self-referenced score,
per-side comparison verdicts, imbalance headline; SS1-SS3 block plan).
**FP-WAVE SKELETON AUTHORED `4e09379`: FP1-FP6 QUEUED, FP8 DRAFT**
(order + serialization + the full Opus handover in QUEUE.md's FABLE
HANDOVER section). FP1 DISPATCHED same session (Channel B auto rung).
Open Seth items: R6 tagline pick; icon PNGs into claudefiledrop/ to
un-DRAFT FP8; G1's migration when the G-wave starts.

Previous entry (July 16, twenty-fourth session, Opus resident —
**MW-WAVE CODE-COMPLETE: MW6 `bfbbe56` + MW8 `52e84cf` dispatched and
LANDED, all 8 units in**). Both went over Channel B in the lane
worktree: MW6 (MODEL opus) on the auto rung as a DELIBERATE descent —
Seth's dispatch instruction restated the standing "run on auto, Opus
audits" call — MW8 (MODEL auto) on its own rung. Audits per
`land-unit`, lanes fresh in the lane both times (unit 170/170, Vite
build, check-hex), full diffs read. MW6: detector name table re-run
independently by node eval (13/13), single pair-creation path +
commit-vs-draft discipline + override-false-wins + completed-path
triple-guard + no-respawn all verified by direct read; no deviations;
one judged-accepted narrowing (bare `\bsingle\b` names like "Squat
(single)" no longer auto-trigger — the name table is the contract,
and `anySetHasSide` keeps existing sided data in per-side mode). MW8:
formatter verified byte-for-byte the `formatEffortValue` body, eval
re-run independently (8.5->"8.5", 8->"8", 10.25->"10.3"), null-reps
ternaries untouched at all 5 sites; one reviewer trivia fix (stray
blank line in StrengthTrendChart.jsx). Per-unit audit records in
QUEUE.md. **Remaining: Seth smokes MW6+MW8 on staging (checklist in
"Next up" 00 — MW1/2/3/7 already PASSED), then the pre-main gate
(Fable + Seth) closes the wave.**

Previous entry (July 16, twenty-third session, Fable — **RULINGS
INTERPRETED + LAST TWO WAVE UNITS AUTHORED: MW6 finalized and QUEUED,
MW8 (new) QUEUED**). Seth's MW4/MW5 answers (`docs/tasks/
mw6-seth-rulings.md`) were brainstormed with him live and dispositioned
— the interpretation section appended to that file is the durable
record. The short version: (1) pair = 2 sets RATIFIED, zero engine
code, heading's raw row count is CORRECT and stays; (2) adherence
pairs/planned DEFERRED into the ruling-3 unit (same side-plumbing);
(3) ruling 3 is a NEW FEATURE — per-side L/R comparison analytics
(side into enrichSet, exerciseDetail splits, Exercises-tab comparison
UI) — Seth confirmed: own unit, NEXT wave, registered as a QUEUE.md
candidate with the design sketch, needs a Fable design pass; (4)
sessions-list "Sets: N" keeps raw rows, zero code; (5) collapsed
summary gains a side letter, folded into MW6. Display vocabulary (Seth
chose from previews): the stepper alone speaks "Pairs" in per-side
mode; everything that COUNTS says sets. MW5's REJECT-decimal-RIR stands
ratified plus Seth's rider ("make it impossible or inform the user") —
a client-side RIR input gate folded into MW6. **MW6 as QUEUED now
carries:** detector broadening with a machine-checkable name table
(One-Arm/one-leg names TRUE, "single response" FALSE), the
auto-first-pair trigger (committed-name discipline, override-on
trigger ruled IN, delete respected/no re-trigger, derived-MODE keying
so override=false wins), the Pairs stepper relabel via a new default-
"Sets" label prop on PlanningSetCountControl (template/block builders
zero-diff), the summary side cue, and the RIR gate. **MW8 (MODEL
auto):** shared reps formatter (`client/src/lib/repsDisplay.js`)
replacing Math.round at the 5 analytics top-set sites so 8.5 stops
rendering as 9; null-reps gating per site untouched. MW6 + MW8 are
fully file-disjoint — batchable back-to-back for one review session;
they are the wave's LAST code units, then Seth's smoke, then the
pre-main gate.

Previous entry (July 16, twenty-second session, Opus resident —
**MW-WAVE DISPATCH RAN THE WHOLE QUEUE: 6 of 7 units dispatched +
LANDED in ONE session** — MW4 `c005c2a`, MW5 `87d6b37`, MW1 `f9a6dfd`,
MW2 `859f3d3`, MW3 `9511e8f`, MW7 `b6c885f`; only MW6 remains, DRAFT,
gated on rulings + Fable). All six went over Channel B; the four
opus-tier units ran on the AUTO rung as a **DELIBERATE ladder descent —
Seth's call mid-session** ("run them on auto and you will review them
as opus") instead of waiting for the 7/17 named-rung reset, with the
Opus audit as the compensating control. Every audit ran per
`land-unit`: lanes fresh in the lane each time (unit 170/170, Vite
build, check-hex on UI units), full diffs read, claims spot-checked by
direct read/grep, and the written-not-run integration tests RUN at
land time in the main tree (MW2: 17/17 incl. the 5-row id-only PATCH
matrix; MW3: 11/11 incl. the reopen round trip). Per-unit audit
records + accepted deviations live in QUEUE.md. **Also this session:**
wave-progress messaging (n/N at dispatch, n/N summary per landing,
N/N complete) added to `dispatch-unit` 2b + `land-unit` 5 as Seth's
standing ask (`627c520`); one transient OneDrive index.lock hiccup
(self-cleared, no damage). **The diagnosis findings** (full reports in
`docs/tasks/mw4-*-FINDINGS.md` / `mw5-*-FINDINGS.md`): MW4 — per-side
storage CORRECT, engine side-blind; volume/counts/e1RM AMBIGUOUS (L+R
pair = 2 full sets everywhere; 5 product-ruling questions for
Seth/Fable); display BROKEN (heading "2 sets" vs toolbar 1 pair);
detection BROKEN (regex misses all ~50 One-Arm names). MW5 — reps 8.5
fine except 5 analytics surfaces Math.round it to 9 (fix-block
candidate: shared reps formatter); RPE 8.5 correct end-to-end; RIR 1.5
cleanly 400-rejected by design — recommendation: REJECT, don't widen. MW4 (per-side end-to-end audit,
DIAGNOSIS, no code) audited per `land-unit`: lane 170/170 fresh, zero
source edits, every spot-checked claim confirmed by direct read/grep/
count. **Verdicts:** storage + manual L/R logging CORRECT (side
persists; engine side-blind by construction — zero `side` refs in
`server/src/analytics/`); volume / set counts / e1RM AMBIGUOUS (an L+R
pair counts as 2 full sets on every counting surface; series bucketing
does NOT double-count sessions; planned-vs-actual adherence reads 2.0
on paired work); display BROKEN (heading `:1359` says "2 sets" while
the per-side toolbar `:1318` says 1 pair); detection BROKEN (regex is
exactly `\bsingle\b` — misses all ~50 One-Arm catalog names of 873,
false-positives on "single response"). Overall: trustworthy WITH
CAVEATS; **MW6 must not ship on the current detector** — its DRAFT
note now points at the findings. Full report preserved verbatim in
`docs/tasks/mw4-per-side-analytics-audit-FINDINGS.md` (DELIVERY.md is
gitignored); it ends with **5 product-ruling questions for Seth/Fable**
(pair = 1 or 2 sets? adherence? per-side e1RM footing? sessions-list
count? last-logged side cue?) — rulings needed before any AMBIGUOUS
surface gets a fix block; the two BROKEN fixes (detector broadening,
heading pair count) are block-ready without rulings.

Previous entry (July 16, twenty-first session, Fable — **MW-WAVE
(maintenance wave) SKELETON AUTHORED: 7 blocks on new branch
`maintenance-wave`**, branched off not-tracked-ux-wave HEAD `5e3d981` =
main `c473e21` + the CW dev-tooling arc, which therefore rides this
wave's pre-main gate). Scope settled with Seth this session: item 12 =
custom EXERCISES (not templates); **un-finish IS the edit path** for
items 10+11 (one mechanism — reopen to live, edit with the existing live
UI, finish again; no second editing surface); item 16 (catalog/search
review) deliberately NOT authored, stays a candidate alongside A3.
Units: MW1 heading-pill un-nest (the gate's shipped-knowingly finding),
MW2 identity contract (issues 8+9 — and **issue 8 is now RULED: the
server accepts id-only identity PATCHes**, fixing BOTH
sessionController `:531` and `:575`), MW3 reopen-completed-session
(`POST /sessions/:id/reopen`, completedAt-only flip; reopened sessions
leaving history/analytics until re-finished is INTENDED), MW4 per-side
end-to-end audit (diagnosis, no code), MW5 decimals audit (diagnosis,
no code; `rir` is `Int?` in schema — the 1.5-RIR question), MW6
per-side auto-first-pair (**DRAFT, gated on MW4's verdict**), MW7
custom-exercise Library tab (client half only; L3 server routes exist).
Dispatch order + serialization matrix in QUEUE.md: MW1+MW2 batchable
(file-disjoint), MW3 after both, MW7 after MW3 (index.css overlap),
MW4/MW5 solo anytime between reviews, never back-to-back with anything.
Dispatch is the resident session's job next — NOTE the named rung is
exhausted until the 7/17 reset, so the economical order is MW4/MW5
(MODEL auto) today, the opus-tier units after the reset. **STAGING
REPOINT AMENDED:** when Seth does RUNBOOK step 6, point staging at
`maintenance-wave` (NOT back to `main`) — that is where this wave's
smokes happen. Seth's post-merge trio (prod SHA verify == `c473e21`,
the repoint, prod smoke incl. the What's New modal) and the CW3 visual
sign-off remain owed, unchanged by this session.

Previous entry (July 15, twentieth session, Fable — **the cursor-watch
arc, all landed: CW1 `018a6ae`, CW2 `a26a2c8`, CW3 `6907d4a`**; wave at
`6907d4a` on origin, resident session ran authored -> dispatched ->
audited -> landed three times). CW2 (auto-open): `--open`,
`--open-on-activity` (once per run, re-armed by DELIVERY.md removal or
branch change), `--open-cmd` test override — audited with a live
marker-cycle check (atStart=False, afterFirst=1, afterSecond=1,
afterRearmWrite=2). CW3 (frontier visuals + DONE): layered panels,
phase-driven accent, event-rate presence orb + sparkline, tool-call
activity cards, DELIVERY READY page sweep + title/favicon state for
background tabs, off-by-default chime, and server-side `--notify` OS
toast (once per run; `--notify-cmd` override) — audited by driving the
page in a REAL browser (Playwright: all three states render, titles
flip, zero console errors) plus a live notify check (afterDelivery=1,
afterMoreWrites=1). MODEL auto for CW3 was DELIBERATE (named rung
exhausted until the 7/17 reset); the fully-specified design block
protected quality. **Persistent setup on Seth's machine (his "anything
ever" ask):** resident watcher runs `--open-on-activity --notify`, and
a Startup shortcut (`shell:startup\cursor-watch.lnk`, hidden
powershell -> node) relaunches it at every login — the dashboard pops
and a toast fires whenever the lane stirs, no agent involved, zero
tokens. **Papercut logged, not a defect in real use:** pointing the
watcher at a NON-git directory lets git walk up to an enclosing repo,
so the totals chip can count foreign files (seen in the audit scratch
dir); the real lane is always a git worktree, unaffected. **Owed:
Seth's visual sign-off on the next live run** — open items: does the
WORKING page read as "a frontier agent at work"; does the DONE moment
land (sweep, lockup, toast). Below, the original CW1 entry.
Seth asked for a live visual of Cursor working, token cost weighed.
Shipped as dev tooling: `scripts/cursor-watch.mjs` — zero-dependency
(Node built-ins only), binds 127.0.0.1 only; run
`node scripts/cursor-watch.mjs`, open `http://127.0.0.1:4646`.
Recursive fs.watch + 3s git poll of the lane worktree, SSE to an
embedded dark mission-control page: live activity feed, per-file +/-
diff bars, typing-reveal pane on the newest diff, WAITING -> CURSOR IS
WORKING -> DELIVERY READY keyed off `DELIVERY.md`, optional
`cursor-run.log` tail. **Zero tokens to watch** — no LLM in the loop;
built by Cursor on the free B-auto rung (the tool that visualizes
Cursor was itself an autonomous dispatch). Audited per `land-unit`:
lanes re-run fresh in the lane (unit 170/170 in 14 suites, Vite build
128 modules); live contract spot-checked against a scratch dir (200
text/html; file write -> WORKING event; DELIVERY.md -> DELIVERY READY;
missing lane exits 1); imports all `node:` built-ins; no external URLs
in the page; no deviations. **CW2 dispatched same session** (auto-open:
`--open`, `--open-on-activity` with once-per-run re-arm on DELIVERY.md
removal/branch change, `--open-cmd` test override) so the dashboard
POPS the moment Cursor starts working; `dispatch-unit` amended with
the pop-the-visual step (ensure watcher serving + open browser at
dispatch; skip gracefully where the script doesn't exist). Two-agents
note, a precedent that WORKED: this session interleaved with the
nineteenth (gate/merge) in the SAME tree — the gate session
deliberately carried this session's uncommitted CW2 QUEUE entry in
`2318a87` and left its in-flight skill edit unstaged; this session
committed those in `1b9174b`; status checks before every commit, zero
collisions. No staging smoke owed — dev tooling, never in the client
build; Seth verifies by watching the dashboard during a live run.

Previous entry (July 15, nineteenth session, Opus — **PRE-MAIN GATE
PASSED + NT-WAVE MERGED TO MAIN `c473e21`**). The gate ran on the full
`main...not-tracked-ux-wave` diff with the archive in hand, then Seth
gave the trigger phrase and the merge went ff-only via a scratch
worktree outside OneDrive (`C:\dev\worktrees\main-merge`, removed
after — the `ui-palettes-v2` precedent; never stash+checkout on this
repo). **`origin/main` CONFIRMED at `c473e21`**, fast-forwarded
`57b1fc8..c473e21`, 28 commits, no merge commit, history still linear.
Product units in it: NT1 `f4baee3`, NT2 `f26e783`, NTFIX1 `e0ba383`,
NT3 `98963f6`, NTFIX2 `888e44d`; the rest are docs/blocks/skills/relay
v5+v5.1 doctrine + `check-hex.mjs`. **No schema, no migration anywhere
in the wave** (server surface = `searchCatalog.js` + its test, both
analytics-pure), so this was a code-only deploy with no DB track.

**GATE RESULTS — read before acting on any of these.** Passed: both
lanes re-run fresh on the merge candidate (unit 170/170 in 14 suites;
Vite build 128 modules); tokens-only holds COMPLETELY (zero raw colors
added anywhere in `client/src` across the wave, `index.css` included —
all 274 new CSS lines are `var()`/`color-mix`); motion is 180ms on
`--ease-standard`, inside the 150-250ms bar, gated behind
`prefers-reduced-motion: no-preference`; cross-user isolation sound
(`validateOptionalExerciseIdentity` scopes `userExerciseId` by
`findFirst({ id, userId })`, session ownership separately 403s — note
NTFIX2 makes that path reachable for the FIRST time and it is correctly
guarded); NT2's runtime-invisible criteria all verified (`CHIP_CYCLE`/
`nextChipRole` gone, retroactivity line in the CREATE done-state only,
LINK variant correctly omits it, link paths use the
`buildSessionExerciseNamePatch` idiom); permissions additive with no
destructive allowlisting.

**RULED — do not re-litigate: the NTFIX2 rename is CONTRACT-SANCTIONED,
not a deviation.** NT2's block (`docs/tasks/nt2-add-exercise-stepped-
sheet.md`, lines 101-104) specifies the create path commits
`userExerciseId` "via the same updateSessionExercise path (**name
unchanged if it already matches**)" — a parenthetical that only parses
if the name is SENT alongside the id. NTFIX2 restored the specified
behavior; the id-only version was the deviation that made the path
silently no-op. The design treats row renames as routine (the LINK
done-copy refuses the retroactivity claim precisely BECAUSE "a rename
affects only this session's row"). Seth's smoke passed it. Closed.
Also accepted on the record: NTFIX2's relay deviations (Claude Code
authored the product code — direct-fix exception + Seth's explicit ask;
audited per `land-unit` before landing).

**SHIPPED KNOWINGLY — the gate's one real finding, now the top
follow-up (see "Next up" 0a).** Nested `<button>` on the LIVE-session
path: `SessionDetailPage.jsx:1468` renders
`<button className="session-exercise-heading-toggle">{headingInner}</button>`
and `headingInner` contains `ExerciseTrackedIndicator`, which renders a
`<button>` when interactive (`:127`). Completed sessions use a `<div>`
wrapper (`:1479`) and are FINE — this is live-only, i.e. exactly the
path NT2 made interactive. Invalid HTML + React nesting warning +
nested interactive controls are an AT problem (the inner control's
accessible name can be swallowed). Functions today only because the
inner `onClick` calls `stopPropagation`. NOT pre-existing relative to
main — this wave introduced it when NT2 turned the pill into a button.
Fix: lift the pill out of `headingInner` so it renders as a SIBLING of
the toggle. Seth chose to ship and follow up.

**NEXT UP — post-merge verification (Seth's, all three).** The NT-wave
is DONE: gate passed, NTFIX2 smoke passed (all five items incl. the
rename), merged to main `c473e21`. Owed now, none of which an agent can
do from here: **(1) verify the prod deploy SHA == `c473e21`** in Render
AND Vercel Events — push is NOT proof of deploy, a redeploy rebuilds the
OLD HEAD until it catches up; **(2) RUNBOOK step 6** — repoint staging
Render off `not-tracked-ux-wave` back to `main`, verify that redeploy's
SHA too; **(3) prod smoke** — the NT flow on prod, folding in the
carried N-wave item: the "Every exercise, in one place" What's New modal
fires for a logged-in user (prod is the ONLY place it renders).
Open findings that SURVIVED the gate, in priority order: the nested
`<button>` (top entry — "Next up" 0a), **F** ("Failed to fetch" = Render
cold-start, no client defect; needs a live Network-tab repro, not code),
the **G server-side question** (issue 8 — client fix already shipped), and
"Use that name" being unable to stamp identity for custom exercises
(issue 9).

Previous entry (July 15, eighteenth session, Fable — relay v5.1:
RESIDENT-SESSION AMENDMENT; docs only, no product code). Seth asked
whether the wave should batch into one big Cursor run + one big audit;
the settled answer, now doctrine: **batch SETH'S touchpoints, never
the machine checkpoints.** One resident Sonnet session per wave is now
the stated norm for the relay loop — "run the relay" once, and the
SAME session dispatches, monitors on scheduled wakeups, lands, and
dispatches-next until the queue empties; a fresh session per unit is
the crash/hand-relay fallback, not the design. Seth smokes ONCE per
wave against a consolidated checklist handed over at wave end (the
July 14 NTFIX1+NT3 sign-off is the precedent). Per-unit audit,
one-commit-per-unit, and bisectable history are explicitly UNCHANGED —
do NOT extend this into batching Cursor execution across units
(sequential units compound errors; a wave-end bounce costs the wave,
not the unit). Files: `docs/specs/autonomous-cursor-dispatch.md`
(status header + relay-loop section + Seth's-touchpoints paragraph),
`dispatch-unit` skill (norm pinned up top), `land-unit` skill
(section 5: carry smoke items forward in a relay session,
dispatch-next in the SAME session). Outside the repo: Seth's cheat
sheet (`Desktop\Cursor\workflowandskillscheat.md`, steps 2+3 merged
into one "relay session" step) and the smoke-checklist memory amended
to match. `author-task-block` deliberately untouched — authoring is
unaffected. Next up UNCHANGED — NTFIX2 smoke + the pre-main gate
(below); the wave-end-smoke norm starts with the NEXT wave, it does
not retroactively bundle NTFIX2's owed smoke.

Previous entry (July 15, seventeenth session, Opus — orphaned
findings-fix work traced, audited, LANDED as **NTFIX2 `888e44d`**;
wave now at `888e44d` on origin).
A pre-gate tree check found `AddExerciseToLibrarySheet.jsx` +
`SessionDetailPage.jsx` modified and uncommitted, mtimes July 14 15:09,
unstaged by a bare `git reset` at reflog `HEAD@{0}`. Seth did not write
them and no `DELIVERY.md` or QUEUE entry claims them. **PROVENANCE NOW
TRACED (do not re-litigate):** Claude Code session
`ee60a330-d305-49c3-b2dc-0ec82b2fe35f`, July 14 **14:47-15:10 local**
(18:47-19:10Z — the window brackets the 15:09 mtimes), prompt **"fix all
findings and test to see if everything works"**. It fixed FOUR findings,
ran the lanes green, reported in full, ended by asking *"I haven't
committed - want me to land this?"* — **and never got an answer.** The
session closed and the work sat in the tree. Not a rogue writer, not a
lane-isolation breach; Cursor is exonerated (every recorded cursor-agent
session that day ended by 10:11, and all NT3 relay activity clusters
10:00-10:53). **Its self-reported four fixes:** (1) **finding G / HIGH** —
stamp PATCH sent id-only, server 400s, and because `http()` throws the
throw ALSO skipped the cache invalidate/refresh, so the pill stayed stale
after a mid-session create; now sends name+id in a `try/catch` so
resolution always runs; (2) **MEDIUM** — `seedSearchLoading` stuck on
"Searching..." because the `<2 chars` early-return skipped clearing the
flag; (3) **MEDIUM** — pill went interactive on a stale committed name
mid-edit (visual keys off the draft, click now keys off the committed
name; NT3's completed-session interactivity preserved); (4) **LOW** —
duplicate search on the suggest->seed hop, deduped via
`seedFetchedTermRef`. **AUDITED AND LANDED as NTFIX2 `888e44d`**, pushed to
staging. Sequence: parked verbatim on `parked/unattributed-g-fix`
(`532125d`) -> wave restored to the audited `98963f6` tree -> full
`land-unit` audit -> landed as one unit with an accurate message.
**Audit evidence (lanes re-run FRESH in the lane worktree, never trusted
from the report):** server unit 170/170 in 14 suites, client Vite build
green 128 modules, `check-hex` clean, scope exactly the 2 claimed files
with nothing unexpected, all four criteria verified by direct read, and
G's mechanism confirmed independently against source (issue 8).
**Deviations stated, not hidden:** Claude Code authored product code
(covered by the AGENTS.md direct-fix exception + Seth's explicit ask, but
a deviation); fix 4 is an optimization beyond the findings; no block file
or `DELIVERY.md` exists, so the session's final report stood in for one
and QUEUE.md carries the record instead. **NOTE: `532125d`'s own commit
message is superseded** — written before the trace, it calls the work
unattributed, unaudited and partly scope creep; all three are wrong.
**BEHAVIOR NOTE FOR THE GATE:** the stamp PATCH now carries
`exerciseName`, so the session-exercise row **renames** to the sheet's
name on create. NT2's handler always anticipated this (its pre-existing
`oldName !== name` invalidation) but the rename never fired while the
PATCH 400'd — newly LIVE behavior, not new code. Worth an explicit ruling
at the gate.

---

Previous entry (July 14, sixteenth session, Sonnet — smoke sign-off).
Seth smoked NTFIX1 + NT3 on the staging preview against the four-item list
from the prior entry (completed-session pill interactive/create-only
context, live-session NT2 flow unchanged, Main/Assists toggle pressed-state,
mid-flow close with no nag) — **PASSED, all four.** No code changes.
**NEXT UP is now solely the pre-main Fable/Opus full-branch-diff review**
(open items: finding F cold-start confirmation, finding G stamp-contract
reconciliation, DOM-nesting warning) — the dispatch queue is empty (NT3 was
the last unit, no other block is QUEUED per `docs/tasks/QUEUE.md`).

Previous entry (July 14, fifteenth session, Fable — relay v5 DOC
ALIGNMENT: skills + task-queue protocol swept for the v4 remnants the
adoption left behind; no product code). Four files. **`author-task-block`**
now frames the dispatch line as channel-agnostic, marks the contract-first
rules carried unchanged into v5, notes MODEL doubles as the
dispatch-routing lever (`auto` -> free CLI rung), pins that MODE governs
only the hand-relay fallback (autonomous dispatch always uses the lane
worktree), adds the DB-free-lanes-only constraint on dispatched blocks
(no `server/.env` in the lane worktree or the cloud — a block needing
the integration lane is a hand-relay flag), and ends by invoking
`dispatch-unit` instead of "hand Seth the dispatch line" (the line
survives as the documented fallback). **`land-unit`** now names the lane
worktree as the primary of THREE delivery modes (audit + lanes run in
`C:\dev\worktrees\cursor-lane`; commit in the lane on `cursor/<unit>`,
ff-merge onto the wave branch, push — the NT3 precedent), scopes the
OneDrive sync-lag caveat to the main tree, and closes with the
relay-loop continuation (idle + QUEUED unit -> `dispatch-unit`; wave
complete -> stop, the gate is Fable + Seth). **`dispatch-unit`** gains
its one missing beat: Channel B flips DISPATCHED in QUEUE.md before the
run (bookkeeping parity with Channel A). **`docs/tasks/README.md`**
rewritten from the v4 "Seth dispatches" loop to v5 (dispatch step =
`dispatch-unit` with the hand-relay line kept as fallback, DELIVERY.md
lands at the root of whichever tree the block runs in, DISPATCHED
flipped by the dispatcher, "Two modes" demoted to hand-relay paths,
Seth's job = go-aheads / bug reports / smoke sign-off / gate items,
MODEL guidance aligned with the Fable-withheld rule). `_TEMPLATE.md`
untouched DELIBERATELY — the standing footer is verbatim-standing and
"repo root" already reads correctly in whichever tree the block runs.
Next up unchanged: the pre-main gate (NEXT UP paragraph below).

Previous entry (July 14, fourteenth session, Fable — RELAY v5 ADOPTED:
pricing probe run + NT3 landed as the FIRST AUTONOMOUS DISPATCH; NT-WAVE
NOW CODE-COMPLETE). Resume sequence executed end-to-end this session:
**(1) Setup verified from ground truth** — the session restart still did
NOT propagate env/PATH to the Claude Code shell (parent process chain
holds the stale environment; durable workaround now in the spec + skill:
read `CURSOR_API_KEY` from the registry inline, invoke
`C:\Users\Sethy\AppData\Local\cursor-agent\cursor-agent.ps1` by full
path); CLI `2026.07.09-a3815c0` responds and `cursor-agent status` ->
logged in as Seth (the item last session couldn't confirm). **(2)
Pricing probe, all three rungs, $0 spent — verdict decisive:** Channel A
(cloud agents) requires usage-based pricing ON with >=$2 headroom and
NEVER draws the included Pro pool -> with Seth's overage toggle OFF it
refuses cleanly at dispatch (`400 usage_limit_exceeded`), so the
per-unit cost question is MOOT and **Channel B is the backbone for ALL
blocks**; B-named is exhausted this cycle ("saved $64 on API model
usage", resets 7/17 — the July 13 "33% consumed" dashboard reading was
evidently a different meter); B-auto works. Routing defaults flipped in
the spec + `dispatch-unit`. **(3) NT3 dispatched autonomously and LANDED
`98963f6`** — Channel B auto rung, lane worktree
`C:\dev\worktrees\cursor-lane` (created off wave HEAD, deps installed,
persists for future dispatches), 45-min hard-timeout wrapper. One
dispatch hiccup, lesson pinned in the skill: **the CLI remembers the
last-used `--model`** — the first flagless dispatch inherited the
exhausted haiku from a probe and quota-refused; ALWAYS pass `--model`
explicitly. Delivery audited per `land-unit`: lanes re-run fresh (unit
170/170, client build green), scope exact (3 files = FILES TO TOUCH),
all 7 criteria verified incl. by direct read (completed-context sheet
opens at seed with name prefilled + hadSuggestStep cleared; parent
create handler skips the stamp PATCH without `userExerciseId` — also
sidesteps bug G on this path — but still invalidates + refreshes name
resolution; live path is a no-op change; check-hex clean; slot-pill
fade-in targets a real class, `prefers-reduced-motion` gated,
tokens-only). Committed in the lane, rebased onto the wave branch,
ff-merged, pushed. **(4) Doctrine amended:** AGENTS.md + CLAUDE.md now
describe relay v5 (autonomous dispatch via `dispatch-unit`; Seth
hand-relaying still works), spec flipped ADOPTED. Also this session:
QUEUE.md had NTFIX1 stale-QUEUED — flipped to LANDED `e0ba383`; HANDOFF
aging pass done (five entries July 10-13 moved verbatim to the
archive). **Leftover (gated deletion candidates):** lane branches
`cursor/pricing-probe` and `cursor/nt3-entry-deferability-polish` (the
latter == wave HEAD; both get re-pointed by `checkout -B` on the next
dispatch anyway).

---

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

Previous entry (July 14, thirteenth session, Sonnet — MANUAL SETUP FOR
RELAY v5 COMPLETE, no product code). Walked Seth through the four-item
one-time setup checklist from `docs/specs/autonomous-cursor-dispatch.md`
("One-time setup" section) in chat: (1) **`CURSOR_API_KEY` minted +
set as a User env var** — confirmed present in the registry
(`[Environment]::GetEnvironmentVariable('CURSOR_API_KEY','User')` ->
truthy); (2) **Cursor CLI installed** via `irm
'https://cursor.com/install?win32=true' | iex` (Windows installer, not
the Unix curl form the spec's prose implied — worth a spec correction
whenever Fable next touches that doc) — **`agent login` completion is
UNCONFIRMED**, Seth moved to step 4 before answering; not necessarily
blocking since the spec allows relying on `CURSOR_API_KEY` alone in CI
mode, but verify explicitly before the first dispatch; (3) worktree
root `C:\dev\worktrees\` already existed (n5 precedent), nothing to do;
(4) **overage toggle confirmed OFF** — dashboard screenshot showed
"On-Demand Spending: Disabled" and "Monthly Limit: Disabled" under Pro
($20/mo, 33% of included usage consumed, resets Jul 17) — matches the
billing precondition exactly (exhaustion means refusals, never a
surprise charge). **Known environment gotcha hit twice this session:**
neither the env var nor the newly-installed CLI (`agent` / `cursor-agent`
on PATH) were visible to this Claude Code session's own shell after
Seth set/installed them in a separate terminal window — Windows only
hands updated env/PATH to processes spawned after the change reaches
whatever launched the session, not to an already-running one. **Session
was restarted specifically to pick these up; next session should verify
first** (`Get-Command agent`, `$env:CURSOR_API_KEY` truthy) before
attempting anything else. **Next up per the resume sequence: skip
straight to step (2)** — run the spec's pricing probe (read-only cloud
agent -> `GET /v1/agents/{id}/usage`, plus the CLI-auto rung), record
the numbers in the spec, then confirm/flip routing defaults, then the
NT3 live dispatch trial. Status still PROPOSED — nothing adopted into
AGENTS.md/CLAUDE.md until the probe validates and NT3 lands clean via
the new channels.

Previous entry (July 13, twelfth session, Fable — AUTONOMOUS-DISPATCH
WORKFLOW PROPOSAL, no product code). Seth green-lit the relay v5 design:
Claude Code dispatches task blocks to Cursor itself instead of Seth
relaying them - Channel A = Cloud Agents API (`POST api.cursor.com
/v1/agents`, delivery stays the accepted `cursor/` branch + PR-body
pattern), Channel B = headless CLI (`agent -p`) in a persistent lane
worktree at `C:\dev\worktrees\cursor-lane` (outside OneDrive, n5
precedent), with a quota fallback ladder A-named -> B-named -> B-auto
and a Sonnet-seat relay loop (dispatch -> poll -> land-unit -> next).
Gate, one-writer rule, land-unit, escalation triggers, and the pre-main
Fable gate all unchanged. **Status PROPOSED, nothing adopted yet** -
blocked on Seth's one-time setup (mint CURSOR_API_KEY, install the
Cursor CLI) + a pricing probe of cloud-agent credit burn (the single
blocking unknown; routing defaults flip on it). Spec:
`docs/specs/autonomous-cursor-dispatch.md`; dispatch ritual:
`.claude/skills/dispatch-unit/SKILL.md`. AGENTS.md/CLAUDE.md still
describe relay v4 by design - amend only after the probe validates and
the first autonomous unit lands clean. **Billing settled with Seth:**
everything rides the Pro plan's included usage (CLI-auto rung is free;
cloud agents + named models draw the ~$20/mo included pool) PROVIDED
on-demand/usage-based overage is toggled OFF or capped in the Cursor
dashboard - Seth must verify that toggle during setup so exhaustion
means refusals (which the ladder absorbs), never surprise charges.
**Resume sequence for the next session, in order:** (1) Seth's setup -
mint CURSOR_API_KEY (dashboard -> API Keys, set as User env var; does
NOT conflict with the ANTHROPIC_API_KEY rule, that one is Claude-auth
only), install the Cursor CLI + `agent login`, verify the overage
toggle; (2) Claude Code runs the spec's pricing probe (read-only cloud
agent -> `GET /v1/agents/{id}/usage`, plus the CLI-auto rung) and
records the numbers in the spec; (3) routing defaults confirmed or
flipped from the probe; (4) first live trial = dispatch NT3
(`nt3-entry-deferability-polish.md`, QUEUED, MODEL auto -> Channel B
auto rung per the spec's defaults) via `dispatch-unit`, land it via
`land-unit`, and only after that clean landing amend AGENTS.md/
CLAUDE.md to relay v5. (This file is over its ~300-line cap; aging
pass owed at the next state rewrite - not done this session to keep
the workflow commit clean.)

Previous entry (July 12, eleventh session, Sonnet — NTFIX1 AUDITED +
LANDED on `not-tracked-ux-wave`, pushed to staging). Cursor's cloud-branch
delivery (`cursor/ntfix1-nt2-smoke-bugs-1341`, PR #3) for the five NT2
smoke findings was fetched, audited, and ff-merged as **`e0ba383`**
(`804b65b..e0ba383`, `origin/not-tracked-ux-wave` confirmed; PR #3 now
MERGED). Both lanes re-run FRESH green (client `npm run build`; server
`test:unit` 170/170 tripwire), diff stays inside the two allowed client
files, and the runtime-invisible checks a build can't catch all hold:
`resolveExerciseNames` response shape (`data.results[0].resolved`) matches
how the sheet already reads it, `inputToSessionExerciseName` is imported in
`SessionDetailPage`, and the name-input `onChange` (~line 627) fires NO
mutation (write stays commit-on-blur). **Landed fixes: (B)** dead `goBack`
ternary collapsed; **(C)** post-create stamp made best-effort (inner
try/catch swallows a stamp failure so create still reaches `done`; only a
`createCustomExercise` throw surfaces an error); **(D)** Main/Assists toggle
converted from broken `role="tablist"` to `aria-pressed` toggle semantics;
**(E)** as-you-type tracked pill — new debounced (300ms, seq-guarded),
WRITE-FREE `resolveExerciseNames` in `SessionExerciseFields` reports a draft
status up to `SessionExerciseBlock`, which renders
`displayTrackedStatus = draftTrackedStatus ?? trackedStatus`; live-only
(`!isCompleted`), no commit-on-blur regression. **(F) STILL OPEN — diagnosed,
NOT fixed (no client defect found):** "Failed to fetch" creating an exercise
from scratch. Cursor could not do a full-stack local repro (cloud workspace
had no `DATABASE_URL`), so it curl-probed staging instead: `/exercises/custom`
preflight + unauthed POST behave identically to `/exercises/resolve`
(204 preflight w/ correct CORS headers, 401 on POST), which CONTRADICTS
"CORS blocks all POSTs" / "wrong API origin." `createCustomExercise` builds
the request correctly via the same `http()` wrapper as the working calls; a
raw `Failed to fetch` is a native fetch `TypeError` (no response), not an
`ApiError`. Ranked candidate: **Render cold-start / transient 502 on the
heavier POST** (staging-repoint caveat applies) — needs a live device/Network
-tab repro or the pre-main gate to confirm. No F code change (correct per the
diagnose-first contract). Deviation logged: F local browser repro not run
(no DB in cloud), curl probe used as supplementary evidence.

**LIVE BROWSER TEST OF F (same eleventh session, Sonnet — Playwright, local
`not-tracked-ux-wave` client via inline `VITE_API_URL` override -> STAGING
Render API `workout-db-staging.onrender.com`, smoke acct `smoke_b8`; NEVER
prod).** Drove the full flow: live session 342 -> typed novel name
`Zzz Cable Thruster Xyz` (pill flipped to "Not tracked" — E confirmed via
multiple write-free `/exercises/resolve -> 200`) -> "Not tracked - add?" ->
"Start from scratch" -> chest Main -> submit. **Results:** (1) **F did NOT
reproduce on the warm backend** — `POST /exercises/custom -> 201`, sheet
reached "Added to your library". Confirms no deterministic client defect;
consistent with the cold-start diagnosis, and directly corroborated by a
measured **22.5s cold-start** on the staging Render `GET /` earlier this
session (that spin-up window is exactly when a POST gets an edge 502 w/o CORS
headers -> `TypeError: Failed to fetch`). (2) **Finding C's fix VERIFIED LIVE:**
the post-create stamp `PATCH /sessions/342/exercises/510` returned **400**,
was swallowed, and the flow still completed — the exact create-succeeds/
stamp-fails path C was written for. (3) **D confirmed** — Main/Assists render
`aria-pressed`/`[pressed]`. **NEW CONFIRMED BUG for the pre-main gate (call it
G — pre-existing NT2, non-fatal, NOT NTFIX1's regression):** the
`userExerciseId` stamp on create-in-live-context 400s EVERY time. Client sends
id-only `{ userExerciseId }` (`SessionDetailPage.jsx:1833`
`handleAddToLibraryCreateCommitted`); server `updateSessionExercise`
(`sessionController.js`) only merges identity into `data` INSIDE the
`if (data.exerciseName !== undefined)` block (~line 577-605) and otherwise trips
"No fields to update" (line 531) — so a stamp-only PATCH can never persist.
Response body confirmed: `400 {"error":"No fields to update"}` for body
`{"userExerciseId":37}`. Net effect: the session_exercise row keeps
`userExerciseId = null`; attribution still works purely by name-based
resolution (why C made the stamp best-effort), but NT2/A4's structural id-link
on this path silently no-ops. Fix is a client/server contract reconciliation
(server accept id-only identity PATCH, OR client send name+id together) — a
new task block, NOT in NTFIX1 scope. **Also observed (pre-existing, not
NTFIX1):** React DOM-nesting warning — the "Not tracked - add?" pill `<button>`
is nested inside the heading-toggle `<button>` in `SessionExerciseBlock`
(invalid HTML / hydration warning). **Test residue on staging smoke acct:**
live session 342 (no sets) + custom exercise `Zzz Cable Thruster Xyz`
(userExercise 37) left behind — harmless staging pollution, not cleaned up.

Previous entry (July 11, ninth session, Opus — NT1 + NT2 LANDED on
`not-tracked-ux-wave`, pushed to staging). **NT1** (`f4baee3`) already on
staging: searchCatalog rows carry `secondaryMuscles` (additive, pure;
170/170 unit lane). **NT2** (`f26e783`) — the wave centerpiece — landed
this session: `AddExerciseToLibrarySheet` rebuilt as the suggest -> seed
-> curate -> done stepped flow (catalog-seeded, segmented Main/Assists
picker replacing the old 3-state cycling chip; `CHIP_CYCLE`/`nextChipRole`
deleted), with LINK wiring into `SessionDetailPage` via the
`updateSessionExercise` + `buildNamePatch` idiom and a `userExerciseId`
stamp on create-in-live-context. Delivered by **Composer** (Cursor was out
of Opus tokens) and audited by **Opus in Claude Code instead of Sonnet**
per Seth: both lanes re-run fresh green (client `npm run build`; server
`test:unit` 170/170 tripwire), all 11 acceptance criteria independently
verified, and the runtime-invisible things a build can't catch checked —
search-row + `resolveExerciseNames` shapes match the sheet's reads exactly,
every CSS `var()` token resolves, no dangling refs, scope limited to the 3
FILES TO TOUCH. **One reviewer fix folded into the commit:** dropped a
vestigial `getMuscles` fetch whose payload was discarded but whose
loading/error state gated the picker (chips render from the hardcoded
17-muscle constant = the server vocab). **Open findings logged for the
pre-main Fable gate (non-blocking):** (B) dead ternary in `goBack`
(`hadSuggestStep ? "seed" : "seed"`); (C) create-succeeds-but-stamp-fails
edge shows an error though the exercise was created (recoverable via the
already-tracked path; stamp is best-effort, retroactivity still works by
name); (D) `role="tablist"`/`"tab"` on the Main/Assists segmented control
has no tabpanel/roving-tabindex (minor a11y). **NT3 flipped DRAFT ->
QUEUED** (unblocked — shares both client files with NT2). Smoke NT2 on the
staging Vercel preview once Render/Vercel track this branch (see the
staging-repoint follow-up below).

Previous entry (July 11, eighth session, Fable — NT-WAVE SKELETON
AUTHORED, no product code). Seth settled the brainstorm doc's three open
questions: (1) variant-of seeding IS in scope this wave; (2) the
retroactive-attribution message lives in the sheet's success moment ONLY
— brief, informative, fires every time; no What's New copy asked for;
(3) the pain is BOTH structural and visual — full flow rebuild AND a
visual bar, not a styling pass. Three task blocks authored on
`not-tracked-ux-wave` per the relay v4 template:
**`nt1-search-secondary-muscles.md`** (QUEUED, MODEL auto — searchCatalog
rows gain `secondaryMuscles`, additive + pure, so the existing search
endpoint carries the full seeding profile; NO new endpoint, no schema, no
migration anywhere in the wave), **`nt2-add-exercise-stepped-sheet.md`**
(QUEUED, MODEL opus — Seth's July 11 call, Fable withheld for the
pre-main gate — the centerpiece: sheet rebuilt as suggest-link /
seed / curate / done stepped flow; cycling chip replaced by a segmented
Main/Assists explicit-role picker; link wiring into SessionDetailPage via
the existing `updateSessionExercise` + `buildNamePatch` idiom; create in
live context also stamps `userExerciseId` on the row; judgment-heavy
visual, so the block carries fuller design detail per the CLAUDE.md
carve-out), and **`nt3-entry-deferability-polish.md`** (DRAFT until NT2
lands — shares both client files with NT2). Facts verified during
authoring, load-bearing: catalog entries' `primaryMuscles`/
`secondaryMuscles` are ALREADY the 17-muscle picker vocabulary
(`deriveMuscleVocabulary` derives it from those fields — no translation
layer needed); completed sessions are LOCKED server-side (every
sessionController mutation guards `completedAt`), so LINK/rename is
live-only while CREATE works from completed sessions too and
retroactively lights them up via name-based resolution — that asymmetry
is NT3's whole design. Dispatch: NT1 then NT2 (file-disjoint, batchable
back-to-back, one review session), NT3 strictly after NT2. QUEUE.md
restructured: N-wave section moved under Landed, NT-wave now Active.

Previous entry (July 10, seventh session, Fable — not-tracked flow
brainstorm, NO code): Next addition chosen by Seth: rework the
"not tracked" custom-exercise UI (the `AddExerciseToLibrarySheet`
bottom sheet + its "Not tracked - add?" pill entry in
`SessionDetailPage.jsx`) — current sheet's three-state cycling muscle
chips + build-from-zero curation flow judged not user friendly. Full
brainstorm written to
**`docs/design/not-tracked-add-flow-brainstorm.md`** (diagnosis, three
directions, recommendation: catalog-seeded stepped flow A with
explicit-role picker B as its final step, body-map C parked; verified
mechanism: name-based resolution makes custom-exercise creation
RETROACTIVE over past sessions — a copy moment to use). Session stopped
before Seth answered the doc's three open questions (settled July 11 —
see top entry). Committed on new branch `not-tracked-ux-wave` off
`analytics-rebalance-wave` HEAD `e960645` (= `main` `57b1fc8` + one
docs bookkeeping commit); the rebalance branch itself stays a clean
deletion candidate.

Previous entry (July 10, sixth session, Opus — weekly-volume graph
rebuild + pre-main review): Seth smoked the N-wave on staging: passed,
one critique — the per-exercise "Weekly volume" mini read as odd (bare
bars, no values/dates/baseline, 8% min-height floor flattening small
weeks + hiding rest weeks). **Rebuilt + LANDED `2bcb6e9`** (client-only:
`ExercisesView.jsx` `WeeklyVolumeMini` + its `index.css` block): zero-based
`niceScale` heights (floor hack gone), visible baseline + faint empty-week
stubs (rest weeks read as gaps not missing data), direct peak-value label +
first/last week dates, accent fill matching sparkline/heatmap, per-bar
`title` tips. Client build green fresh; unit lane 167/167 fresh (no server
touch); tokens-only, no hex. Pushed to `origin/analytics-rebalance-wave`
(`4d89a06..2bcb6e9`). **Pre-main Opus review of the full branch diff DONE
and CLEAN** (36 files, ~4.4k insertions): cross-user isolation verified
single-point (both new exercise endpoints route through
`fetchAllTimeEnrichedSets(userId)`, same doctrine as `getSummary`; a
foreign `userExerciseId` filters to 404, no leak); NO migration coupling
in the diff (catalog/FK migrations were the A-wave, already on main);
unit lane 167/167. **N-WAVE MERGED TO MAIN `8068ffb`** (July 10, clean
ff `13a1e59..8068ffb`, 26 commits, `origin/main` confirmed == branch
tip; done via throwaway worktree per the merge-to-main ritual, no
OneDrive churn). No migration coupling, so no prod DB step. Prod
Vercel/Render track `main` and auto-deploy on push. **Open follow-ups:**
(1) verify prod deploy SHA == `8068ffb` in Render/Vercel Events (push !=
live); (2) prod smoke of the exercises tab + new weekly-volume graph;
(3) RUNBOOK step 6 — repoint staging Render from `analytics-rebalance-wave`
back to `main`, verify redeploy SHA. `analytics-rebalance-wave` is now
fully contained in `main` and is a deletion candidate (gated).

**What's New — DONE + MERGED TO MAIN (`57b1fc8`, July 10; clean ff
`8068ffb..57b1fc8`, 3 commits, no migration).** Seth's standing
not-yet-actioned note is closed: the whole
What's New surface is now PROD-ONLY via new `client/src/lib/appEnv.js`
`isProdEnv()` (keys off the API host `workout-db-l3gc`, NOT Vite build
mode — a staging Vercel build also reads PROD; same doctrine as server
`dbHostGuard`). Modal (`WhatsNewGate`) returns null off prod, archive
page (`WhatsNewPage`) redirects to `/profile`, Profile link hidden —
staging + local dev show no release notes. New release entry
`2026-07-exercises-tab` (2026-07-10) prepended to `whatsNew.js`
(non-technical copy, outcomes only); its new id re-fires the modal on
prod. Build green. **Note: because the surface is prod-only by design,
there is NOTHING to smoke on staging except confirming it stays HIDDEN;
the modal is first visible on PROD after this deploy lands — verify the
"Every exercise, in one place" modal fires there for a logged-in user.**
`main` and `analytics-rebalance-wave` are now identical (`57b1fc8`) — the
branch is a clean deletion candidate (gated).

- **Wave loose ends still open:** staging Render must be REPOINTED from
  `main` to `analytics-rebalance-wave` before Seth smokes any
  server-touching unit (N1/N2 carry engine tails). Smoke account was
  re-seeded July 10 (TODO 0b done).

Previous entry (July 10, fifth session, Sonnet — N6 LANDED
`28efeba`, the LAST N-wave unit: Cursor's delivery audited, committed +
pushed to `origin/analytics-rebalance-wave` (`5778bae..28efeba`). Unit
lane 167/167 (tripwire, no server touch) + client build re-run fresh;
scope exact (4 files, matches FILES TO TOUCH). Page empty state now
splits new-user (all-time index empty -> warm copy + "Log your first
workout" CTA) from data-exists-but-not-in-range (range chips as the
implied action), verified by direct read of the `isNewUser` gate; range
choice (2/4/8/12 weeks) now persists via `analyticsRangePref.js`,
confirmed byte-for-byte the `weightUnitPref.js` accessor pattern; Top
set / Top gain KPI tiles link to `?view=exercises&exercise=...`, volume
headline links to `?view=muscles`, empty-data tiles confirmed staying
plain (non-link) divs; `.stat-tile--link` >=44px with focus-visible +
color-mix hover, no hex in CSS diff. No deviations. **The N-wave
(analytics UI rebalance) is now CODE-COMPLETE on
`analytics-rebalance-wave` — N1/N5/N2/N4/N7/N3/N6 all landed. Next:
the wave's pre-main Fable review of the full branch diff (grep
`HANDOFF-ARCHIVE.md` for the full session history first), then Seth's
"push to main" trigger.** Visual smoke of N3/N6 together (exercises tab
+ new empty states + tile tap-through) still owed to Seth on staging —
repoint check below still applies before that smoke.

**Seth's note this session (not yet actioned — no task block written):**
the What's New modal/page currently has NO environment gate (`WhatsNewGate.jsx`
shows to any logged-in user regardless of host) - Seth wants it PROD-ONLY,
never on staging. Content-authoring process (prepend an entry to
`client/src/data/whatsNew.js`, the token-efficient data-file-edit pattern
already in use) is fine as-is and should continue. Standing copy
requirement for future releases: keep it non-technical and straight to
the point (no implementation jargon, no internal metric names - user-facing
outcomes only). Worth a small task block (env check in `WhatsNewGate.jsx` -
likely `import.meta.env.MODE` or a prod-hostname check, same family as
`dbHostGuard`'s prod/staging split) whenever Seth wants it queued; not
part of the N-wave.

Previous entry (July 10, third session, Fable — N4 LANDED `4f37361`
AND N7 LANDED `d1b2871`, both Fable-direct in the main working tree, no
worktree needed since Cursor is idle. **N4:** strength tab reframed
progression-first — table columns Exercise | Top set | Top-set trend |
Matched effort, e1RM columns + HOW_BEST_E1RM removed, footer link
"Estimated 1RM has its own view →" targets `?view=exercises` (muscles
fallback until N3, by design — now landed); sparklines re-anchored to
whole-number top-set weights via N2's `topSetSeries`, marks per the
signed July 9 mock (re-fetched and checked against its actual source:
2px accent line, 10% wash, single ringed 9px end dot, no intermediate
dots, 40px plot, bare-number endpoint labels, delta chip "+20 lbs ·
top set 245 × 3"). Unit lane 162/162 + build fresh, scope exact 3
files, e1rm grep clean, no hex. **N7:** Trend view replaced by the
binned 4-step volume heatmap; engine series bucketing parametrized
week|day (granularity derives from range, <= 14 days -> day cells;
series keys now periodStart/periodEnd; meta.seriesGranularity added);
2-weeks range chip added and rangeForWeeks fixed to span exactly N*7
calendar days inclusive (kills a latent 5th-bucket artifact); volume
table de-noised (right-aligned tabular-nums, em-dash + one footnote,
"3d" recency with warn tint at >= 14d, ? buttons out of headers); ramp
validated with the dataviz ordinal checks for all TEN palette x mode
combos — iron light anchors toward text ink (accent-vs-surface can
never clear 2:1 there), everything else on shared per-mode P constants
(light 51/66/81/100, dark 40/60/80/100). Unit lane 167/167 (5 new
fixtures, both bucket modes) + build fresh. Full evidence per unit in
QUEUE.md. Seth's on-device smoke still owed for N4/N7/N3 together.)

Session log (July 10, Fable — N-WAVE SKELETON BUILT + N5 SHIPPED +
N1 LANDED): all 7 unit blocks authored + queued on new branch
`analytics-rebalance-wave` (off catalog-fk-wave HEAD `3d4e874` = main +
docs + a settings commit); N5 implemented Fable-direct same session
(`c4e3ba8` — exercise index/detail endpoints + rep-target engine, unit
lane 153/153, isolation+purity greps clean, built in worktree
`C:\dev\worktrees\n5`, kept for N4/N7); N1 landed Cursor-relay same day
(`11b9c71` — shared weight/effort formatters + component sweep, unit
lane 157/157, Fable-audited deeper than the standard pass since Fable
authored the block, no deviations).
- Blocks: `docs/tasks/n{1,2,3,4,5,6,7}-*.md` (see QUEUE.md Active for the
  index). **Filename collision marked:** the June nav-wave's landed
  n1/n2/n3 task files still exist — dispatch by FULL filename only.
- **Division settled with Seth:** Cursor lane N1 → N2 → N3 → N6
  (mechanical/relay); Fable-direct N5 → N4 → N7 (isolation surface +
  the two mock-signed visual units). N4/N7/N3 all touch
  `AnalyticsPage.jsx` — strictly sequential N4 → N7 → N3.
- Spec open items SETTLED during authoring: rep ladder 1/3/5/8/10/12/15
  (20 rejected: Epley error > plate increment that far out); adaptive
  coverage threshold 0.6 (named constant, landed in N2); plate
  increments 2.5 lbs / 1.25 kg (N1 `roundToPlate`). Spec gap found +
  fixed in-block: N4's sparklines need a per-session top-set weight
  series the payload lacked — `topSetSeries` added to N2's engine tail
  (now landed) so N4 stays client-only.
- **Loose ends for this wave:** (a) staging Render must be REPOINTED
  from `main` to `analytics-rebalance-wave` before Seth smokes any
  server-touching unit (N1 and N2 both carry engine tails, both now
  landed); (b) re-seed the staging smoke account before visual sign-off
  (TODO 0b).

---

Session log (July 9, Fable — N-wave spec complete): criteria + chart
forms signed off via mock. Docs-only session, no code.) Seth set the
wave's completion bar ("passes as a professional frontier weightlifting
app, down to every detail") and the session turned that into contract
material in `docs/specs/analytics-ui-rebalance.md`:
- **3rd pass (`2929579`):** code-level audit of the whole analytics tab
  against the bar → the **F-test** (10-item exit checklist; runs per-unit
  on touched files + in full at pre-main review). Findings folded into
  units: weight/estimate formatting into N1 (four duplicated `formatWeight`
  copies all print "225.0 lbs"; new `weightDisplay.js`, estimates rounded
  whole), two mechanical traps named in N3 (4th tab breaks the hardcoded
  3-col tabs grid; `setView`'s `setSearchParams` CLOBBERS other query
  params), plate rounding added to N5 rep targets (client-side, 2.5 lbs /
  1.25 kg), and a new **N6 frontier-polish unit** (actionable two-variant
  page empty state, range persistence via `analyticsRangePref.js`, KPI
  tile deep-links).
- **4th pass (`fa3b4f8`):** chart-form design pass (dataviz method) on
  Seth's "trend and table are a mash" feedback. Built a side-by-side mock
  artifact ("LogChamp — Analytics chart-form proposals",
  claude.ai/code/artifact/2470c620-b4d9-47aa-a301-0a14181162f5), rendered +
  verified light/dark/390px. **Seth SIGNED OFF:** Muscles Trend becomes a
  binned volume HEATMAP (4-step accent-derived ramp, validator-passed for
  champ both modes; empty cell = faint neutral, deliberately NOT ramp
  step 1), Table de-noised (right-aligned tabular nums, ONE unlock
  footnote replacing per-cell sentences, 14d recency warn tint), Strength
  sparklines get the full mark spec (top-set series, 2px accent line, 10%
  wash, ringed endpoint — folded into N4). All landed as new unit **N7**.
- **Seth's period question, tested against the bar at his instruction
  ("don't take my word as absolute"):** 10/15/20-day bucket lengths
  REJECTED (nonstandard denominators — nobody can benchmark "sets per 10
  days"); accepted mechanism = **new 2-week preset rendering DAY
  granularity** (14 cells; the honest non-weekly-split answer — mock
  section 1b, phone-width verified). Custom date picker rejected for the
  wave; presets now 2/4/8/12; granularity derives from range, never a
  second knob. Rationale written into the spec so it isn't re-litigated.
- **Wave shape now: N1 → N2 → N4 → N7 → (N5 → N3) → N6**, spec-complete.
  N4+N7 both touch `AnalyticsPage.jsx` — sequential, don't batch.

---

**Updated:** July 8, 2026 (Opus — A-WAVE PROD ROLLOUT COMPLETE, MERGED TO MAIN,
SMOKED LIVE.)** Executed the full prod choreography WITH Seth (agent did
reads/prep only; Seth ran every prod write). All steps verified:
- **Step 0 (read):** prod had 14 healthy migrations, NO `Exercise` table, NO
  failed records — the CLEAN case (unlike staging's old May-27 collision). No
  `readonly_agent` role was stood up; Seth ran the Step-0 reads in the Neon
  editor and pasted output.
- **Steps 1 + 3 (migrations, Seth hand-applied in Neon editor):** catalog
  `20260707120000_add_exercise_catalog` and FK-linkage
  `20260707130000_add_exercise_fk_linkage`, each as one transactional block
  (DDL + hand-inserted `_prisma_migrations` row). Checksums derived from the
  migration files via **LF-normalized sha256** — proven correct against two
  existing prod rows FIRST; the working tree is CRLF so a raw `sha256sum` is
  wrong, must `tr -d '\r'` before hashing. Values: catalog `85908f0e…a6d5a`,
  fk-linkage `1cb43415…dfc63`, both == staging's stored rows.
- **Step 2 (seed, Seth ran):** `npm run prisma:seed` against prod via
  shell-set `$env:DATABASE_URL` — dotenv does NOT override an already-set
  shell var, which is the mechanism that lets prod win while `.env` stays on
  staging. Two false starts, both instructive: (a) the `<PLACEHOLDER>` URL
  pasted verbatim → guard "unparseable" (which PROVED dotenv wasn't
  clobbering); (b) a non-owner role → `42501 permission denied for table
  Exercise`. Fixed by using the **`neondb_owner`** connection string (it owns
  the table). Result `Seeded 873 exercises (30 with muscleWeights
  overrides)`; verified `count = 873` / `30`.
- **Step 4 (diff):** prod ledger = 16 rows, all `finished_at` set, last two
  checksums canonical → prod == staging == code, no drift. (Closes old Open
  TODOs #2 migration-diff and #3 username-checksum — prod's
  `add_user_username` checksum matched the canonical file exactly.)
- **Step 5 (merge, gated "push to main"):** clean fast-forward
  `3767840 → 13a1e59`, done via `git branch -f main` (no-checkout, to dodge
  the OneDrive lock + the dirty working tree; true ff so safe). Pushed;
  `origin/main` confirmed `13a1e59`.
- **Step 6 (smoke):** Seth smoked prod LIVE — login + exercise typeahead +
  existing sessions + analytics/attribution all work. **Confirmed working.**
DB-before-code ordering held throughout; zero code-ahead-of-DB window.
**Remaining, non-urgent:** optional Step-7 historical backfill
(`scripts/backfill-exercise-ids.mjs`, dry-run then `--apply`) — historical
rows carry valid NULL identity until then. (Staging Render already repointed
to `main` — Seth confirmed July 8.) **Still
open from the prior EOD:** codify the read-only-prod-review exception into
AGENTS.md invariant #9 + gate item 2 (needs Seth's exact wording — do NOT
unilaterally rewrite the safety invariants).

---

**Updated:** July 7, 2026 latest+5 (Opus — EOD; prod choreography PREPPED,
handoff for next session. Seth done for the day.)** No prod writes happened
this session — the whole prod rollout is teed up for the next session to
execute WITH Seth. Decisions locked here:
- **NEW RULE (Seth, this session):** during **Opus/Fable review sessions**
  the reviewing agent gets a **READ-ONLY prod DB connection** for diagnostics
  (dedicated `readonly_agent` Neon role, SELECT-only); **all prod WRITES
  (migrations, seed) still stay with Seth.** Does NOT extend to Sonnet/Cursor.
  Rationale: the May-2026 wipe was a *different, non-frontier* model. Saved to
  memory (`opus-fable-review-prod-access`). **TODO next session: codify this
  scoped exception into AGENTS.md invariant #9 + gate item 2 (get Seth's exact
  wording — do NOT unilaterally rewrite the safety invariants).**
- **Read-only access NOT yet stood up.** To do the agent-side Step-0 read,
  Seth creates the `readonly_agent` role on prod (SELECT-only CREATE ROLE +
  GRANTs) and drops the real conn string in an OFF-TRANSCRIPT scratchpad file;
  OR just pastes the Step-0 query output from the Neon editor and skips the
  role entirely (both queries are in Next-up item 0). Placeholder string Seth
  first pasted had a template password (`choose-a-strong-password-here`) — not
  usable; real creds go via file, never chat.
- **Seed method LOCKED = Option A:** `npx prisma db seed` against prod (tested,
  idempotent, no hand-written SQL, identical 873-row result). It's a WRITE, so
  **Seth runs it** with the write-capable prod owner URL (NOT `readonly_agent`).
  Today's `assertRecognizedHost` guard split is what lets seed run on prod.
- **State unchanged on prod:** prod still has NEITHER catalog nor FK migration;
  `origin/main` still `3767840`; branch `catalog-fk-wave` `6331647` is
  review-clean and pushed. NOT merged. Full ordered choreography = Next-up
  item 0.

**Updated:** July 7, 2026 latest+4 (Opus — PRE-MAIN REVIEW DONE + guard-split
fix landed `0e6f32a`.)** Ran the mandated Fable/Opus pre-main branch-diff
review of the whole A-wave (`catalog-fk-wave` vs `main`), with the archived
session logs in hand. **Verdict: code is clean and mergeable** — schema/
migrations additive and consistent (nullable FKs, SET NULL, one-identity
CHECKs, indexed), the `userExerciseId` tier correctly threaded resolve ->
enrichSet -> attribution (the `0d2118e` regression fix holds and is pinned),
write-path controllers enforce cross-user ownership on `userExerciseId` and
reject both-set, backfill is idempotent/dry-run-default/`--apply`-gated, client
picker is debounced+seq-guarded+no-portal+a11y, CSS token-clean. Fresh lanes:
unit 129/129 then 137/137 after the fix, client build green.
**One finding, fixed this session (direct-fix, diagnosis was the work):** the
prod migration choreography needs `npx prisma db seed` (873 catalog rows) and
the A6b backfill `--apply` on prod, but BOTH called `assertSafeForReset`, which
denylists the prod host — the prod rollout would have been blocked by its own
guard at the seed step. Split the guard: new `assertRecognizedHost` (permits
prod deliberately, still rejects unknown/typo'd hosts) now guards seed.js +
backfill; `assertSafeForReset` (staging/localhost only) still guards the
destructive test-reset path (`jest.setup.js`) unchanged. Added first-ever
`dbHostGuard` unit tests (137 total now) routed into the fast unit lane
(`test/lib/**`). Committed `0e6f32a`, pushed, origin confirmed.
**Minor note (not fixed, non-blocking):** `updateSessionExercise` silently
drops a provided identity when the patch carries no `exerciseName` — harmless,
the picker always sends both.

---

**Updated:** July 7, 2026 latest+3 (Sonnet — A5 + A6b LANDED, both audited
and committed same session; ALSO fixed a real A4 regression found during
the audit.)** Render confirmed pointed at `catalog-fk-wave` on the latest
commit (Seth verified), so the A-wave code is confirmed live on staging.
Dispatched A5 (`a5-exercise-picker.md`) and A6b
(`a6b-exercise-id-backfill.md`) to Cursor back-to-back per the v4
batchable-disjoint-files rule; Cursor delivered both, but overwrote its own
`DELIVERY.md` running the second task, so A5's per-criterion evidence
report was lost — audited A5 directly against the tree instead (re-ran
every lane fresh, read the fixture tests to confirm they pin real
behavior rather than trusting the report). **Worth flagging for future
dispatches: DELIVERY.md is single-file, so back-to-back units on the same
task file will clobber each other's report - review right after each stops,
or expect to reconstruct the first unit's evidence by hand.**

Audit surfaced a real bug, not caused by this session's diff: A4's
`resolve.js` added a `userExerciseId` stored-id resolution tier, but
`attribution.js`'s source check was never updated to recognize it (only
matched `"userExercise"`) - so any session exercise resolved via the new
tier (the normal case once A4 stamps ids at write time) silently lost its
muscle attribution entirely. Surfaced because this was the first full
`npm test` run since staging's migration made the tier actually reachable
(`exercises.integration.test.js`'s custom-exercise analytics test failed
with an undefined quadriceps bucket). Root-caused by tracing resolve.js ->
enrichSet.js -> attribution.js; one-line fix, shipped directly per the
direct-fix exception (diagnosis was the bulk of the work) rather than a
Cursor diagnosis-block round trip. **Committed separately from A5/A6b**
since it's outside their FILES TO TOUCH.

Three commits, in order: `0d2118e` (attribution fix), `c7c8ca6` (A5),
`eeaa30c` (A6b) - all pushed, origin confirmed. Full suite re-run fresh
after the fix: 185/185 green (20 suites). Client build green, no hex in
CSS diff, searchCatalog purity/no-portal greps clean, A6b's
`assertSafeForReset` guard + `--apply` gating verified directly (not
trusted from the report). **A-wave is now feature-complete on
`catalog-fk-wave`.** Given the whole wave is backend/script-shaped except
A5's live-session typeahead, and very little of it is visually smoke-able,
Seth explicitly opted to skip his own visual sign-off on A5 and rely on
the mandated Fable/Opus pre-main branch-diff review as the sole gate
before merge. **Next: kick off that review** (it should grep
`HANDOFF-ARCHIVE.md` for the wave's full session history per the standing
rule) - then, if clean, the prod migration choreography (same choreography
as staging, but check prod's `_prisma_migrations` for the same
old-migration-name situation first - unverified) - then "push to main"
(Seth's trigger phrase, gated).

**Updated:** July 7, 2026 latest+2 (Fable — workflow-docs side session, NO
code, NO A-wave movement).** The poor-mans-workflow tracking doc
(`docs/specs/poor-mans-agentic-workflow.md`) gained three sections at
Seth's direction: 6 steering layer (keep-human-on-task + anti-loop
mechanisms, "erosion-resistant not foolproof"), 7 adopter setup interview,
8 measured pilot receipts (~24 units/6 days, zero bounces, 2 prod-breaking
defects caught; old sections 6/7 renumbered 9/10). The public shell repo
(`C:\dev\the-poor-mans-agentic-workflow`) was refreshed in the same
session: source-material re-scrubbed to current v4 files (+ QUEUE and
HANDOFF-ARCHIVE snapshots added as receipts ground truth), BRIEF rewritten
to the v4 story with Seth's publishing decisions settled and written in
(MIT, named-tools-first, provenance-only receipts, on-ramp tone) - it is
now READY for the claude.ai/code buildout. One docs commit here on
`catalog-fk-wave`; the Render staging-service check in the entry below is
STILL the next A-wave action.

**Updated:** July 7, 2026 latest+1 (Sonnet — STAGING MIGRATED: A1 + A4 both
now live on staging; CORRECTS a wrong historical claim below.)** Ran the
staging migration choreography and found ground truth did not match this
file: **the May 27 catalog migration (`20260527120000_add_exercise_catalog`,
from the abandoned pre-A1 branch) was never wiped from staging** — it has
been applied and the `Exercise` table has held all 873 rows, fully seeded,
continuously since May 27. The July 6 entry below claiming "test resets
wiped it from staging, 14 migrations, zero drift" was simply wrong (verified
directly via `_prisma_migrations` + row count query, not inferred). On top
of that, an earlier `prisma migrate deploy` attempt today against staging
(pre-dating this fix) tried to apply the new re-timestamped
`20260707120000_add_exercise_catalog` migration, hit `relation "Exercise"
already exists`, and left a FAILED migration record blocking all further
deploys. **Fix applied (Seth approved all 3 steps):** (1)
`prisma migrate resolve --applied 20260707120000_add_exercise_catalog` to
baseline the bookkeeping onto the schema state that already existed, (2)
`npx prisma db seed` (idempotent — refreshed muscleWeights curation to the
current A2-cleaned 30-key set; row count unchanged at 873, confirmed against
`exercises.json`), (3) `npx prisma migrate deploy` applied A4's
`20260707130000_add_exercise_fk_linkage` cleanly. **Verified directly by SQL
query** (not just `migrate status`): `exerciseId`/`userExerciseId` present on
TemplateExercise/SessionExercise/BlockWorkoutExercise, `blockWorkoutSetId` on
WorkoutSet, all three `_one_identity_chk` CHECK constraints present. The
orphan `20260527120000_add_exercise_catalog` row stays in `_prisma_migrations`
harmlessly (not present locally, but not blocking — matches no local
migration name so `migrate status` will always flag it as drift; low-priority
cleanup candidate, not urgent). **Open question for whoever does the prod
migration:** confirm the SAME old-migration situation isn't also true on
prod before assuming the choreography there starts from a clean slate — this
session did not check prod. **Next: verify whether Render's staging service
is actually pointed at `catalog-fk-wave`** (RUNBOOK step 2 - it normally
tracks `main` and needs manual repointing) before assuming the already-pushed
A4 code is live; confirm deploy SHA in Events either way. Then A5/A6b dispatch.
**Session closed here (Seth, July 7, EOD).** Nothing else in flight - working
tree clean except `.claude/settings.json` (local permissions, untracked
elsewhere) and `claudefiledrop/` (two Discord CDN `.url` shortcuts, not yet
the expected Gemini sprite PNGs). Pick up next session with the Render
check above.

**Updated:** July 7, 2026 latest (Sonnet — A4 LANDED `0743070`; L-wave prod
smoke closed.)** Seth confirmed the L-wave prod smoke (Open TODO #1) is
complete — no issues reported. **A4 (`a4-exercise-fk-linkage.md`) audited and
committed `0743070`, pushed, origin confirmed on `catalog-fk-wave`.** Nullable
`exerciseId`/`userExerciseId` on TemplateExercise/SessionExercise/
BlockWorkoutExercise (+ at-most-one CHECK per model), `blockWorkoutSetId`
groundwork on WorkoutSet, write-path stamping helper
(`server/src/lib/exerciseIdentity.js`, catalog beats userExercise, mirrors
`resolveExercise` tier order), `resolve.js` gains a stored-`userExerciseId`
tier ahead of name resolution. Audit re-ran both lanes fresh (unit 124/124,
`prisma validate` clean — matches `DELIVERY.md`'s claims), confirmed scope
exact against FILES TO TOUCH (13 files, no client touch), verified the
migration SQL by hand (7 ADD COLUMN / 7 indexes / 7 SET-NULL FKs / 3 CHECK,
no DROP/NOT NULL/DEFAULT), confirmed schema types match the block's exact
spec (String? on the Exercise FK, Int? on the UserExercise FK — avoids L3's
wrong-FK-type mistake), and spot-checked `analyticsController.js`'s id
precedence against the pre-existing `exerciseName` derivation precedence
(`sessionExercise ?? templateExercise ?? null`) — identical shape, not
invented. Integration lane written (4 tests) but deliberately NOT run per
the block's sequencing flag. **Migration is NOT applied to any environment
yet.** Next: Seth's staging migration choreography (RUNBOOK, gated) — (1)
`20260707120000_add_exercise_catalog`, (2) `npx prisma db seed` from
`server/`, (3) `20260707130000_add_exercise_fk_linkage`, in that order —
then staging Render redeploy, then dispatch A5/A6b.

---

## Superseded current-state entries (July 7, 2026 latest+1)

**Updated:** July 7, 2026 (Fable — A-WAVE OPENED: Track A structural
exercise identity. A1 landed direct; A4/A5/A6b authored and queued.)**
New branch `catalog-fk-wave` (off `logging-ux-wave` HEAD `80373e1` = main
`3767840` + one docs commit). **A1 LANDED `3a6bc25` (Fable direct):** the
stale `exercise-catalog-seed` branch (`c27a6de`, May 27) reconciled by
hand, NOT merged - its package.json predated `test:unit` (a blind merge
would have deleted it) and its prisma.config.ts seed shape predated Prisma
6.19 (`migrations.seed` is the current location; the deprecated
package.json `prisma` block was deliberately skipped). Exercise model added
standalone (no FKs), migration re-timestamped `20260527120000` ->
`20260707120000_add_exercise_catalog` (safe: never applied to prod, and
test resets wiped it from staging - July 6 verification showed 14
migrations, zero drift), seed.js verbatim (idempotent upserts,
`assertSafeForReset` guard), `server/data/README.md` updated for the
curated muscle-weights/aliases reality. `exercises.json` was already
byte-identical on main - data shipped with the engine, only the table
never landed. Unit lane 119/119 + `prisma validate` green; deploy-safe
before its migration (nothing queries the table). **Wave blocks authored
(contract-first): `a4-exercise-fk-linkage.md`** (nullable
exerciseId String? / userExerciseId Int? on TemplateExercise /
SessionExercise / BlockWorkoutExercise + CHECK at-most-one + WorkoutSet.
blockWorkoutSetId groundwork for block plan-vs-actual; write-path stamping
helper; engine gains a stored-userExerciseId tier; schema snippet in the
block IS the contract - L3's wrong-FK-type lesson), **`a5-exercise-picker.
md`** (pure searchCatalog + GET /exercises/search + live-session typeahead
writing ids on commit; free text stays first-class), **`a6b-exercise-id-
backfill.md`** (dry-run-default script stamping historical rows; unresolved
report feeds alias curation). **Migration choreography (Seth, RUNBOOK,
gated): after A4 lands - staging gets catalog migration, then `npx prisma
db seed`, then the A4 linkage migration, in that order (stamped FK values
need catalog rows), then Render redeploy, then A5/A6b.** A4's sequencing
flag is app-wide (regenerated client selects new columns on every
template/session/block read). Housekeeping this session: stale TODO #0
closed (reps `step="1"` verified at SessionDetailPage.jsx:934 - L6 fixed
it), moot `prod-migrate-l1-l3-prep.md` task file deleted (prod migrations
were applied by hand July 6), QUEUE rewritten for the A-wave. **Next:
dispatch A4 to Cursor; Seth's prod smoke of the L-wave on `3767840` is
still outstanding (list below).**
(Superseded: its claim that staging's May 27 catalog migration was "wiped"
by test resets was WRONG - see the July 7 latest+1 HANDOFF entry that
corrects this from a direct DB query. Also superseded by A4 landing and
the staging migration choreography completing.)

## Superseded current-state entries (July 7, 2026 latest+2)

**Updated:** July 6, 2026 latest+1 (Opus — T3B "basic" cold-start lifter
loader MERGED TO MAIN; Gemini sprite upgrade queued.)** `logging-ux-wave`
fast-forwarded onto `origin/main` again — clean ff `451a3d6..3767840`, two
commits only: `73becdc` (feat: animated lifter mark on the cold-start boot
loader) + `3767840` (QUEUE doc). No migrations, no schema, no server change —
client CSS + docs only; **prod DB untouched**, deploys the client to prod
Vercel. Local + origin `main` both at `3767840` (local ref fast-forwarded to
match; ff push straight to `origin/main`, no checkout — avoids the OneDrive
lock hang). **What shipped:** the page-tone `LoadingState` (ProtectedRoute's
sole `tone="page"` user — the boot screen shown while `/auth/me` wakes a cold
Render server) swapped its breathing ring for an accent-tinted pixel-lifter
mask (`client/src/assets/brand/lifter.png`) doing a CSS-transform "rep"
(translateY + scaleY, `coldstart-lift`/`coldstart-glow` keyframes, lockout
glow, reduced-motion static, label cross-fade + delayed reveal untouched).
**This is a deliberate PLACEHOLDER** — Seth judged the single-silhouette bob
"not professional" (no articulation, no face). **Queued upgrade (decided this
session):** replace it with a real 3-frame full-color expressive pixel sprite —
Rack (bar at shoulders, elbows bent) / Drive (mid, gritted-teeth effort) /
Lockout (bar overhead, arms straight) — looped **A-B-C-B** via CSS `steps()`.
Art direction settled: full-color expressive mascot, ONE master character
recolored per palette (unique-per-theme, like the scene rasters). **Seth
generates the 3 frames in Gemini** (hero-then-image-edit workflow; prompts
handed off this session — flat limited palette, neutral skin / chalk-gray
singlet / steel bar so recolor is clean, feet+hips locked across frames to
prevent jump), drops the transparent PNGs in `claudefiledrop/`; then Claude
Code slices+aligns into a sheet, builds the `steps()` A-B-C-B animation,
generates the 4 palette recolors, wires it into `LoadingState`/`index.css`,
refreshes the preview harness. **Preview harness exists:** a standalone
Artifact (real sprite mask + real per-palette tokens + exact keyframes, with
palette/theme/motion/size controls) to judge the loader without a cold-start
wait or deploy — reuse/refresh it when the real sprite lands. **Verify (Seth,
browser):** Vercel prod Events show `3767840` deployed. Next: Gemini frames ->
sprite upgrade.
(Superseded: still the current plan for T3C, just archived for HANDOFF
capping - see the "Next up" section in HANDOFF.md for the live pointer.
Note as of this archiving: the two files dropped in `claudefiledrop/` are
Discord CDN `.url` shortcuts, not yet the expected transparent PNG frames.)

## Superseded current-state entries (July 7, 2026)

**Updated:** July 6, 2026 latest (Opus — L-wave MERGED TO MAIN; prod migrations
applied + verified first.)** `logging-ux-wave` (`d927fb8`) fast-forwarded onto
`origin/main` — the whole L-wave (L1/L2/L2B/L3/L4/L5/L6 + A6), the off-queue
login-UX + resume-hero fixes, and the docs/relay-v4 restructuring are now on
`main`. **State correction:** `main` was NOT at `750c42b` as the older entries
below say — `ui-nav-overhaul` had already merged (main was at `516d249`, nav
features live), so the feared merge-order conflict was moot and the What's New
copy (which advertises the nav overhaul) is accurate. Merge was a clean ff
(`516d249..d927fb8`), no worktree, no conflicts; local + origin `main` both
confirmed at `d927fb8`. **Prod DB migrated FIRST (schema-ahead-of-code, the
safe order), by Seth by hand in the prod Neon SQL editor
(`ep-solitary-sea-an56mioq`), verified this session from his screenshots:**
`WorkoutSet.side` (`text`) exists; `UserExercise` table has its 6 columns;
`_prisma_migrations` went 12 -> 14 rows. Both ledger rows carry the real
staging checksums (pulled read-only this session):
`20260704120000_add_workout_set_side` =
`0dea47c048f0d8db874880e3a32200d0da46c09e0eac1769e83dbe7eb312308c`,
`20260704130000_add_user_exercise` =
`4b2195e0821ef9e6df5afd2b55fcb3b8246fbbe6f297d0ec185e927da645866b` (both
`applied_steps_count` 1). **Next: verify prod Render/Vercel Events show
`d927fb8` deployed, then smoke prod** — analytics/summary end-to-end (the path
the L3 flag threatened), unilateral L/R logging, the tracked-exercise pills +
add-to-library sheet, and the What's New modal firing once. Pre-existing Open
TODOs (#1-6) below still stand. Cursor's migration-prep branch
(`origin/cursor/prod-migrate-l1-l3-prep-0b4a`) is now redundant — deletable
whenever.
(Superseded by the July 7 entry recording the L-wave prod smoke as complete
and A4 landing on `catalog-fk-wave`.)

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
