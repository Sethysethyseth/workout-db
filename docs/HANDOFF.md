# HANDOFF — current state

**Next action (human):** **Decide how the F-wave finishes - the Cursor quota is
gone and F2/F3 cannot be dispatched.** Every rung on the ladder is exhausted
(named models refuse on this plan; auto hit its usage limit mid-F1). Options are
laid out in "The F-wave" below: upgrade to Cursor Pro, wait for the quota to
reset, or waive the standing no-inline-code rule for the last two units. Nothing
else moves until you pick. Also open, blocking nothing: prod-smoke the E-wave on
production (merged `d272930`, prod Vercel rebuilt), and the `docs/parked/*`
ruling.

> **Standing rule:** the line above is filled on EVERY rewrite and is
> never empty or deferred — one sentence, the single thing SETH does
> next (not the agent). If nothing is blocked on him, it says so
> explicitly. Dogfoods the shell repo's decision-10 no-dangling-next-
> action requirement; `land-unit` section 5 keeps it maintained.

**Updated:** August 2, 2026, thirty-eighth session (Opus frontier seat — **E-wave
gated and MERGED to `main`; F-wave opened, authored, and PARKED at 2/4 on
exhausted Cursor quota**). Prior entry: August 2, thirty-seventh session (Opus —
E3 + E4 authored and landed; AI0 RULED and its recon landed). Full session logs
are verbatim in `docs/HANDOFF-ARCHIVE.md`.

---

## The F-wave (effort MANDATORY) — 2/4 LANDED, PARKED on quota

Branch **`effort-mandatory-wave`** at **`3da8bf5`**, pushed, branched off `main`
`8541bca`. NOT smoked, NOT gated. No schema change or migration anywhere in it.

- **F0** `00e06d9` — a template's stored effort signal now reaches the live
  session (six server selects + a one-time client seed).
- **F1** `3da8bf5` — either-or signal control (`rir | rpe | null`) plus
  `effortSignalPref.js`, wired to all five call sites.
- **F2** `f2-legacy-effort-required-choice.md` — QUEUED, undispatched.
- **F3** `f3-live-session-effort-enforcement.md` — QUEUED, undispatched.

**Why it is parked.** Every rung of the `dispatch-unit` fallback ladder is
exhausted: Channel A is off by the standing billing precondition, Channel B
named refuses (`Named models unavailable. Free plans can only use Auto.`), and
Channel B auto hit its usage limit partway through F1. The ladder's terminal
rung is STOP-and-page-Seth, which is where this sits. **Seth's call, three
options:** (1) upgrade to Cursor Pro, which also restores the named rung the
MODEL header assumes; (2) wait for the auto quota to reset and resume with no
other change; (3) waive the standing "Claude Code never writes feature code
inline" rule for F2/F3 only. Option 3 contradicts the relay's whole cost model
and should be a deliberate exception, not a drift - do not take it silently.

**Two things the next session must not re-derive:**

1. **F0's bug was an AUTHORING error, and it is the wave's main lesson.** The
   block said to patch `FULL_SESSION_RELATIONS`; that object is referenced at
   exactly ONE call site - creating an ad-hoc session, which by definition has
   no template - so the fix as contracted landed where it could never fire, with
   a green build and a truthful no-deviations report. The real load path is
   `getSessionById`, which carries its own inline select. Recon had named BOTH
   sites; the block carried one. **When recon lists two locations, the contract
   names both or says why not.**
2. **F1 landed WITHOUT a delivery report** - a salvaged killed run (code written,
   `DELIVERY.md` not, quota died in between). Every acceptance criterion was
   audited directly instead. The pre-main gate must read F1 as first-pass
   material, not as something already reviewed twice.

**Smoke items accumulated so far** (do NOT smoke yet - the wave is incomplete;
these carry forward to the consolidated wave checklist):
- Build a template with RIR on, start a workout from it, confirm the RIR field
  appears WITHOUT touching a checkbox. This is F0's whole point and neither
  runnable lane can prove it - the unit lane is analytics-only and the
  integration lane cannot run in a dispatch worktree.
- New template / new block template: the control offers exactly one of RIR/RPE,
  never both, never neither.
