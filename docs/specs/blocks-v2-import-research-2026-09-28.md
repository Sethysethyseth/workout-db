<!-- Preserved Sept 28, 2026 from Cursor report lane recon/blocks-b3 (web research, --model auto) during the blocks-v2 authoring session (Opus). Verbatim below; claims carry their own URLs and were not re-verified by the frontier seat beyond spot checks. Referenced by docs/specs/blocks-v2.md. -->

# RECON-B3 — Program import + block builder UX (web research)

Report-only research for LogChamp wave: program/block import, MCP create, AI assist, phone-first builder. Every factual claim has a URL. Gaps marked **NOT FOUND**.

---

## 1. Gymvanna (and spelling variants)

### Verdict

**NOT FOUND** as a weightlifting / workout-tracker product with a documented program/block import feature.

### Searches run

- `Gymvanna app program import training block feature`
- `Gymvana OR "Gym Vanna" OR GymVanna weightlifting app`
- `"gymvanna" OR "gym vanna" OR gymvana workout OR training OR program OR import site:reddit.com`
- `Gymvanna fitness app App Store program import AI`
- `"gymvanna" OR "gym vanna" OR gymvana lifting OR hevy OR strong OR program`
- `"similar to Gymvanna" OR Gymanna OR "Gym Anna" workout tracker`
- Repo grep for `Gymvanna|Gymvana|gymvana|Gym Vanna` in this worktree: no matches

### What turned up under similar names

| Name | What it is | Program import? | Source |
| --- | --- | --- | --- |
| **Gymvana** (`gymvana.net`) | Shopify store selling gym equipment (dip belts, weighted vests, etc.), registered ~Apr 2025 | No software/import feature found | https://www.merchantgenius.io/shop/url/gymvana.net |
| **GymVision** | AI workout planner; import workouts from TikTok / Instagram / YouTube links; gym equipment scan | Social-link import of *workouts*, not a documented multi-week block import from spreadsheets/PDFs | https://gymvision.app/ ; https://apps.apple.com/tm/app/gymvision-ai-workout-planner/id6752872750 |
| **Genova / Novana** | AI workout trackers (name-adjacent only) | NOT FOUND for Gymvanna-style block import | https://mwm.ai/apps/gymup-ai-workout-tracker/6758448477 ; https://apps.apple.com/ml/app/ai-fitness-tracker-novana/id6757356294 |

### Closest *feature* matches if the PO meant “AI import a program from outside the app”

These are **not** named Gymvanna; listed only as candidates for what “similar to this” might refer to:

- **BridgeAthletic Import with AI** — PDF / spreadsheet / image / paste → structured phase (see §4). https://intercom.help/bridgeathletic/en/articles/14305448-how-to-import-training-programs-with-ai
- **Workd** — screenshots, social posts, web links → routines. https://workd.fit/
- **Fitness Gen** — screenshots / notes / images → runnable session with review. https://fitnessgen.app/
- **Kinoku Photo Import** — photo/screenshot → routine with pre-save review. https://kinoku.app/features/photo-import
- **Hevy @hevy ChatGPT app** (successor to HevyGPT) — generate plans and save to Hevy; Reddit users report screenshot upload into HevyGPT historically. https://www.hevyapp.com/features/hevy-gpt/ ; https://www.reddit.com/r/Hevy/comments/1mp4u1s/import_workouts/

**Action for authoring:** Ask the PO for the correct product name / App Store link. Do not treat Gymvana.net or GymVision as confirmed “Gymvanna.”

---

## 2. Other apps — what a user can get OUT (programs vs history)

Legend: **Programs** = reusable multi-session / multi-week templates. **History** = logged workouts only.

### Hevy

- **History export:** Official CSV via Profile → Settings → Export & Import Data → Export Workouts. One row per set. Cannot re-import into Hevy. https://griptapp.com/help/export-workouts-from-hevy ; Hevy’s own screen cited there as stating no re-import.
- **Exact history CSV headers** (from an actual export, Taper):  
  `title, start_time, end_time, description, exercise_title, superset_id, exercise_notes, set_index, set_type, weight_lbs, reps, distance_miles, duration_seconds, rpe`  
  Source: https://thetaperapp.com/articles/how-to-export-hevy-data/  
  Note: Gript documents `weight_kg` **or** `weight_lbs` depending on unit setting, plus optional extras; same snake_case family. https://griptapp.com/help/export-workouts-from-hevy
