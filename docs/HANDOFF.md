# HANDOFF — current state

**Next action (human):** Say **"push to main"** when you want the E-wave
merged — it is smoke-signed-off and gate-PASSED, and the merge is the only
thing standing between `effort-wave` and prod. Three decisions remain
yours, none urgent: **AI0** (`ai-layer.md` section 4.2 — build an OAuth 2.1
authorization server vs delegate to a managed provider; recommendation is
delegate) blocks the AI connector lane; the untracked `docs/parked/*` files
still need a ruling (commit here, or move to the workflow repo); and the
F-wave shape below needs your yes before it is authored.

> **Standing rule:** the line above is filled on EVERY rewrite and is
> never empty or deferred — one sentence, the single thing SETH does
> next (not the agent). If nothing is blocked on him, it says so
> explicitly. Dogfoods the shell repo's decision-10 no-dangling-next-
> action requirement; `land-unit` section 5 keeps it maintained.

**Updated:** August 1, 2026, thirty-sixth session (Opus frontier seat —
**E-wave smoke sign-off + pre-main gate PASS; F-wave ruled, not
authored**). Prior entry: July 29, thirty-fifth session (resident relay —
E-wave landed 2/2). Full session logs, including the E-wave audit
findings and the AI-layer research, are verbatim in
`docs/HANDOFF-ARCHIVE.md`.

---

## The E-wave — SIGNED OFF, GATE PASSED, awaiting merge

Branch **`effort-wave`** at **`1a585ed`** (code at `3eadc64`), pushed.
Branched off `main` `90248f9`. Client-only; no server code, no schema
change, no migration.

- **E1** `876bd58` — RIR defaults ON for new templates, new block
  templates, and quick logs; RPE stays off; a stored boolean always wins.
- **E2** `3eadc64` — point-of-edit nudge + why-RIR education when both
  toggles are off, both variants, tokens-only.

**Smoke sign-off: Seth, August 1.** He raised three findings; all three
were classified as next-wave scope, none an E1/E2 contract failure (see
the F-wave section). He then explicitly chose to gate and merge the wave
as-is rather than hold or revert E2.

**Pre-main gate: PASS (Opus, August 1).** Lanes re-run fresh on the
branch — 204 unit tests / 15 suites green, client build clean,
`check-hex.mjs` exit 0. Each commit touches exactly the files its block
named (E1 two, E2 two); `schema.prisma` absent from the diff as
contracted; no scope leakage; no security/auth/cross-user surface.

Three things the gate verified DIRECTLY rather than trusting the reports
— re-verify these if the code moves:

- `--color-muted` (`index.css:63`) resolves in all 8 palette x mode
  combos. It aliases `--color-text-secondary`, overridden only at
  `:root:12` and `html[data-theme="dark"]:94` — both root selectors, no
  palette block touches it. Had a palette overridden it on a descendant,
  the nudge would have computed to nothing in 6 of 8 combos.
- All five `RirRpeToggleRow` call sites pass BOTH `useRIR` and `useRPE`
  explicitly. The nudge keys on ABSENCE (`!useRIR && !useRPE`), so one
  omitted prop renders it on a template that IS capturing effort.
- Neither edit page can flash the nudge pre-hydration —
  `EditTemplatePage.jsx:110` and `EditBlockTemplatePage.jsx:220` both
  early-return on `loading`, so the toggle row never mounts against the
  `useState(false)` initial values.

**Gate process note, recorded as a deliberate call:** the diff was read
in-seat rather than fanned out to Cursor report lanes. 37 lines across 4
files — fan-out exists to move grunt SEARCH off the frontier seat and
there was no search here. Not a skipped step; do not read it as
precedent for larger waves.

**Hard constraints held:** no schema change, no migration, no backfill.
The Prisma `useRIR Boolean @default(false)` is untouched; existing
templates keep their stored values and are nudged, never silently
rewritten.

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

## The AI layer — spec'd, nothing authored

- **`docs/specs/ai-layer.md`** is the AI design of record. Two surfaces,
  **connector first**: Lane A a remote MCP server the user adds inside
  the AI app they already pay for (their subscription funds inference, we
  pay zero tokens); Lane B the in-app coach proxy where BYO-key and
  hosted are ONE code path with a different key source. Phasing AI0-AI6.
- **`docs/specs/ai-theming.md`** — AI-generated palettes. The model emits
  a ~20-hex token object, **never CSS**. Spec only, by Seth's decision.
- `analytics-engine.md` section 8 is AMENDED, not contradicted; Track C
  now means `ai-layer.md`. Do not phase AI work from the old section.

**AI0 blocks the whole connector lane** and is Seth's call: the server has
no OAuth today (cookie sessions + `server/src/lib/jwt.js` only) and remote
connectors need OAuth 2.1 with dynamic client registration. Build vs
delegate — recommendation is delegate, since hand-rolling it turns the
cheapest lane into the most security-sensitive code in the repo.

**Two premises settled, so nobody re-litigates them:** `.mil`/DoD
credentials are permanently out (5 CFR 2635.704 — government property,
authorized purposes only), and consumer-subscription OAuth in third-party
apps is a ToS violation, not merely unavailable. Detail in
`ai-layer.md` section 3 and the archive.

**Correction on record** (`ai-theming.md` section 4): `check-hex.mjs`
CANNOT gate AI-generated palettes — it scans a git diff
(`check-hex.mjs:23`), so runtime-generated output never reaches it. It
stays the right tripwire for authored code. A separate pure validator is
specified.

## Repo / deploy state

- **`main` is at `90248f9` (July 21)** — the frontier-parity-wave merge,
  deployed and prod-smoked clean (Seth, July 28). Prod Vercel/Render
  track `main`. **Because prod tracks main, any push to main is a
  prod-bound push (gate item 2).**
- **Staging Render tracks `main`** (Seth repointed it July 28). The
  E-wave shipped ZERO server changes, so smoking it against a `main`
  Render backend was correct — no repoint needed. The F-wave is also
  expected client-only; re-check that assumption if enforcement needs
  server validation.
- **`effort-wave` at `1a585ed`** — E1 + E2 + docs commits. Gate-passed,
  merge pending the trigger phrase.
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
