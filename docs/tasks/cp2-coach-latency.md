# TASK CP2: make the hosted coach fast - one agent run per question, quiet logs, measured

STATUS: QUEUED
MODEL: auto
MODE: 1-relay

CONTEXT:
The hosted coach and palette studio run on a Cursor API key through
`server/src/coach/cursorProvider.js` (CP1, `8ab7dcf`). It works on prod but
Seth reports it is SLOW (Sept 27). Three causes are known, and this unit
fixes the two that live in code and adds the measurement that proves it:

1. **Two agent runs per question.** `streamCursor` (`cursorProvider.js:343`)
   always tries a run WITH `systemPrompt` first. This Cursor account is
   gated for `systemPrompt`, so every request pays a full `Agent.create` +
   `send` + failing `wait()` (the gate error surfaces at `:314-323`) before
   the inline retry (`:382-394`) does the real work. Nothing remembers the
   gate between requests.
2. **Six "Ripgrep path not configured" stack traces per request** in the
   Render logs. Verified Sept 27 against the installed `@cursor/sdk@1.0.32`:
   at `Agent.create` the SDK looks for ripgrep in `CURSOR_RIPGREP_PATH` (used
   only when ABSOLUTE), then an internal lookup, then `PATH`; when all three
   miss, later code throws `Ripgrep path not configured. Call
   configureRipgrepPath() at startup.` `configureRipgrepPath` is NOT a
   top-level export of the package (`Object.keys(require('@cursor/sdk'))` has
   no ripgrep/sandbox keys). The platform package the SDK already installs,
   `@cursor/sdk-<platform>-<arch>`, SHIPS the binary: `bin/rg.exe` in
   `@cursor/sdk-win32-x64` here, and the lockfile carries
   `@cursor/sdk-linux-x64` for Render. Why the SDK's own lookup misses it on
   Render is NOT known yet.
3. A fresh local agent + scratch dir per attempt. Cause 1's fix halves this;
   the rest is deliberate (see the isolation invariant in CHANGE A).

Design of record: `docs/specs/ai-layer.md` section 5 (Lane B). The BYO path
(Anthropic keys, `provider.js`) is not involved and must not change.

FILES TO TOUCH:
- `server/src/coach/cursorProvider.js`      (the gate memo, the ripgrep hook,
                                             the timing log line)
- `server/test/lib/cursorProvider.test.js`  (new fake-SDK tests)
- `scripts/smoke-cursor-coach.mjs`          (timing + agent-run count, two
                                             coach runs in one process)
Do NOT modify anything outside these files. In particular: NOT
`provider.js`, `askCoach.js`, `prompt.js`, `mockProvider.js`,
`coachController.js`, anything under `server/src/ai/` or `client/`, and NOT
`server/package.json` / `package-lock.json`.

CHANGE:

**Order matters - do the measurement FIRST.** Extend the smoke script
(CHANGE D) and run it against the UNMODIFIED provider to get the BEFORE
numbers. Only then change `cursorProvider.js` and run it again for AFTER.

**A. Remember the systemPrompt gate per process.** Once any request in this
process has seen the account-gated systemPrompt error (either shape:
thrown from `send()` or reported by `wait()` - `isSystemPromptGateError`
already recognizes both), every LATER request skips the systemPrompt attempt
and goes straight to the inline path: ONE agent run, system text inlined at
the top of the message exactly as the retry does today, `systemPromptMode:
"inline"`. Rules:
- ONLY the gate error sets the memo. A rate limit, an auth error, a network
  error, a non-gate `wait()` error, or an abort must NOT set it.
- A request that finds the systemPrompt ACCEPTED leaves the memo unset
  (still one run; nothing to remember).
- The memo lives for the process. A deploy restarts the process, so if
  Cursor ever ungates the account, the next deploy re-probes. No TTL.
- Concurrent first requests may each pay the probe; that is acceptable - do
  not add locking.
- Tests must be able to reset it (an exported reset seam, or state keyed so
  that each fake SDK starts clean - your choice; say which in DELIVERY.md).
- **Isolation invariant - do not "optimize" this away:** every request still
  gets its OWN `Agent.create`, its OWN fresh scratch dir from `makeScratch`,
  and its agent is disposed at the end of that request. Never cache, pool,
  or reuse an agent or a scratch dir across requests - a reused agent would
  carry one user's conversation into another user's answer. The memo stores
  a boolean fact about the ACCOUNT, nothing else.

**B. Ripgrep: satisfy the SDK's lookup from the binary it already ships.**
First, find in the installed SDK source (`server/node_modules/@cursor/sdk/
dist/`) why its internal lookup misses, and record the answer in
DELIVERY.md with the file and the relevant code. Then: lazily (inside the
call path, never at module load) and at most once per process, if
`process.env.CURSOR_RIPGREP_PATH` is unset, resolve the `rg` binary from the
installed `@cursor/sdk-<process.platform>-<process.arch>` package (`bin/rg`,
`bin/rg.exe` on win32) and hand its ABSOLUTE path to the SDK through the
`CURSOR_RIPGREP_PATH` hook before `Agent.create`. If the package or binary
is not there, do nothing - never throw, never block a request. An operator
who already set `CURSOR_RIPGREP_PATH` wins; never overwrite it. `tools: []`
and the empty scratch cwd stay, so a found `rg` grants the agent nothing.
**Escape hatch:** if the only working fix needs a NEW package, a download,
or a Render setting, do NOT do it - leave the hook out, record the finding
and the exact setting Seth would need in DELIVERY.md, and say so. That is a
reported outcome, not a failed unit; A, C, D still ship.

