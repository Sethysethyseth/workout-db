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

## Model selection / division of labor (v4 - Sonnet resident, Fable gated, Cursor rebalanced)

Decided July 3, 2026 (v3, token-efficiency rebalance); amended July 6, 2026
(v4: Cursor rebalance + two-tier state channel). Three roles:

- **Sonnet in Claude Code = the resident driver.** Runs the day-to-day
  relay: per-unit AUDIT of each Cursor delivery, then commit / push /
  state upkeep. The exact ritual is the **`land-unit` skill** - invoke
  it at review time rather than reciting from memory. Sonnet does NOT
  author task blocks and does NOT settle contract ambiguity - it bounces
  up instead of guessing (escalation triggers below).
- **Fable/Opus in Claude Code = the architect + final gate.** Short, rare,
  high-leverage sessions: (a) authors the unit-scale task blocks
  CONTRACT-FIRST - the ritual is the **`author-task-block` skill** -
  plus architecture and planning with the repo in hand; (b) ONE thorough
  review of the
  accumulated branch diff before any merge to main - nothing ships to main
  without a Fable/Opus pass; it greps `HANDOFF-ARCHIVE.md` for the wave's
  full session history (accepted deviations, sequencing flags, reviewer
  fixes) as review fuel. Standing escalation triggers that pull Fable in
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
is the tripwire, the pre-main Fable review is the net. (v4) contract-first
blocks mean Cursor occasionally picks a wrong idiom and gets bounced -
that bounce cost is the price of moving implementation thinking off the
frontier seat; the acceptance criteria and review lane are what protect
precision, not spec prose density.

## Workflow (the relay, v4)

Fable plans / Cursor executes and self-verifies / Sonnet audits and lands.
The loop per unit:

1. Fable (Claude Code) emits a **unit-scale task block** (ritual: the
   `author-task-block` skill) - one coherent roadmap unit with a testable
   contract, not a 1-3 file slice. Fable typically authors a wave of
   blocks in one session, then drops out.
2. Cursor implements it, gets tests green, writes `DELIVERY.md` (files
   touched, verbatim lane output, per-criterion evidence, deviations),
   stops without committing. Two blocks with fully disjoint FILES TO TOUCH
   may run back-to-back before one review session.
3. Sonnet (Claude Code) audits and lands the unit via the `land-unit`
   skill (fresh lanes, report-vs-tree audit, fix-or-bounce, one commit
   per unit, push to staging, QUEUE/HANDOFF upkeep), then dispatches the
   next block.
4. Bugs: Seth's report becomes a **diagnosis block** for Cursor first
   (no code); Sonnet verifies the reasoning and green-lights the fix
   block. Direct-fix exception: when diagnosis was ~95% of the work and
   the fix is trivial, the diagnosing agent ships it directly.
5. Before merge to main: Fable/Opus reviews the full accumulated branch
   diff against the specs, with the wave's archived session logs in hand
   (the review lane caught a real shipped-contract bug on day one - it is
   not optional ceremony; it has moved gates, not disappeared). Merge
   itself stays behind Seth's "push to main" trigger phrase per the gate.

`docs/HANDOFF.md` (capped) carries current-state between sessions - all
agents read it. `docs/HANDOFF-ARCHIVE.md` carries the verbatim session-log
history - only Fable reads it, when planning or gating.

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
  `land-unit` (per-unit audit + land) and `author-task-block` (block
  authoring). Cursor never loads skills - anything Cursor needs stays in
  AGENTS.md. Deliberately NOT skills: merge-to-main and schema-deploy
  stay as copy-paste RUNBOOK rituals - their friction is a feature.
  `scripts/check-hex.mjs` is the tokens-only tripwire `land-unit` runs
  on UI units.
