# TASK FP0: frontier-parity report - current-state evidence + change specs, NO CODE

STATUS: QUEUED
MODEL: auto
MODE: 1-relay

CONTEXT:
The July 17 product review (hands-on staging drive + competitor research)
produced six concrete findings and a prioritized gap list vs the frontier
apps (Strong, Hevy, Boostcamp). Direction calls have now been MADE at the
gate tier and are baked into this block - do not re-litigate them, ground
them. This unit is a REPORT for Seth: for every item below, document what
the app does TODAY (with file:line evidence) and describe concretely what
the called change WILL LOOK LIKE. No code changes anywhere. This report
becomes the contract fuel for the wave's implementation blocks.

FILES TO TOUCH:
- (none - report-only unit; DELIVERY.md at the repo root is the ONLY file
  you write)
Do NOT modify anything outside these files.

CHANGE:
Investigate each item below in the codebase and write the report described
under REPORT FORMAT. Every "NOW" claim must carry file:line evidence you
actually read - no guessing. The direction call per item is stated; your
job is the evidence, the concrete before/after description, and the size
estimate.

TIER 0 - defects/frictions (fix direction is settled):

R1. Rebrand title leak. NOW: `client/index.html:7` is
    `<title>WorkoutDB beta</title>`; the PWA manifest already says
    LogChamp. CALL: retitle to "LogChamp". Also sweep rendered UI text
    (JSX string literals in client/src) for any other user-visible
    "WorkoutDB" - list every hit with file:line and whether it is in
    rebrand scope per the AGENTS.md rename boundary (internal
    identifiers, storage keys, cookie names are OUT of scope - do not
    list those as problems).

R2. PWA install icons. NOW: `client/public/manifest.webmanifest` ships
    `"icons": []`; document what that means for install on Android/iOS
    and what `index.html:5` currently points at (favicon.svg - describe
    what it contains). CALL: interim typographic monogram icon ("LC" on
    the champ-palette dark surface, flat, no gradients) at 192x192 +
    512x512 + a maskable variant, plus apple-touch-icon. Report exactly
    which files/sizes/manifest entries the fix needs. Real art replaces
    it later; the interim unblocks install.

R3. "This week" strip incoherence. The review saw 24 Workouts but 0 Sets
    and "not enough data" for Top set/Top gain in the same strip. NOW:
    trace the dashboard's This-week strip - which component renders it,
    where each number comes from (endpoint, engine function, date
    window), and name the MECHANISM that lets the workout counter and
    the set-derived tiles disagree (different windows? different data
    sources? a seed-data artifact - e.g. workouts with zero sets?). This
    is a diagnosis: evidence, not a guess. CALL: one shared week window
    and one data source for the whole strip; state concretely what
    unifying them requires.

