# WorkoutDB — Master Context Prompt v16

**Last updated:** June 11, 2026
**Previous version:** v15 (username merge done, prod migration incident, schema-change deploy discipline)
**This version:** structural change — the **handoff snapshot moves out of this file** into `docs/HANDOFF.md`, and recurring command rituals move into `docs/RUNBOOK.md`. This file is now *purely* stable context and changes only when fundamentals change. Product direction, schema, and principles unchanged from v15.

---

## Convention (revised in v16: three-file system)

The master prompt is **stable context only**. Identity, stack, principles, product vision, foundational schema decisions, escalation rules, load-bearing operational knowledge.

Three project docs, three cadences:

| File | Contains | Changes when |
| --- | --- | --- |
| `WORKOUTDB_MASTER_PROMPT_N.md` (this file) | Stable context | Fundamentals change (rare; version-bumped) |
| `docs/HANDOFF.md` | Current state: open TODOs, in-flight branches, next unit, open forks | Every working session (rewritten in place, dated, no version number) |
| `docs/RUNBOOK.md` | Copy-paste PowerShell/SQL blocks for recurring rituals | A ritual changes (rare) |

What does NOT live here:
- Open work, current bugs, in-flight branches → `docs/HANDOFF.md` / GitHub issues
- Command sequences and checklists → `docs/RUNBOOK.md`
- Incident play-by-play → `docs/incidents/`
- Commit conventions, branch state → git itself

**Session start = load this file + current `HANDOFF.md`.** Session end = update `HANDOFF.md` (a one-paragraph rewrite, not a ceremony). The master is regenerated only when fundamentals change — a handoff update never bumps the master version.

---

## Who I am and what this project is

I'm Sethyseth, sole developer. Claude is my planning and review partner; **Cursor** is the AI coding agent that executes code changes. All git operations (commit, push, merge) and all production database operations are run **by me, manually**, never delegated to Cursor.