**C. One timing log line per request.** Each `streamCursor` call (which
also covers `completeCursor`, i.e. the palette path) emits exactly ONE
`console.info` line when it ends, starting with `[coach] cursor`, carrying at
least: the mode that produced the answer (`accepted` / `inline`), how many
agent runs this request made, milliseconds to the first text item (or none),
total milliseconds, and the outcome (stop reason, `error`, or `aborted`).
It must NEVER contain the API key, the system text, or any message content -
that is user data going to Render logs. This line is how prod gets measured
after the merge, so keep it greppable (`key=value` pairs are fine). Follow
the `[coach]` prefix style of `coachController.js:181`.

**D. `scripts/smoke-cursor-coach.mjs` measures.** Keep everything it does
today and its `--help` contract (exits 0, no network). Add:
- Run the coach stream TWICE in the same process (same inputs), then the
  existing palette completion - so the memo's effect is visible.
- For each run print one line: `RUN <n> systemPrompt=<mode>
  agentRuns=<k> ttft_ms=<ms> total_ms=<ms>` (palette run labeled as such).
  Count agent runs by passing the provider's existing `sdk` injection
  parameter a thin wrapper around the REAL SDK (loaded from
  `server/node_modules` the same way the provider resolves it) that counts
  `Agent.create` calls and delegates everything else unchanged. Create the
  wrapper once for the whole script.
- The existing `VERDICT` / `PALETTE` lines stay.

ACCEPTANCE CRITERIA (machine-checkable):
- `npm run test:unit` green from `server/` - paste verbatim counts. Baseline
  is 30 suites / 324 tests; yours must be more tests, same or more suites.
  No existing test's ASSERTIONS changed (adding a reset call in a
  `beforeEach` is allowed); paste `git diff` of the test file's pre-existing
  region to prove it.
- New fake-SDK tests prove, at minimum:
  - Gated SDK, two `streamCursor` calls in a row, both with system text:
    call 1 makes 2 `Agent.create` calls (first with `systemPrompt`, second
    without); call 2 makes exactly 1 more (3 total), without
    `systemPrompt`, its `send` message contains both the system text and
    the question, it yields `systemPromptMode: "inline"`, and no `error`
    item. Prove it for BOTH gate shapes (`send()` throw and `wait()` error).
  - A `RateLimitError` on call 1 does NOT set the memo: call 2's first
    `Agent.create` still carries `systemPrompt`. Same for an aborted call 1.
  - Ungated SDK: two calls -> 2 `Agent.create` total, both with
    `systemPrompt`, mode `accepted`.
  - Across two calls, the two agents are distinct objects, both disposed,
    and their `local.cwd` values differ (the isolation invariant).
  - The log line: with `apiKey: "key_abc"`, system text "You are the
    coach." and question "How is volume?", exactly one `[coach] cursor`
    `console.info` line per call, containing the agent-run count and none
    of `key_abc`, `You are the coach.`, `How is volume?`.
  - Ripgrep hook (if implemented): binary present -> absolute path set;
    binary absent -> nothing set, no throw; `CURSOR_RIPGREP_PATH` already
    set -> untouched. Use injected paths or a temp fixture - do not depend
    on the real platform package in the unit lane.
- Lazy loading still holds: from `server/`, `node -e
  "require('./src/app'); console.log(Object.keys(require.cache).some(k =>
  k.includes('@cursor')))"` prints `false` (paste it), and `grep -rn
  "@cursor/sdk" server/src` shows requires/resolves only inside function
  bodies (paste it).
- Scope: `git status --untracked-files=all` and `git diff --stat` show only
  the three FILES TO TOUCH changed (paste both). `provider.js`,
  `askCoach.js`, `coachController.js`, `package.json` untouched.
- **LIVE smoke, mandatory - the fake SDK encoded a wrong belief once already
  (CP1).** `node --check scripts/smoke-cursor-coach.mjs` exits 0; `--help`
  exits 0. Then run it for real with the `CURSOR_API_KEY` already in this
  environment, capturing stdout AND stderr together, TWICE:
  - BEFORE: extended script, UNMODIFIED `cursorProvider.js`.
  - AFTER: extended script, your `cursorProvider.js`.
  Paste both outputs verbatim, plus for each the count of lines containing
  `Ripgrep path not configured`. Expected AFTER shape on this gated
  account: RUN 1 `agentRuns=2`, RUN 2 `agentRuns=1`, palette `agentRuns=1`,
  `PALETTE validatePalette=pass`. Put a small BEFORE/AFTER table of
  ttft_ms / total_ms / agentRuns in DELIVERY.md. If the BEFORE ripgrep count
  is already 0 on this machine (the Windows lookup may succeed where
  Render's fails), say so plainly - the ripgrep fix is then proven by the
  unit tests here and by the reviewer's staging log check, not by this run.
  If a live run fails, do not paper over it: paste the error and stop.
- `npm run build` from `client/` still clean (untouched, but prove it).

NOT IN SCOPE (known, deliberately left): the persona riding inside the user
message on the inline path (weaker separation; no tools, so blast radius is
text only); agent pooling or warm agents (rejected - isolation invariant);
Render instance type / cold starts (Seth checks the dashboard).

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
