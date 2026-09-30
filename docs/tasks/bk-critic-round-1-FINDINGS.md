# BK coach-persona critic - round 1 FINDINGS (Sept 29, 2026)

Run by the frontier seat (Opus, Playwright MCP) per `docs/specs/blocks-v2.md`
section 11. Persona: a strength coach programming for intermediate lifters,
on a phone between clients, moving a client (Seth) off a spreadsheet.

**Environment (deviation, stated):** staging Render never deployed the wave
(stale since before BK1 - Seth checking Render Events), so this round ran on
the documented local recipe: the pushed client (`vite`, `VITE_API_URL` ->
local API) and the pushed server (`COACH_PROVIDER=mock`) against the MIGRATED
staging database, `demo.critic` account. Same code as `origin/ai-connector-wave`
at `3c6510c`; only the host differs. 390x844 champ dark (primary), forest
light (rotating palette), 1280x800 champ dark. Screenshots are local-only
under `.playwright-mcp/bk-critic/round-1/` (numbered below as `#NN`).

## Score: 6 / 10 - NOT PASSING (bar: 8+, no criterion below 7, no P0/P1 open)

| Criterion | Score | Why |
|---|---|---|
| First-block speed | 6 | Builder flow is complete (picker sheet, timed toggle, +day/+week, copy forward, labels), but saving a skeleton with an empty day fails with a raw server error (P1-2), and a brand-new block claims "Saved". |
| Mid-set legibility | 7 | Plan line + coach notes (Setup, Tempo, Lead side) visible without a tap (ISSUE-05 met), plan placeholders, one-tap "As planned", over-cap warn. Dragged by "e.g. 185" on unloaded exercises and the cap placeholder reading "6" not "<= 6". |
| Import trust | 5 | Seth's real Phase-1 sheet: 216/216 rows, 602 sets, 84 timed, zero blanks-to-0, only the two extra columns warned - excellent. But the Any AI path rejected a normal AI answer (P0-1, fixed in-round), and the preview opens mid-page with a ~3000px matching list before the program. |
| Feel | 6 | Local edits instant, undo toasts, clear unsaved/saved states on existing blocks. Creating the 216-exercise block took ~19 s (local->Neon) with no progress state; toasts wrap to 5 lines; new blocks say "Saved". |
| Visual coherence | 6 | The recovery language is applied consistently and holds in forest light; tokens resolve. Set-grid header is off by one column; day tiles truncate to 2-5 chars and the ring overlaps "DAY n"; on desktop the sticky block header covers the app's top nav. |
| Coaching fidelity | 6 | Caps read as caps (RPE <= 6 in the rx, over-cap warn, Execution drift = overshoot only), ranges, rest, week labels, the progression table is legible. But copy forward loads the deload week heaviest, the finished summary drops timed sets, and Analytics hides evening sessions. |
| AI optionality | 6 | Every coach result lands in the reviewable preview; coach convert works (mock); entries are gated on /coach/status. The Any AI path break (P0-1) is what holds this down. |

## Tasks

- **T1 import Seth's Phase-1 (`Program` sheet)** - week 1 (36 rows) by paste,
  then all 6 weeks by File upload. PASS on data: every row present, 29 distinct
  names (24 in week 1), loads numeric, blanks blank, timed sets survive (5x45s,
  30 sec/side, 5 min), Setup + Lead side in notes. #03-#12.
- **T2 build 4-week 4-day U/L at 390px, deload label, progression helper** -
  completed; P1-2 hit on the way; copy-forward + deload interaction P2-7. #13-#23.
- **T3 start, open today, log a timed set + a capped set** - completed;
  reopen shows values intact in the DB; the finished summary does not (P1-3).
  #25-#36.
- **T4 Execution judges that session** - engine CORRECT (Box Squat: load 1.0,
  volume 0.25, drift -2 = the RPE 8 vs cap 6 overshoot); the Analytics UI shows
  "Nothing to compare yet" because of P1-4. #37-#38.
- **T5 export -> re-import** - PASS: identical stats, "Nothing skipped". #39-#40.
- **T6 any-AI path** - copy works (1,206 chars); the answer paste FAILED (P0-1);
  fixed in-round (`8da0ae5`) and re-verified. #41-#42, #48.
- **T7 coach convert / ask** - PASS on the mock provider (convert -> same
  preview; ask with block focus verified live at the API). #43.

## Findings (ranked)

