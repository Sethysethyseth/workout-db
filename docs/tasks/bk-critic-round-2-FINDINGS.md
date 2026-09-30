# BK coach-persona critic - round 2 FINDINGS (Sept 29, 2026)

Frontier seat (Opus, Playwright MCP), spec section 11. Same persona, same
environment deviation as round 1 (staging Render still not deploying; local
recipe against the migrated staging DB, `demo.critic`), code at `69bed37`
(bkf1a/b/c landed). Screenshots: `.playwright-mcp/bk-critic/round-2/` (#NN).

## Score: 7.5 / 10 - NOT PASSING (bar 8+) - no P0/P1 open, no criterion below 7

| Criterion | R1 | R2 | Evidence |
|---|---|---|---|
| First-block speed | 6 | 8 | Empty days are named before posting with a one-tap "Remove empty days" (#03); new blocks show no false "Saved"; picker ranks catalog matches first; Reps -> Time = 30 s. |
| Mid-set legibility | 7 | 8 | No fake "e.g. 185" on band/bodyweight plans; capped effort placeholder "<= 6"; plan line + coach notes; as planned; over cap (#07). |
| Import trust | 5 | 7 | Opens at the top, program before matching, sticky Create with a busy state, pluralized (#01). Dragged by truncated match rows ("SINGLE-L..." x3, #02) and no word that unmatched names drop out of Analytics. |
| Feel | 6 | 7.5 | Wider toasts, busy states, undo. Bright native scrollbars under the day tiles (fixed in-round, `207c0f2`). |
| Visual coherence | 6 | 7.5 | Day tiles readable (two-line names). Set-grid header still bunched after bkf1a (fixed in-round, `207c0f2`, root cause below); desktop header still covers the second row of the app nav (#11). |
| Coaching fidelity | 6 | 8 | Copy forward skips Deload weeks and says so (#05); finished summary shows the 45 s timed set, SETS 2 (#08); Execution shows evening block sessions with cap-aware language ("pushed ~2 reps past plan", #09). |
| AI optionality | 6 | 8 | Any AI paste works (round-1 P0 fix); coach convert lands in the same preview. |

## Round-1 findings - status

Closed: P0-1, P1-2, P1-3, P1-4, P2-5, 7, 9, 11, 12, 13, 14, 15, 16, 17; P3-18,
19, 20, 21, 22, 23, 24, 25, 27. Closed in-round 2 by direct fix (`207c0f2`):
P2-8 set-grid header - root cause: `bk-ui.css` and `bk-builder.css` both style
`.bk-set-grid`; the builder's flex column inherited `align-items: center`,
shrink-wrapping and centering the header row (152px) while input rows
stretched (282px). Verified header/row column x identical after the fix.
Still open: P2-10 (desktop header offset, partially fixed - see 2 below).

## Findings (ranked) - round 2

### P2
1. **Import match rows truncate names** to ~8 characters at 390px (the
   compact row still carries "Not in your library" + "Keep as typed" per
   row) - three "SINGLE-L..." rows are indistinguishable. #02
2. **Desktop header still covers the app nav's second row.** bkf1a set a
   fixed 64px offset; at 1280px the app nav renders as two rows (~100px),
   so "Library/History/..." sit under the block header. Needs the real nav
   height. #11
3. **Unmatched names silently drop out of Analytics.** Seth's program has
   21 of 29 names outside the catalog; those exercises import and log fine
   but never count toward muscle volume, strength or Execution (Feet-Up
   Bench Press logged tonight is absent from Execution, #09). The preview
   must say so where the user decides "Match..." vs keep. (Product note for
   Seth - A4/A6 name resolution: auto-creating custom exercises for
   unmatched imports would not fix this either, since custom exercises
   carry no catalog muscles.)
4. **"No rest" wraps to two lines** in the rest stepper's 52px value cell. #04

### P3
5. Stats line wraps mid-phrase ("36 / EXERCISES · 100 SETS") at 390px.
6. "bench press" search ranks "Bench Press - Powerlifting" above "Barbell
   Bench Press - Medium Grip" (acceptable; catalog naming).

## Next

Round 3 - the last (spec section 11: max 3 rounds). `bkf2-critic-round-2-fixes.md`
covers P2-1..4; land it, then the final round.