**Naming note:** the product is being renamed **WorkoutDB → LogChamp** (a light play on Twitch's PogChamp; not leaned into). **This rename is display-layer only.** See the rename boundary principle. The repo, services, env vars, and internal identifiers all stay `workout-db`/`workoutdb`. When this doc says "the app," it means LogChamp the product; when it says infra names, those are unchanged.

**Stack:**
- **Frontend:** React + Vite, deployed on Vercel (Production + Preview)
- **Backend:** Express + Prisma 6 (config in `prisma.config.ts`, not `package.json`), deployed on Render (`workout-db-l3gc` prod + `workout-db-staging`)
- **Database:** Postgres via Neon (separate prod and staging projects)
- **AI coding agent:** Cursor
- **Planning/review partner:** Claude (this project)

---

## Product vision

### What LogChamp is

A workout tracker that doesn't just log your training — it tells you what your data means. Aimed at intermediate lifters who want depth: weekly volume per muscle group, plan-vs-actual execution, progressive overload trends, strength benchmarks.

### Positioning

The logging market is saturated (Strong, Hevy, Fitbod, Boostcamp); competing on capture is a losing game. **The wedge is the analytics layer most apps treat as an afterthought.** Target user *now*: intermediate lifters who train seriously and want richer insight. Beginner-onboarding mode is deferred — roughly the opposite product; would dilute the core.

### What "good" looks like

A daily-driver tracker for intermediate lifters where:
- Logging is fast enough that it doesn't get in the way
- Block planning and session execution are both first-class
- Analytics surface insight, not just numbers
- Data is honest about what it is (muscle attribution is an estimate, surfaced as such)
- The app feels polished and personal — it should not read as alpha-stage. Professional motion, theming, and a real profile surface are part of the product, not decoration.

### Endgame

Mix of personal tool, learning project, and potential product. If it gets good enough to sell, the lane is **paid tracker with insight-first analytics for serious lifters.** No commitment to monetize; build with the option open.

### Anti-goals

- Maximum data for its own sake. Every data marker is friction at capture. Goal is the *minimum* data needed for the analytics we want.
- Being a beginner app and an intermediate app simultaneously.
- Out-feature-ing Strong/Hevy on logging UX. They've spent years there; we won't beat them.
- Inferring training style from data ("are you a powerlifter?"). A settings toggle gets 90% of the value at 0% of the risk. Defer smart inference to v3+.
- Over-built motion. Professional = restraint. ~150–250ms, ease-out, subtle, consistent. Flashy animation reads as amateur. One motion system applied uniformly, not per-screen bespoke effects.

---

## UI/UX overhaul direction (active track)

First-class track running in parallel with (and currently ahead of) the analytics/catalog work. Goal: take the app from functional-but-alpha to polished, personal, professional, while keeping logging fast. Decisions made:

### Rebrand
- **WorkoutDB → LogChamp.** Display-layer only (see rename boundary principle).
- Login screen reworked from a bare alpha form to: brand → tagline → form → de-emphasized small-print caveats. Tagline is a swappable string constant. Current tagline is casual ("Log your shit dog") and intentionally so for beta; one constant to change later if the tone should harden toward the serious-analytics positioning.
- **Status:** the LogChamp rebrand strings landed in the username commit, but as of the merge the running app still shows "WORKOUTDB BETA" and old nav labels ("Programs", "Hello!") in places — the *rebrand display pass and IA changes below are NOT all shipped yet*. The committed rebrand was partial (login/register/profile touch points bundled with username). Treat the full rebrand display pass as still-to-do within this track.

### Navigation / information architecture (target — NOT yet shipped)
The 4-tab bar (Workout / Programs / History / Hello) carries tabs that don't earn their slot. Target IA:
- **Workout** — home. Start workout, quick picks, recently logged. Eventually surfaces a metrics teaser. Block-builder entry removed from here while the builder is unbuilt.
- **History** — full session archive. Distinct from home's "recently logged" (a 3-item shortcut). Gains value once analytics exists.
- **Library** — **renamed from "Programs."** Holds saved workouts + blocks + community programs. Label/heading/copy renamed; route paths and component names (`/templates`, `MyTemplatesPage`) intentionally NOT renamed.
- **Profile** — see below.
- **Hello tab retired** — onboarding content moves to a **first-run popup on account creation** plus a help section in Profile. A popup can only *instruct* the home-screen install, not trigger it (platform-dependent: iOS Safari vs Android Chrome).
- **Reserved slot:** when the analytics engine lands, **Analytics/Insights** is the natural new top-level tab. Hold space for it.

### Profile (the biggest UI upgrade)
Currently rudimentary (email + light/dark + password + feedback + logout — a settings dump). Target: a real profile surface.
- **Leads with identity:** username (now shipped to schema), member-since, and eventually headline stats (total sessions, weekly volume).
- **Separates identity from settings:** a Settings subsection or sub-screen holds theme / password / feedback / logout. Push-to-subscreen reads more "real app" and gives a natural home for a unique transition animation.
- Email is de-emphasized (people don't like seeing their email as their identity).

### Theming / personalization
- First customization feature. A theme = a named set of CSS custom properties; switching swaps variable values at `:root`. If light/dark already runs through CSS variables, named themes are "more presets," not new architecture.
- **The visual overhaul and the theme system are ONE effort.** Redesign the look by variable-izing design tokens, not hardcoding colors — otherwise theming gets harder later. Build on variables now; themes come nearly free.
- Ship 3–4 tasteful presets first, not 16. Keep the mechanism generous so adding presets is trivial.
- Storage: currently device-local (matches existing appearance setting). Can be promoted to a server-side user preference later. **Open fork:** device-local vs account-level.
- Seed of a broader "let the user customize" direction.

### Motion / loading
- Tab transitions + profile entry + workout enter/exit get a subtle, uniform motion layer (framer-motion-ish). Restraint per the anti-goal.
- **Loading screen for cold starts.** Free-tier servers cold-start slowly (staging ~50s). Two distinct waits:
  - **Long/unpredictable (cold start, cross-tab fetch):** show a loader, but only after a ~300–500ms delay so fast loads never flash it. If a fetch crosses ~3–5s, swap copy to something honest ("waking up the server…").
  - **Warm/instant (tab transitions on cached data):** motion only, no loader — a spinner that flashes for 80ms looks broken.
  - **Skeleton screens** preferred over centered spinners for predictable list layouts (History, Library).

### Feedback persistence
- A `Feedback` model already exists in the schema (confirmed during username work). Standing requirement: feedback must **persist to a table the developer can actually read**, not fire into a void. Consolidate feedback to one home (Profile) rather than duplicated across Hello + Profile. Verify the read path exists.

---

## Foundational schema decisions

Load-bearing. Changing any of them is a red-tier decision.

### User identity / username

Username is a foundational identity field (personalization + future community/public-handle features depend on it). **Now shipped to both prod and staging databases.**

- **Two fields on `User`, both nullable:**
  - `displayName String?` — stored **verbatim** as typed (preserves case + internal single spaces).
  - `usernameKey String? @unique` — the **normalized** key; unique index. Uniqueness, login lookup, and future search match against this.
- **Normalization (single shared function, used identically at signup, login, uniqueness check, future search):** trim → collapse internal whitespace runs to one space → Unicode **NFKC** normalize → lowercase. NFKC is load-bearing: folds lookalike/compatibility whitespace (non-breaking, zero-width, em-space, full-width) that would otherwise let people squat visually-identical names.
- **Validation (server-authoritative, mirrored client-side):** length 3–30 chars; allowed set = letters, numbers, spaces, `_ - .` (no arbitrary Unicode, no emoji); reject on `usernameKey` collision.
- **Login accepts email OR username** in one field: `WHERE email = lower(input) OR usernameKey = normalize(input)`.
- **Backfill is a HARD GATE:** existing users have `usernameKey = null`. On successful login, null → a blocking, non-dismissable modal forcing username creation before entering the app. New signups set both fields at registration and never hit the gate. **Verified working on staging AND prod.**
- **Homoglyph gap (known, deferred):** NFKC does NOT fold cross-script lookalikes (Cyrillic "а" vs Latin "a"). Full confusables detection is overkill for a known-user beta. Add only if/when public handles make impersonation matter.
- **Uniqueness is global.**
- **Migration:** `20260603140000_add_user_username` — additive, both columns nullable, unique index on `usernameKey` (NULLs don't collide in Postgres). The migration SQL is three statements: two `ADD COLUMN`, one `CREATE UNIQUE INDEX`. Applied to staging during smoke testing, and to prod manually via the Neon SQL editor after the merge (see incident below).

### Exercise catalog

- **Source:** [Free Exercise DB](https://github.com/yuhonas/free-exercise-db) — Public Domain, 873 exercises seeded from `dist/exercises.json`.
- **Vendored, not hot-linked.** `server/data/exercises.json` committed. Verification queries the local file. (Image assets still hot-linked from `raw.githubusercontent.com`; revisitable.)
- **Storage:** `Exercise` table, PK = upstream slug (e.g. `Barbell_Bench_Press_-_Medium_Grip`). String PK, not autoincrement.
- **Imported fields:** `id`, `name`, `force`, `level`, `mechanic`, `equipment`, `category`, `primaryMuscles` (text[]), `secondaryMuscles` (text[]), `instructions` (text[]), `images` (text[]).
- **Curation field:** `muscleWeights Json?`.

### Two-layer muscle attribution model

1. **Baseline (auto, from upstream):** every exercise gets `primaryMuscles`/`secondaryMuscles`. Analytics applies `primary_multiplier` (default 1.0) and `secondary_multiplier` (default 0.5).
2. **Override (manual, curated):** ~30 high-impact compounds have a `muscleWeights` JSON map summing to 1.0, e.g. bench → `{chest: 0.65, triceps: 0.2, shoulders: 0.15}`. Analytics prefers `muscleWeights` when present, falls back to multipliers.

- **Curation overlay:** `server/data/muscle-weights.json` — committed, keyed by exercise ID, read at seed time. Idempotent.
- **Rationale file:** `server/data/muscle-weights-rationale.md` — reasoning per weight, updated in the same commit as the JSON.
- **Honesty principle:** attribution is an estimate on community-consensus weights and disagreeing EMG studies. UI must surface this ("How is this calculated?"), not present estimates as measured truth.
- **Curation scope:** big compounds only. Isolation + machine compounds stay on the multiplier model.

### Path B FK strategy (Exercise catalog linkage)

The Exercise table is **additive** — no FKs from existing exercise-bearing models yet. Existing data uses free-text `exerciseName` on `TemplateExercise`, `SessionExercise`, `BlockWorkoutExercise`.

Path forward = **Path B (catalog + FKs), staged:**
1. ✅ Stage 1: Catalog table exists + seeded. (branch `exercise-catalog-seed`, migration `20260527120000_add_exercise_catalog`.) **Committed but NOT merged to main — see handoff.**
2. ⏳ Stage 2: Add nullable `exerciseId String?` FK to each of the three models. Keep `exerciseName` as display fallback. New writes set both. Old rows null until backfilled.
3. ⏳ Stage 3: Backfill `exerciseId` where `exerciseName` string-matches a catalog entry with high confidence.
4. ⏳ Stage 4: Exercise picker UI writes catalog-resolved entries.

**Why Path B not Path A:** string-match-at-query-time is fragile and slow. Exact FK join is fast and exact. Staged because each stage is small, reversible, verifiable.

### Sessions, blocks, and plan-vs-actual

Reusable template model with denormalized plan snapshots. Schema has the right *shape* (`WorkoutTemplate`, `BlockTemplate`, `BlockWeek`, `BlockWorkout`, `BlockWorkoutExercise`, `WorkoutSession`, `SessionExercise`, `WorkoutSet`, `TemplateSet`, `BlockWorkoutSet`) but doesn't yet capture **planned vs actual at the set level**. Open work.

**Target shape for plan-vs-actual:**
```
SessionSet (one row per set performed)
  - reps, weight, rir            ← actuals
  - planned_reps, planned_weight, planned_rir  ← snapshot at instantiation
  - is_warmup
```

Snapshot pattern means: editing the block template affects future instantiations not past sessions; plan-vs-actual is a single-table query; sessions can exist standalone (block_id nullable). `TemplateSet`/`BlockWorkoutSet` are separate from `WorkoutSet` today; unifying is a future refactor, not blocking analytics.

### Units
- **Storage:** kg, always. One canonical unit.
- **Display:** user preference toggle (kg ↔ lbs). Conversion at display layer, never at write time.

---

## Analytics engine (paused, not dropped)

### Architecture
- **Compute on read, not on write.** No denormalized aggregate tables. Add a cache later only if needed.
- **Backend-only computation**, surfaced on a dedicated analytics screen, not live during logging.

### Metrics
1. **Sets per muscle per week** (volume — RP/Israetel MEV/MAV/MRV language)
2. **Estimated 1RM per exercise** (strength — Epley/Brzycki)
3. **PR detection** (progression — best weight at each rep count)

**Tracked PR vs estimated PR must stay distinct in any UI.** Tracked = real logged number; estimated = formula output.

### What the engine is NOT
Not a training-style classifier; not a real-time set-by-set layer; not a "what to do next" recommender (deferred).

---

## Product roadmap (sequenced)

**UI/UX track (active):**
- U1. ✅ Partial LogChamp rebrand + login warmth + Library rename strings (bundled into the username commit; full display pass still pending — see UI section)
- U2. ✅ Username unit (schema + auth + hard-gate backfill) — **merged to main, live on prod and staging, gate verified on both**
- U3. Feedback persistence verification + consolidation to Profile
- U4. Profile restructure (identity header + Settings subscreen)
- U5. Theme system + token-based visual overhaul + motion/loading layer (one effort)
- U6. Hello-tab retirement → first-run popup + Profile help section
- U7. Full rebrand display pass + IA changes (Programs→Library label, Hello retirement, "WORKOUTDB BETA" → LogChamp in all surfaces) — fold into U4–U6 where natural

**Analytics/catalog track (paused mid-flight):**
1. ✅ Exercise catalog table + seed (red). Done but UNMERGED to main.
2. ⏳ Muscle weights curation file (green/content — in flight, uncommitted, 3 bad IDs to fix, 32→30).
3. ⏳ Exercise FK linkage (yellow — Path B stage 2).
4. Units toggle (yellow).
5. Analytics: sets per muscle per week (yellow — the wedge; depends on FK linkage).
6. Analytics: 1RM + PR detection (green/yellow — keep tracked vs estimated separate).
7. Plan-vs-actual schema on WorkoutSet (yellow).
8. Block ↔ session instantiation flow UX (yellow).
9. Progressive overload trends (yellow).
10. Recovery/frequency analytics (yellow).
11. MCP/CLI surface (yellow — deferred).
12. Beginner onboarding mode (red — deferred indefinitely).

**Why UI went first:** analytics (#5) depends on FK linkage (#3) which depends on the catalog being merged — none done. UI/personalization now while the catalog/FK foundation matures is sound sequencing.

---

## Approach and patterns

- Sessions start by loading this master prompt **plus `docs/HANDOFF.md`** to orient Claude; run the Session Start block in `docs/RUNBOOK.md` before any work.
- Work organized into tiered units (red/yellow/green) by risk and reversibility.
- Cursor prompts bundled where units are low-risk and cohesive; delivered as inline triple-backtick blocks.
- Cursor self-greenlighting acceptable on yellow/green; flagged deviations logged as tech debt.
- **All git operations (commit, push, merge) run by me, manually, in PowerShell — never by Cursor.** Standing rule: no `Co-authored-by: Cursor` trailer in commits. Commit workaround: `git hash-object` + temp UTF-8 file to dodge the auto-injected trailer. Author: `Seth Knisel <SethjKnisel@gmail.com>`.
- **All production database operations run by me, manually, in the Neon SQL editor — never by Cursor.** (Reinforced by the v15 prod incident below.)
- **Clarifying-question discipline:** surface real forks explicitly when scope is genuinely ambiguous; decide low-stakes ones, flag genuine ones. Don't over-ask.

### Schema-change deploy discipline (NEW in v15 — LOAD-BEARING)

**Pushing code to `main` does NOT migrate any database.** Code deploys (Render auto-builds on push) and schema migrations (applied to Neon) are on **separate, manual tracks.** Neither Render service runs `prisma migrate deploy` in its build or start command — confirmed June 08. Build = `npm install`; Start = `node src/server.js` on both prod and staging. So a migration only reaches a database when **I apply it by hand.**

**The rule, every time a unit includes a schema change** (exact command/SQL blocks: `docs/RUNBOOK.md` → "Schema-change deploy"):
1. **Apply the migration to the target Neon DB first** (or in lockstep with the code deploy), by running the migration SQL in the Neon SQL editor for that database. Confirm the host in the URL bar before running (`snowy-resonance` = prod, `noisy-surf`/LogChamp-staging = staging).
2. **Then deploy the code.** Order matters: DB ahead of code is safe (extra columns ignored); code ahead of DB crashes (missing columns → Prisma `findFirst` errors → login/route failure). Prefer migrate-then-deploy.
3. **Keep `_prisma_migrations` consistent.** When applying SQL manually, also insert the corresponding `_prisma_migrations` row so Prisma history doesn't drift (prod has this table; the username row was inserted manually). Mismatched history between prod and staging is a latent hazard — periodically diff `SELECT migration_name FROM "_prisma_migrations" ORDER BY migration_name;` across both.
4. **This is a deliberate choice to stay manual.** Automating `migrate deploy` in the Render build was considered and declined: it would run a schema command against whatever `DATABASE_URL` a service points at, on every deploy, with no human checkpoint — which conflicts with the manual-prod-control stance and the unresolved prod-wipe history. If revisited, the safer shape is build-time on staging + a Render *Pre-Deploy* hook on prod (fails safe: old version keeps serving if migration errors), and only after the `session`-table drift is resolved and prod/staging histories are confirmed in sync.

### Rename boundary principle

A user-facing rebrand (WorkoutDB → LogChamp) is **display-layer only** and must never touch infrastructure identity. Never changes for a rebrand:
- Repo name, GitHub remote (`Sethysethyseth/workout-db`)
- Render/Neon/Vercel service names
- Env var names and values (`VITE_API_URL`, `DATABASE_URL`)
- npm `package.json` name fields
- Cookie names (`workoutdb.sid`), localStorage keys (`workoutdb-theme`)
- Route paths (`/templates`, `/programs`), component filenames (`MyTemplatesPage`), CSS class prefixes, internal identifiers
- API messages, migration content

Lives in: rendered UI text, `<title>`, PWA manifest `name`/`short_name`, and (later) favicon/icon. If renaming a string would change a network call, build artifact, or service identity, it's out of scope.

### Trust calibration on Cursor

Cursor's read-only diagnostics may not reflect ground truth. For high-stakes verifications, confirm yourself.
- Verification steps must query local vendored data, not re-download from upstream.
- Multi-step prompts with judgment moments need checkpoints; don't queue sequential red/yellow prompts back-to-back.
- Cursor may report "ready for manual merge" when nothing is committed or pushed. ALWAYS verify with `git log <branch> --oneline` and `git status` that commits exist and were pushed before trusting a "ready to merge" claim.
- Cursor's failure-diagnosis may be plausible but wrong (attributed test failures to "409 email exists" when isolated runs showed P2003 FK violations). Confirm a self-diagnosis before acting on it.

### Build/test reliability caveat

Build-passing and grep-clean are Cursor's self-report; the build claim is cheap to confirm locally. React Hook dependency-array errors are NOT caught by build or server tests — enumerate hook dep arrays in pre-implementation reports and smoke-test previews before merge.

### Operational rule on `server/.env`

`server/.env` only ever points at staging or localhost. Never prod. `dbHostGuard` enforces this on the test path. Add safe hosts via `ALLOWLIST` in `server/src/lib/dbHostGuard.js`. Never disable guards to make a test pass.

**Guard coverage:** PrismaClient instantiation does NOT auto-run dbHostGuard. DB-connecting code outside tests (seed scripts, one-off migrations) must call `assertSafeForReset(process.env.DATABASE_URL)` at the top of `main()` before any Prisma op.

### Staging branch discipline (load-bearing)

**The Render staging service's deploy branch is a setting that must be verified, not assumed.** The three-week decimal-reps loop was caused by staging deploying from `main` instead of the feature branch under test. When testing a branch on staging, point staging at that branch — and **set it back to the correct long-term branch when done.** Leaving staging on a stale feature branch is the exact trap. (Open item at v15 cut — see handoff: staging may still be on `add-username`.)

### Data honesty principle

Where the app presents derived numbers (muscle volume, estimated 1RM, progression scores), the UI must make clear these are estimates. Avoid composite metrics in v1; if added, surface the inputs.

---

## Migration method on the fragile DB (load-bearing)

The DB has known out-of-band drift: a `connect-pg-simple` `session` table created at runtime (`createTableIfMissing: true`), **absent from `schema.prisma` entirely** (not even `@@ignore`). `prisma migrate status` reports clean *because* Prisma doesn't know the table exists — but `prisma migrate dev` (stricter, builds a shadow DB) can trip on it.

**Rule:** for **additive** migrations (new nullable column, new index, new table), hand-craft `migration.sql` and apply with `prisma migrate deploy` OR run the SQL directly in the Neon editor — both skip the shadow-DB drift check. This is the path that worked for the catalog migration, the username migration, and the manual prod recovery. For **non-additive** changes, resolve the drift FIRST. Always confirm the target host before running.

**Drift resolution paths** (before any non-additive schema change):
- (a) `prisma db pull` + baseline migration including the `session` table (cleanest long-term)
- (b) Mark `session` as `@@ignore`
- (c) Continue manual migration crafting (current state — fragile for non-additive work)

---

## Model escalation policy

Defaults to **Sonnet** for token economy.

**Escalate to Opus for:** red-tier tasks (auth, sessions, schema, infra, product direction); bugs resisting one diagnosis round; hard-to-reverse architecture calls; designing prompts for tricky/high-risk work; master prompt regeneration when fundamentals change; planning sessions where structural decisions get baked in.

**Stay on Sonnet for:** yellow/green prompt writing and diff review; master prompt regen when only updating stable facts; workflow/meta questions; straightforward CRUD.

Prefer a new Opus chat over mid-chat model switches.

---

## Quick-reference connection identity

- **Prod Neon:** project `snowy-resonance-34178668` ("LogChamp"), hostname `ep-solitary-sea-an56mioq` (denylisted in `dbHostGuard`)
- **Staging Neon:** project `noisy-surf-48238263` ("LogChamp-staging"), hostname `ep-bitter-breeze-am81izlh` (allowlisted in `dbHostGuard`)
- **Prod Render service:** `workout-db-l3gc` → `https://workout-db-l3gc.onrender.com` (Build: `npm install` · Start: `node src/server.js` — no auto-migrate)
- **Staging Render service:** `workout-db-staging` → `https://workout-db-staging.onrender.com` (Build: `npm install` · Start: `node src/server.js` — no auto-migrate)
- **Prod Vercel:** `workout-db-psi.vercel.app`
- **GitHub:** `Sethysethyseth/workout-db`
- **Git author:** `Seth Knisel <SethjKnisel@gmail.com>`
- **Local env:** Windows / PowerShell (no `&&` separator — commands on separate lines; Unix tools like `grep`/`wc` unavailable, use `Select-String` etc.)
- Current branch state / `main` SHA: see `docs/HANDOFF.md`.

---

## Lessons preserved from prior incidents

(Full detail in `docs/incidents/`.)

- **May 20 / May 23 prod wipes:** root cause never definitively identified. The `server/.env`-at-prod theory was disproven in v10. `dbHostGuard` blocks the suspected mechanism as defense-in-depth, not a confirmed root-cause fix. Any destructive event on prod again = critical signal.
- **June 08 prod login outage (NOT a wipe — recovered, zero data loss):** after merging `add-username` to main, prod auto-redeployed code that expected `displayName`/`usernameKey` columns, but the username migration had only ever been applied to *staging* Neon, never prod. Prod login crashed with `Invalid prisma.user.findFirst() invocation: The column User.displayName does not exist`. Initially feared as a data wipe; confirmed via `information_schema.columns` + `count(*)` that all 3 prod users were intact and only the columns were missing. Fixed by applying the three migration statements + a manual `_prisma_migrations` row directly in the prod Neon SQL editor. **Root lesson → the schema-change deploy discipline above.** This was a process gap (code and DB on separate manual tracks), not an infra failure.
- **All four secrets are per-environment** (separate `JWT_SECRET`/`SESSION_SECRET` for prod and staging). No cross-env leakage.
- **Standing rule:** never paste prod connection strings into local files or ad-hoc CLI.

---

## Known issues (stable enough to record here)

- **connect-pg-simple `session` table drift** — see migration method. Resolve before any non-additive schema change.
- **Integration test suite is unreliable on shared staging.** Three suites (`sessions.lifecycle`, `blockTemplates.integration`, `templates.integration`) fail on `main` itself with P2003 FK violations stemming from shared-staging data pollution / persisted sessions, not the code under test. Until fixed, a failing integration suite is NOT automatically a regression signal — check whether the same failures occur on main. Tracked for cleanup (needs per-run isolation / teardown).
- **Render services do not auto-migrate** (build = `npm install`, start = `node src/server.js`). Every schema change requires a manual migration step per the schema-change deploy discipline. Recorded as a known operational property, not a bug to fix unless/until automation is deliberately adopted.

---

## What goes where now

| Type of content | Lives in |
| --- | --- |
| Stable identity, vision, schema, principles | **This file** |
| Open bugs, in-flight units, branch decisions, next unit, open forks | **`docs/HANDOFF.md`** (+ GitHub issues) |
| Recurring command rituals (session start, merge, schema deploy, verification) | **`docs/RUNBOOK.md`** |
| Incident play-by-play | `docs/incidents/` |
| Commit conventions, branch state | Git itself |
| Curation reasoning (muscle weights) | `*-rationale.md` files in the repo |

---

## Where we left off

**No longer in this file.** The handoff snapshot lives in `docs/HANDOFF.md`, rewritten each session. If `HANDOFF.md` is missing from context at session start, ask for it before planning any work.

---

*End of v16.*
