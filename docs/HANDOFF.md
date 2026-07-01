# HANDOFF — current state

**Updated:** June 30, 2026
**Rule:** rewritten in place at the end of every working session. Dated, never versioned. If this file looks stale (date > ~2 weeks old), verify branch/deploy state from ground truth before trusting it.

---

## Repo / deploy state

- **`main` is at `654e4f6`** (docs: add CLAUDE.md + AGENTS.md per master prompt v17). Main carries the base palette system (data-palette axis, 4 presets, hand-authored surfaces, card restructure) but NOT the raster scene wiring or shared chrome below — that work is 10 commits ahead on `ui-palettes-v2` (HEAD `d42f9f7`), pushed to staging, not yet merged.
- Username feature LIVE and verified on both environments (carried over from prior session, unchanged).
- The merge deliberately EXCLUDES `server/data/` (catalog track) and junk (`_tmp-export/`, `ai-export/`, `ai-export.zip`, `scripts/`) — still untracked, should be gitignored.

## Open TODOs (do at next session start)

1. **Diff `_prisma_migrations` prod vs staging** (RUNBOOK -> "Migration history diff"). Confirm history in sync after the manual prod insert. Predates the UI work below, unresolved.
2. **Verify the manually inserted prod `_prisma_migrations` row's `checksum` matches staging's row** for `20260603140000_add_user_username`. Latent hazard — check once, fix if mismatched.
3. Confirm prod Render serving cleanly post-recovery (unverified since last check).

## U5 — UI overhaul (IN FLIGHT)

**Plan:** T1 tokens -> T2 palettes -> T3 dynamic loading screens -> T4 motion.

