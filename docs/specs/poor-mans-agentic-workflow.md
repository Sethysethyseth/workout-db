# The Poor Man's Agentic Workflow - tracking doc

**Purpose:** working notes toward a future public GitHub repo (working title:
`the-poor-mans-agentic-workflow`) showing how to run a real two-agent coding
workflow for ~$40/month (Claude Pro + Cursor Pro) instead of ~$200/month
(Claude Max). NOT to be published yet - Seth decides when. Every session that
changes the workflow should append to the log at the bottom, so the public
repo can be extracted from this file + the artifacts it points to.

---

## 1. The pitch (future repo README seed)

Agentic coding is usually sold as "one expensive agent does everything."
The $200/mo tier buys you enough tokens to let a frontier model plan, code,
review, and manage state in one seat. The poor man's version splits the work
across two cheap seats by *what the work actually costs*:

- **Planner/reviewer seat (Claude Pro, $20):** Claude Code does the judgment
  work - architecture, task authoring, diff review, root-cause debugging,
  git/state ownership. Sessions are short and high-leverage; the seat's
  usage limits are respected by design, not willpower.
- **Executor seat (Cursor Pro, $20):** Cursor's agent does the token-heavy
  codegen - whole roadmap units, multi-file implementation, test runs. It
  writes code and STOPS: never commits, never touches state files.
- **The human is the message bus.** There is no API between the two agents,
  and that's fine: tasks are dispatched as *files in the repo*, so the
  human's whole job is one pointer line per unit ("read docs/tasks/X.md and
  execute it") plus telling the reviewer when the executor stopped.

The safety net that makes big executor diffs cheap to accept is the
**review gate**: the planner seat reads the working tree against the spec
before anything is committed. In this project that lane caught a shipped
contract bug on day one. Skipping review to save tokens costs more tokens
(re-fix sessions) than it saves.

## 2. Cost model

- Claude Pro $20 + Cursor Pro $20 = **$40/mo**, vs Claude Max $100-200/mo.
- Token levers, in order of impact:
  1. **Unit-scale task blocks** - the executor's fixed overhead (loading
     AGENTS.md, exploring the repo) is paid once per session; one big
     coherent block beats ten small prompts for the same work.
  2. **Model tier per unit** - each block declares `MODEL: fable` (hard
     units) or `MODEL: auto` (mechanical ones); the human picks at a glance.
  3. **Short planner sessions** - author blocks, review, commit, drop out.
     A resident planner re-reading context is the waste on that side.
  4. **The review gate itself** - rework is the most expensive token sink.
- Non-lever: file-read vs chat-paste dispatch is token-neutral (the prompt
  enters context either way; a file read adds a few hundred tokens of tool
  chatter on tasks that consume tens of thousands). Measured intuition, not
  worth optimizing.

## 3. The mechanism (what exists in THIS repo)

| Piece | Artifact here | Genericize for public repo as |
| --- | --- | --- |
| Shared agent contract | `AGENTS.md` (single source, CLAUDE.md imports it) | template AGENTS.md |
| Work-state channel | `docs/HANDOFF.md`, single writer | template HANDOFF.md + single-writer rule |
| Task block format | `cursor-task-block-template.md` + `docs/tasks/_TEMPLATE.md` | the template, both scales |
| File-dispatch queue | `docs/tasks/` (README = protocol, QUEUE.md = index) | the whole directory |
| Command gate | AGENTS.md "Command-running gate" | template gate (merge/prod/migrations/destructive/deps) |
| Review ritual | CLAUDE.md workflow v2 + RUNBOOK pre-merge checklist | reviewer checklist |
| Parallel isolation | RUNBOOK "Parallel worktree ritual" | the ritual, verbatim |
| Verify-before-trust | AGENTS.md section | as-is |

Two operating modes (detail in `docs/tasks/README.md`): Mode 1 serialized
file relay (zero new risk), Mode 2 parallel via git worktrees with
file-disjoint blocks (planner reviews unit N while executor builds N+1).

## 4. Hard-won rules the public repo must carry (from this project's scars)

- **Two agents, one working tree race** (July 1, 2026): concurrent edits got
  swept into the wrong commit and state files were clobbered mid-write.
  Hence: single committer, single state-writer, worktrees for parallelism,
  `git status --untracked-files=all` before every commit.
- **The executor lies about done** - "tests green" must be re-run by the
  reviewer; commits must be SHA-verified; deploys verified against origin
  HEAD.
- **Executor never commits** even though it can - two writers on one tree is
  the root cause of the worst class of accidents.
- **Blocks must be self-contained** - the executor gets zero chat context
  beyond the dispatch line; a block needing an unmade decision is DRAFT.
- **Stop conditions are load-bearing** - agents sprawl when not told to stop;
  the standing footer (no git, no state files, no deps, end your turn) is
  the single most important part of the template.
- Cloud-synced repo folders (OneDrive/Dropbox) cause file-lock hangs and
  stale reads - keep worktrees (ideally the repo) outside sync.

## 5. Honest positioning - pros, cons, comparability (REQUIRED content)

**Status of this section:** the final marketing angle is Seth's call and may
differ from this framing - but whatever the angle, the published repo MUST
carry the full pros/cons and the comparability claim below, stated plainly.
Users adopting this setup should know exactly what they're trading. Treat
this as required README content, not optional framing.

**The comparability claim, in one line:** equal output *quality*, meaningfully
lower cost, paid for in wall-clock time, human attention, and rationing
discipline. It is not "Max for $40" - it is "Max-quality *results* for $40,
if your work decomposes well and you're willing to be the router."

