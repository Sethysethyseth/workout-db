# Workflow + Skills Cheat Sheet

One page for Seth. What to type, to whom, and when. Deep detail lives in
CLAUDE.md / AGENTS.md / the skills themselves - this is just the steering wheel.

---

## The relay at a glance

```
PLAN            EXECUTE           LAND              GATE              SHIP
Fable/Opus  ->  Cursor        ->  Sonnet        ->  Fable/Opus    ->  Seth
authors         implements        audits + lands    reviews whole     merges to
task blocks     from the block    each unit         branch diff       main by hand
(/author-       file, writes      (/land-unit)      (/code-review)    (RUNBOOK,
task-block)     DELIVERY.md,                                          one command
                STOPS                                                 at a time)
```

Repeat EXECUTE -> LAND per unit until the wave is done, then GATE, then SHIP.

---

## What you type, step by step

### 1. Planning session (Claude Code on Fable or Opus)

> author the next wave of task blocks for <goal>

The session invokes the `author-task-block` skill per block. Don't restate
the block rules - the skill has them. Blocks get committed AND pushed
(cloud Cursor can't see unpushed files). You get back a dispatch line
per block.

### 2. Dispatch (you, one line in Cursor)

> Read docs/tasks/<unit>.md and execute it exactly. It is the complete
> task; do not ask for the task in chat.

Cursor implements, writes DELIVERY.md (or pushes a cursor/ branch + PR),
and stops. You do nothing else here.

### 3. Review session (Claude Code on Sonnet)

> review <unit>

That's the whole prompt. Sonnet invokes the `land-unit` skill: fresh test
lanes, report-vs-tree audit, hex tripwire on UI units, fix-or-bounce, one
commit per unit, push to staging, QUEUE/HANDOFF upkeep. It ends by giving
you a smoke-test bullet list for the staging deploy.

### 4. Bugs

> here's a bug: <what you saw, where, on which screen>

This becomes a DIAGNOSIS block for Cursor first (no code), then a fix
block after the reasoning checks out. Exception: if diagnosis was ~95%
of the work, the diagnosing agent ships the trivial fix directly.

### 5. Pre-main gate (Claude Code on Fable/Opus, once per wave)

> review the wave before main

Fable runs /code-review on the accumulated branch diff (or
`/code-review ultra` for a big wave) + greps HANDOFF-ARCHIVE for the
wave's session history. Nothing ships to main without this pass.

### 6. Ship (you, by hand)

> push to main        <- the exact trigger phrase, verbatim

Then RUNBOOK section 2 (pre-merge checklist), one command at a time with
your approval between each. Schema change in the wave? RUNBOOK section 3
FIRST - DB before code, always.

---

## Skills index

| Skill | Who runs it | When | What it carries |
| --- | --- | --- | --- |
| `land-unit` (project) | Sonnet | every "review <unit>" | the full audit+land ritual, both delivery modes (local tree / cursor branch+PR), hex tripwire, bounce rules, bookkeeping |
| `author-task-block` (project) | Fable/Opus | planning sessions | contract-first v4 rules, diagnosis + batching variants, commit-AND-push finish, dispatch line |
| `/code-review` (built-in) | Fable/Opus | pre-main gate | branch-diff review; `ultra` = multi-agent cloud review for big waves |
| `dataviz` (built-in) | whoever builds charts | BEFORE the first line of chart code | chart form/color/interaction system |
| `frontend-design` (plugin, enabled) | visual units | new UI / reshaping UI | aesthetic direction, avoids templated defaults |
| `/security-review` (built-in) | Fable/Opus | cross-user isolation surfaces | security pass on pending changes |

**Deliberately NOT skills:** merge-to-main and schema-deploy. They stay as
RUNBOOK copy-paste - rare, dangerous, and the friction is a feature.

**Support script:** `node scripts/check-hex.mjs [range]` - flags raw
hex/rgb/hsl added under client/src outside index.css (tokens-only rule).
land-unit runs it automatically on UI units; exit 1 = review signal, not
auto-fail.

---

## Prompting rules that keep it cheap

1. **Invoke by name, never re-describe.** "review nt3" beats a paragraph
   re-explaining the audit. If you paste procedure into the prompt you pay
   for it twice and risk it forking from the skill.
2. **Right model per seat.** Sonnet reviews/lands (frequent, cheap).
   Fable/Opus plans and gates (rare, expensive). Cursor's tier is set per
   block by the MODEL header - that's the cost lever.
3. **Bigger coherent blocks beat many small ones** - they amortize
   Cursor's fixed context-loading cost.
4. **Skills load fresh at execution time** - so a long Sonnet session
   still runs the exact checklist, not a degraded memory of it. Trust the
   skill over mid-session recall.

---

## Trigger phrases + gates (unchanged, always-on)

- "push to main" (verbatim) - the ONLY way a main merge starts.
- Ask-first, always: prod anything, migrations (any env), destructive git
  (reset --hard / clean / force-push / branch -D), dependency installs.
- Everything else runs hands-off, including pushes to staging.

## Escalation triggers (Sonnet bounces UP, never guesses)

- schema/migration design - security / cross-user isolation - prod
  incidents - root-cause debugging that won't close - delivery vs spec
  disagreement the block doesn't settle.
