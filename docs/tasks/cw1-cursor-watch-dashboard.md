# TASK CW1: cursor-watch - live local dashboard for watching Channel B Cursor runs

STATUS: QUEUED
MODEL: auto
MODE: 1-relay

CONTEXT:
Relay v5 dispatches task blocks to the headless Cursor CLI running in the
lane worktree `C:\dev\worktrees\cursor-lane` (design:
`docs/specs/autonomous-cursor-dispatch.md`). Nothing currently visualizes
a run - Seth's only view is a background-task buffer he never sees. This
unit adds a ZERO-DEPENDENCY local dashboard he opens in a browser to
watch Cursor work in real time. It is dev tooling, not app code: it must
never enter the client build or the server runtime, and it must cost zero
tokens to run - no LLM anywhere in it; it only watches the filesystem and
local git. The two free signals it renders: (1) file changes in the lane
worktree the moment Cursor writes them, (2) the uncommitted git diff in
that worktree, which IS the delivery (Cursor never commits). `DELIVERY.md`
appearing in the lane is, by the relay contract, the moment Cursor stops.

FILES TO TOUCH:
- scripts/cursor-watch.mjs   (NEW - the entire tool in one file: watcher +
                              local HTTP server + embedded dashboard page)
Do NOT modify anything outside these files.

CHANGE:
Build `scripts/cursor-watch.mjs`, run as `node scripts/cursor-watch.mjs`.
Follow the existing `scripts/check-hex.mjs` / `scripts/backfill-exercise-ids.mjs`
style for a standalone `.mjs` script (shebang-free, top-level `main()`).

Hard constraints (the reviewer greps for these):
- Node BUILT-INS ONLY (`node:http`, `node:fs`, `node:path`,
  `node:child_process`, `node:os`, ...). No new packages;
  `package.json` and all lockfiles stay byte-identical.
- The server binds 127.0.0.1 ONLY (this is a local viewer, never exposed).
- The dashboard page is fully embedded in the script (template string or
  equivalent) and references NO external URL - no CDN, no web fonts, no
  fetch to anything but its own origin.

CLI contract:
- `node scripts/cursor-watch.mjs [--lane <dir>] [--port <n>] [--log <file>]`
- Defaults: lane `C:\dev\worktrees\cursor-lane`, port `4646`.
- Missing/nonexistent lane dir: print a clear error naming the resolved
  path, exit with code 1.
- On start, print the URL to open (e.g. `http://127.0.0.1:4646`).

Data collection (all local, all cheap):
- Recursive `fs.watch` on the lane dir, ignoring `.git`, `node_modules`,
  and editor-noise paths. Debounce bursts.
- Poll local git every ~3s via `child_process` with `cwd` = the lane:
  current branch (`rev-parse --abbrev-ref HEAD`), per-file numstat of the
  uncommitted diff, and `status --porcelain -uall` so brand-new untracked
  files are counted too (a Cursor delivery is often mostly new files).
- If `--log <file>` is given, or a `cursor-run.log` exists in the lane,
  tail it and stream appended lines (this is where a future dispatch-unit
  tee of the CLI's own output would land; the dashboard must work fine
  when no log exists).

Server contract:
- `GET /` -> 200, `text/html`, the dashboard page.
- `GET /events` -> `text/event-stream` (SSE). Push JSON events for: file
  activity (path + change kind), diff-stat snapshots, state transitions,
  log lines. The page renders purely from this stream plus one initial
  snapshot (initial state may be inlined in the page or fetched from a
  small JSON endpoint - implementer's choice).

State machine shown in the header, derived not guessed:
- WAITING - no activity observed yet.
- CURSOR IS WORKING - file/diff activity observed, no DELIVERY.md.
- DELIVERY READY - `DELIVERY.md` exists in the lane (awaiting audit);
  freeze the elapsed timer.
- Header also shows: the lane's current branch (`cursor/<unit>` names the
  unit), the lane path, and elapsed time since first observed activity.

The page (this is the product - it should look GOOD, not like a debug
page; dark mission-control/terminal aesthetic; you choose the exact
colors/type since app palette tokens do not apply to a standalone dev
page - keep it cohesive and legible, and make "CURSOR" unmistakably the
agent at work in the header):
- Live activity feed: recent file events, newest first, filenames
  prominent, each new arrival visibly (briefly) highlighted.
- Per-file diff-stat bars: additions/deletions per touched file, growing
  as the run progresses.
- A "now writing" pane: an excerpt of the most recently changed file's
  diff rendered with a typing/reveal effect - the watching-it-code
  moment. Continuous ambient motion is allowed here; state transitions
  elsewhere stay quick and restrained (~150-250ms ease-out).
- If a log is being tailed: a scrolling ticker of the CLI's output lines.
- DELIVERY READY flips the header treatment unmistakably (color + label).

Testing note: verify the live behaviors against a THROWAWAY directory
under `os.tmpdir()` that you create and write test files into - do not
create test dirs or fixture files inside the repo. Backgrounding the
server, curling it, and killing it is an acceptable evidence pattern.

ACCEPTANCE CRITERIA (machine-checkable):
- `node scripts/cursor-watch.mjs --lane <tmpdir> --port 4747` starts and
  prints the URL; `GET /` returns 200 with `text/html`; `GET /events`
  returns `text/event-stream`. Evidence: verbatim command output /
  response headers.
- Writing a new file into the watched tmpdir produces an SSE event within
  5 seconds. Evidence: the captured event line(s).
- Creating `DELIVERY.md` in the watched tmpdir produces a delivery-ready
  state event. Evidence: the captured event line(s).
- Pointing `--lane` at a nonexistent dir exits code 1 with an error
  naming the path. Evidence: verbatim output + exit code.
- Every `import` in the script resolves to a `node:` built-in (grep the
  file); `package.json` and lockfiles are untouched (`git diff --stat`
  shows only `scripts/cursor-watch.mjs`).
- The embedded page contains no external URL: grep the script for
  `https://` and `http://` - the only permitted hits are `127.0.0.1` /
  `localhost` self-references (e.g. the printed startup URL).
- Tripwires (nothing app-side should change): `npm run test:unit` green
  from `server/`; `npm run build` clean from `client/`.

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