R4. Recent-workouts row friction. NOW: the dashboard's recent-workouts
    strip scrolls horizontally on mobile and truncates titles ("Upper A ("
    was observed cut off). Document the component + CSS that produce
    this. CALL: replace with a VERTICAL stack of the 3 most recent
    workouts, full-width rows, full titles (wrap, don't truncate), with
    a "View all" link to History. This matches the frontier idiom (Hevy/
    Strong both list recents vertically). Describe the new layout
    against the existing card/row idioms in the codebase (name the
    classes/components it would reuse).

R5. Empty-state dead space. NOW: on data-light accounts the scene raster
    fills ~40% of the dashboard/analytics viewport with nothing in it.
    Document what each empty state currently renders (dashboard,
    analytics per-tab - the N6 two-variant empty state work is landed,
    start there). CALL: empty analytics surfaces tease the wedge - a
    restrained STATIC ghost preview of what the real analytics look like
    (tokens-only, no new motion) plus one honest line naming what
    unlocks it (in the voice of the existing insufficient-data layer,
    e.g. "Log 3 workouts and this becomes your volume trend"). Describe
    per surface what the ghost preview would show.

R6. Login tagline (Seth's call - present options, decide nothing). NOW:
    `client/src/components/AuthLayout.jsx:11` renders "Log your shit
    dog" as the auth tagline - first thing every new user reads.
    Present these four options verbatim in the report for Seth: (a) keep
    it, (b) "Know your numbers.", (c) "Every set, accounted for.",
    (d) "Log hard. Lift harder." One line on the trade-off (brand
    personality vs first-impression risk); no recommendation.

TIER 1 - frontier-parity features (report NOW + what the feature looks
like; these become their own blocks later):

R7. PR detection (top pick - the app's own UI flags it missing). NOW:
    document what the analytics engine already computes that PR
    detection can ride on (topSet/topSetSeries, e1rmSeries, the
    all-time exercise index from N5) and where the UI currently says
    anything PR-adjacent. CALL: a pure engine module in
    server/src/analytics/ (fixture-tested, no DB - match the existing
    engine pattern) detecting per-exercise PRs from history: weight PR,
    reps-at-weight PR, e1RM PR. Surfaced as (a) a quiet flag chip on
    the set/session in history and exercise detail, (b) a "PRs" section
    in the Exercises-tab detail view. NO confetti, no celebration
    animation - motion restraint is an anti-goal boundary. Sketch the
    UI in words/ASCII against the existing components.

R8. Weekly insight digest. NOW: document exactly what the Home
    WeeklyReport band already shows (it landed in the N-wave) and what
    data it pulls. CALL: extend it into a Boostcamp-style digest -
    volume by muscle vs prior week, PRs this week (rides R7), one
    execution-adherence line, one nudge line derived from existing
    execution data. In-app only, no email. Describe the delta from
    today's band.

R9. Strength Score + imbalance headline. NOW: document the data that
    exists (strength trends, the Balance scale, per-side set data).
    Sketch ONE candidate shape (single relative score + a balance
    headline) but mark this item NEEDS FABLE DESIGN PASS - it must be
    designed together with the already-queued per-side L/R comparison
    unit (see QUEUE.md Candidates). Not build-ready; the report scopes
    it, nothing more.

R10. Never-gate-history guarantee. NOW: verify by evidence that nothing
    currently time-limits a user's history or analytics (session list
    queries, the all-time exercise index, any LIMIT/date floor) - list
    what you checked. Hevy's 3-month history wall is the #1 intermediate
    complaint; being able to STATE the guarantee is the feature. CALL:
    it becomes product copy (candidate placements: the login/auth
    surface, Profile/About) - propose wording in the honesty-layer
    voice.

TIER 2 - horizon (one short paragraph each, NOW-hook + shape, no deep
work): per-lift progressive-overload nudge (Execution data already
supports it), mesocycle/block analytics (Blocks exist in Library), CSV
export + year-end Wrapped.

REPORT FORMAT (this is the deliverable, written INTO DELIVERY.md):
- Open with a one-paragraph frontier-parity verdict: where the app
  already matches or beats Strong/Hevy/Boostcamp, where the real gaps
  are. Plain language - Seth reads this first.
- Then one section per item: `## R# - <name>`, with `**Now:**` (plain-
  language state, then the file:line evidence), `**Change:**` (what it
  will look like after, concrete - a user could visualize it),
  `**Size:** S/M/L` (+ which files it would touch). Plain language
  first, engineering detail second.
- Close with a suggested wave order (which R-items batch into which
  implementation blocks, what is file-disjoint) - advisory, the
  reviewer re-derives it.

ACCEPTANCE CRITERIA (machine-checkable):
- ZERO source modifications: `git status --porcelain` shows DELIVERY.md
  as the only change.
- Every "Now" claim in the report carries at least one file:line
  reference that exists in the tree.
- R3 names a concrete mechanism with evidence (the disagreeing data
  sources/windows identified by file:line), not a hypothesis list.
- R1's sweep lists every rendered-UI "WorkoutDB" hit with file:line and
  an in-scope/out-of-scope verdict per the rename boundary.
- All six Tier-0 items, all four Tier-1 items, and the Tier-2 paragraph
  are present in the stated format.
- `npm run test:unit` green from server/ (tripwire that the tree is
  untouched, not a code gate).

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