- **T1 DONE** — token consolidation, merged to main.
- **T2 palette system DONE and merged to main** — `data-palette` axis, 4 presets, hand-authored surfaces (not algorithmic tints).
- **T2 scene/chrome layer — all 5 palettes now on real raster scenes, on branch `ui-palettes-v2` (unmerged):**
  - **champ** — night-skyline band, refreshed raster (`champ.jpg` swapped June 27), shared chrome (crown wordmark, notched cards, dumbbell glyph, star glints), dark-mode notch-stroke specificity bug fixed (June 30).
  - **iron** — forge/anvil band, tuned to design fidelity, has the workout-tab single-layer suppression (see gotcha below).
  - **chill** — pine-treeline band, wired.
  - **forest** — canopy band wired June 30 (`forest.jpg`, cropped from `ForestMock.png`, full-bleed 0,1232,704,288). Light mode glow-only, dark mode glow+photo, mirrors champ's structure exactly.
  - **crimson** — wolf/moon band wired June 30 (`crimson.jpg`, cropped from inside `CrimsonMock.png`'s phone-frame inset at 52,1172,600,246 — that mock has a gray surround + rounded corners, not full-bleed like the others). Same light/dark structure as champ.
  - Zero placeholder inline-SVG scene art left in `index.css`.
- **Smoke test round 1 (June 30):** on-device shots of forest/crimson dark Home flagged a hard, un-faded top seam on the scene band — read as a pasted image, unlike champ's soft fade. Root cause: champ/iron have a dedicated `.workout-tab::before` fade-mask layer (transparent-to-`--color-bg` ramp) that chill/forest/crimson never got; they were falling through to the un-faded global `body::before` scene. **Fixed same day** — generalized the champ/iron `.workout-tab::before` block into one shared dark-mode rule off `--scene-image` (already resolves per palette), plus suppression blocks for chill/forest/crimson mirroring champ's. Pushed to staging (`1995c72`). champ/iron declaration bodies are byte-identical, so their Home rendering shouldn't have changed.
- **Smoke test round 2 (June 30):** all 5 palettes (champ, iron, chill, forest, crimson) confirmed dark/Home with the fade-mask band, no hard seams, no regressions on champ/iron. Matrix closed — see `docs/smoke-tests/SCENE-SMOKE-CRITIQUE.md`. Not covered: light mode and non-Home routes (unchanged by this fix, lower risk).
- **Dead-zone fix (June 30):** root cause was structural, not spacing — the scene band is `position: fixed`/viewport-anchored, so no container `min-height` change moves it; each palette's ambient glow just faded to transparent before reaching the middle. Decided against restoring the cut quick-picks/Library&Build section (would reverse a deliberate trim and cuts against the max-data anti-goal). Fix: widened each palette's glow size/falloff (same center/color, identity preserved — iron still bottom-up forge, champ/forest still top-down sky) + modest star-glint opacity boost. Pushed to staging (`883ee76`).
- **Remaining before `ui-palettes-v2` -> `main`:**
  1. Smoke-test the dead-zone fix (5 palettes x dark x Home) — confirm the glow reads as atmosphere and not overdone.
- T3 (dynamic loading screens) and T4 (motion) not started.

## Next up (the active task)

Smoke-test the dead-zone fix. If it holds up, `ui-palettes-v2` -> `main` is a manual merge (ask-before-running gate item 1).

## Open forks (settle before merge)

1. **Theme storage** — *proposed default:* device-local now (matches existing appearance setting, zero schema change), all reads through one accessor function so account-level promotion later is one swap + an additive migration.
2. **Login tagline** ("Log your shit dog") — *proposed default:* keep, with a trigger condition instead of a decision: it changes the day a stranger can sign up. One constant either way.

## Analytics/catalog track — paused mid-flight ("finish what I started")

*Still paused behind U5. Unresolved from prior session, no changes.*

1. **`exercise-catalog-seed` committed (`c27a6de`) but NOT merged to main.** Staging DB has the catalog migration; main's code doesn't. Prod has neither — when the catalog merges, its migration must be applied to prod per the schema-change deploy discipline. Reconcile before FK work.
2. **`muscle-weights-curation`: uncommitted**, branch behind main — rebase needed. 3 bad IDs: rename `Incline_Bench_Press` -> `Barbell_Incline_Bench_Press_-_Medium_Grip`; drop `Bulgarian_Split_Squat` and `Pendlay_Row` as known gaps. Count 32 -> 30.
3. **Integration test step-6 output (malformed-key seed behavior) still UNVIEWED.** Look before designing the FK unit.

## Other branches floating around

- `round-7-unify-set-row` (`f6c2a6f`) — set-row unification, parked, decision pending.

## Issues to open

1. Resolve connect-pg-simple `session` table drift (proposed: just do option (b) `@@ignore` soon).
2. Fix integration suite reliability on shared staging (FK pollution / teardown; per-run isolation).
3. Gitignore export/junk artifacts.
4. User-defined exercise support for movements absent upstream (Bulgarian split squat, Pendlay row).
5. Favicon/PWA icon swap for LogChamp (needs an asset).
6. Long-term call on migration automation vs manual discipline.
7. Schema sentinel — see spec (`docs/specs/schema-sentinel.md`).

## Known tech debt (queued, not blocking)

- `DraftSessionSetRow` / `SessionSetRow` unification.
- Prisma 6->7 bump.
- Jest open handle.
- pg SSL deprecation.

## Notes / gotchas discovered

- Scene reference mockups (`client/src/assets/scenes/*Mock.png`) are full-app screenshots with fake UI ghosted behind the real scene art — only ever crop the bottom scene band, never ship the mock itself as a scene asset. Not all mocks are full-bleed: `CrimsonMock.png` has a gray phone-frame surround with rounded corners, so its crop had to be inset inside the frame rather than a straight bottom-crop.
- `ForestMock.png` and `CrimsonMock.png` deleted June 30 after their crops were verified. `ChampMock.png`, `IronMock.png`, `ChillMock.png` still present — undecided whether they're spent (Champ) or still pending a refresh pass (Iron/Chill currently ship a pre-mock raster, untouched by these mocks).
- A commit can land locally while a redeploy rebuilds the OLD HEAD until the push lands. Push, confirm origin HEAD, THEN smoke.
- Build-passing + diff-looking-right do NOT prove the visual - smoke on device.
- When bumping a value produces near-zero visible change, it's not a tuning problem - something is suppressing it. Diagnose, don't tune.
- Migrations are a separate manual track - pushing code does not migrate any DB.
- `server/.env` only ever points at staging or localhost, never prod. `dbHostGuard` enforces this two ways: `assertSafeForBoot()` runs automatically at server boot (`server.js`); `assertSafeForReset()` covers the test/reset path (`jest.setup.js`) and must be called explicitly by any new DB-connecting script at the top of `main()`.