- Switch to RPE, reload, create another template - it should still be RPE.
- Open a legacy template (both toggles off historically): expect neither
  selected and the education nudge. The REQUIRED-CHOICE prompt is F2, not landed.

---

## The E-wave — CLOSED. 4/4 landed, smoked, gated, MERGED to main.

**Merged August 2 as a clean fast-forward, `7d1c9ba..d272930`**, verified on
`origin/main` by SHA (`origin/main` == `origin/effort-wave` == `d272930`). No
merge commit. Branched off `main` `90248f9`. Client-only throughout — five
client files, no server code, no schema change, no migration, so the merge
carried no DB work and the manual migration track was never engaged.

- **E1** `876bd58` — RIR defaults ON for new templates, new block
  templates, and quick logs; RPE stays off; a stored boolean always wins.
- **E2** `3eadc64` — point-of-edit nudge + why-RIR education when both
  toggles are off, both variants, tokens-only.
- **E3** `19c2c20` (August 2) — the "why we ask for effort" rationale as a
  `HowCalculatedButton` on the Analytics Data-quality coverage row.
- **E4** `965b2c8` (August 2) — the same rationale, one short sentence, ALWAYS
  VISIBLE under the coverage meter. The `(?)` stays and keeps the long copy.

**Smoke sign-off: Seth, August 1 — covers E1/E2 ONLY.** He raised three
findings; all three were classified as next-wave scope, none an E1/E2
contract failure (see the F-wave section). He then explicitly chose to gate
and merge the wave as-is rather than hold or revert E2. **E3 and E4 postdate
that sign-off and are NOT covered by it.**

**Pre-main gate: PASSED August 1, but only through `1a585ed`.** Lanes were
re-run fresh on the branch — 204 unit tests / 15 suites green, client build
clean, `check-hex.mjs` exit 0. Each commit touched exactly the files its
block named (E1 two, E2 two); `schema.prisma` absent from the diff as
contracted; no scope leakage; no security/auth/cross-user surface.

**Scoped gate on the delta: PASSED August 2** (Opus frontier seat), covering
`1a585ed..8b34138` — E3, E4, and the docs/spec/queue commits between them. Seth
smoked E3+E4 and signed off first, in order. Lanes re-run fresh on the branch:
204 unit tests / 15 suites green, client build clean, `check-hex.mjs` exit 0.
The delta's only code file is `AnalyticsPage.jsx` (E1/E2's files are untouched
by it, so their August 1 PASS still stands); zero server, schema, or migration
files anywhere in the wave; no scope leakage. Both blocks' contracts met
verbatim, including E4's grid-SIBLING placement constraint and the
byte-identical `effortCoverage === null` branch.

**The one cross-unit seam was checked directly, not assumed.** E2 modified the
SHARED `RirRpeToggleRow`, whose nudge keys off prop ABSENCE (`!useRIR &&
!useRPE`) — so call sites no block ever named could render it spuriously with a
green build. Both untouched sites (`EditTemplatePage.jsx:198`,
`EditBlockTemplatePage.jsx:313`) pass `useRIR`/`useRPE` explicitly. Seam clean.

**Merge mechanics, verified:** `main` is an ancestor of `effort-wave`, so the
merge is a clean fast-forward with no divergence to reconcile.

### E3/E4 — the effort rationale, and why it took two units

Both touch only `client/src/pages/AnalyticsPage.jsx`. E3 filed the rationale
behind the Data-quality `(?)`; E4 added the always-visible one-liner under the
coverage meter when smoke found E3 invisible. Both live in the
`effortCoverage !== null` branch only — a user at 0% coverage renders that row
and IS the intended reader, while `null` means no attributed sets at all.
Deliberately NOT mid-workout: an explainer bolted to a mandatory field signals
the field is an imposition. Full rationale in HANDOFF-ARCHIVE.

The copy reuses E2's smoke-approved line, which is load-bearing for the
F-wave: E2's nudge fires on `!useRIR && !useRPE`, impossible once one signal
is always selected, so that copy would otherwise have become dead code.