- **Programs/routines export:** **NOT in the workout CSV.** Routines/templates are not exported. https://thetaperapp.com/articles/how-to-export-hevy-data/ ; https://griptapp.com/help/export-workouts-from-hevy
- **Program share (in-ecosystem):** Share Routine / Share Folder → hevy.com link; recipients save to their profile. Not a portable file format. https://www.hevyapp.com/features/share-folders-routines/
- **Program create via AI/API:** Hevy ChatGPT app (`@hevy`) builds plans and saves to account; free Hevy account works for the plugin. https://www.hevyapp.com/features/hevy-gpt/  
  Older HevyGPT + `POST /v1/routines` JSON path documented by community. https://www.reddit.com/r/Hevy/comments/1kr2aw9/how_i_used_chatgpt_hevy_api_to_autoupload/ ; https://github.com/hevyapp/hevy-gpt

### Strong

- **History export:** Official CSV. iOS: Settings → Export Strong Data; Android: Settings → Export Data. Cannot re-import into Strong. https://help.strongapp.io/article/235-export-workout-data
- **Exact history CSV headers** (sample export + importers agree):  
  `Date, Workout Name, Duration, Exercise Name, Set Order, Weight, Reps, Distance, Seconds, Notes, Workout Notes, RPE`  
  Sources: https://github.com/AlexandrosKyriakakis/StrongAppAnalytics/blob/main/Data/strong.csv ; https://griptapp.com/help/export-workouts-from-strong  
  Weight column has **no unit** in the file. https://griptapp.com/help/export-workouts-from-strong  
  Variants: semicolon delimiter; older `Weight (kg)` / `Weight (lbs)` headers. https://liftshift.app/supported-apps/strong/
- **Programs/templates export:** **NOT in workout CSV.** Share links for individual workouts/templates exist. https://help.strongapp.io/article/235-export-workout-data ; https://griptapp.com/help/export-workouts-from-strong

### Boostcamp

- **Program out:** Custom Program Creator → save in-app; **share private/public link**; recipient taps save. Explicitly “No export, no steps” for getting the program into the app — programs stay Boostcamp-native. https://www.boostcamp.app/custom-program
- **History export:** Native CSV **NOT FOUND**. Community Chrome extension / SQLite workarounds. https://www.reddit.com/r/Boostcamp/comments/1mvura5/can_i_download_my_historical_data/ ; https://github.com/sakibchy/boostcamp-exporter

### Liftosaur

- **Documented program language:** **Liftoscript** (text DSL for weeks/days/sets/progressions). https://www.liftosaur.com/doc/liftoscript
- **Program import:** Paste / import a program **link** (web editor → “Import link” in app). https://www.liftosaur.com/ ; https://www.liftosaur.com/blog/posts/launched-workout-planner/
- **API create:** `POST /api/v1/programs` with `{ name, text }` where `text` is Liftoscript. https://www.liftosaur.com/doc/api
- **MCP write tools:** `create_program`, `update_program`, `delete_program` (plus history CRUD). https://www.liftosaur.com/doc/mcp
- **History:** API / MCP / in-app JSON export path referenced; structured as Liftoscript Workouts text. https://www.liftosaur.com/doc/api

### JEFIT

- **History:** Website export CSV (My Jefit → Settings → Data Controls → Export Data). Multi-section file; editing in Sheets can break structure. https://griptapp.com/help/import-from-jefit ; https://www.reddit.com/r/jefit/comments/18ympdt/data_export_possible/
- **Programs export as portable format:** **NOT FOUND** in those sources (history-focused).

### TrainHeroic

- **Training plan export:** Official answer: **no** way to export training plans or history (older article). https://support.trainheroic.com/hc/en-us/articles/18156474632717-Is-there-a-way-to-export-my-training-plan-or-history
- **GDPR / personal data:** Athlete web portal → CSV zip of history, profile, messages, readiness, nutrition — still not a reusable “program file.” https://support.trainheroic.com/hc/en-us/articles/19026188372621-As-an-athlete-how-do-I-download-my-personal-data-GDPR-Export

