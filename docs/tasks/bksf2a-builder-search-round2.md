# TASK bksf2a: Builder + search - critic round 2 fixes (RPE inline, your exercises first, honest header)

STATUS: QUEUED
MODEL: auto
MODE: 1-relay

CONTEXT:
Critic round 2 scored 7/10 (`docs/tasks/bks-critic-round-2-FINDINGS.md`; IDs
refer to it). Builder roominess is at 6/10 and must reach 7+ in the final
round. bksf1b (`docs/tasks/bksf1b-builder-search-critic-fixes.md`) made the
chrome much smaller, but:
- It pushed each set's RPE onto an unlabeled full-width second row (N1, P1).
- Search still ranks short obscure names first, so "Barbell Bench Press -
  Medium Grip", which is in the user's own block, is not in the top 40 for
  "press" (P2-1).
Every bksf1b contract stays in force: one-row header, nav hidden while typing,
"..." menu, local draft + Restore, relevance tiers, limit 50 + hasMore.

FILES TO TOUCH:
- client/src/components/blocks/builder/*
- client/src/styles/blocks/bk-builder.css
- server/src/controllers/exerciseController.js (search route only)
- server/src/analytics/searchCatalog.js, server/test/analytics/searchCatalog.test.js
Do NOT modify anything outside these files (parallel units own import, Home
and the run page).

CHANGE:
1. **RPE/RIR inline (N1):**
   - The set grid shows Set | Reps | Load | Effort (RPE or RIR, labelled as the
     block uses it) | remove, on ONE row per set at 390px and up, for fixed
     reps.
   - Rep-range rows (two rep inputs) may wrap ONLY below 400px wide, and the
     wrapped field carries a visible label ("RPE").
   - The remove control stays in the same column on every row.
   - Target: a 4-set expanded card at 390px is 440px tall or less. Measure it.
2. **Your exercises first (P2-1):**
   - `searchCatalog` already accepts `usageByKey`, but the route never passes
     it. In the search route, build `usageByKey` from the requesting user's
     own data:
     - how often each exercise appears in their logged sessions
     - plus each exercise in their saved blocks
   - Use the same key format `searchCatalog` reads (`catalog:<id>` and the
     user-exercise keys). Read the function to match it.
   - Keep it to at most two indexed queries per search, scoped to the user,
     with no N+1.
   - Within a relevance tier, used exercises rank first. Add a usage tier so
     that a used exercise containing the query as a whole word outranks an
     unused exact/short name.
   - Test with an injected `usageByKey`: "Barbell Bench Press - Medium Grip"
     with usage 5 is #1 for "press", and "Seated Dumbbell Press" with usage 2
     is in the top 3.
3. **Header honesty (P3):**
   - The block name is never clipped in a way that hides it. Let it wrap to
     two lines in the sticky row, or truncate with the full name one tap away
     (tap to edit). The header row may grow to 64px for this.
   - The save state reads "Unsaved" while a draft is pending, "Saving…"
     during a save and "Saved" only after the server confirms. Never "Saved"
     while a local draft differs.
4. **Discoverability (P3):** each collapsed exercise card shows a read-only
   summary line of rest / target / cap / note when set (e.g. "Rest 3:00 · RPE
   ≤ 8 · 1 note"). Tapping it opens the same editor the "..." menu opens.

ACCEPTANCE CRITERIA (machine-checkable):
- `npm run test:unit` from `server/` green, including the new usage-tier tests
  above.
- Client `npm run build` green. `node scripts/check-hex.mjs` clean.
- **Hook rule:** no hook is called after an early return in any component you
  touch. State it in DELIVERY.md.
- DELIVERY.md:
  - shows the route's two queries and the `usageByKey` construction
    (file:line)
  - gives the item-1 card height measurement method and result
  - shows the save-state logic

STOP CONDITION (standing footer - keep verbatim in every block):
Stop when the acceptance criteria are met. If a criterion cannot be met,
stop and explain why instead of guessing.
- Before stopping, run every lane this block allows and write the delivery
  report to DELIVERY.md at the repo root (files touched; verbatim test
  output; each acceptance criterion with the evidence that proved it; any
  deviations from this block, with reasons). Do not commit it.
- Do NOT commit, push, or touch git in any way - leave the working tree
  for review.
- Do NOT edit docs/HANDOFF.md, AGENTS.md, CLAUDE.md, this task file, or
  anything under docs/tasks/ - state is the reviewer's job.
- Do NOT add dependencies or refactor unrelated code.
- Do NOT start another task file when done - end your turn.