**Gate note, August 2 — copy drift, for whoever authors the F-wave.** "Reuses"
above is generous: the "two sets of 10" sentence now ships in THREE hand-varied
forms — E2's nudge (`RirRpeToggleRow.jsx:22`, colon, "taken to the limit",
"RIR is how"), E3's `HOW_EFFORT_MATTERS` (hyphen, "taken to the limit", "RIR
(or RPE) is how"), and E4's `EFFORT_RATIONALE_SHORT` (hyphen, "at the limit",
"Effort is how"). Each is defensible alone and none is a defect, so this did
NOT block the gate. But the F-wave plans to repurpose E2's copy into the
legacy required-choice prompt, which would make a FOURTH variant. Pick one
canonical wording and a single shared constant at that point instead of
authoring another — three near-identical strings drifting independently is how
product voice erodes, and the F-wave is the natural moment to consolidate.

## NEXT AFTER THE MERGE — the connector auth work, then the AI layer

**Seth's August 2 instruction:** once the E-wave is merged, the server-side
auth work is next, "along with the option to add AI." Recorded here so it is
the first thing the next session reads.

**Naming, stated once so nobody builds the wrong thing.** Seth calls this "the
server migration." It is NOT a user migration and must never become one - the
August 2 AI0 ruling is explicitly zero-migration. What actually changes on the
server is that LogChamp gains the ability to ISSUE scoped OAuth tokens to
third-party clients, layered OVER the cookie/JWT auth that already exists.
Existing users, the user table, and the login flow are untouched. If a future
block description contains the words "migrate users", it has misread this.

**Sequencing this creates a real question.** The F-wave (effort mandatory) was
previously next and is fully ruled but unauthored. Seth's August 2 line puts
the AI/auth work first. Both are live; neither is dropped. **This needs one
sentence from Seth before either is authored** - it is a priority call, not a
technical one. Do not silently pick.

**The auth unit (AI1), when it is authored.** Per `ai-layer.md` section 4.2 as
amended, and the recon findings:

- Delegate to a vendor supporting OAuth-over-existing-auth. WorkOS Standalone
  Connect ranked 1 (1M MAU free, exact pattern fit), Scalekit 2, Stytch 3.
- LogChamp authors only: the Login URI handler (vendor redirects to us, we
  check the existing session, we call their completion API with the identity),
  `/.well-known/oauth-protected-resource` (RFC 9728 - a MUST for MCP servers),
  Bearer validation against the vendor's JWKS WITH audience checking (RFC 8707
  binding is a MUST), and read-only scope enforcement.
- **This is a cross-user isolation surface**, so it is a standing frontier-seat
  escalation under CLAUDE.md regardless of who writes it, and it is the first
  server-side unit in a long while - re-check the client-only assumptions that
  the E and F waves have been coasting on.
- It is NOT migration-carrying and NOT prod-touching by itself, so it does not
  hit the manual-track gate. Deploying it eventually will.

**Then the AI layer proper** (`docs/specs/ai-layer.md`, phases AI0-AI6). AI0 is
resolved; AI1+ are unauthored. Lane A (the remote MCP connector - their
subscription pays for inference, we pay zero tokens) is deliberately first;
Lane B (in-app coach, BYO-key and hosted over one code path) second. The hard
boundary holds on both: the deterministic engine computes every number, the
model only narrates.

## The F-wave (effort mandatory) — RULED by Seth, NOT YET AUTHORED

Seth's August 1 rulings, from the E-wave smoke. These supersede the
"someday" framing of the mandate:

1. **RIR and RPE are EITHER-OR, never both.** Two independent toggles is
   the wrong model — one effort signal per template/session, RIR default.
2. **Mandatory lands in the SAME wave as either-or.** He was offered a
   3-state `RIR | RPE | Off` interim and explicitly chose `RIR | RPE`
   with no Off state.
3. **Capture preference must be REMEMBERED, device-local.** Extend the
   existing `quickWorkoutLogPrefs.js` localStorage pattern (same
   precedent as `weightUnitPref.js`) to template creation and block
   templates. Explicitly NOT an account-level column — no schema change,
   no migration.

