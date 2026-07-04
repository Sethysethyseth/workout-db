# L2 decimal-reps smoke evidence (July 4, 2026)

On-device screenshots from Seth's visual smoke of the `logging-ux-wave`
staging/preview deploy. Drop-in for Claude Code review - open the images
directly.

## Deploy context

![vercel preview](./images/l-wave-vercel-preview-logging-ux-wave-11a9f0e.png)

- Branch: `logging-ux-wave`
- Commit: `11a9f0e` ("docs: HANDOFF + QUEUE - L1 landed (4ae0fbf), migration applied + verified")
- Environment: Vercel preview (not prod)

## Bug: reps display as decimals (9.98 / 9.99)

User entered whole-number reps; the session-edit form shows fractional values.

### Shot 1 - arbitrary exercise name

![decimal reps 9.98](./images/l2-decimal-reps-session-edit-9-98.png)

- Exercise: `dseytfvsrhezg`
- Weight: `200`
- Reps shown: **`9.98`** (expected integer)

### Shot 2 - barbell curl

![decimal reps 9.99 barbell curl](./images/l2-decimal-reps-barbell-curl-9-99.png)

- Exercise: `Barbell curl`
- Weight: `100`
- Reps shown: **`9.99`** (expected integer)

## Notes for triage

- Both shots are the in-session exercise edit form (Sets dropdown + L/R toggle visible).
- Pattern suggests a floating-point or rounding/display bug on read-back, not user input of decimals.
- Related prior incident: decimal-reps loop noted in `WORKOUTDB_MASTER_PROMPT_17.md` (staging branch mismatch); this may be a separate UI bug on L2.
