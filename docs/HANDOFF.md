# HANDOFF — current state

**Next action (human):** **Smoke the F-wave on the staging Vercel deploy and
sign off** - the consolidated checklist is in the F-wave section below. The wave
is 4/4 LANDED and `origin/effort-mandatory-wave` is at `0ee258b`, so the deploy
has the code. Nothing ships to `main` until he signs off: smoke comes FIRST,
then the pre-main gate. Separately open, blocking nothing: prod-smoke the E-wave
on production (merged `d272930`), and the `docs/parked/*` ruling.

> **Standing rule:** the line above is filled on EVERY rewrite and is
> never empty or deferred — one sentence, the single thing SETH does
> next (not the agent). If nothing is blocked on him, it says so
> explicitly. Dogfoods the shell repo's decision-10 no-dangling-next-
> action requirement; `land-unit` section 5 keeps it maintained.

**Updated:** August 3, 2026, thirty-ninth session (Opus frontier seat — **F-wave
UNPARKED and COMPLETED 4/4; awaiting Seth's smoke**). Prior entry: August 2,
thirty-eighth session (Opus — E-wave gated and MERGED to `main`; F-wave opened,
authored, and PARKED at 2/4 on exhausted Cursor quota). Full session logs are
verbatim in `docs/HANDOFF-ARCHIVE.md`.

---

## The F-wave (effort MANDATORY) — 4/4 LANDED, AWAITING SMOKE

Branch **`effort-mandatory-wave`** at **`0ee258b`**, pushed, branched off `main`
`8541bca`. NOT smoked, NOT gated. **No schema change or migration anywhere in
it, and no `server/` code at all after F0** — F1/F2/F3 are client-only.

- **F0** `00e06d9` — a template's stored effort signal now reaches the live
  session (six server selects + a one-time client seed).
- **F1** `3da8bf5` — either-or signal control (`rir | rpe | null`) plus
  `effortSignalPref.js`, wired to all five call sites.
- **F2** `bfa010a` — legacy both-false templates get a REQUIRED CHOICE on open;
  Save blocked until the user picks; loading one writes nothing.
- **F3** `0ee258b` — live session either-or control, signal locks after the
  first effort value, Finish blocked while a core-logged set is missing it.

**The park is closed on its own terms.** Seth ruled August 2 to wait for the
Cursor auto quota rather than upgrade the plan or waive the no-inline-code rule.
The August 3 dispatch of F2 doubled as the probe: the quota HAD reset, both
remaining units ran clean on the auto rung, and the wave cost one day. The
ruling was right; do not re-litigate it.

**Three things the next session must not re-derive:**

1. **The wave's recurring failure is AUTHORING, not execution — twice now, in
   the same shape.** F0's block named `FULL_SESSION_RELATIONS`, one of the TWO
   locations recon had found, so the fix landed where it could never fire.
   F2's block named the required-choice prompt but not `RirRpeToggleRow`'s
   built-in null-state nudge — one of the TWO things that render that state —
   so the same "two sets of 10" sentence shipped twice on one screen, in two
   wordings, above a line claiming effort logging was "off" on a page that
   demands a choice. Both times: contract followed exactly, green build,
   truthful no-deviations report, wrong screen. **Generalized rule: when a
   contract touches a state, it must enumerate everything already acting on
   that state, or say why not.** F3's block was amended pre-dispatch on this
   basis and landed with no fix needed.
2. **F1 landed WITHOUT a delivery report** - a salvaged killed run (code written,
   `DELIVERY.md` not, quota died in between). Every acceptance criterion was
   audited directly instead. The pre-main gate must read F1 as first-pass
   material, not as something already reviewed twice.
3. **F2 carries a known-ugly seam the gate should not re-diagnose.**
   `EFFORT_SIGNAL_REQUIRED_CHOICE_HINT` is exported from `EditTemplatePage.jsx`
   and imported by `EditBlockTemplatePage.jsx`, because that block's FILES TO
   TOUCH allowed no third module. Zero bundle cost (`App.jsx:11-12` imports both
   statically). It is the FOURTH variant of the effort-education sentence and
   belongs to the standing consolidation follow-up, not to a gate finding.

### The consolidated smoke checklist — Seth, on the staging Vercel deploy

`origin/effort-mandatory-wave` is at `0ee258b`, so the deploy has all four
units. Smoke ONCE against this list; findings are gate input.

**F0 — the signal actually reaches the session** (neither lane can prove this):
- Build a template with RIR on, start a workout from it, confirm the RIR field
  appears WITHOUT touching anything.

**F1 — either-or, and it remembers:**
- New template / new block template: exactly one of RIR/RPE is on, never both,
  never neither.
- Switch to RPE, reload, create another template — still RPE.

**F2 — legacy templates demand a choice:**
- Open a template saved before the mandate (both toggles off historically):
  neither signal selected, a prompt explains why and says Save is blocked, and
  **Save is actually disabled**.
- Pick a signal → Save enables. Save, reopen → no prompt, normal page.
- Open a legacy template and navigate AWAY without picking → reopen it and
  confirm it is unchanged (nothing was written on load).
- Open a template that already HAS a signal → no prompt, Save enabled, looks
  exactly as it did before this wave.
- **Watch for the F2 bug specifically:** the education sentence should appear
  ONCE on that screen, not twice.

**F3 — the live session, the mandate, and the lock:**
- Start a template session: the two RIR/RPE checkboxes are GONE, replaced by the
  same either-or control the quick log uses. The other checkboxes (workout
  description, exercise notes, set notes) are untouched.
- Log a set WITH an effort value → the signal control locks, stays visible, and
  says why. Confirm you cannot switch it.
- Log two more sets WITHOUT effort → **Finish is disabled and the hint names the
  count** ("Add RIR on 2 more sets..."), with the empty effort fields softly
  cued. Fill them → Finish enables.
- **The one that matters most: enter RIR 0** (taken to failure) and confirm it
  counts as filled and does NOT keep Finish blocked.
- A quick log behaves the same way.
- Open an OLD completed session → no lock messaging, no enforcement, nothing
  demanded retroactively.
- If you have a legacy session with no signal ever chosen, confirm it still
  finishes with no effort values — nobody should be stranded mid-workout.

---

## The E-wave — CLOSED and MERGED. Detail archived August 3.

**Merged August 2 as a clean fast-forward, `7d1c9ba..d272930`** (E1 `876bd58`
RIR-defaults-on, E2 `3eadc64` legacy nudge, E3 `19c2c20` + E4 `965b2c8` the
Analytics effort rationale). Client-only, no schema, no migration. Smoked and
gated in two passes (Aug 1 through `1a585ed`, Aug 2 scoped to the E3/E4 delta).
**The full section moved VERBATIM to `docs/HANDOFF-ARCHIVE.md` (top) when this
file exceeded its cap** — go there for the gate reasoning, the E3/E4 split, and
the cross-unit seam check.

**The one E-wave note still live for the F-wave gate:** the "two sets of 10"
sentence now ships in FOUR hand-varied forms (E2's nudge, E3's
`HOW_EFFORT_MATTERS`, E4's `EFFORT_RATIONALE_SHORT`, and now F2's
`EFFORT_SIGNAL_REQUIRED_CHOICE_HINT`). None is a defect alone and this did not
block the August 2 gate. Consolidating them into one shared module is a known
follow-up — it should absorb F2's page-to-page import at the same time.


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

**Sequencing: RESOLVED BY EVENTS, August 3.** This was an open priority call
between the F-wave and the AI/auth work. The F-wave is now 4/4 landed, so the
question is moot — **the connector auth work (AI1) is next**, once the F-wave
clears smoke and the gate. Nothing here needs a fresh ruling from Seth; if he
wants something else first, that is a new instruction, not a pending one.

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

## The F-wave rulings — the WHY behind the four landed units

Kept because the gate and any future effort work need the reasoning, not just
the diff. All four units are LANDED (see the section at the top); nothing here
is outstanding. Seth's August 1 rulings, from the E-wave smoke, which superseded
the "someday" framing of the mandate:

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

**AUTHORED AND SHIPPED** as F0-F3 (August 2-3). The estimate of ~3 units was
one short: F0 was added when authoring recon found the stored signal never
reached the live session at all, which would have made F3 enforce a field the
session never showed.

### Lane worktree state

`cursor-lane` is on `cursor/f3` (`0ee258b`), landed and ff-merged, so it is
free. `cursor-lane-2` is on `recon/f-wave-2`; `cursor-lane-3` is untouched on
`recon/e1rm-blast` (`4078c0b`).
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
- **A component that renders its OWN copy for a state will collide with
  any copy you add for that state.** F2 shipped the same sentence twice
  on one screen because the block named the new prompt but not
  `RirRpeToggleRow`'s built-in null-state nudge. Fixed with a `showNudge`
  prop (default true). Before adding copy for a state, grep what already
  renders in it — a green build and a truthful "no deviations" report are
  both fully compatible with a duplicated paragraph.
- **Effort presence must be a BLANK test, never a truthiness test.**
  `rir = 0` means taken to failure — the most important value in the
  vocabulary — and `!set.rir` treats it as missing. F3 uses
  `String(v).trim() !== ""` throughout. A truthiness check would have
  blocked Finish on exactly the sets that matter most, invisibly to both
  lanes.
- **`startSession` creates ZERO `WorkoutSet` rows** (`sessionController.js:148`)
  — only the session and its `sessionExercise` rows. Worth knowing before
  designing anything that enforces per-set rules: a fresh template session
  has no sets to enforce against, so there are no pre-filled scaffold rows
  to accidentally block on.
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
