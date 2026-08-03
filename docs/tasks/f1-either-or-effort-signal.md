# TASK F1: either-or effort signal + remembered device-local preference

STATUS: QUEUED
MODEL: auto     <!-- was opus; the named rung REFUSED August 2 with
                     "Named models unavailable. Free plans can only use Auto."
                     Descended per the dispatch-unit fallback ladder. This is a
                     plan limitation, not a judgment about the unit - it is
                     still the wave's most intricate block, so the acceptance
                     criteria and the review lane carry the precision here. -->
MODE: 1-relay

CONTEXT:
F-wave unit 2 of 4. Seth's August 1 rulings, which this unit implements:
RIR and RPE are **either-or, never both** - one effort signal per template or
session, RIR the default - and the choice must be **remembered device-local**,
extending the existing localStorage pref pattern rather than adding an
account-level column. No schema change, no migration.

Today `RirRpeToggleRow` (`client/src/components/templates/RirRpeToggleRow.jsx`)
models two INDEPENDENT booleans, so all four combinations are reachable
including both-on and both-off. Five call sites render it (verified August 2):
`CreateTemplatePage.jsx:365` (workout) and `:492` (block), `EditTemplatePage.jsx:198`,
`EditBlockTemplatePage.jsx:313`, and `SessionDetailPage.jsx:2810` (quick log only -
template-driven sessions currently render a separate checkbox grid at `:2755-2807`,
which is F3's problem, NOT this unit's).

Preference memory today exists for QUICK LOGS ONLY
(`client/src/lib/quickWorkoutLogPrefs.js`, key
`workoutdb_quick_log_display_prefs_v1`). Template creation ignores it:
`CreateTemplatePage.jsx:46-47` and `:59-60` hardcode `useState(true)`/`useState(false)`.
Net effect an RPE user is handed RIR-on/RPE-off on every new template, forever.

LINE-NUMBER NOTE: every `SessionDetailPage.jsx` line number below was recorded
BEFORE F0 (`00e06d9`) landed, which inserted 5 lines at ~2193. References after
that point are therefore off by about 5. Locate the code by CONTENT, not by
line number, and trust the surrounding code over any number in this block.

FILES TO TOUCH:
- client/src/components/templates/RirRpeToggleRow.jsx  (either-or control)
- client/src/lib/<new effort-signal pref module>        (new, see CHANGE 2)
- client/src/pages/CreateTemplatePage.jsx               (both create flows)
- client/src/pages/EditTemplatePage.jsx                 (call site + mapping)
- client/src/pages/EditBlockTemplatePage.jsx            (call site + mapping)
- client/src/pages/SessionDetailPage.jsx                (QUICK-LOG call site ONLY)
Do NOT modify anything outside these files. Do NOT touch
server/prisma/schema.prisma, any server file, or client/src/index.css beyond
what the control genuinely needs - and if it needs CSS, it goes in index.css
via tokens, never a hex literal.

CHANGE:

**1. `RirRpeToggleRow` becomes a single-value either-or control.**
Replace the two independent booleans with ONE source of truth for the active
signal. The value domain is exactly three: `"rir"`, `"rpe"`, and `null`.

- `"rir"` / `"rpe"` - that signal is active, the other is not.
- `null` - **nothing chosen yet.** This is NOT a user-selectable "Off": there
  must be no control, click path, or keyboard interaction that moves a chosen
  signal back to `null`. It exists solely to represent legacy stored data that
  predates the mandate (a template saved with both booleans false), so the UI
  can render honestly instead of silently inventing a choice. F2 adds the
  required-choice prompt that resolves it; this unit only has to render it
  without lying.
- Clicking the inactive signal switches to it. Clicking the ACTIVE signal is a
  no-op - it must not deselect.

You choose the prop names and the internal markup. Keep both existing visual
variants (`"prefs"` and `"compact"`) working, keep the RIR/RPE definition hint
copy, and keep the existing `aria-pressed` segmented-button idiom already in the
file. Preserve the E2 effort-nudge copy ONLY if it still has a reachable state
to describe; if either-or makes it dead code, DELETE it rather than leaving an
unreachable branch, and say so in DELIVERY.md.

