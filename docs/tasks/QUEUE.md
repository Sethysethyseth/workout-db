# QUEUE - task-queue index (single writer: Claude Code)

Format: `<status> | <file> | <one-line scope> | <notes>`
Statuses: DRAFT / QUEUED / DISPATCHED / AWAITING-REVIEW / LANDED <sha> / BOUNCED
(protocol in README.md)

## Active

Dispatch order: U10 -> U8 -> U9, strictly serialized (all three touch
client/src/index.css; U8/U9 also share AnalyticsPage.jsx). Seth critiques
each unit's visuals on the staging Vercel deploy after it lands before
dispatching the next.

- QUEUED | u10-home-hero-dead-space.md | home layout fix (grid align-content stretch = hero dead space) + weekly-report set-count formatting | client-only; root cause pre-diagnosed in the block; from Seth's July 3 U7 staging smoke
- QUEUED | u8-volume-trend-strength-sparklines.md | volume Bars|Trend|Table small multiples + strength e1RM sparklines off B9 series | client-only; delta chip MUST derive from e1rmSeries endpoints, not e1rmTrend
- QUEUED | u9-execution-legibility-balance-polish.md | execution concrete plan-vs-actual line + deterministic verdict; balance zone band + ghost tracks | client-only

## Candidates (next units, not yet authored as blocks)

- A5 exercise picker (UI, Cursor-suited once A4 FK design is done)
- A6 name-resolution backfill/aliasing (Cursor-suited, needs A4 first)
- T3 dynamic loading screens (UI, file-disjoint from Track A -> a natural
  first Mode 2 parallel pair once designed)
- NOT queueable: A1 catalog merge (gated migration, Seth manual), A4 FK
  schema design (Claude-tier planning, not a Cursor unit)

## Landed

- LANDED f22989d | u7-home-weekly-report.md | weekly report band on Home (last-7-days vs prior-7-days, under the hero) | review clean (build re-run, no-hex grep, sessions endpoint unlimited); Seth smoked it July 3 on staging - band accepted, two layout/formatting critiques spun off as U10
- LANDED c7acb43 | b9-analytics-time-series.md | weekly volume series + per-session e1RM series + execution planned/actual summaries | reviewer tightened the inclusive-end bucket assertion; 103/103 unit lane
- LANDED 00c67dc | b8-rpe-effort-pooling.md | RPE pooled with RIR as one effort signal engine-wide
- LANDED d4b1d72 | u6-weight-unit-pref.md | lbs/kg display pref in log prefs + analytics