### Alpha Progression

- **CSV export (free tier):** Plans, full workout history, custom exercises, body measurements. https://alphaprogression.com/en/blog/alpha-progression-guide
- **Plan share:** Share plans/workouts via link (template structure: name, exercises, targets, supersets — not logged personal sets). https://alphaprogression.com/en/blog/alpha-progression-guide
- **Exact CSV column headers for plan or history export:** **NOT FOUND** in public docs searched (feature confirmed; schema not published on the pages above).

### Juggernaut AI

- **CSV workout-history export:** Conflicting secondary sources. Fitness Volt comparison table marks export “Yes.” https://fitnessvolt.com/rpe-training/comparisons/rpe-calculator-vs-juggernautai/  
  Alpha Progression migration guide: **could not verify** a current publicly documented one-click CSV history export. https://alphaprogression.com/en/blog/best-juggernautai-alternatives  
  Older third-party changelog text mentions “Improvements to CSV Export.” https://juggernautai-strength-training-workouts.apps112.com/  
- **Program/template portable export format:** **NOT FOUND**. Workout sharing is social image / session summary oriented. https://www.juggernautai.app/blog/juggernautai-25

### RP Hypertrophy (app)

- **Export plans or history as CSV/file:** User reports and Reddit: **no export**; screenshots / copy-paste only. https://www.reddit.com/r/RPHypertrophy/comments/1ey7esg/questions_about_the_app/ ; https://www.reddit.com/r/RPStrength/comments/1glzhnz/share_or_export_plan_to_trainer/
- **Spreadsheet programs (separate product):** RP sells programming as spreadsheets (outside the hypertrophy web app). https://www.reddit.com/r/RPHypertrophy/comments/1ey7esg/questions_about_the_app/
- **Community Liftosaur ports** of RP-style mesocycles exist as Liftoscript templates. https://www.reddit.com/r/liftosaur/comments/1kiurgi/rp_hypertrophy_program_v4_release/

### Fitbod

- **History CSV:** Log → Settings gear → Export Workout Data.  
  Headers: `Date, Exercise, Reps, Weight(kg), Duration(s), Distance(m), Incline, Resistance, isWarmup, Note, multiplier`  
  Sources: https://changemap.co/ntl/reflect/task/10488-support-fitbod-csv-import-date/ ; https://github.com/rhnfzl/fitbod-report
- **Generated routines / programs in export:** **No** — Gript: “Fitbod's generated routines aren't part of the export.” https://griptapp.com/help/import-from-fitbod
- Share links (`go.fitbod.link`) carry no workout data for importers. https://griptapp.com/help/import-from-fitbod

### Liftin'

- **Import history:** Supports Strong and Hevy CSV (dev confirmation). https://www.reddit.com/r/LiftinApp/comments/1oxxzkh/no_workout_found_when_importing_csv/
- **Import plans/programs from CSV or ChatGPT file:** **Not currently possible**; users request it; founder: “not possible currently but definitely something I will explore.” https://www.reddit.com/r/LiftinApp/comments/1ppqnpd/import_plans/
- **Export:** Mentioned vaguely in API-request thread (“You can achieve that using the export”) — **exact format / program export: NOT FOUND**. https://www.reddit.com/r/LiftinApp/comments/1r9gfzi/feature_request_api_access/

### Stronglifts

- **History CSV:** Settings → Export Data → share CSV. https://support.stronglifts.com/article/131-export
- **Import CSV back / program file export:** Explicitly cannot import CSV onto a new device; use account sync. Program-as-file export **NOT FOUND**. https://support.stronglifts.com/article/131-export

### Summary table (realistic OUT for LogChamp import)