**The conflict this creates, and the agreed resolution.** With no Off
state, an existing template storing both toggles `false` (no backfill
ever ran, so these exist) renders a control with nothing selected. The
two naive exits are both wrong: auto-selecting RIR silently rewrites a
stored user choice — exactly what E-wave smoke item 5 existed to catch —
and keeping an implicit off-state is the 3-state option in disguise.
Resolution put to Seth and not contested:

- **New templates, block templates, quick logs:** hard 2-state, one
  signal always selected, RIR default, remembered from prefs. No Off.
- **Legacy templates with both off:** a one-time REQUIRED CHOICE on open.
  Nothing is written until the user picks. E2's copy is not deleted — it
  is repurposed from a quiet hint into that prompt, which also satisfies
  the standing "the mandate ships WITH user education" requirement.
- **Enforcement:** block session completion when a captured-effort set
  has no value. Already-completed historical sessions untouched.

**Where the pref gap actually is** (verified August 1, not assumed):
preference memory exists for QUICK LOGS ONLY. `quickWorkoutLogPrefs.js`
persists `useRIR`/`useRPE`/`useExerciseNotes`, restored at
`SessionDetailPage.jsx:2199-2206`. Template creation ignores it entirely
(`CreateTemplatePage.jsx:46-47` hardcodes `useState(true)`/
`useState(false)`; block equivalents the same), and template-driven live
sessions take the template's stored booleans via the
`session.workoutTemplate` branch at `SessionDetailPage.jsx:2190-2196` and
never consult prefs. Net effect: an RPE user is handed RIR-on/RPE-off on
every new template, forever. Weight unit DOES already persist
device-local (`weightUnitPref.js`, defaults lbs) — if it appears to
forget, that is a SEPARATE bug and needs a repro.

**Not yet authored.** Blocks go through `author-task-block` once Seth
confirms the shape above. Expect ~3 units: toggle model + pref memory,
legacy required-choice prompt, completion enforcement.

### Lane worktree state

`cursor-lane` is on `cursor/e1` (`876bd58`), `cursor-lane-2` on
`cursor/e2` (`3eadc64`) — both landed and ff-merged, so both lanes are
free. `cursor-lane-3` is untouched on `recon/e1rm-blast` (`4078c0b`).
Repoint any lane to a branch off the target wave before dispatching, or
the delivery lands on the wrong base. Check lane cleanliness by
DELIVERY.md TIMESTAMP, not `git status` (it is gitignored, so a stale
report reads as "clean") — and delete the stale report before the run so
the incoming one cannot be mistaken for landed work.

## The AI layer — specs, and what is already settled

Forward plan and the AI0 ruling live in "NEXT AFTER THE MERGE" above; this
section holds only the standing spec pointers and the things already decided,
so they are not re-litigated.

- **`docs/specs/ai-layer.md`** is the AI design of record. Two surfaces,
  **connector first**: Lane A a remote MCP server the user adds inside the AI
  app they already pay for; Lane B the in-app coach proxy where BYO-key and
  hosted are ONE code path with a different key source. Phasing AI0-AI6.
  Section 4.2 carries the Aug 2 AI0 ruling plus both Aug 2 corrections (DCR is
  no longer a hard MCP requirement - CIMD is SHOULD, DCR is MAY; and the
  in-house fallback is multi-day/multi-week, not "a few hundred lines").
- **`docs/specs/ai-theming.md`** — AI-generated palettes. The model emits a
  ~20-hex token object, **never CSS**. Spec only, by Seth's decision.
- `analytics-engine.md` section 8 is AMENDED, not contradicted; Track C now
  means `ai-layer.md`. Do not phase AI work from the old section.
- Recon findings: `docs/tasks/ai0-recon-oauth-delegation-FINDINGS.md`.

**Two premises settled, so nobody re-litigates them:** `.mil`/DoD credentials
are permanently out (5 CFR 2635.704 — government property, authorized purposes
only), and consumer-subscription OAuth in third-party apps is a ToS violation,
not merely unavailable. Detail in `ai-layer.md` section 3 and the archive.

**Correction on record** (`ai-theming.md` section 4): `check-hex.mjs` CANNOT
gate AI-generated palettes — it scans a git diff (`check-hex.mjs:23`), so
runtime-generated output never reaches it. It stays the right tripwire for
authored code. A separate pure validator is specified.

