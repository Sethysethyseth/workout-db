# QUEUE - task-queue index (single writer: Claude Code)

Format: `<status> | <file> | <one-line scope> | <notes>`
Statuses: DRAFT / QUEUED / DISPATCHED / AWAITING-REVIEW / LANDED <sha> / BOUNCED
(protocol in README.md)

## Active

- QUEUED | b8-rpe-effort-pooling.md | pool RPE with RIR as one effort signal across the whole engine (RIR = 10 - RPE, explicit RIR wins) | server engine + controller + copy; renames meta.rirCoverage -> effortCoverage
- QUEUED | u6-weight-unit-pref.md | lbs/kg display pref in live-log prefs block + AnalyticsPage labels (display-only, no conversion) | client-only; NOT file-disjoint from B8 (both touch AnalyticsPage.jsx) - serialize, do not run as a Mode 2 pair

## Candidates (next units, not yet authored as blocks)

- A5 exercise picker (UI, Cursor-suited once A4 FK design is done)
- A6 name-resolution backfill/aliasing (Cursor-suited, needs A4 first)
- T3 dynamic loading screens (UI, file-disjoint from Track A -> a natural
  first Mode 2 parallel pair once designed)
- NOT queueable: A1 catalog merge (gated migration, Seth manual), A4 FK
  schema design (Claude-tier planning, not a Cursor unit)

## Landed

(none yet)
