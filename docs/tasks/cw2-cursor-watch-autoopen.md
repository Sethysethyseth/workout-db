# TASK CW2: cursor-watch auto-open - the dashboard pops when Cursor starts working

STATUS: QUEUED
MODEL: auto
MODE: 1-relay

CONTEXT:
Follow-up to CW1 (`scripts/cursor-watch.mjs`, landed just before this
block dispatches - read the shipped script first and match its style).
Seth wants the dashboard to APPEAR on its own the second Cursor works on
anything, as visual confirmation - not be a page he remembers to open.
Two modes make that true: open-on-start (for the dispatch ritual, which
launches the watcher the moment it dispatches a unit) and
open-on-activity (for a persistent watcher that sits quiet and pops the
browser only when the lane actually stirs). Same zero-token constraint
as CW1: no LLM, filesystem + local git only.

FILES TO TOUCH:
- scripts/cursor-watch.mjs   (extend CW1's script - no new files)
Do NOT modify anything outside these files.

CHANGE:
Add three flags to the existing CLI (keep every CW1 behavior and default
intact; no new dependencies, `node:` built-ins only):

- `--open` - after the HTTP server binds, launch the default browser at
  the dashboard URL once. A failed launch must not kill the server: log
  and continue.
- `--open-on-activity` - do NOT open at startup; open the browser the
  first time run activity is observed, at most ONCE PER RUN. Run
  boundary, derived from signals CW1 already tracks: the auto-open
  re-arms when `DELIVERY.md` disappears from the lane or the lane's
  branch changes (that is what the next dispatch's `checkout -B` does).
  Activity while DELIVERY READY does not re-fire. Both flags together:
  both behaviors apply.
- `--open-cmd <command>` - override for HOW the browser is launched: the
  command is executed with the dashboard URL appended as the final
  argument. Default when absent: the platform opener (on Windows,
  `start` via a shell; use the `node:child_process` idiom that does not
  block the server). This override exists so the behavior is
  machine-testable without a real browser.

Testing note (same rule as CW1): drive everything against a THROWAWAY
dir under `os.tmpdir()`; use `--open-cmd` pointed at a trivial marker
command (e.g. `cmd /c echo opened>>marker.txt` or a tiny node -e append)
so "the browser opened" becomes "the marker file gained a line".

ACCEPTANCE CRITERIA (machine-checkable):
- `--open` with an `--open-cmd` marker override: server starts, marker
  fires exactly once, dashboard still serves 200 at `/`. Evidence:
  marker content + response status.
- `--open-on-activity` with the marker override: no fire at startup;
  first file write into the watched tmpdir fires the marker within 5s;
  a second write does NOT fire it again. Evidence: marker line count
  after each step.
- Re-arm: create `DELIVERY.md` in the tmpdir, delete it, write another
  file -> marker fires a second time. Evidence: marker line count.
- Open failure is non-fatal: `--open --open-cmd <nonexistent-command>`
  logs an error and the server keeps serving 200 at `/`. Evidence:
  logged line + response status.
- All CW1 flags/behaviors unchanged: default run with neither new flag
  never invokes any opener. Evidence: marker absent/empty in a default
  run with the override set.
- `git diff --stat` shows only `scripts/cursor-watch.mjs`; every import
  still resolves to a `node:` built-in; `package.json` and lockfiles
  byte-identical.
- Tripwires: `npm run test:unit` green from `server/`; `npm run build`
  clean from `client/`.

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
