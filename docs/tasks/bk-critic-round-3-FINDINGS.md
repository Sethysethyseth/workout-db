# BK coach-persona critic - round 3 FINDINGS (Sept 29, 2026) - PASS

Frontier seat (Opus, Playwright MCP), spec section 11, final round. Same
persona; same environment deviation as rounds 1-2 (staging Render still not
deploying - local recipe against the migrated staging DB, `demo.critic`),
code at `9082443` (bkf2 landed). Screenshots: `.playwright-mcp/bk-critic/round-3/`.

## Score: 8 / 10 - PASS (8+, no criterion below 7, no P0/P1 open)

| Criterion | R1 | R2 | R3 |
|---|---|---|---|
| First-block speed | 6 | 8 | 8 |
| Mid-set legibility | 7 | 8 | 8 |
| Import trust | 5 | 7 | 8 |
| Feel | 6 | 7.5 | 8 |
| Visual coherence | 6 | 7.5 | 8 |
| Coaching fidelity | 6 | 8 | 8 |
| AI optionality | 6 | 8 | 8 |

## Round-2 findings - status (all P2 closed)

1. Import match rows - CLOSED: full names wrap, no truncation measured at
   390px; "Match..." is the row's only control. #04
2. Desktop header vs app nav - CLOSED: StickyHeader measures `header.nav`
   (Navbar) - header top 101px = nav bottom 101px at 1280x800 in the builder
   AND the run view, page scrolled.
3. Unmatched names vs Analytics - CLOSED: "Not in your library (23)", "Kept
   exactly as typed unless you match them.", and the plain-language
   consequence sentence. #04
4. Rest stepper - CLOSED: 0 reads "None" (aria "No rest") on one line, 44px. #05
Also re-verified: set-grid header columns aligned (#05); day picker without
native scrollbars.

## Open (P3, not blocking - candidates for a later polish pass)

- Stats line wraps mid-phrase at 390px ("36 / EXERCISES · 100 SETS").
- The "Match..." link sits on its own line under short names (loose rows).
- Picker: "bench press" ranks "Bench Press - Powerlifting" before "Barbell
  Bench Press - Medium Grip" (catalog naming).
- Product note for Seth (A4/A6): 21 of 29 names in his Phase-1 sheet are
  outside the catalog - they import and log, but only matched names reach
  Analytics. The preview now says so; matching is one tap per name.

## Caveat carried to Seth's smoke

All three rounds ran on the local recipe because staging Render never
deployed the wave. The code is identical to `origin/ai-connector-wave`, but
the deployed stack (Render + Vercel preview) has NOT been exercised - Seth's
smoke on the staging Vercel deploy is the first real-host run.
