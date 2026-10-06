# DELIVERY: bkr-d2 — DIAGNOSIS — "Draft with the coach" hangs on "Drafting…"

STATUS: complete (report only; no source edits)

## Files touched
- `DELIVERY.md` (this file) only

## Test / lane output
Diagnosis block — no code lanes. Acceptance check (verbatim):

```
git status --porcelain --untracked-files=all
(empty — no tracked or untracked visible changes)

git check-ignore -v DELIVERY.md
.gitignore:48:/DELIVERY.md	DELIVERY.md

Test-Path DELIVERY.md
True
```

`DELIVERY.md` is gitignored by design (`/.gitignore:48`), so porcelain does not show `?? DELIVERY.md`. Working tree has zero source edits; only the ignored report file exists.

---

## 1. Worst-case duration and timeouts per hop

### Generate call shape (hosted Anthropic path)
| Knob | Value | Evidence |
|---|---|---|
| `max_tokens` | **8000** (`BLOCK_DRAFT_MAX_TOKENS`) | `server/src/coach/blockDraft.js:15`, passed at `coachController.js:493` |
| Effort | **`medium`** default (`DEFAULT_EFFORT`), overridable via `COACH_EFFORT` | `server/src/coach/config.js:12,36-37`; passed at `coachController.js:492` |
| Model | **`claude-sonnet-5`** default (`DEFAULT_MODEL`), overridable via `COACH_MODEL` | `server/src/coach/config.js:10,34-35` |
| Transport | **Non-streaming** `completeAnthropic` (full body buffered) | `provider.js:185-230`; `coachController.js:482-496` |
| Extra work before charge | `loadSummary` + `compactSummaryForCoach` when `mode === "generate"` | `coachController.js:445-453` (runs **before** `CoachUsage` insert) |

A full multi-week JSON block under a shared 8000 thinking+response budget at medium effort can easily run for tens of seconds to a few minutes. There is no progress UI on this path (button text only).

### Timeout on each hop (seconds or "none")

| Hop | Timeout | Evidence |
|---|---|---|
| Client `fetch` (`http()` → `coachBlockDraft`) | **none** | `client/src/api/http.js:56-65` — no `signal`, no `AbortSignal.timeout`, no timer. `coachApi.js:85-90` adds nothing. |
| `CoachDraftCard` UX | **none** | `CoachDraftCard.jsx:57-99` — sets `busy` and awaits; no abort, no slow escalation. While pending, button reads `"Drafting…"` (`:127`). |
| Express / app code | **none** (app-configured) | `server/src/server.js:9-11` — bare `app.listen`; no `server.timeout` / `requestTimeout` overrides. `app.js` has no request-timeout middleware. |
| Node HTTP `requestTimeout` (runtime default) | **300** seconds | Node `http.Server` default `requestTimeout = 300000` (verified locally). Not set in repo; still applies to the listen socket unless changed on the host. |
| Node socket `timeout` | **none** (`0`) | Same Node defaults. |
| Provider `fetch` in `completeAnthropic` | **none** | `provider.js:207-216` — optional `signal` exists but **`draftBlock` never passes one** (`coachController.js:482-496`). Contrast: `askCoach` aborts on client close (`coachController.js:227-228`). |
| Render platform HTTP ceiling | **up to 6000** seconds (100 min) per current Render docs | Not configured in-repo; not a practical bound for this bug. Client/proxy/browser can still drop earlier. |

### What the client shows if the request never resolves
It stays on **"Drafting…"** indefinitely (`CoachDraftCard.jsx:64-65,127`). `setBusy(false)` only runs in `finally` after the promise settles (`:97-99`). There is no error, no slow copy, and no abort path. A never-settling `fetch` = forever Drafting….

---

## 2. `CoachUsage` charge / refund cases (a)–(d)

Charge timing for block-draft: when the weekly cap applies, a row is **inserted before** the provider call (`coachController.js:455-459`). Refund is only via `finally`: `if (!deliveredBlock) await removeUsage(usageId)` (`:528-530`). `deliveredBlock` flips to `true` only after validation succeeds, immediately before `res.json` (`:517-522`).

`removeUsageRow` definition: `coachController.js:110-118` (delete by id; ignore `P2025`).