**2. New device-local pref module for the effort signal.**
Create it in `client/src/lib/`, modeled on `weightUnitPref.js` BY NAME - same
shape: a plain string value (not a JSON blob), a load function that returns a
safe default when the key is absent/unrecognized/throwing, and a save function
that no-ops on an invalid value. Default is `"rir"`.

The localStorage key MUST use the `workoutdb` prefix like its siblings
(`workoutdb-weight-unit`, `workoutdb-theme`) - this is a hard rename-boundary
rule in AGENTS.md, and LogChamp branding never reaches storage keys.

Do NOT change `quickWorkoutLogPrefs.js` or its existing key. Its
`useExerciseNotes`/`useSessionNotes` entries stay exactly as they are; the
effort signal simply stops being read from there.

**3. Wire the five call sites.**

- **Create workout** (`:365`) and **create block** (`:492`): initial value comes
  from the new pref module, NOT a hardcoded literal. Replace the
  `useState(true)`/`useState(false)` pairs at `:46-47` and `:59-60`, and the
  matching re-hardcodes inside `resetFlow` (`:78-79`, `:88-89`). Changing the
  control WRITES the pref, so the next new template remembers it. Create flows
  never render `null`.
- **Edit workout** (`:198`) and **edit block** (`:313`): value comes from the
  STORED template, mapped from its two booleans - `useRIR` true -> `"rir"`,
  `useRPE` true -> `"rpe"`, both true -> `"rir"` (RIR is the default signal and
  wins), both false -> `null`. Editing does NOT write the device pref; a
  template's stored signal and the device default are different things.
- **Quick log** (`SessionDetailPage.jsx:2810`): read from and write to the new
  pref module instead of the `useRIR`/`useRPE` booleans in
  `quickWorkoutLogPrefs`. Touch ONLY this call site and the quick-log branch of
  the init effect that seeds it (`:2205-2206`). Leave the template branch of
  that effect alone - F0 owns it.

**4. Saving still writes the two existing boolean columns.** The API contract
and the Prisma columns are unchanged: derive `useRIR`/`useRPE` from the active
signal at save time (`"rir"` -> true/false, `"rpe"` -> false/true, `null` ->
both false, preserving legacy rows byte-for-byte until the user resolves them).
This unit changes the UI's state model, NOT the wire format.

ACCEPTANCE CRITERIA (machine-checkable):
- `npm run test:unit` from `server/` is green (expected 204 tests / 15 suites).
- `npm run build` from `client/` compiles with no errors.
- `node scripts/check-hex.mjs` exits 0.
- No call site of `RirRpeToggleRow` anywhere in `client/src` still passes the
  old two-boolean prop pair. Grep for the component and show every call site in
  DELIVERY.md with its new props - all five, including the two this block did
  not list as primary targets.
- There is NO code path by which a chosen signal returns to `null`. Demonstrate
  this in DELIVERY.md by quoting the change handler.
- Clicking the already-active signal leaves state unchanged (quote the handler).
- Round-trip: with an empty localStorage, create-workout renders RIR active;
  switch to RPE; reload; create-workout renders RPE active. Walk this in
  DELIVERY.md against the code that produces it.
- Stored-template mapping: state the rendered value for all four stored boolean
  combinations `(true,false) (false,true) (true,true) (false,false)`, quoting
  the mapping code.
- Save mapping: state the `useRIR`/`useRPE` written for each of `"rir"`,
  `"rpe"`, `null`.
- `server/prisma/schema.prisma` does NOT appear in the diff, and no file under
  `server/` appears in the diff.

KNOWN MID-WAVE INCONSISTENCY (expected, do not "fix"):
After this unit, template-driven live sessions still show the old two-checkbox
grid at `SessionDetailPage.jsx:2755-2807`, which can still reach both-off. That
is F3's scope. Do not convert it here - it collides with F0/F3 and would put
three units in one file.

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