| App | Programs/routines out | History out | Best portable artifact |
| --- | --- | --- | --- |
| Hevy | Share link only (not file) | CSV (headers above) | History CSV; routines via link/API/AI |
| Strong | Share link for templates | CSV (headers above) | History CSV |
| Boostcamp | In-app share link | No official CSV | Program link (Boostcamp-only) |
| Liftosaur | Liftoscript text + import link + API/MCP | API / Liftoscript Workouts | **Liftoscript** |
| JEFIT | NOT FOUND as file | Website CSV | History CSV |
| TrainHeroic | No | GDPR CSV zip (history), not plan | Weak for programs |
| Alpha Progression | CSV export of plans (schema NOT FOUND) + share link | CSV | Plan CSV / share link |
| Juggernaut AI | NOT FOUND | Unverified / disputed | Manual recreate |
| RP Hypertrophy | No | No | Screenshots / buy sheets / Liftosaur ports |
| Fitbod | No | CSV (headers above) | History CSV |
| Liftin' | No | Unclear / not for plans | Strong/Hevy as *input* to Liftin' |
| Stronglifts | No | CSV | History CSV |

---

## 3. Spreadsheet programs — layout + importer must-handles

### How popular programs are distributed

| Program family | Typical distribution | Layout notes | Sources |
| --- | --- | --- | --- |
| **nSuns 5/3/1 LP** | Google Sheets / Excel bundles (4/5/6-day, variants) on Lift Vault etc. | Sets as **% of Training Max** (TM ≈ 90% of 1RM); main + secondary lifts; **AMRAP** denoted by `+` (e.g. `1+`); yellow highlight on AMRAP in original sheets; weekly TM bump from AMRAP reps | https://liftvault.com/programs/powerlifting/n-suns-lifting-spreadsheets/ ; https://www.drworkout.fitness/nsuns-programs-with-spreadsheet/ |
| **GZCLP** | Google Sheets (blacknoir v4.x) + Excel/Dropbox macros | Day = **T1 / T2 / T3**; T1 ~5×3+ @ ~85% TM; T2 ~3×10 @ ~65% TM; T3 ~3×15+; last set AMRAP; stage drops (5×3+ → 6×2+ → 10×1+) | https://liftvault.com/programs/powerlifting/gzclp-program-spreadsheets/ ; http://swoleateveryheight.blogspot.com/2016/02/gzcl-applications-adaptations.html ; https://www.dayoneapp.fit/programs/gzclp |
| **5/3/1 BBB** | Spreadsheets + app ports (e.g. Liftosaur) | Weekly wave of % of TM/1RM; BBB supplemental **5×10 @ ~50%**; week 4 deload percentages; AMRAP on top set (`5+`, `3+`, `1+`) | https://www.liftosaur.com/programs/the531bbb ; https://hardy.app/articles/531-vs-gzclp-vs-nsuns |
| **Jeff Nippard** | Paid PDF + **Excel tracking sheet** | Columns like **SETS / REPS / RPE / REST / NOTES / LSRPE**; load entry cells; not %TM grids | https://jeffnippard.com/products/fundamentals-hypertrophy-program ; https://kszd.mk/wp-content/uploads/2023/08/09-2-D0BED0B4-09.08.2023-JeffNippardFundamentalsHypertrophy.pdf.pdf ; Scribd sheet excerpt showing `Reps / Duration | Load (kg) | RPE | Rest` https://www.scribd.com/document/686370989/Fundamentals-Programs-3htdqv |
| **RP templates** | Paid Excel/Sheets (separate from RP Hypertrophy web app) | Meso/RIR-style programming in sheets; exact column schema **NOT FOUND** in free public docs this pass | https://www.reddit.com/r/RPHypertrophy/comments/1ey7esg/questions_about_the_app/ |

### Typical structural patterns (what an importer sees)

- **Week × day × exercise rows** (or one sheet per week / day).
- **Percentage of TM or 1RM** cells with formulas (absolute kg/lb computed).
- **Rep scheme strings:** `3x8`, `5x3+`, `3x8-10`, `5/3/1`, `1x5+`.
- **AMRAP / “+”** on final sets; progression tables keyed off AMRAP result.
- **RPE / RIR / LSRPE** target columns (hypertrophy sheets).
- **Rest** as `3-4min` text.
- Accessory blocks freer-form than main lifts.

### What an importer must handle