## Repo / deploy state

- **`main` is at `d272930`** — the E-wave merge, August 2. It is the first
  CODE to reach main since the frontier-parity merge `90248f9` (July 21,
  prod-smoked clean July 28); the two commits between them (`869c5f1`,
  `7d1c9ba`) were docs-only. Prod Vercel/Render track `main`, so this push is
  deploying to production now — **prod smoke is open and unverified.** Because
  prod tracks main, any push to main is a prod-bound push (gate item 2).
- **Staging Render tracks `main`** (Seth repointed it July 28). The
  E-wave shipped ZERO server changes, so smoking it against a `main`
  Render backend was correct — no repoint needed. The F-wave is also
  expected client-only; re-check that assumption if enforcement needs
  server validation.
- **`effort-wave` is MERGED and closed** — all its CODE is on `main`. It now
  sits one or two DOCS-ONLY commits ahead (this post-merge HANDOFF upkeep,
  which is written after the merge and so cannot be part of it). **Therefore
  it is NOT yet a safe deletion candidate** — deleting it would drop those
  commits, since `main`'s copy of this file still reads "awaiting the merge
  trigger". Prior waves resolved this by landing the post-merge HANDOFF commit
  on `main` (`f2be093`, `869c5f1` are exactly that). Doing so is a docs-only
  prod-bound push and needs Seth's say-so; until then, leave the branch alone.
- **Staging Render needed no repoint** (RUNBOOK step 7): it already tracks
  `main`, and the E-wave shipped zero server changes either way.
- MW-wave, NT-wave, A-wave, FP-wave all merged and closed; their branches
  plus the lane branches are deletion candidates (gated).
- FP8 (PWA icons) is the only open FP unit — DRAFT, blocked on Seth
  dropping icon PNGs into `claudefiledrop/` (as of Aug 1 it holds only an
  analytics screenshot). Icons LAST by his rider.

## Other open items (unchanged)

**Seth items:** the R6 tagline pick (one-line `AuthLayout.jsx` swap); FP8
icon PNGs; the Cursor model-routing question; the `docs/parked/*` ruling;
the F-wave shape confirmation.

**PARKED by Seth — the block builder.** "don't do anything with the block
builder for now, that's for another wave." Evidence in
`docs/specs/block-execution-gap.md` (`267271c`): the multi-week layer is
fully authored in schema + API + builder UI but CANNOT BE TRAINED. **Do
NOT author against it, and do NOT ask him about it again** — he already
ruled. It also records that Execution reads planned values LIVE from
`TemplateSet` rather than snapshotting, so editing a template
retroactively changes what past sessions are judged against.

**Spec'd, unauthored:** R9/per-side in
`docs/specs/strength-score-per-side.md` (SS1-SS3); gym context in
`docs/specs/gym-context.md` (G1 is migration-carrying = Seth's manual
track). Evidence base for FP units stays
`docs/tasks/fp0-frontier-parity-report-FINDINGS.md` (`137e0ea`).

**Loose ends:** CW3 visual sign-off on the next live watcher run. Finding
**F** stays open ("Failed to fetch" = Render cold-start ranked cause;
needs a live Network-tab repro). A-wave optional Step-7 backfill:
`node scripts/backfill-exercise-ids.mjs` (DRY-RUN first) then `--apply`
against prod — idempotent, safe to defer. T3C sprite loader unblocks when
Seth drops the Gemini frames in `claudefiledrop/`. T4 motion (last
unstarted U5 unit) needs a frontier-seat design pass.

**Analytics/catalog track.** Track B v1 (B1-B9) MERGED (`e9ce82c`), Track
A MERGED (`13a1e59`), prod migrated + seeded. Residual: (1) validator
surfaced 29 secondary-less compounds in the 675-exercise lifting subset —
curation-skim candidate (A3), pairs with the catalog/`searchCatalog`
review pass (maintenance item 16); (2) integration test step-6 output
(malformed-key seed behavior) still UNVIEWED.