**Every call site of `removeUsageRow` in app code:**
1. `askCoach` `finally` — `if (!deliveredAnswer) await removeUsageRow(usageId)` (`:296`)
2. `draftBlock` `finally` — via injected `removeUsage` defaulting to `removeUsageRow` (`:407`, `:529`)

(`importMap` does **not** use it; it inserts rows only after success — `:641-646`.)

| Case | Verdict | Evidence |
|---|---|---|
| **(a)** Provider slow; phone gives up / tab sleeps / user navigates away | **charged** if the server later finishes successfully; **refunded** only if the handler ends with `deliveredBlock === false` (provider/validate error, or death before `:517`) | `draftBlock` does **not** wire `res.on("close")` → abort (unlike `askCoach` `:227-228`). Client has **no** `AbortController` (`CoachDraftCard.jsx:57-73`). Disconnect does not stop `completeAnthropic`. Success path sets `deliveredBlock = true` then responds (`:517-522`) → `finally` does **not** refund (`:529`). Matches staging rows existing while Seth never saw a draft. |
| **(b)** Provider errors (`CoachProviderError` or other throw) | **refunded** | `catch` returns 502 / `next(err)` without setting `deliveredBlock` (`:523-527`); `finally` deletes (`:528-530`). |
| **(c)** Validation rejects the draft | **refunded** | `validateDraftCandidate` failure returns 422 before `deliveredBlock = true` (`:513-516`); stop_reason / parse failures return earlier (`:497-509`). Unit proof: `coachBlockDraft.test.js` "unknown field → 422 … CoachUsage row deleted". |
| **(d)** Response arrives after `CoachDraftCard` unmounted | **charged** on server success (same as success path); client may drop the draft | Unmount does not cancel the in-flight `http()` call. On resolve, `onDrafted?.(data)` still runs (`CoachDraftCard.jsx:73`) if the closure is alive; if the whole builder unmounted, React ignores the subsequent `setState` in `handleCoachDrafted`. No refund hook on unmount. Server already set `deliveredBlock = true` (`:517`). |

---

## 3. Success path: `onDrafted` → could a draft arrive and render nothing?

Flow:
1. `CoachDraftCard` calls `onDrafted?.(data)` with `{ block, stats, source }` (`CoachDraftCard.jsx:73`).
2. Parent wires `onDrafted={(data) => void handleCoachDrafted(data)}` (`BlockBuilder.jsx:992`).
3. `handleCoachDrafted` POSTs `previewBlockImport` with `JSON.stringify(data.block)`, then `setCoachPreview(preview)` (`BlockBuilder.jsx:462-474`).
4. When `coachPreview` is set, the builder **early-returns** a full `ImportPreviewStep` UI (`BlockBuilder.jsx:851-882`) — not a silent no-op.

Failure modes on this leg surface as errors / "Previewing coach draft…", **not** stuck "Drafting…":
- Preview 422 → user-visible error (`:475-477`)
- Other preview errors → error (`:478-479`)
- Busy preview → `"Previewing coach draft…"` (`:995-998`)

**Could success render nothing?** Only if the card/builder is gone before state updates (navigate away / hard sleep) — not if the user is still staring at "Drafting…". Seth’s symptom pins the hang to **`await coachBlockDraft(...)`** (`CoachDraftCard.jsx:67-72`), before `onDrafted`.

---

## 4. Most likely root cause (ranked)

### Rank 1 — Most likely: unbounded non-streaming generate + no client timeout/abort + pre-charge
**Symptom fit:** Button stays `"Drafting…"` until `fetch` settles; nothing in the client ever times out or aborts (`http.js:56-65`, `CoachDraftCard.jsx:64-99,127`). Generate uses non-streaming Anthropic with **8000** max tokens and **medium** effort (`blockDraft.js:15`, `config.js:12`, `coachController.js:482-496`). On a phone that feels like "forever."

**Charge fit:** `CoachUsage` is created **before** the provider returns (`coachController.js:455-459`). Refund only if `deliveredBlock` stays false (`:528-530`). If the model eventually succeeds after the phone dropped the connection (tab sleep, navigate, flaky mobile network) — or the user left while the server was still working — the row remains. **No disconnect abort** on this path (contrast `askCoach` `:227-228`).