| Construct | Why it matters | Evidence |
| --- | --- | --- |
| `%1RM` / `%TM` | Absolute load depends on user max + rounding | nSuns / 5/3/1 / GZCLP docs above |
| `AMRAP` / trailing `+` | Not a fixed rep count; drives progression | https://liftvault.com/programs/powerlifting/n-suns-lifting-spreadsheets/ |
| `3x8-10` / ranges | Target is a range, not a single rep | Common on Nippard-style sheets (RPE + range) |
| `5/3/1+` wave notation | Different set prescriptions per week | https://www.liftosaur.com/programs/the531bbb |
| RPE / RIR targets | Intensity without fixed load | Nippard PDF columns; Alpha Progression RIR periodization https://alphaprogression.com/en/fact-sheet |
| Timed sets (`45 sec`, duration columns) | Planks/carries; Fitbod/Hevy use duration fields | Fitbod `Duration(s)`; Hevy `duration_seconds` |
| Per-side / unilateral | Liftosaur RP port notes set counts for unilateral no longer auto-doubled | https://www.reddit.com/r/liftosaur/comments/1kiurgi/rp_hypertrophy_program_v4_release/ |
| Supersets | Grouping metadata (Hevy `superset_id`; builder UX) | https://thetaperapp.com/articles/how-to-export-hevy-data/ |
| Warm-ups | Separate from working sets (Fitbod `isWarmup`; Hevy `set_type=warmup`) | Same sources |
| Deload weeks | Different % and volume | 5/3/1 week 4 in Liftosaur BBB program |

---

## 4. AI-assisted program import (paste / screenshot → structured)

### Who does it (documented)

| Product | Inputs | AI role | Review before save | Known limits / failure modes | Source |
| --- | --- | --- | --- | --- | --- |
| **BridgeAthletic Import with AI (beta)** | Upload: PDF, JPG, PNG, WebP, CSV, MD, TXT (≤2 MB, ≤25 pages, ≤45 workouts). Paste: ≤40k chars | Reads workouts → matches library → builds phase/blocks/sets | Unmatched exercises: Create / Replace / Skip; then Week View + Load Progression View spot-check | Multi-week up to ~10 min; alternatives go to **notes**, not programmed alts; context instructions help abbreviations; undo = delete phase | https://intercom.help/bridgeathletic/en/articles/14305448-how-to-import-training-programs-with-ai |
| **Fitness Gen** | Screenshots, images, handwritten, notes | Extracts exercises, sets, reps, rest | “Review and edit before you start” | Marketing FAQ claims high accuracy; independent failure-rate data **NOT FOUND** | https://fitnessgen.app/ |
| **Kinoku Photo Import** | Camera photo or screenshot (on-device) | OCR/parse days, exercises, sets/reps, weights, rest, RPE; match library | Review screen marks unclear numbers / assumed set counts; new-exercise chips; “never guesses a weight into your routine” | Handwriting best-effort; Latin scripts only; Japanese/Korean/Cyrillic → paste text faster | https://kinoku.app/features/photo-import |
| **Workd** | Screenshots, social posts, website uploads | AI import to routines | Site emphasizes view/change after import | Detailed failure modes **NOT FOUND** on landing page | https://workd.fit/ |
| **EVOX** | Photo of whiteboard / screenshot / PDF / handwriting | OCR + fitness NLP (AMRAP, EMOM, %, CrossFit notation) | Implied edit after scan | Messy handwriting needs edits; multi-page up to 5 photos | https://www.getevox.fit/import-workout-photo |
| **Kiron** | Paste AI chatbot plan text | Parser maps exercises/sets/reps | Positioning: paste → ready; fine-grained review UX **NOT FOUND** on marketing page | Designed for messy AI output | https://trykiron.com/ |
| **Hevy ChatGPT / HevyGPT** | Prompted generation; Reddit: screenshots into GPT | Creates routines/folder via API | User asks to save; HevyGPT historically create-only (no delete/update existing) | Android ChatGPT limits on old GPT; free Hevy limited routines historically; exercise matching quirks | https://www.hevyapp.com/features/hevy-gpt/ ; https://www.reddit.com/r/Hevy/comments/1kl1t8y/introducing_hevygpt/ ; https://www.reddit.com/r/Hevy/comments/1mp4u1s/import_workouts/ |
| **Lyfta community tool** | Excel/PDF → Gemini → Lyfta upload | Structures + matches Lyfta DB | Community OSS | Progression/weight logic across weeks questioned by users | https://www.reddit.com/r/Lyfta_App/comments/1m1aszm/community_tool_import_workouts_from_excelpdf_into/ |
| **Gript AI import** | Notebooks, spreadsheets, photos of logbooks (history-oriented) | Mentioned as AI import of unstructured history | Importer matching UX elsewhere | Product is history-first, not multi-week program builder | https://griptapp.com/help/export-workouts-from-hevy |

