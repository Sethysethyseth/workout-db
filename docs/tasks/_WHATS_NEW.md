# TASK <wave>-wn: What's New release - <wave branch>

<!-- STANDING BLOCK (spec: docs/specs/quality-of-life-wave.md section 4).
     Claude Code copies this file to docs/tasks/<wave>-wn-whats-new-release.md
     as the LAST unit of every wave (after the critic round, before Seth's
     smoke), fills the <angle> fields and the RELEASES-TO-WRITE list,
     registers it in QUEUE.md, and dispatches it like any content unit.
     Delete this comment in the copy. -->

STATUS: QUEUED
MODEL: auto
MODE: 1-relay

CONTEXT:
You are LogChamp's What's New writer. Shipped work is recorded as it lands
in `docs/releases/UNRELEASED.md` (the ledger). Your job is to turn the
ledger into release notes users will actually read, plus keep the coach's
app guide current.

Release notes live in `client/src/data/whatsNew.js` (`RELEASES`, newest
first; read its header comment for the shape). Each release has:
- concise `sections`: 5 bullets or fewer
- an optional in-depth `details` layer: `[{ heading, body: string[],
  where? }]`

The app guide is `server/data/app-guide.md`. It is the coach's source for
"how do I..." questions.

RELEASES-TO-WRITE (newest last; prepend so the newest ends up first):
- <id> | date <YYYY-MM-DD> | covers ledger section "<heading>"

FILES TO TOUCH:
- client/src/data/whatsNew.js     (PREPEND new entries only)
- server/data/app-guide.md        (update the sections the ledger changes)
Do NOT modify anything outside these files.

CHANGE:
1. Read `docs/releases/UNRELEASED.md` in full. For every entry, open the
   files it names so your wording matches the real on-screen labels. Never
   describe a screen you have not seen in the code.
2. Write each release in RELEASES-TO-WRITE:
   - `title`: 8 words or fewer, outcome-first ("Settings that stay out of
     your way").
   - `tagline`: one sentence, 14 words or fewer.
   - `sections` (the concise layer): 5 bullets or fewer TOTAL, 25 words or
     fewer each, under 1-3 headings, ordered by how much the change matters
     to a lifter.
   - `details`: one entry per change worth explaining. Each has a
     `heading`, a `body` of 1-3 short paragraphs (70 words or fewer total)
     that says what it does and how to use it, and a `where` with the tap
     path using on-screen labels ("Profile, then Training").
   - Merge related ledger entries. Skip fixes users cannot notice. Every
     skip is listed in DELIVERY.md with a reason.
3. Copy rules (Seth's standing rule - non-technical, straight to the
   point):
   - Talk to the lifter as "you", in sentence case.
   - Describe outcomes, not implementation: no endpoints, no "API",
     "schema", "migration", "token", "component", unit ids or file names.
   - No hype ("revolutionary", "seamless", "powerful", "supercharge"), no
     exclamation marks, no emoji.
   - Write "LogChamp", never "WorkoutDB".
4. Update `app-guide.md` wherever a ledger entry changes how something is
   done or where it lives. Add a section if a new area appeared. Keep the
   guide's style and keep it under 12,000 characters (trim older, wordier
   passages if you must). Update its "Not in LogChamp yet" list if
   something on it now exists.

ACCEPTANCE CRITERIA (machine-checkable):
- Client `npm run build` clean. `npm run test:unit` green from `server/`.
- `whatsNew.js`: existing entries are byte-identical, and the new entries
  sit at the top of `RELEASES` in the order listed. DELIVERY.md quotes the
  diff stat and the new entries in full.
- Per release: `sections` holds 5 bullets or fewer in total, and each
  bullet is 25 words or fewer (count them in DELIVERY.md).
- In the new copy, `grep -inE "endpoint|\bapi\b|schema|migration|component|qol[0-9]|\.jsx|workoutdb"`
  returns zero hits. "AI" alone is fine.
- `wc -c server/data/app-guide.md` is under 12000.
- DELIVERY.md has a table of every ledger entry, with where it went
  (release + section/detail) or why it was skipped.

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