### P0 - broken / data loss
1. **Any AI tab rejects a normal AI answer.** `ImportBlockPage` sends
   `kind: "json"` for the Any AI source; `importPreview` parsed kind json
   strictly, so "Sure! Here is your block: ```json ...```" -> "That isn't valid
   JSON". **FIXED in-round** (`8da0ae5`, direct-fix exception: json branch
   extracts when the text is not bare JSON; +1 test). #42 -> #48.

### P1 - blocks the coach
2. **Saving a block with an empty day fails with a raw server error.** Adding
   days first and filling them later is the natural skeleton flow; Save posts,
   the server rejects ("Template must include at least one exercise"), the card
   names no day and nothing scrolls. Fix: client validation catches empty days
   BEFORE posting, names them ("Week 2 > Day 3 has no exercises"), selects that
   week/day and scrolls to it; offer "Remove empty days" as the one-tap way out. #22.
3. **Finished workout summary drops timed sets.** Logged 45 s Spanish Squat +
   5x55 Box Squat -> summary says SETS 1, the isometric shows "0 sets / No sets
   logged" (DB has both: set 1907 durationSec 45, set 1908). Fix: the completed
   view's set counting and per-exercise rows treat a `durationSec` set as a
   logged set and render it ("45 s", "20 lb x 45 s"). #34, #36.
4. **Analytics hides evening sessions (pre-existing, found here).** The client
   sends `to` as a date-only string; the server reads it as 23:59:59.999Z UTC.
   Seth's 8:42 PM EDT session (00:42Z next day) is outside "today" until
   tomorrow - Execution showed "Nothing to compare yet". Everyone west of UTC
   who trains in the evening is affected. Fix: send the end of the LOCAL day as
   an ISO datetime (client) - the server already accepts datetimes. #37-#38.

### P2 - friction
5. Preview opens scrolled mid-page (scrollY ~2286) - reset to top on step change. #03
6. The exercise-matching list dominates the preview (29 cards, ~3000px, before
   Browse and Create). Compact one-line rows, collapse matched names under a
   "22 match your library" summary, keep the unmatched list short, and put
   Create block in a sticky footer. #04
7. Copy forward loads the deload week heaviest (W4 "Deload" got 200 lb). Skip
   weeks whose label contains "deload" by default (say so in the preview) - or
   let the sheet exclude them. #19-#23
8. Set-grid header is offset one column (SET sits over REPS) - builder, both
   palettes. #16, #45
9. Day tiles at 5 days on 390px truncate names to 2-5 characters and the
   progress ring overlaps "DAY n" (builder, run view, import browse). Tiles need
   either wider min-width + horizontal scroll, or a 2-line name. #11, #28
10. Desktop 1280: the builder/run sticky header covers the app's top nav. #47
11. A brand-new, never-saved block shows "Saved". #13
12. Reps -> Time converts reps x 3 (8 reps -> 24 s). Default to 30 s. #16
13. Logger weight placeholder "e.g. 185" on a planned exercise with no planned
    load (bands, bodyweight). Show the plan's Load note or nothing. #31
14. Library opens on "Saved workouts: 0 / No saved workouts yet" right after
    creating three blocks - land on blocks when there are blocks and no
    workouts. #24
15. End block and "Start block" over a running block use `window.confirm` -
    use the in-page confirm pattern the app uses elsewhere.
16. Creating a large import (216 exercises) took ~19 s locally with no
    progress state - "Creating..." + disabled button; re-measure on staging.
17. `/blocks/current`: "Start workout" sits below the whole exercise list (7
    exercises); put the primary action at the top of the day card or sticky. #28

### P3 - polish
18. Pluralization: "1 WEEKS", "1 DAYS", "Imported 1 weeks".
19. Progression table shows "1x300s" where the card shows "1 x 5 min" (use formatDuration). #12
20. "Rest 0s" shown - omit rest when 0.
21. Units: run view "185 lbs" vs builder "185 lb".
22. Picker puts "Use 'bench'" above catalog matches; "row" ranks "Alternating Kettlebell Row" first.
23. Cap placeholder reads "6" - show "<= 6" (RIR ">= 2").
24. Toasts are too narrow at 390px (5-line wrap). #17
25. Empty state "4 weeks · 16 days" -> "4 weeks · 4 days a week". #27
26. Completed summary collapses note newlines into one run-on line. #36
27. Read-only exercise cards (import browse) show an expand chevron. #06

## Next

Round 1 fails -> the frontier seat authors `bkf1` fix blocks from this list
(P1-2..4 and P2-5..17; P3 where they ride along), dispatch, land, then round 2.
Max 3 rounds (spec section 11).
