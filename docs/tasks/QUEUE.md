# QUEUE - task-queue index (single writer: Claude Code)

Format: `<status> | <file> | <one-line scope> | <notes>`
Statuses: DRAFT / QUEUED / DISPATCHED / AWAITING-REVIEW / LANDED <sha> / BOUNCED
(protocol in README.md)

## Active

- QUEUED | b9-analytics-time-series.md | weekly per-muscle volume series + per-session e1RM series + execution planned/actual concrete summaries (engine-only, additive) | unblocks the U7-U9 analytics UI wave; no controller/DB surface

## Candidates (next units, not yet authored as blocks)

- U7 weekly report hero on Home (last-7-days vs prior-7-days deltas under
  Start Workout; client-only, two getSummary calls) - author after B9 lands
- U8 volume trend view (Bars|Trend|Table segmented) + strength sparklines
  (consume B9 series) - author after B9 lands
- U9 execution comprehension rework (concrete plan-vs-actual display +
  plain-language verdict, consumes B9 planned/actual) + balance card polish
  (diverging scale, balanced-zone band, ghost tracks on degraded rows)
- A5 exercise picker (UI, Cursor-suited once A4 FK design is done)
- A6 name-resolution backfill/aliasing (Cursor-suited, needs A4 first)
- T3 dynamic loading screens (UI, file-disjoint from Track A -> a natural
  first Mode 2 parallel pair once designed)
- NOT queueable: A1 catalog merge (gated migration, Seth manual), A4 FK
  schema design (Claude-tier planning, not a Cursor unit)

## Landed

- LANDED 00c67dc | b8-rpe-effort-pooling.md | RPE pooled with RIR as one effort signal engine-wide
- LANDED d4b1d72 | u6-weight-unit-pref.md | lbs/kg display pref in log prefs + analytics
