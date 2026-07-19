> Preserved verbatim from a fan-out REPORT lane (cursor-lane-2, auto rung,
> July 18, 2026) - the research grounding the relay v5.2 width/stagger
> rules in autonomous-cursor-dispatch.md. Report-lane delivery, FP0-style
> preservation.

# DELIVERY: Concurrent headless Cursor CLI agents (REPORT-ONLY)

**Date researched:** 2026-07-18  
**Scope:** One Windows machine, one logged-in Cursor account, headless `agent -p` / `cursor-agent --print`  
**Method:** Official Cursor docs + community forum/bug reports + local `~/.cursor/cli-config.json` inspection + this repo’s relay notes. No code or git changes except this file.

---

## Findings (with sources)

### Q1 — Multiple simultaneous headless runs under one account / one Windows machine?

**Short answer:** Yes in practice — one account login is shared, and nothing in official docs forbids multiple local CLI processes. There is **no published hard concurrency cap** for headless CLI. Limits that matter are soft: startup races (historical), shared config, provider rate limits, and machine/worktree cost. Official “run as many as you want in parallel” language applies to **Cloud Agents**, not the local CLI.

#### What official docs say

| Claim | Source | Notes |
| --- | --- | --- |
| Non-interactive / headless via `-p` / `--print` for scripts/CI | [Using Agent in CLI](https://cursor.com/docs/cli/using) (fetched 2026-07-18) | Print mode is the supported scripting path; `--force` / `--trust` for unattended runs. |
| `--model`, `--workspace`, `-w/--worktree` for isolation | [CLI parameters](https://cursor.com/docs/cli/reference/parameters) (search snippet 2026-07-18) | Worktrees isolate *edits*; they do not create separate accounts. |
| Shared user config: `~/.cursor/cli-config.json` including `model` | [CLI configuration](https://cursor.com/docs/cli/reference/configuration) (search snippet 2026-07-18) | Single home-dir config for the account/machine. |
| Cloud Agents: “run as many agents as you want in parallel” | [Cloud Agents](https://cursor.com/docs/cloud-agent) (fetched 2026-07-18) | Parallelism is first-class for **cloud VMs**, not documented as a CLI guarantee. |
| Usage: Auto draws from First-party models pool (generous, not “unlimited”) | [Usage and limits](https://cursor.com/help/models-and-usage/usage-limits) (search snippet 2026-07-18); [Models & Pricing](https://cursor.com/docs/models-and-pricing) | Concurrent Auto runs share one pool and one account. |

#### Community / bug reports (concurrency-relevant)

1. **Concurrent headless start race (confirmed by Cursor staff)**  
   - Thread: [Concurrent headless cursor-agent invocations fail without delay](https://forum.cursor.com/t/concurrent-headless-cursor-agent-invocations-fail-without-delay/142677)  
   - Opened **2025-11-15**; OS in report: **macOS** (mechanism is process-local, relevant to Windows too).  
   - Symptom: two near-simultaneous `cursor-agent --print` launches → one exits immediately with status `1` and no output.  
   - Staff (deanrie, **2025-11-15**): “race condition… likely related to **session initialization or file locking**.” Workaround: ~100 ms stagger / serialize starts.  
   - Reporter follow-up (**2025-11-26**): on CLI version `2025.11.25-d5b3271`, simultaneous launches returned `status1=0 status2=0` — **appears fixed in that build**. Treat as “was real; verify on current Windows CLI before trusting zero-stagger fanout.”

2. **Provider rate limits even on Auto**  
   - Thread: [Rate limit in auto mode?](https://forum.cursor.com/t/rate-limit-in-auto-mode/137332) (**2025-10-14** onward)  
   - Error while already on Auto: provider rate limit / “switch to auto.” Multiple users; staff acknowledged. Community note: shared provider pressure can hit Auto users.  
   - Implication for fanout: N concurrent Auto agents ≈ N× request burst to the same account + shared provider capacity.

3. **Print-mode reliability (hang / non-exit)** — amplifies under concurrency  
   - [agent -p hangs indefinitely](https://forum.cursor.com/t/cursor-agent-p-print-headless-mode-hangs-indefinitely-and-never-returns/150246)  
   - [cursor-agent --print doesn't exit after completing](https://forum.cursor.com/t/cursor-agent-print-doesnt-exit-after-completing/150296)  
   - This repo already treats print hang as a known defect (`docs/specs/autonomous-cursor-dispatch.md`, Channel B: hard timeout, kill, retry once).

4. **Parallel local agents via worktrees (community pattern, not official concurrency SLA)**  
   - BenXHub: [Cursor CLI with Git Worktree](https://benxhub.com/en/blog/cursor/cli/06-cursor-cli-with-worktree) — multiple terminals, one worktree each.  
   - IDE Parallel Agents / Best-of-N also use worktrees on Windows ([forum](https://forum.cursor.com/t/windows-request-to-disable-automatic-worktree-creation-critical-disk-space-issue/146189), staff: worktrees power Parallel Agents/Best-of-N on all OSes; disk growth is a real Windows failure mode).

#### Local evidence (this machine, 2026-07-18)

Inspected `%USERPROFILE%\.cursor\cli-config.json`:

- Single shared file for the logged-in user (auth cached under `authInfo`).
- Persisted model state present: `model`, `selectedModel`, `modelSelectionHistory`, `hasChangedDefaultModel: true`.
- Current display model: Auto (`displayModelId: "auto"`).
- No separate lockfile observed next to `cli-config.json` in a quick directory listing (absence of an obvious lock file is consistent with a shared read/write config risk under concurrent writers — not proof of missing locking inside the binary).

Config path resolution note (CI community): `CURSOR_CONFIG_DIR || $XDG_CONFIG_HOME/cursor || ~/.cursor` ([example](https://github.com/kernel/hypeman-go/pull/41)) — optional isolation lever if fanout must avoid shared config writes.

#### Account / rate-limit shape (Auto rung)

- Auto / Composer / first-party models share a **First-party models pool**; named third-party models use the **API** pool ([Usage and limits](https://cursor.com/help/models-and-usage/usage-limits)).  
- Staff/forum clarification: pools are limited; Auto is not a free infinite parallel farm ([Is “Auto” mode unlimited?](https://forum.cursor.com/t/is-auto-mode-unlimited-and-free/152909)).  
- No Cursor doc found stating “max N concurrent CLI agents per account.” Closest hard parallel language is Cloud Agents.

---

### Q2 — Last-used `--model` in shared config: race? Is always passing `--model` enough?

**Short answer:** Yes, the CLI persists last-used / selected model in shared `cli-config.json`. Concurrent runs **can race that persisted default**. Passing `--model` on **every** invocation is a **sufficient mitigation for that run’s model selection**; it does **not** eliminate shared-config write races for the *default* left behind, nor other shared-state races at process start.

#### Evidence

1. **Official config schema** lists `model`, `hasChangedDefaultModel` as CLI-managed fields ([CLI configuration](https://cursor.com/docs/cli/reference/configuration)).  
2. **Cursor skill guidance** (`update-cli-config`): `model` / `selectedModel` / `modelParameters` / `hasChangedDefaultModel` are internal — “managed by the model picker”; do not hand-edit.  
3. **This repo’s operational proof (2026-07-14):** flagless `agent -p` inherited exhausted `claude-haiku-4-5` from a prior probe and quota-refused; `--model auto` worked. Recorded in `docs/HANDOFF.md`, `docs/tasks/QUEUE.md` (NT3 notes), and `.claude/skills/dispatch-unit/SKILL.md` (“ALWAYS pass `--model` EXPLICITLY”).  
4. **ACP / model flag reliability:** Forum [ACP model selection API removed?](https://forum.cursor.com/t/acp-model-selection-api-removed/160063) (2026-05): staff — `--model` at startup “correctly validates and applies the model” for the session (workaround when runtime picker metadata is empty).  
5. **Analogy (other CLIs):** Copilot CLI has an open report of concurrent sessions last-writer-wins on `~/.copilot/config.json` ([issue #1307](https://github.com/github/copilot-cli/issues/1307), 2026-02). Not Cursor, but same class of risk for a single home config file.

#### Mitigation assessment

| Risk | Does always `--model` fix it? |
| --- | --- |
| Wrong model / wrong quota pool for *this* run | **Yes** — pin `auto` or the named id every launch. |
| Last-writer clobber of default for *next* flagless run | **No** — still possible; don’t ever run flagless. |
| Startup session/file-lock race (historical) | **No** — stagger starts; verify current CLI version. |
| Provider rate limit under N-wide Auto fanout | **No** — reduce width / backoff / retry. |
| Two agents editing one worktree | **No** — separate worktrees + file-disjoint blocks (repo Mode 2). |

Optional stronger isolation: distinct `CURSOR_CONFIG_DIR` per lane (undocumented-as-first-class for fanout, but used in CI to force config location).

---

### Q3 — Docs / forum / changelog guidance on parallel background agents via CLI

| Channel | Guidance | Parallel story |
| --- | --- | --- |
| **Cloud Agents docs** | Explicit: run many in parallel; isolated VMs; API/desktop/web/Slack/etc. | Official parallel path. (Billing note for this project: Channel A needs usage-based pricing — often OFF.) |
| **CLI “Using Agent”** | `-p` for non-interactive; `--worktree` for isolated checkouts; cloud handoff via `&` | Isolation primitives; **no** documented N-wide local fanout playbook. |
| **CLI parameters** | `--workspace`, `--worktree`, `--model`, `--force`, `--trust` | Building blocks for parallel local runs. |
| **Forum** | Concurrent `-p` race (Nov 2025) + fix report; Auto rate-limit incidents; print hangs | Operational caveats, not a green light for large N. |
| **IDE Parallel Agents / Best-of-N** | Worktree-backed parallel candidates | Product feature for parallel *local* agents; disk cleanup settings matter on Windows. |
| **This repo** | Mode 2: parallel **worktrees** only when FILES TO TOUCH are disjoint; Channel B is currently **one** lane (`C:\dev\worktrees\cursor-lane`) | Safe graduation path is width **2** with disjoint files, not unbounded CLI fanout. |

No Cursor changelog entry was found that states “headless CLI supports N concurrent agents under one login” as a supported SLA. Parallelism is clearly endorsed for **Cloud Agents** and for **worktree-isolated** local agents; headless multi-process fanout is community/operational, with known sharp edges.

---

## PRACTICAL VERDICT

### Safe concurrency width (Auto rung, one Windows account)

| Width | Verdict |
| --- | --- |
| **1** | Proven. Current Channel B design. |
| **2** | **Recommended max for production relay fanout.** Matches repo Mode 2 (two worktrees, file-disjoint), community worktree pattern, and keeps rate-limit / hang blast radius manageable. Stagger process starts by ≥250–500 ms on Windows even if the Nov 2025 race is fixed. |
| **3** | Experimental only. Expect occasional provider rate limits, more print hangs to babysit, and higher First-party pool burn. Only with three separate worktrees + always `--model auto` + hard timeouts. |
| **4+** | Not advised for unattended Auto fanout on one account. No official CLI SLA; failure modes compound (rate limit, hang orphans, config last-writer, disk from worktrees). Prefer Cloud Agents (if billing allows) or serialize. |

**Default recommendation for LogChamp lane fanout:** concurrency width **2** on Auto, separate worktrees outside OneDrive, always `--model auto`, hard timeout per process.

### Known failure modes

1. **Near-simultaneous process start** → one agent exits 0-output / status 1 (historical race; staff: session init / file locking).  
2. **Shared `cli-config.json` model default** → flagless inherit wrong/exhausted model; concurrent writers can clobber persisted `model` / history.  
3. **Provider / Auto rate limits** under burst concurrency (even while “on Auto”).  
4. **Print-mode hang / non-exit** — each concurrent run needs its own timeout/kill; zombies waste quota and confuse monitors.  
5. **Same-tree / overlapping FILES TO TOUCH** — classic two-agents-one-checkout corruption (repo gotcha, independent of Cursor).  
6. **Worktree disk growth on Windows** — parallel agents × large trees fill disk; prune aggressively.  
7. **Auth/quota shared with IDE** — interactive Cursor and headless Auto share pools; fanout can starve the interactive session mid-cycle.

### Mitigations (checklist)

1. **Always** pass `--model auto` (or the exact named id) — never rely on last-used.  
2. **One worktree (or `--workspace`) per concurrent agent**; file-disjoint blocks only.  
3. **Stagger launches** (250–500 ms+); avoid fork-bomb simultaneous starts.  
4. **Hard timeout** + kill + single retry per hang (existing Channel B rule).  
5. Cap Auto fanout at **2** until a soak test on *this* Windows CLI build shows clean 3-wide.  
6. Optional: per-lane `CURSOR_CONFIG_DIR` if config clobber appears in soak tests.  
7. Monitor dashboard usage; back off on provider rate-limit errors rather than widening.  
8. Keep Cloud Agents as the true high-N parallel path when usage-based billing is intentionally enabled.

### Residual uncertainty

- No official numeric CLI concurrency limit was published as of **2026-07-18**.  
- The Nov 2025 start-race fix was confirmed by a reporter on one CLI build (macOS); **re-verify on the current Windows `cursor-agent` before assuming zero-stagger is safe**.  
- Whether `--model` still *writes* the shared default on every run (vs read-only override) is inferred from persisted history + last-used behavior, not from an open-source CLI write path.

---

## Sources (URLs + dates)

| Source | Date used |
| --- | --- |
| https://cursor.com/docs/cli/using | Fetched 2026-07-18 |
| https://cursor.com/docs/cli/reference/parameters | Cited 2026-07-18 |
| https://cursor.com/docs/cli/reference/configuration | Cited 2026-07-18 |
| https://cursor.com/docs/cloud-agent | Fetched 2026-07-18 |
| https://cursor.com/help/models-and-usage/usage-limits | Cited 2026-07-18 |
| https://cursor.com/docs/models-and-pricing | Cited 2026-07-18 |
| https://forum.cursor.com/t/concurrent-headless-cursor-agent-invocations-fail-without-delay/142677 | 2025-11-15 … 2025-11-26 |
| https://forum.cursor.com/t/rate-limit-in-auto-mode/137332 | 2025-10-14 … |
| https://forum.cursor.com/t/cursor-agent-p-print-headless-mode-hangs-indefinitely-and-never-returns/150246 | Community hang reports |
| https://forum.cursor.com/t/cursor-agent-print-doesnt-exit-after-completing/150296 | Community hang reports |
| https://forum.cursor.com/t/acp-model-selection-api-removed/160063 | ~2026-05 |
| https://forum.cursor.com/t/is-auto-mode-unlimited-and-free/152909 | Usage-pool clarification |
| https://benxhub.com/en/blog/cursor/cli/06-cursor-cli-with-worktree | Community parallel+worktree pattern |
| Local `%USERPROFILE%\.cursor\cli-config.json` | Inspected 2026-07-18 |
| Repo: `docs/HANDOFF.md`, `docs/tasks/QUEUE.md`, `docs/specs/autonomous-cursor-dispatch.md`, `.claude/skills/dispatch-unit/SKILL.md` | July 2026 operational notes |

---

**STOP.** Report-only; no further actions.
