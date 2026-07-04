# TASK N2: Profile hub + settings sub-screens

STATUS: QUEUED
MODEL: sonnet
MODE: 1-relay

CONTEXT:
Second unit of the N-wave (dispatch AFTER N1 lands - both touch
`client/src/index.css`; do not combine units). Today `/profile` is a
settings page wearing a Profile name. It becomes a person: identity header
+ lifetime stat strip + drill-in rows, with the existing Appearance /
Security / Feedback sections moved verbatim onto their own sub-routes.
No server changes: `/auth/me` already returns `createdAt` (sanitizeUser
strips only passwordHash), and `/sessions/mine` returns ALL sessions with
`completedAt` (no server-side limit - verified during U7), so every stat
below is client-derivable.

FILES TO TOUCH:
- client/src/pages/ProfilePage.jsx              (becomes the hub)
- client/src/pages/profile/AppearancePage.jsx   (NEW - extracted section)
- client/src/pages/profile/SecurityPage.jsx     (NEW - extracted section)
- client/src/pages/profile/FeedbackPage.jsx     (NEW - extracted section)
- client/src/lib/profileStats.js                (NEW - pure stat helpers)
- client/src/lib/reviewerEmails.js              (NEW - extracted parser)
- client/src/components/layout/Navbar.jsx       (import swap ONLY: use
                                                 reviewerEmails.js instead
                                                 of its local parser)
- client/src/App.jsx                            (three new routes)
- client/src/index.css                          (hub styles)
Do NOT modify anything outside these files.

CHANGE:

1. **Routes** (App.jsx, same `Layout` + `ProtectedRoute` wrapping as every
   other page): `/profile/appearance`, `/profile/security`,
   `/profile/feedback`.

2. **Sub-screens**: move the existing Appearance (theme radios + palette
   grid, including `PALETTE_OPTIONS`), Security (change-password form), and
   Beta feedback (category + message form) sections out of ProfilePage into
   the three new pages, markup and state logic as close to verbatim as
   possible (same class names, same api calls, same success/error
   behavior). Each sub-screen wraps in the existing `settings-page` shell,
   with its own `h1` (`settings-page-title`) and a back link to `/profile`
   at the top (a plain `Link`, e.g. "&larr; Profile", styled muted small).
   One copy fix while moving: the feedback hint "Help improve WorkoutDB."
   becomes "Help improve LogChamp." (rendered UI text - allowed and wanted
   by the rename boundary; identifiers stay workoutdb-*).

3. **`profileStats.js`** - pure, exported, no React:
   - `countCompleted(sessions)` - sessions with truthy `completedAt`.
   - `countThisWeek(sessions, now)` - completed sessions whose
     `completedAt` falls in the current calendar week (Monday 00:00 local
     through `now`).
   - `weekStreak(sessions, now)` - build the set of Monday-based local
     week-start keys containing at least one completed session; starting
     at the current week, count consecutive present weeks going backward.
     If the CURRENT week is empty, skip it without breaking and start
     counting from last week (a Tuesday visit before training shouldn't
     zero the streak). No sessions at all -> 0.
   All take the raw `/sessions/mine` array; ignore entries without
   `completedAt`. Guard invalid dates (NaN -> ignored).

4. **The hub** (ProfilePage.jsx), top to bottom:
   - Identity header: circular initials avatar (first letters of up to two
     words of `displayName`, else first letter of `email`; background =
     `color-mix` of `--color-interactive` over surface, text
     `--color-interactive` - tokens only), `displayName || email` as the
     name line, email as the secondary line when displayName exists
     (mirrors the current "Signed in as" row), and "Member since {Mon
     YYYY}" from `currentUser.createdAt` (via `toLocaleDateString` with
     `{ month: "short", year: "numeric" }`; omit the line if createdAt is
     missing).
   - Stat strip: three tiles - "Workouts" (countCompleted), "This week"
     (countThisWeek), "Week streak" (weekStreak, rendered like "3 wk").
     Sessions come from `useActiveSession()` (already provides `sessions`
     + `loading`); while loading render an em dash placeholder, never 0.
   - Settings rows: a `settings-group` of link rows (chevron affordance,
     44px min height) -> Appearance, Security, Send feedback; plus a
     conditional "Dev feedback" row (navigates to `/dev/feedback`) shown
     only when the reviewer-email check passes.
   - Footer: the existing logout button, behavior unchanged (including the
     401-swallow in `onLogout`). Keep `ErrorMessage` for logout errors.

5. **`reviewerEmails.js`**: extract Navbar's `parseReviewerEmails` +
   the eligibility check into one exported helper, e.g.
   `canReviewFeedback(currentUser)` reading
   `import.meta.env.VITE_FEEDBACK_REVIEWER_EMAILS`. Navbar and the hub both
   import it; Navbar's rendered output is unchanged.

6. **CSS**: new `profile-hub-` prefixed block for the avatar, header, and
   stat tiles (reuse existing `settings-` classes for rows/groups where
   they fit). Tokens only, no hex. Stat tiles are simple cards - no
   charts, no motion.

ACCEPTANCE CRITERIA (machine-checkable):
- `npm run build` from client/ compiles with no errors.
- `/profile` renders header + 3 stat tiles + rows; `/profile/appearance`,
  `/profile/security`, `/profile/feedback` each render the moved section
  with a back link. No password/theme/feedback behavior change (same api
  functions called with the same payloads - verify by diff).
- `profileStats.js` contract, verifiable by direct node/manual eval:
  - `weekStreak` with sessions in the current week and the two prior weeks
    -> 3; with sessions last week + two weeks ago but none this week -> 2
    (current empty week skipped, not broken); with a gap week -> counting
    stops at the gap; `[]` -> 0.
  - `countThisWeek` excludes a session completed last Sunday when "now" is
    a Monday-based current week.
- `grep -n "parseReviewerEmails" client/src` shows the logic only in
  `reviewerEmails.js`; Navbar imports it.
- The string "Help improve LogChamp." exists; "Help improve WorkoutDB."
  does not. No localStorage/cookie/route identifiers renamed.
- No new hex colors in changed CSS; `client/package.json` byte-identical.

STOP CONDITION (standing footer - keep verbatim in every block):
Stop when the acceptance criteria are met. If a criterion cannot be met,
stop and explain why instead of guessing.
- Do NOT commit, push, or touch git in any way - leave the working tree
  for review.
- Do NOT edit docs/HANDOFF.md, AGENTS.md, CLAUDE.md, this task file, or
  anything under docs/tasks/ - state is the reviewer's job.
- Do NOT add dependencies or refactor unrelated code.
- Do NOT start another task file when done - end your turn.
