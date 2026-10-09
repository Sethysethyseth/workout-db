# Quality-of-life wave (`quality-of-life-updates`) - design of record

Opened October 8, 2026 (Opus frontier seat). Branch `quality-of-life-updates`,
cut from `main` at `b5c6777`. Authoring recon: `qol-r1` (logging prefs,
mirror, finish), `qol-r2` (custom-exercise edit, What's New, coach),
`qol-r3` (stowed backlog) - reports preserved as
`docs/tasks/qol-r{1,2,3}-*-FINDINGS.md`.

## 1. Seth's rulings (Oct 8, asked and answered in session)

1. **Logging settings move out of the logger.** lbs/kg, RIR vs RPE, notes,
   repeat-last-time and the rest timer live in ONE preferences form. It is
   reachable from a new Profile page AND from a compact strip under Home's
   log button. The same form renders in both places.
2. **Repeat last time = ghosts, like block days.** Last time's numbers show
   greyed in empty fields. The set-number button accepts them. Typing
   overrides. Nothing is saved that the lifter didn't log. Opt-in, off by
   default ("an option users can enable").
3. **Effort no longer gates Finish (REVERSES the Aug 1 mandate).** Finish
   works with one logged set. If any logged set lacks RIR/RPE, a warning
   says what that costs, and the lifter can finish anyway. This applies to
   normal workouts and block days. The either-or ruling (RIR | RPE, one
   signal, no Off state) STILL stands.
4. **The coach helps with the app, for everyone.** Without AI consent the
   coach answers how-to questions from an app guide and receives NO
   training data. With consent it does both.
5. **Coach history lives in Library, under a new Coach tab.** It is kept
   until the user deletes it, with delete-one and delete-all.
6. **The BYO coach key is encrypted on the server** (meets the Sept 29
   "MUST be encrypted" ruling). The browser stops holding it.
7. **Connector hardening is in.** The site root forwards the sign-in
   handoff.
8. **Out of this wave:** privacy/ToS (BK0, facts still owed), search
   synonyms (held for Seth's own change), swap-exercise-for-today
   (parked).

### Considered and rejected (so nobody re-litigates)

- **Account-level preference columns.** Rejected: the Aug 1 ruling keeps
  capture prefs device-local (`weightUnitPref.js` precedent). The wave
  adds new localStorage keys only and never renames existing ones
  (rename boundary).
- **Re-adding an effort "Off" state** now that Finish isn't gated.
  Rejected: either-or stands. An unfilled effort column already is the
  no-effort path.
- **Real pre-filled values for repeat-last.** Rejected by Seth: they would
  save sets nobody lifted, because any non-blank draft auto-promotes
  (`tryPromote`, qol-r1 B5).
- **The coach key on the `User` row.** Rejected: `sanitizeUser` strips
  only `passwordHash`, so `/auth/me` would ship the ciphertext. It gets
  its own table.

## 2. Design language for this wave (every UI unit follows this)

The bar Seth set: "very professional, maintaining a nice flow." His feel
criteria still govern:

- nothing cramped
- lists easy to scroll
- the phone keypad and fixed bars never cover what you're typing

1. **Tokens only.** Every new surface renders correctly in all 10
   palette x mode combos. Accent-adjacent states derive from
   `--color-interactive` via `color-mix`. Run `node scripts/check-hex.mjs`
   clean.
2. **New CSS goes in a NEW file under `client/src/styles/`**, named in
   the block and imported by the component that owns it. `index.css` is
   touched only where a block says so (tokens). This keeps units
   parallel-safe.
3. **Copy:**
   - Sentence case everywhere.
   - No ALL-CAPS labels on new surfaces.
   - No middle-dot meta strings ("A · B").
   - No "→" in button or link text.
   - A button says exactly what happens ("Save changes", "Discard
     workout", "Finish anyway"). The same action keeps the same name
     through the flow.
   - Empty and error states give direction, never mood.
   - Plain words, never internal names.
4. **Motion** is 150-250ms ease-out, and only in answer to a user action
   (sheet open, expand, lift-to-drag, confirm). Every new animation has
   a `prefers-reduced-motion` fallback.
5. **Phone first at 390x844.** Touch targets are at least 44px. Sheets
   are keyboard-safe. Fixed bars never overlap inputs.
6. **One sheet look.** Reuse the existing bottom-sheet chrome (the
   `StartWorkoutPicker` / `BuilderSheet` pattern) - no new sheet style.
7. **One confirm.** In-app panels only (qol4's `ConfirmPanel`), never
   `window.confirm` / `alert` in new code.
8. **One memorable element per surface; everything else stays quiet.**
   Each visual block names its one element.
9. `card--live` keeps its single meaning (a live workout). Portals render
   above the scene layer (`#root` stacking note in AGENTS.md).

## 3. Units, landing order, collisions

N = 15. All are MODEL auto, MODE 1-relay, DB-free lanes. Every server
route gets a LIVE proof at landing via the real-app recipe (HANDOFF,
"Lanes + verification"). The unit lane does not cover endpoints.

| n | Unit | Scope | Runs beside |
|---|------|-------|-------------|
| 1 | qol1 | schema + migration: coach key, coach history | qol3, qol5 |
| 2 | qol2 | training preferences (Profile page, Home strip, logger toggles out) | qol3, qol5 |
| 3 | qol3 | builder: hold-to-move exercises | qol1, qol2, qol4, qol5 |
| 4 | qol4 | one confirm panel; finish without effort; discard from Home + bar; browser dialogs out | qol3, qol5 |
| 5 | qol5 | server fixes: 413 on coach import, history import keeps top 7 | anything but qol6 |
| 6 | qol6 | coach helps with the app: guide, help mode, /coach page, entry points, wait copy | qol8 (disjoint), qol9 |
| 7 | qol7 | repeat last time (server endpoint + ghosts) | qol8, qol9 |
| 8 | qol8 | edit custom exercises + Library loads per tab | qol6, qol7, qol9 |
| 9 | qol9 | builder polish (sr3 P3s, per-side chip, week pill, recents) | qol6, qol7, qol8 |
| 10 | qol10 | coach history (store, routes, Library Coach tab) | qol12 |
| 11 | qol11 | BYO key vault (server-encrypted) | qol12 |
| 12 | qol12 | rest timer | qol10 or qol11 |
| 13 | qol13 | small visual fixes + connector forward | qol14 |
| 14 | qol14 | What's New: concise + in-depth, Profile card, staging preview | qol13 |
| 15 | qol15 | What's New release run (first `_WHATS_NEW.md` instance) | none - last |

Hard serial chains (they share files):

- **Logger** (`SessionDetailPage.jsx`): qol2 -> qol4 -> qol7 -> qol12.
- **Home / Profile / App.jsx:** qol2 -> qol4 -> qol6 -> qol13 / qol14.
- **Builder** (`BlockBuilder.jsx`, `ExerciseCard.jsx`, `bk-*.css`): qol3 ->
  qol9 -> qol11 (qol11 only strips BYO-key reads there).
- **Coach** (`coachController.js`, `CoachPanel.jsx`): qol6 -> qol10 ->
  qol11.
- **Library** (`MyTemplatesPage.jsx`): qol8 -> qol10.
- **Schema:** qol1 lands first. Its landing push MIGRATES STAGING
  (Render's build runs `migrate deploy`), so the push waits for Seth's
  "migrate staging". qol10 and qol11 need it applied.

A critic round (ONE, per Seth's Oct 6 rule) runs after qol14 lands and
before qol15, over the wave's visual surfaces.

## 4. What's New pipeline (Seth's ask 2) - process of record

- **Ledger:** `docs/releases/UNRELEASED.md`. `land-unit` appends one entry
  per user-facing landing: a plain-language line, where to find it, and
  the unit id. Claude Code is the single writer.
- **The what's-new agent:** a Cursor content lane run from the standing
  block `docs/tasks/_WHATS_NEW.md`, as the LAST unit of every wave (after
  the critic round, before Seth's smoke). It turns the ledger into
  `RELEASES` entries in `client/src/data/whatsNew.js`:
  - concise `sections` (5 bullets or fewer)
  - an optional in-depth `details` layer (qol14's shape)
  - updates to `server/data/app-guide.md` (qol6), so the coach's guide
    stays current from the same input
- **At landing,** Claude Code moves the consumed ledger entries VERBATIM
  to `docs/releases/RELEASED.md` (newest first) and resets
  `UNRELEASED.md` to its header.
- **Seth reviews the copy** on staging at `/profile/whats-new?preview=1`
  (qol14). The modal stays prod-only (July 10 ruling).
