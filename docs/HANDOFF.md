# HANDOFF — current state

**Updated:** June 11, 2026 (initial extraction from master prompt v15 → v16 split)
**Rule:** rewritten in place at the end of every working session. Dated, never versioned. If this file looks stale (date > ~2 weeks old), verify branch/deploy state from ground truth before trusting it.

---

## Repo / deploy state

- **`main` is at `1ee6cc4`** — merged username + partial-rebrand commit (fast-forwarded from `64948d1`), pushed June 08.
- **Username feature LIVE and verified on both environments.** Staging gate tested via nulled `usernameKey` on `freakcity`; prod migration applied manually post-incident, gate confirmed on prod account.
- The merge deliberately EXCLUDES `server/data/` (catalog track) and junk (`_tmp-export/`, `ai-export/`, `ai-export.zip`, `scripts/`, `CLAUDE_CONTEXT.md/`) — still untracked, should be gitignored.

## Open TODOs (do at next session start)

1. **Repoint staging Render off `add-username` → `main`** (or intended long-term branch). Verify redeploy SHA in Render Events. Last unconfirmed step from the merge; harmless while both point at `1ee6cc4`, a trap once branches diverge.
2. **Diff `_prisma_migrations` prod vs staging** (RUNBOOK → "Migration history diff"). Confirm history in sync after the manual prod insert.
3. **Verify the manually inserted prod `_prisma_migrations` row's `checksum` matches staging's row** for `20260603140000_add_user_username`. A wrong/placeholder checksum can make a future `prisma migrate deploy` against prod flag the migration as modified/failed. Latent hazard — check once, fix if mismatched.
4. Confirm prod Render serving cleanly post-recovery (was clean as of June 08).

## Next active unit

**U3 — Feedback persistence** (verify `Feedback` table write path + a developer-readable read path; consolidate to Profile). Keep the read path minimal — reading the table in the Neon console counts; don't build admin UI.

Then: U4 profile restructure → U5 theme + token overhaul + motion → U6 Hello retirement, folding U7 (full rebrand display pass + IA changes) into U4–U6.

**Proposed new green/yellow unit (from June 11 review, awaiting go/no-go): schema sentinel** — boot-time check that the latest expected migration exists in `_prisma_migrations`; fail fast with a named error instead of crashing at login. Spec: `docs/specs/schema-sentinel.md`. Prevents a repeat of the June 08 incident class. Slot before the next schema-bearing unit (catalog merge or FK stage 2).

## Open forks (settle before U5)

1. **Theme storage** — *proposed default:* device-local now (matches existing appearance setting, zero schema change), all reads through one accessor function so account-level promotion later is one swap + an additive migration.
2. **Login tagline** ("Log your shit dog") — *proposed default:* keep, with a trigger condition instead of a decision: it changes the day a stranger can sign up. One constant either way.

## Analytics/catalog track — paused mid-flight ("finish what I started")

*Proposed (June 11 review): close all three items in one bounded ~2-hour cleanup session before going deep on UI — current state violates one-thing-in-motion three ways.*

1. **`exercise-catalog-seed` committed (`c27a6de`) but NOT merged to main.** Staging DB has the catalog migration; main's code doesn't. Prod has neither — when the catalog merges, its migration must be applied to prod per the schema-change deploy discipline. Reconcile before FK work.
2. **`muscle-weights-curation`: uncommitted**, branch points at `64948d1` (behind main — rebase). 3 bad IDs: rename `Incline_Bench_Press` → `Barbell_Incline_Bench_Press_-_Medium_Grip`; drop `Bulgarian_Split_Squat` and `Pendlay_Row` as known gaps. Count 32 → 30. Old WIP stash `wip-pre-add-username` (a.k.a. `diag-add-username-wip`) on this branch — leave it.
3. **Integration test step-6 output (malformed-key seed behavior) still UNVIEWED.** Look before designing the FK unit.

## Other branches floating around

- `round-7-unify-set-row` (`f6c2a6f`) — set-row unification, parked, decision pending.

## Issues to open

1. Resolve connect-pg-simple `session` table drift (proposed: just do option (b) `@@ignore` soon — ~15 min, deletes a class of migration-safety reasoning).
2. Fix integration suite reliability on shared staging (FK pollution / teardown; per-run isolation).
3. Gitignore export/junk artifacts.
4. User-defined exercise support for movements absent upstream (Bulgarian split squat, Pendlay row).
5. Favicon/PWA icon swap for LogChamp (needs an asset).
6. Long-term call on migration automation vs manual discipline (if automating: resolve drift + sync histories first, prod Pre-Deploy hook shape).
7. (NEW) Schema sentinel — see spec.

## Known tech debt (queued, not blocking)

- `DraftSessionSetRow` / `SessionSetRow` unification.
- Prisma 6→7 bump.
- Jest open handle.
- pg SSL deprecation.
