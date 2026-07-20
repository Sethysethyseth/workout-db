# CLAUDE.md  (LogChamp - Claude Code specifics)

> All shared agent context - project, stack, conventions, UI architecture,
> the command-running gate, verify-before-trust, durable gotchas - lives in
> AGENTS.md (single source, imported below). This file holds ONLY what is
> specific to Claude/Claude Code. Don't duplicate AGENTS.md content here.
> Current work-state: `docs/HANDOFF.md`. Full stable context (product vision,
> schema rationale, incident history): `WORKOUTDB_MASTER_PROMPT_17.md` - pull
> that in for planning/architecture work, not every turn.

@AGENTS.md

---

## Model selection / division of labor (v5 - Sonnet resident, Opus on the frontier seat, Cursor rebalanced, dispatch autonomous)

> **Seat naming (July 18, 2026): Fable has DEPARTED.** Opus holds the
> frontier seat - skeletons, block authoring, escalations, and the
> pre-main gate. "Frontier seat" below always means Opus. Historical
> records (HANDOFF-ARCHIVE session logs, QUEUE per-unit notes, dated
> spec amendments, landed task blocks' MODEL headers) still name Fable
> as the actor and are CORRECT as history - never rewrite them. Only
> live instructions were swept.

Decided July 3, 2026 (v3, token-efficiency rebalance); amended July 6, 2026
(v4: Cursor rebalance + two-tier state channel); amended July 14, 2026
(v5: autonomous Cursor dispatch - Claude Code dispatches task blocks to
Cursor itself via the **`dispatch-unit` skill** instead of Seth relaying
them; adopted after the pricing probe validated the cost model and NT3
landed clean as the first autonomous unit. Design + channel/ladder
details: `docs/specs/autonomous-cursor-dispatch.md`); amended July 18,
2026 (v5.2: FAN-OUT - multiple parallel Cursor agents, one per
worktree; report lanes now aid the frontier seats' authoring recon and
gate fuel; spec section "Fan-out (relay v5.2)"); amended July 20, 2026
(v5.3: the gate gets a ritual - the **`pre-main-review` skill** - and
wave end becomes an ordered HARD STOP: N/N -> Seth smokes -> gate ->
merge trigger; plus the live wave task list and the Fable->Opus seat
sweep). Three roles:

- **Sonnet in Claude Code = the resident driver.** Runs the day-to-day
  relay: per-unit AUDIT of each Cursor delivery, then commit / push /
  state upkeep. The exact ritual is the **`land-unit` skill** - invoke
  it at review time rather than reciting from memory. Sonnet does NOT
  author task blocks and does NOT settle contract ambiguity - it bounces
  up instead of guessing (escalation triggers below).
- **Opus in Claude Code = the frontier seat: architect + final gate.** Short, rare,
  high-leverage sessions: (a) authors the unit-scale task blocks
  CONTRACT-FIRST - the ritual is the **`author-task-block` skill** -
  plus architecture and planning with the repo in hand; (b) ONE thorough
  review of the
  accumulated branch diff before any merge to main - nothing ships to main
  without a frontier-seat pass (ritual: the **`pre-main-review` skill**);
  it greps `HANDOFF-ARCHIVE.md` for the wave's
  full session history (accepted deviations, sequencing flags, reviewer
  fixes) as review fuel. In BOTH rituals the frontier seat fans grunt
  search out to CURSOR agents - report lanes on the cheap rung, per the
  spec's fan-out section - explicitly NOT Claude subagents via the
  Agent tool, even when a built-in ritual (e.g. `/code-review`) says
  "spawn agents" (authoring recon per `author-task-block`; gate-fuel
  coverage/consistency sweeps per the spec) - reports compress search,
  never judgment; the ruling itself never fans out. Standing escalation
  triggers that pull the frontier seat in
  mid-wave: schema or migration design (A4), security / cross-user
  isolation surfaces, prod incidents, root-cause debugging Sonnet can't
  close, and any unit where Sonnet's review finds the delivery and the
  spec disagree in a way the block doesn't settle.
- **Cursor = the hands, now with more of the load.** Executes unit-scale
  task blocks (Sonnet, or cheaper per the block's MODEL header - mechanical
  units route to auto/cheap), making its own implementation choices within
  the block's contract. Writes code, runs the allowed lanes itself, writes
  the `DELIVERY.md` report (evidence per criterion, deviations), STOPS.
  Gets first crack at bugs via DIAGNOSIS blocks (root cause + evidence +
  proposed fix, no code). Never commits, never edits `docs/HANDOFF.md`
  (see the division-of-labor rule in AGENTS.md).

Accepted trade-offs, stated so nobody "fixes" them silently: (v3) deep
review moves from per-unit to the single pre-main gate, so a contract bug
can land on staging and be caught one gate later - Sonnet's per-unit pass
is the tripwire, the pre-main gate review is the net. (v4) contract-first
blocks mean Cursor occasionally picks a wrong idiom and gets bounced -
that bounce cost is the price of moving implementation thinking off the
frontier seat; the acceptance criteria and review lane are what protect
precision, not spec prose density.

## Workflow (the relay, v5)

Opus plans / Claude Code dispatches / Cursor executes and self-verifies /
Sonnet audits and lands. The loop per unit:

1. Opus (Claude Code, the frontier seat) emits a **unit-scale task block**
   (ritual: the `author-task-block` skill) - one coherent roadmap unit with
   a testable contract, not a 1-3 file slice. The frontier seat typically
   authors a wave of blocks in one session, then drops out.
2. Claude Code dispatches the block itself (ritual: the **`dispatch-unit`
   skill**): backbone is Channel B - headless Cursor CLI in the lane
   worktree `C:\dev\worktrees\cursor-lane`, `--model` ALWAYS explicit
   (auto rung for MODEL-auto blocks, named for judgment tier); Channel A
   (Cloud Agents API) exists but requires usage-based pricing Seth keeps
   OFF, so it refuses cleanly unless he deliberately enables it. Quota
   refusals descend the ladder (B named -> B auto -> page Seth), never
   stall.
3. Cursor implements it, gets tests green, writes the delivery report
   (`DELIVERY.md` in the lane worktree; PR body on the cloud channel),
   stops without committing. Two blocks with fully disjoint FILES TO TOUCH
   may run back-to-back before one review session.
4. Sonnet (Claude Code) audits and lands the unit via the `land-unit`
   skill (fresh lanes, report-vs-tree audit, fix-or-bounce, one commit
   per unit, push to staging, QUEUE/HANDOFF upkeep), then dispatches the
   next block.
5. Bugs: Seth's report becomes a **diagnosis block** for Cursor first
   (no code); Sonnet verifies the reasoning and green-lights the fix
   block. Direct-fix exception: when diagnosis was ~95% of the work and
   the fix is trivial, the diagnosing agent ships it directly.
6. **Wave complete (n == N) -> Seth smokes FIRST.** The relay session
   stops at the last landing, hands over ONE consolidated smoke
   checklist against the staging Vercel deploy, and ends. No branch
   review, no `/code-review`, no merge prep until Seth signs off - his
   smoke findings are review INPUT, and a gate run before smoke gets
   partly re-run after it. A smoke defect re-enters as a diagnosis
   block and resets the sign-off.
7. Only after sign-off: the pre-main gate - ritual is the
   **`pre-main-review` skill**. Opus reviews the full accumulated branch
   diff against the specs and the task-block contracts, with the wave's
   archived session logs in hand, fanning gate fuel out to CURSOR report
   lanes (never Claude subagents). The review lane caught a real
   shipped-contract bug on day one - it is not optional ceremony; it has
   moved gates, not disappeared. Merge itself stays behind Seth's "push
   to main" trigger phrase per the gate.

`docs/HANDOFF.md` (capped) carries current-state between sessions - all
agents read it. `docs/HANDOFF-ARCHIVE.md` carries the verbatim session-log
history - only the frontier seat (Opus) reads it, when planning or gating.

## Claude-Code-specific environment

- NEVER set `ANTHROPIC_API_KEY` - subscription login auth; an env key bills
  per-token silently. (This is about THIS environment's auth - it does not
  forbid the app itself from using its own API key server-side; that's a
  separate, deliberate app-billing choice. See the analytics spec, section 8.)
- `.claude/settings.local.json` is per-machine (gitignored). Destructive ops
  are deliberately NOT allowlisted there - they must always prompt, matching
  gate item 4.
- Project skills (`.claude/skills/`) carry the repeated rituals so they
  load on demand at full fidelity instead of sitting always-on:
  `land-unit` (per-unit audit + land), `author-task-block` (block
  authoring), `dispatch-unit` (autonomous hand-to-Cursor, channels +
  fallback ladder), and `pre-main-review` (the gate: wave-end order,
  gate-fuel fan-out, verdict). Cursor never loads skills - anything Cursor needs
  stays in AGENTS.md. Deliberately NOT skills: merge-to-main and schema-deploy
  stay as copy-paste RUNBOOK rituals - their friction is a feature.
  `scripts/check-hex.mjs` is the tokens-only tripwire `land-unit` runs
  on UI units.