**Issues to open:** connect-pg-simple `session` table drift (proposed
`@@ignore`); integration-suite isolation on shared staging (Neon
copy-on-write branches would kill the FK-pollution flake); user-defined
exercise support; favicon/PWA icon swap; migration automation vs manual
discipline; schema sentinel (`docs/specs/schema-sentinel.md`); **repo
lives inside OneDrive** (already caused a `git stash` hang — decision for
Seth: move to `C:\dev\workout-db` or exclude from sync; everything is
pushed, so the move is low-risk).

**Known tech debt (queued, not blocking):** `DraftSessionSetRow` /
`SessionSetRow` unification; Prisma 6->7 bump; Jest open handle; pg SSL
deprecation. Also parked: `round-7-unify-set-row` (`f6c2a6f`), decision
pending.

**Dispatch-mechanism lessons** from the thirtieth/thirty-first sessions
(detached-launch fix for the background-task reap bug, the
DELIVERY.md-is-gitignored staleness trap, killed-run salvage) are verbatim
in `docs/HANDOFF-ARCHIVE.md` — still load-bearing for future dispatches.

## Durable gotchas

- **Two agents, one working tree:** check `git status
  --untracked-files=all` immediately before every commit (untracked
  DIRECTORIES collapse to one line), let writes settle, one agent commits
  at a time. Relay v5's lane worktrees sidestep this for dispatched units.
- **Windows env/PATH staleness:** a session may not see User env-var/PATH
  changes even after a restart — read from the registry inline
  (`[Environment]::GetEnvironmentVariable('CURSOR_API_KEY','User')`) and
  invoke new CLIs by full path.
- **Cursor CLI remembers the last-used `--model`** — always pass it
  explicitly; a flagless run silently inherits the previous invocation's.
- Cursor's agent binaries run as `node.exe` under
  `cursor-agent\versions\` — a `ProcessName -like "*cursor*"` filter
  returns 0 and looks like "the run died." Match on the PATH instead.
- **`DELIVERY.md` is gitignored** — check lane cleanliness by TIMESTAMP
  on the file, not by `git status` (a stale report reads as "clean").
- **Acceptance criteria cannot express "discoverable."** E3 met every
  criterion in its block and still failed its purpose — Seth looked at the
  page and saw nothing, because a 7th `(?)` on a page with six others is
  invisible. Criteria assert an element EXISTS; only smoke asserts a human
  NOTICES it. The fix is not vaguer criteria; it is remembering that
  discoverability is a smoke question. (E4 `965b2c8` is the repair.)
- **Adding a child to a CSS grid silently reflows it.** E4's line had to be a
  SIBLING of `.coverage-row` (a `1fr 120px` grid, `index.css:6535`) — as a
  child it becomes a third grid item squeezed into the narrow first column,
  with a green build and a wrong layout.
- **A component keying off prop ABSENCE is a seam risk** — the E2 nudge
  (`!useRIR && !useRPE`) renders spuriously if any call site omits a
  prop. Build passes either way. Check every call site, not just the
  ones the block named.
- Scene mock PNGs are design references — `docs/design/mocks/`, never
  ship from `client/src/`.
- A commit can land locally while a redeploy rebuilds the OLD HEAD until
  the push lands. Push, confirm origin HEAD, THEN smoke.
- Build-passing + diff-looking-right do NOT prove the visual — smoke on
  device.
- When bumping a value produces near-zero visible change, something is
  suppressing it. Diagnose, don't tune.
- Migrations are a separate manual track — pushing code does not migrate
  any DB.
- `server/.env` only ever points at staging or localhost, never prod.
  `dbHostGuard` enforces it at boot (`assertSafeForBoot()`) and on the
  test/reset path (`assertSafeForReset()`, called explicitly by any new
  DB-connecting script at the top of `main()`).
- `npm run test:unit` is DB-free; `npm test` requires (and resets) the
  staging DB.

**Rule:** rewritten in place at the end of every working session; kept
CAPPED (~300 lines). Aged session logs move VERBATIM — never summarized —
to `docs/HANDOFF-ARCHIVE.md`, newest first, in the same rewrite. Dated,
never versioned. If this file looks stale (date > ~2 weeks old), verify
branch/deploy state from ground truth before trusting it.