**File:line anchors:** `CoachDraftCard.jsx:67-72,127`; `http.js:56-65`; `coachController.js:455-459,482-496,517-530`; `provider.js:207-216`; `blockDraft.js:15`.

### Rank 2 — Plausible contributor: mobile connection death without a clean reject
iOS/WebKit can freeze or drop a long backgrounded `fetch` such that JS never runs the `catch`/`finally` until foreground — or the socket hangs half-open. Same missing client timeout makes that indistinguishable from "still drafting." Usage rows still appear once the server completes successfully.

### Rank 3 — Unlikely for this symptom: preview / `onDrafted` swallow
Would clear "Drafting…" first (`finally` at `:97-99`) and either show preview or an error. Does not match "stuck on Drafting…".

---

## 5. Smallest correct fix (prose + sketch — not applied)

### Server (charge correctness + abort)
1. Mirror `askCoach`: `AbortController` + `res.on("close", () => controller.abort())`, pass `signal` into `completeAnthropic` (`provider.js` already accepts it).
2. Keep `finally` refund when `!deliveredBlock` (already correct for errors/validation/abort-before-success).
3. Align with upcoming **bkr2** reserve/settle/refund ledger: prefer settle-on-success (or explicit abort → refund) so a draft the client never receives cannot stay charged. Until bkr2 lands, abort-on-close + existing `removeUsageRow` is the minimal patch.

### Client (what Seth should see — feeds **bkr1**)
1. Wrap `coachBlockDraft` in `AbortController` with a hard timeout (sketch: **90s**, tunable; must be ≤ any platform bound you care about; Node default request timeout is 300s).
2. On slow wait (sketch: **8–10s**): show bkr1’s shared AI loader — crown spinner on the button + copy like "this is taking a minute" (smoke CR in `bk-smoke-FINDINGS.md`).
3. On timeout/abort: clear busy, show plain error ("The coach took too long. You weren’t charged — try a shorter description.") — only honest if server refunds on abort.
4. On success: unchanged → preview step.
5. On provider/validation errors: existing `coachErrorMessage` paths.

### Sketch (not applied)

```js
// CoachDraftCard onDraft — conceptual
const controller = new AbortController();
const hard = setTimeout(() => controller.abort(), 90_000);
setBusy(true);
setSlow(false);
const slowTimer = setTimeout(() => setSlow(true), 10_000);
try {
  const data = await coachBlockDraft({ ..., signal: controller.signal });
  onDrafted?.(data);
} catch (err) {
  if (err.name === "AbortError") setError("The coach took too long. Try a shorter description.");
  else /* existing ApiError / network mapping */;
} finally {
  clearTimeout(hard); clearTimeout(slowTimer); setBusy(false);
}
// busy UI: bkr1 AiWaitButton — crown spinner + (slow ? "This is taking a minute…" : "Drafting…")
```

```js
// draftBlock — conceptual
const controller = new AbortController();
res.on("close", () => controller.abort());
// ... after usageId create:
const message = await completeAnthropicFn({ ..., signal: controller.signal });
// existing finally already refunds when !deliveredBlock
```

### Overlap with bkr1
bkr1 owns the shared crown AI-loader. **Do not invent a one-off spinner in CoachDraftCard** — land timeout/abort + refund first (or with bkr1), and plug this button into that loader so draft/ask/import-map share one slow-wait language. QUEUE already says bkr1 absorbs the d2 fix after this diagnosis is verified.

---

## Acceptance criteria

| Criterion | Evidence |
|---|---|
| `git status --porcelain` shows no change except untracked `DELIVERY.md` | Porcelain empty (report is gitignored at `/.gitignore:48`); `DELIVERY.md` present; no source edits. |
| Timeout number (seconds or `"none"`) for each hop | Section 1 table: client **none**, Express app **none**, Node `requestTimeout` **300**, provider fetch **none**, Render ceiling **6000** (platform docs, not in-repo). |
| Cases (a)–(d) with charged/refunded + file:line | Section 2 table. |

## Deviations
None. Report-only; no source modifications; no git operations performed by this agent beyond read-only `git status` for the acceptance check.
