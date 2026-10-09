# TASK qol13: Small fixes - crimson "good" colour, desktop bar width, whole Execution numbers, no login flash, connector forward

STATUS: QUEUED
MODEL: auto
MODE: 1-relay

CONTEXT:
The stowed small fixes, each with current file:line in
`docs/tasks/qol-r3-recon-stowed-backlog-FINDINGS.md` sections D3, D4, D7
and D9:
- **(a)** Crimson's "good" colour reads amber (warning-like):
  `client/src/index.css` ~8925-8958.
- **(b)** The desktop In-progress bar is a full-width strip up to 980px
  that ignores the content column (`index.css` ~5755-5770, 5869-5882).
- **(c)** Execution's plan/actual line shows fractional means:
  `formatPlanActual` / `formatDecimalCount` in
  `client/src/lib/executionVerdict.js` 3-7 and 73-97. The server rounds to
  2 dp, which stays.
- **(d)** A ~1s Login flash after iOS clears site data: `ProtectedRoute`
  redirects to `/login` while `/auth/me` is still in flight
  (`ProtectedRoute.jsx` 11-17).
- **(e) Connector hardening** (ruling 7): if a sign-in handoff lands on
  the site root with `?external_auth_id=`, forward it to
  `/connector/login`, so a wrong WorkOS sign-in URI can no longer strand
  the handshake (bit twice: Aug 8, Sept 26-28).

Design rules: `docs/specs/quality-of-life-wave.md` section 2.

FILES TO TOUCH:
- client/src/index.css                      (ONLY the crimson success tokens
                                             and the in-progress bar rules)
- client/src/components/Layout.jsx          (only if (b) needs a wrapper class)
- client/src/lib/executionVerdict.js
- client/src/components/ProtectedRoute.jsx
- client/src/App.jsx                        (root forward)
Do NOT modify anything outside these files.

CHANGE:
1. **(a) Crimson good.** Replace crimson's success tokens (dark and light)
   with a green family that reads as "good":
   - hue between 130 and 170 degrees
   - the success TEXT token at least 4.5:1 contrast against crimson's card
     surface token in the same mode
   - the success ACCENT at least 3:1 against that surface
   - hue at least 60 degrees from crimson's warning token

   Update the "gold on crimson" comment to say why it changed. List the
   chosen values and their computed ratios in DELIVERY.md. Touch no other
   palette.
2. **(b) Desktop bar.** At 720px and wider, the In-progress bar aligns
   with the left and right edges of the page content column it sits over,
   centered, never wider than that column. The phone layout (under 719px)
   is unchanged.
3. **(c) Whole numbers.** In the plan/actual line:
   - sets, reps and RIR display rounded to whole numbers
   - weight displays rounded to the nearest whole unit

   Percentages are unchanged. Examples:
   - planned `{sets: 3, reps: 8.33, weight: 102.5, rir: 2}` vs actual
     `{sets: 2.67, reps: 7.5, weight: 186.67, rir: 1.25}` renders
     "3 x 8 @ 103" / "3 x 8 @ 187" with RIR 2 / 1, using the line's
     existing separators and units.
   - `reps: 7.5` rounds half up to 8.
4. **(d) No login flash.**
   - While `authLoading` is true, `ProtectedRoute` renders the existing
     `LoadingState` (session tone), whether or not a token is stored. It
     redirects to `/login?next=...` only after auth resolves with no
     user.
   - A logged-out visitor sees the loader briefly, then Login. A
     still-valid cookie never shows the Login form.
5. **(e) Connector forward.** When the app loads at `/` with an
   `external_auth_id` query param, it navigates (replace) to
   `/connector/login` with the FULL original query string, BEFORE any
   auth redirect. No other path and no other param changes behavior.
   Examples:
   - `/?external_auth_id=abc&x=1` -> `/connector/login?external_auth_id=abc&x=1`
   - `/` -> unchanged
   - `/?foo=1` -> unchanged
   - `/analytics?external_auth_id=abc` -> unchanged (root only)

ACCEPTANCE CRITERIA (machine-checkable):
- Client `npm run build` clean. `npm run test:unit` green from `server/`.
- `node scripts/check-hex.mjs` passes. New crimson hexes are allowed only
  inside the crimson token block of `index.css`, which is where the
  palette's hand-authored hexes live.
- DELIVERY.md lists the crimson values with computed contrast ratios that
  meet step 1, and states the (c) and (e) examples with their results.
- Real-app items for the reviewer:
  - crimson dark and light: Analytics "good" states read green
  - at 1280px the In-progress bar matches the content column
  - with storage cleared but the cookie valid, there is no Login flash
  - `/?external_auth_id=test` lands on the connector login page

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
