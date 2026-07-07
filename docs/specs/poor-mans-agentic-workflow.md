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

## 6. The steering layer (keeps the HUMAN on task, stops AGENT loops)

Named as a first-class layer 2026-07-07 (it existed implicitly in the
artifacts from day one; naming it makes it publishable). The state files
are not bookkeeping - they are a steering mechanism pointed at BOTH
failure modes of a human-routed relay: **human drift** (off-queue
detours, skipped gates, forgotten TODOs, abandoned waves) and **agent
loops** (retry thrash, polish spirals, guess-fix-guess cycles, repeated
failures driven by a wrong belief).

**The design goal, stated honestly: EROSION-RESISTANT, not foolproof.**
A human with git access can override any speed bump (documented receipt:
the mandated pre-main review was explicitly skipped once, July 4, at the
owner's instruction). What the layer guarantees is NO SILENT DRIFT:
every deviation requires an explicit, recorded step around a named rule,
so drift is visible, priced, and correctable - never ambient. Do not
publish a stronger claim; an adopter would falsify "foolproof" in a week.

### Human-steering mechanisms (all live in this repo, receipts in the archive)

1. **Single next action.** HANDOFF's "Next up" names ONE next task.
   Session-start ritual: the agent reads HANDOFF and STATES the next
   action before doing anything else. The human never opens a session
   wondering where they were.
2. **Off-queue work is labeled, never refused.** When the human asks for
   something not in the queue, the agent does it AND records it as
   off-queue in QUEUE/HANDOFF/commit messages (receipt: the July 6
   login-UX fixes carry the label everywhere). Drift is allowed but
   priced and visible - which is what keeps it occasional.
3. **Open TODOs are numbered and re-surfaced** at every session start
   until closed or explicitly demoted (receipt: the decimal-reps bug
   survived as TODO #0 across four days of sessions until verified
   fixed; it never quietly vanished).
4. **Gates require trigger phrases.** "push to main" verbatim - the
   agent never treats enthusiasm, implication, or "looks good" as
   authorization for a gated op.
5. **Session-close ritual.** HANDOFF rewritten, "nothing in flight"
   stated or in-flight work named, next action pinned - the next
   session (any agent, any tier) starts on rails.
6. **Post-push smoke checklist.** After every staging push the agent
   hands the human a short concrete checklist - human verification
   becomes a bounded task instead of a vibe, so it actually happens.

### Anti-loop mechanisms (agent side)

1. **Machine-checkable acceptance criteria are a terminating
   condition.** "Done" is a checklist, not a feeling - kills polish
   spirals.
2. **The standing footer's anti-loop line:** "if a criterion can't be
   met, STOP and explain why instead of guessing." Retrying without new
   information is forbidden by construction.
3. **Diagnosis-before-fix** kills guess-fix-guess: no code until a root
   cause exists with file:line, mechanism, and why it explains the
   exact symptom.
4. **Escalation instead of retry.** Ambiguity bounces UP a tier on the
   standing triggers; it never spins in place (receipt: the A6
   resolution gap - the resident seat paused dispatch and escalated
   rather than patching blindly).
5. **Ground-truth verification breaks belief loops.** When reality
   contradicts a state file, query the system of record and CORRECT the
   file (receipt: July 7 - a wrong HANDOFF claim about staging's
   migration history caused exactly one failed deploy; the rule caught
   it before it became a loop, and the correction is recorded in place).
6. **Bounce, don't thrash.** A failed review updates the BLOCK with
   what to fix and re-queues it; the executor never iterates blind
   against a silent reviewer.

Generalizes for the public repo as: "the state files are the steering
wheel - one next action for the human, one terminating condition for
the agent, and no silent step around either."

## 7. Setup interview (the adopter's setup phase - REQUIRED template)

The public repo must ship a setup interview: before any templates are
copied, the adopter points their planner-seat agent at the repo and the
agent asks these questions IN ONE BATCH (batching is itself a learned
rule - drip-fed questions stall setups), then GENERATES the target
repo's AGENTS.md, command gate, HANDOFF skeleton, and steering rules
from the answers. A question the adopter can't answer means the
corresponding mechanism ships in its strict default form (gate
everything, serialize everything).

1. **Irreversibles:** what actions in your project are irreversible or
   expensive (prod deploys, DB migrations, emails/payments/webhooks,
   force-push)? -> becomes the command gate.
2. **Verification lanes:** what can be re-run fresh in under ~2 minutes
   to verify work (unit tests, build, lint)? If nothing exists,
   building a cheap lane is unit #1 - the review gate cannot function
   without it.
3. **Decomposability check:** describe your next 3 units of work as
   file-scoped contracts with observable done-conditions. If you can't,
   this workflow is the wrong tool (see "who should NOT use this") -
   better to learn that in setup than three units in.
4. **Seats + budget:** which tool/model per seat, and what routes to
   cheap models (the MODEL header is where the price holds or creeps).
5. **Human cadence:** how many dispatch/review round-trips per week can
   you actually sustain? Mode 1 costs ~3 human touches per unit; if the
   honest answer is "two per week," size units accordingly.
6. **Repo location:** is the repo inside a cloud-synced folder
   (OneDrive/Dropbox/Drive)? Move it or exclude it BEFORE the first
   worktree (documented scar).
7. **Trigger phrase:** pick the verbatim phrase for your release gate
   now and write it into the gate.
8. **Your drift profile:** which failure is most you - scope creep,
   skipping review when confident, or abandoning waves midway? The
   agent writes the MATCHING speed bump into the generated AGENTS.md
   (e.g. "if the human asks to skip the review gate, restate the rule
   and require explicit confirmation once - then comply and RECORD the
   skip").
9. **State channel:** where HANDOFF/QUEUE live and who the single
   writer is - confirmed, not assumed.
10. **Escalation triggers:** define "stuck" for YOUR project (schema,
    security, prod, spec-conflict equivalents) so ambiguity has a
    destination other than retry.

Answers are written INTO the generated files, not kept in chat. The
interview is also where erosion-resistance gets personalized: the speed
bumps that survive are the ones matched to the adopter's actual drift
profile, not a generic lecture.

## 8. Receipts - measured pilot results (July 2-7, 2026; append per wave)

The proof the workflow works, extracted from QUEUE.md + the HANDOFF
archive. Published numbers must trace to those files (both carried in
the shell repo's source-material); append a line per wave so the
receipts stay current.

- **~24 units landed in 6 days** (B8/B9, U6-U10, N1-N3, T3/T3B, L1-L6,
  A1/A4/A6 + off-queue fixes) on one $20 planner seat + one $20
  executor seat.
- **Zero formal bounces** - no unit failed review outright and returned
  to the queue. (Read honestly: blocks were well-specified; v4's
  contract-first change deliberately trades a slightly higher expected
  bounce rate for cheaper authoring.)
- **2 would-have-broken-prod defects caught by the review gate** before
  any deploy: L1's and L3's code-ahead-of-DB sequencing flags
  (deploying the code before its migration would have broken all set
  logging app-wide).
- **Day-one shipped-contract bug caught by the review lane** (the
  original receipt that set the gate's value).
- **6 reviewer fixes in the one session that violated serialization**
  (U8-U10 ran as three units in one tree) - the messiest session on
  record is the one that broke the protocol, which is the protocol
  arguing for itself.
- **1 escalation up-tier** (A6 resolution gap): resident seat paused
  dispatch, escalated on a standing trigger, got a design session -
  resolution by escalation, not thrash.
- **~5 of ~24 units were planner-direct implementations** (escalation
  outcomes, stated direct-fix exceptions, one token-expiry scramble) -
  the measured leak rate of the seat split. Published, not hidden: the
  split holds ~80% of the time and leaks under pressure at exactly the
  seams it names.
- **1 process-erosion event, recorded at the time:** the mandated
  pre-main review skipped once (July 4, owner's instruction, noted in
  HANDOFF so it was never silently treated as having happened).
- **1 wrong-belief correction:** a false state-file claim about
  staging's migration history caused exactly one failed deploy before
  ground-truth verification caught and corrected it (July 7).
- **~half of all commits are docs/state upkeep** - the bookkeeping tax,
  priced down in v4 by the capped state file + mid-tier resident
  driver.

## 9. Open questions before publishing

- Does Mode 2 actually pay for itself for a solo dev, or is Mode 1 the real
  product? (Measure during the pilot: units landed per week, bounce rate.)
- Minimum viable gate for a public template (this repo's gate has
  project-specific prod/migration items).
- Whether to include the Claude Code memory/HANDOFF interplay or keep the
  public version tool-agnostic (Cursor+Claude Code vs any planner+executor).
- Name check + license before creating the repo.

## 10. Log (append per session that changes the workflow)

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
- **2026-07-03 (later):** Relay v3 - planner seat split by model tier
  (Seth). The planner seat's work turned out to be TWO cost profiles, not
  one: judgment (block authoring, architecture, pre-release review) and
  bookkeeping (per-unit sanity pass, commits, state upkeep, dispatch).
  v3 routes them separately: the frontier model (Fable/Opus) authors task
  blocks in short wave-sessions and does ONE thorough review of the
  accumulated branch diff before release; a mid-tier model (Sonnet) becomes
  the RESIDENT driver - per-unit tripwire review (re-run tests/build, scope
  + acceptance checks), commit/push/state, dispatch - and escalates on
  defined triggers (schema, security, prod, unresolved spec conflicts)
  instead of guessing. Executor seat also defaults down-tier. Accepted
  trade-off, stated in CLAUDE.md so it isn't silently reverted: deep review
  moves from per-unit to the release gate, so a contract bug can live on
  staging one gate longer. Generalizes for the public repo as: "the planner
  seat is really two roles - rent frontier intelligence by the session for
  authoring + release review, keep a cheap resident for the loop." This is
  the same cost-to-value matching as the original split, applied one level
  deeper.
- **2026-07-06:** Relay v4 - executor rebalance + two-tier state channel
  (Seth: "claude is doing a lot more"; diagnosis confirmed it - the planner
  seat was leaking effort through four holes, none of them the review gate
  itself). The four fixes: (1) **state channel split into two tiers** - the
  work-state file is CAPPED (~300 lines, every agent reads it every
  session) and aged session logs move VERBATIM to an append-only archive
  file only the frontier model reads (pre-release review, big-picture
  planning). The uncapped state file had grown to ~42k tokens and was a
  per-session tax on every seat. (2) **Executor self-verifies:** every
  block's standing footer now requires a DELIVERY.md report (gitignored;
  files touched, verbatim lane output, per-criterion evidence, deviations)
  before stopping. The resident reviewer AUDITS the report against the
  tree and re-runs only the cheap lanes fresh (never trusts it for green
  tests - the "executor lies about done" scar stands) instead of
  re-deriving the whole delivery. (3) **Bugs get an executor diagnosis
  block first** (root cause + evidence + proposed fix, no code); the
  reviewer verifies reasoning instead of deriving it. The previously
  unstated direct-fix precedent is now a stated exception: when diagnosis
  was ~95% of the work and the fix is trivial, the diagnosing agent ships
  it - everything implementation-heavy goes to the executor, however
  small (unstated precedents expand; stated ones hold their shape).
  (4) **Blocks go contract-first** (files, patterns by name,
  machine-checkable criteria - not line-level implementation), except
  judgment-heavy visual units where the design IS the spec; plus
  file-disjoint blocks may batch two executor runs per review session
  (one commit per unit). Accepted trade-off, stated in CLAUDE.md:
  contract-first blocks raise the bounce rate slightly - that is the price
  of moving implementation thinking off the frontier seat. Generalizes for
  the public repo as: "the executor should hand the reviewer a claim to
  audit, not a tree to reconstruct; state files every agent reads must be
  capped, with history in a tier only the expensive seat reads."
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
- **2026-07-07:** Steering layer named + receipts captured (Seth's
  direction: the agents should keep the HUMAN on task the same way they
  keep each other honest, the anti-loop mechanics should be explicit
  published content, and the pilot's progress must ship as proof).
  Three additions, all REQUIRED public content: section 6 (steering
  layer - human-steering + anti-loop mechanisms, framed
  "erosion-resistant, not foolproof; the guarantee is NO SILENT DRIFT" -
  do not publish a stronger claim), section 7 (setup interview - the
  adopter's batched setup-phase questionnaire; answers GENERATE the
  target repo's gate/AGENTS/HANDOFF, including a speed bump matched to
  the adopter's own drift profile; unanswerable questions get strict
  defaults), section 8 (receipts - measured July 2-7 pilot numbers
  including the honest ones: zero bounces, 2 prod-breaking defects
  caught pre-deploy, ~20% planner-direct leak rate, 1 recorded review
  skip; append per wave). Old sections 6/7 renumbered to 9/10. Shell
  repo refreshed the same session: source-material re-scrubbed to the
  current v4 files, BRIEF updated to the v4 three-role story + the new
  required content.
