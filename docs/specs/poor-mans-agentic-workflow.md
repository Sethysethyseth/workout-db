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

## 5. Open questions before publishing

- Does Mode 2 actually pay for itself for a solo dev, or is Mode 1 the real
  product? (Measure during the pilot: units landed per week, bounce rate.)
- Minimum viable gate for a public template (this repo's gate has
  project-specific prod/migration items).
- Whether to include the Claude Code memory/HANDOFF interplay or keep the
  public version tool-agnostic (Cursor+Claude Code vs any planner+executor).
- Name check + license before creating the repo.

## 6. Log (append per session that changes the workflow)

- **2026-07-02:** Concept agreed (Seth + Claude Code). Pilot scaffolding
  created: `docs/tasks/` (README protocol, QUEUE.md index, _TEMPLATE.md with
  standing footer + MODEL/MODE headers), RUNBOOK "Parallel worktree ritual",
  this tracking doc. Decisions: two modes with Mode 1 first and graduation
  after ~3 clean units; file-dispatch is token-neutral (documented so nobody
  optimizes it); QUEUE.md single-writer = Claude Code; model tier declared
  per block. Public repo deferred until Seth says go.