### Failure modes (cross-cutting, sourced)

- **Exercise name mismatch** → replace/create/skip UX (Bridge). https://intercom.help/bridgeathletic/en/articles/14305448-how-to-import-training-programs-with-ai
- **Abbreviations / house notation** without context (“SS”, “RIR”, “BB”). Same Bridge tip.
- **Alternatives / progressions** flattened to notes or lost. Bridge: alternatives → notes only.
- **Handwriting / non-Latin scripts.** Kinoku.
- **Multi-week phases slow / timeout.** Bridge ≤10 minutes guidance.
- **History vs program confusion** — most consumer CSV exports are history, not templates (Hevy/Strong/Fitbod).

---

## 5. Block/program builder UX — phone-first patterns worth copying

| # | Pattern | App | Detail | Source |
| --- | --- | --- | --- | --- |
| 1 | **Folder = program; routine = day** | Hevy | Programs saved as folders of routines; drag-reorder folders/routines; duplicate routine as foundation | https://www.hevyapp.com/features/gym-routines/ |
| 2 | **Desktop builder, phone runner** | Boostcamp | Web creator maps weeks/sessions; save → appears in app immediately; share link | https://www.boostcamp.app/custom-program |
| 3 | **Text DSL + web editor for complex blocks** | Liftosaur | Liftoscript in text field; phone typing tedious → web editor + import link; MCP/AI for authoring | https://www.liftosaur.com/ ; https://www.liftosaur.com/doc/liftoscript |
| 4 | **Fast set editing: + Add Set, swipe delete, inline kg/reps** | Hevy | Tap cells for weight/reps; TIME for duration; three-dot: reorder, replace, superset, warm-ups | https://www.hevyapp.com/features/exercise-programming-options/ |
| 5 | **Post-session “update template” ladder** | Strong | After workout from template: Update Template / Update Values Only / Update Template and Values / Keep Original (destructive update warned in red) | https://help.strongapp.io/article/177-update-template |
| 6 | **Built-in auto-progression + periodization/deloads in plan** | Boostcamp / Alpha Progression | Boostcamp: percentages, AMRAP, deload, auto-progression on programs. Alpha: periodization, deloads, RIR, progression recommendations | https://www.boostcamp.app/vs/hevy ; https://alphaprogression.com/en/fact-sheet |
| 7 | **Week view + load progression review after AI import** | BridgeAthletic | Imported phase opens in Week View; Load Progression View to verify multi-week loading | https://intercom.help/bridgeathletic/en/articles/14305448-how-to-import-training-programs-with-ai |
| 8 | **Playground / dry-run before commit** | Liftosaur MCP | `run_playground` simulates sets/progressions before `create_program` / `update_program` | https://www.liftosaur.com/doc/mcp |

**Also useful (narrower):** Athlete Analyzer “training blocks” = select weeks → reusable importable block; copy week between plans. https://www.athleteanalyzer.com/post/training-blocks-reuse-your-best-plans

**Gap for LogChamp:** Explicit **copy-week / duplicate-day** as a named control is well documented for Athlete Analyzer and implied by Hevy duplicate-routine + Boostcamp multi-week mapping; a dedicated “copy week N → week N+1 with +X kg” control with a public how-to was **NOT FOUND** as a standalone Hevy feature page in this pass.

---

## 6. MCP write tools — safe expose patterns

### Spec: tool annotations (quote)

From MCP schema (`2025-06-18`):

> Additional properties describing a Tool to clients.  
> **NOTE: all properties in ToolAnnotations are hints.** They are not guaranteed to provide a faithful description of tool behavior… **Clients should never make tool use decisions based on ToolAnnotations received from untrusted servers.**

Fields:

