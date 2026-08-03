# TASK F2: required effort-signal choice on legacy templates

STATUS: QUEUED
MODEL: auto
MODE: 1-relay

CONTEXT:
F-wave unit 3 of 4. F1 made the effort signal either-or with a `null` value
meaning "not chosen yet". `null` is reachable for exactly one reason: templates
saved before the mandate, holding `useRIR = false, useRPE = false`.

Those are not an edge case - they are the historical NORM. Static analysis of
`server/prisma/migrations/` (August 2) found the only migration touching these
columns is `20260325120000_template_display_options`, which adds them as
`BOOLEAN NOT NULL DEFAULT false` and never backfills either one. So every
template created before that feature is both-false.

Seth's August 1 ruling on how to resolve them: a **one-time REQUIRED CHOICE on
open. Nothing is written until the user picks.** The two lazy exits were both
rejected on the record - auto-selecting RIR silently rewrites a stored user
choice (exactly what E-wave smoke item 5 existed to catch), and leaving an
implicit off-state is the 3-state model in disguise. This also satisfies the
standing requirement that the mandate ships WITH user education.

FILES TO TOUCH:
- client/src/pages/EditTemplatePage.jsx
- client/src/pages/EditBlockTemplatePage.jsx
- client/src/index.css                    (ONLY if new styling is unavoidable;
                                           tokens only, no hex)
Do NOT modify anything outside these files. In particular do NOT touch
`SessionDetailPage.jsx` (F3 owns the live-session side) or
`RirRpeToggleRow.jsx` (F1 settled its contract - consume it, don't reopen it).

CHANGE:
On both edit pages, when the loaded template's effort signal resolves to `null`,
the page enters a REQUIRED-CHOICE state:

1. The either-or control renders with neither signal active (F1 already supports
   this) and is visually marked as needing an answer.
2. A short explanatory line appears next to it saying why the choice is being
   asked for now - this is the education requirement, not decoration.
3. **Save is blocked** until a signal is chosen, with the reason stated in text
   rather than left for the user to deduce from a dead button.
4. **Nothing is written until the user picks.** Merely opening the page must not
   PATCH the template, must not write the device pref, and must not mutate any
   other field. A user who opens a legacy template and navigates away leaves it
   byte-identical in the database.

Follow the blocking-validation idiom these two pages ALREADY use for the block
duration field - `field-hint-warn` + a `disabled` Save whose condition is
computed alongside the other save-blockers (`CreateTemplatePage.jsx:521-527` and
`:585` are the reference rendering; `EditBlockTemplatePage.jsx` carries the
equivalent). Do NOT invent a modal, and do NOT add a toast - this client has no
toast system and adding one is out of scope.

A template that already has a signal (the normal case) must be COMPLETELY
unaffected: no new copy, no new warning, Save enabled exactly as before.

COPY: use ONE shared string constant for the required-choice explanation, not a
per-page literal. Base it on E2's smoke-approved effort education line, which
Seth signed off August 1:

  "Two sets of 10 can be worlds apart - one taken to the limit, one with five
  reps left. Effort is how LogChamp tells them apart."

Adapt it into a prompt that asks for the choice; keep it to roughly one or two
short sentences. ASCII only - hyphens, never em-dashes.

(Deliberately out of scope: the same sentence also exists in variant forms in
`AnalyticsPage.jsx`. Consolidating all of them into one module is a known
follow-up and is NOT part of this unit - do not touch that file.)

ACCEPTANCE CRITERIA (machine-checkable):
- `npm run test:unit` from `server/` is green (expected 204 tests / 15 suites).
- `npm run build` from `client/` compiles with no errors.
- `node scripts/check-hex.mjs` exits 0.
- The shared copy constant is declared ONCE and referenced by both pages - show
  the declaration and both references in DELIVERY.md.
- With a stored template `(useRIR=false, useRPE=false)`: control renders with
  neither active, the prompt copy is visible, and Save is disabled. Quote the
  code producing each of the three.
- With a stored template `(useRIR=true, useRPE=false)`: no prompt, Save enabled.
  Quote the condition that distinguishes the two cases.
- After the user picks a signal in the required-choice state, Save becomes
  enabled. Quote the state transition.
- No network call, `localStorage` write, or state mutation happens as a result
  of merely LOADING a both-false template. Walk the load path in DELIVERY.md and
  state explicitly that nothing is written.
- No file under `server/` appears in the diff.

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