### Where it genuinely wins

- **Quality per dollar.** Same frontier models write and review the code;
  the review gate catches defects before they compound (receipts in this
  repo: a shipped-contract bug caught on day one; a null cop-out in a
  delivered unit caught and fixed in review). On output quality the $40
  setup matches Max; on quality per dollar it beats it.
- **The economics are structurally right,** not a coupon: planning/review/
  debugging are high-judgment low-token, codegen is low-judgment high-token.
  Paying frontier prices for judgment and commodity prices for typing is
  matching cost to value.
- **The review gate doubles as a quality mechanism** a solo Max agent
  doesn't get for free: a second context reads the tree against the spec
  before anything is committed.

### Where Max wins (do not soften these)

1. **Throughput and your time.** Max buys autonomy - one agent grinds a unit
   end-to-end unattended. Here the human is the message bus: every unit
   costs a dispatch, a "it stopped," and a "review it," and Mode 1 is
   strictly serialized. Part of the $160/mo saved is paid back in attention.
   Right trade for time-rich/cash-poor; inverts for anyone billing hourly.
2. **Pro-tier limits are real friction, not theoretical.** Documented scar:
   July 2, 2026 session - Claude Code built two units directly because the
   Pro seat's tokens were expiring mid-plan. Long debugging sessions and big
   review diffs hit the 5-hour-window caps. Max's real product is never
   thinking about the meter.
3. **The $40 can creep.** Frontier-model usage in Cursor burns the included
   allowance fast; heavy months throttle or spill into overage. The
   template's MODEL: header is the mitigation - the price only holds if
   mechanical work actually routes to cheap models. Say this or the first
   issue filed is "this cost me $55."
4. **Context loss at every seam.** A solo agent carries full context across
   plan -> code -> debug. The relay forces self-contained task blocks (an
   authoring tax on the planner seat) and the executor starts cold every
   session. Mitigated by the template + AGENTS.md, never eliminated.
5. **Worst at exploratory work.** Well-decomposed roadmap units are the
   ideal case (this repo's B1-B7). Ambiguous "figure out why prod is slow"
   work doesn't decompose into blocks - it lands on the planner seat and
   eats its limits.

### Who should NOT use this

Anyone whose time is worth more than the savings, anyone whose work is
mostly exploratory debugging, anyone unwilling to run the review ritual
(skipping review quietly converts this into "cheap unreviewed codegen,"
which is worse than either alternative).

## 6. Open questions before publishing

- Does Mode 2 actually pay for itself for a solo dev, or is Mode 1 the real
  product? (Measure during the pilot: units landed per week, bounce rate.)
- Minimum viable gate for a public template (this repo's gate has
  project-specific prod/migration items).
- Whether to include the Claude Code memory/HANDOFF interplay or keep the
  public version tool-agnostic (Cursor+Claude Code vs any planner+executor).
- Name check + license before creating the repo.

## 7. Log (append per session that changes the workflow)

- **2026-07-02:** Concept agreed (Seth + Claude Code). Pilot scaffolding
  created: `docs/tasks/` (README protocol, QUEUE.md index, _TEMPLATE.md with
  standing footer + MODEL/MODE headers), RUNBOOK "Parallel worktree ritual",
  this tracking doc. Decisions: two modes with Mode 1 first and graduation
  after ~3 clean units; file-dispatch is token-neutral (documented so nobody
  optimizes it); QUEUE.md single-writer = Claude Code; model tier declared
  per block. Public repo deferred until Seth says go.
- **2026-07-02 (later):** Honest-positioning section added (section 5) at
  Seth's direction: final shipping angle is his call, but full pros/cons and
  the comparability claim ("Max-quality results, not Max; paid in time,
  attention, rationing") are REQUIRED published content regardless of angle.
  Includes the "who should NOT use this" list and the Pro-limit scar as a
  documented receipt.
- **2026-07-03:** Smoke-testing lane changed (Seth): visual verification now
  happens on the STAGING-BRANCH CLOUD DEPLOYMENT (Vercel preview of
  `analytics-engine`), never a local dev server. Reason: local dev had a
  footgun (client env silently pointing at the prod API) and the deployed
  build is the real artifact anyway. Relay-order consequence: the reviewer
  seat commits + pushes a unit to staging as soon as spec review passes, so
  a deployment exists for the human to smoke; visual sign-off moves AFTER
  the commit (it gates dispatching the NEXT unit and the eventual main
  merge, not the staging commit). Generalizes for the public repo as:
  "review gates the commit; human visual sign-off gates the next unit and
  the release, and it happens on a deployed build, not a dev server."
- **2026-07-02 (later still):** Shell repo created at
  `github.com/Sethysethyseth/the-poor-mans-agentic-workflow` (PRIVATE - still
  not published; visibility flip stays Seth's call). Contents: `BRIEF.md`
  (build instructions for a browser/cloud agent: batch the open questions to
  Seth first - name, license, tool-agnostic vs named-tools, receipts
  anonymity, tone - then build in reviewable PRs) + `source-material/`
  (scrubbed verbatim copies of this doc, AGENTS.md, CLAUDE.md, the task
  templates, queue protocol, RUNBOOK excerpts - carried in-repo because the
  browser agent can't see workout-db). Infra identifiers scrubbed to
  placeholders at copy time. Buildout is delegated to a Claude Code web
  session (claude.ai/code) pointed at BRIEF.md; local clone lives at
  `C:\dev\the-poor-mans-agentic-workflow` (outside OneDrive, per our own
  rule). source-material/ gets deleted on the pre-publish checklist.