- `title?: string` — human-readable title  
- `readOnlyHint?: boolean` — If true, the tool does not modify its environment. **Default: false**  
- `destructiveHint?: boolean` — If true, may perform destructive updates; if false, only additive. Meaningful only when `readOnlyHint == false`. **Default: true**  
- `idempotentHint?: boolean` — Repeated calls with same args have no additional effect. Meaningful only when `readOnlyHint == false`. **Default: false**  
- `openWorldHint?: boolean` — May interact with an open world of external entities. **Default: true**

Source: https://modelcontextprotocol.io/specification/2025-06-18/schema  

Also (tools chapter, `2025-03-26`): clients **MUST** consider annotations untrusted unless from trusted servers; applications **SHOULD** present confirmation prompts for operations (human in the loop). https://modelcontextprotocol.io/specification/2025-03-26/server/tools  

Maintainer blog restates the TypeScript interface and that defaults are pessimistic (unannotated ≈ write + destructive + non-idempotent + open-world). https://blog.modelcontextprotocol.io/posts/2026-03-16-tool-annotations/

### How Claude’s connector UI treats non-read-only tools

Anthropic Help Center (connectors):

- Connectors Directory pages document **read/write capabilities**.
- Team/Enterprise Owners can set per-tool / per-category permissions: **Always allow**, **Needs approval**, or **Blocked**, categorized e.g. “read-only tools” vs “write/delete tools.”
- Even when Claude allows a write, source-system permissions still apply.

Source: https://support.anthropic.com/en/articles/11176164-pre-built-web-connectors-using-remote-mcp  

Kiteworks’ Claude Desktop guide (illustrative of the same permission model): recommend read-only → Always allow; write/delete → **Needs approval** (per-call confirmation). https://developer.kiteworks.com/configure-mcp-connector-claude.html  

Claude connector building docs require declaring `readOnlyHint` / `destructiveHint` on tools. https://claude.com/docs/connectors/building/mcp  

**Per-call approval is therefore configurable (Needs approval), not an unconditional always-on for every write** — but it is the recommended / org-enforceable pattern for mutating tools.

### Common safe write patterns (sourced)

| Pattern | Example | Source |
| --- | --- | --- |
| **Annotate honestly** | `readOnlyHint: true` on reads; `destructiveHint: false` on additive creates; destructive deletes marked true | https://blog.modelcontextprotocol.io/posts/2026-03-16-tool-annotations/ |
| **Create-only / non-destructive AI surface** | HevyGPT: create routines/folders only; “can't do anything potentially destructive like updating or delete existing routines” | https://www.reddit.com/r/Hevy/comments/1kl1t8y/introducing_hevygpt/ |
| **Validate then write** | Liftosaur: `run_playground` / `get_program_stats` before `create_program` / `update_program` | https://www.liftosaur.com/doc/mcp |
| **Human review UI after AI structure** | Bridge unmatched-exercise gate; Kinoku review screen before save | Bridge + Kinoku URLs in §4 |
| **Server-side elicitation** | Couchbase MCP: confirmation-required tool list before execute | https://mcp-server.couchbase.com/configuration/elicitation-for-tools |
| **Draft → user confirms in-app** | Implicit in Fitness Gen / Kinoku “review before start/save”; Boostcamp “save → appears in app” is human-initiated save on builder | https://fitnessgen.app/ ; https://kinoku.app/features/photo-import ; https://www.boostcamp.app/custom-program |

**LogChamp-relevant takeaway:** Expose MCP **create_block_draft** (additive, `destructiveHint: false`, `idempotentHint` carefully set) that lands a **draft** requiring in-app confirm; keep `delete_*` / overwrite behind `destructiveHint: true` + Claude “Needs approval”; never rely on annotations alone for security (spec).

---

## Research gaps (explicit)

1. **Gymvanna product identity** — NOT FOUND; need PO clarification.  
2. **Alpha Progression / Juggernaut / JEFIT / Stronglifts exact program-export schemas** — history/plan export existence varies; column-level schemas mostly NOT FOUND except Strong/Hevy/Fitbod history.  
3. **RP official spreadsheet column layout** — NOT FOUND in free public docs this pass.  
4. **Claude always-on per-call approval for custom connectors on Free/Pro** — org “Needs approval” documented for Team/Enterprise; individual Free/Pro default UX for unannotated write tools not fully detailed beyond general human-in-the-loop SHOULD in the MCP spec.

---

*End of RECON-B3. No code or other repo edits.*

