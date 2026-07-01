# Muscle Weights Rationale

This document explains the reasoning behind each entry in `muscle-weights.json`. When tuning these numbers, update this document at the same time. Numbers without rationale are numbers we can't defend.

## Principles

- **Weights sum to 1.0 per exercise.** This makes per-set volume contributions add up to "one set of work" total across muscles, which keeps cross-exercise aggregation honest.
- **Primary mover gets the largest share.** Synergists get smaller shares proportional to their contribution under load.
- **These are estimates.** EMG studies disagree, biomechanics vary by individual, and load distribution shifts with form. The honesty principle (master prompt) requires that we never present these as measured truth in the UI.
- **Curation is for high-impact compounds only.** Isolation exercises stay on the default multiplier model (primary 1.0, secondary 0.5). Curating bicep curls adds noise without insight.

## Entries

### Bench press family

- **Flat barbell bench (medium grip, powerlifting variant):** `chest 0.65 / triceps 0.2 / shoulders 0.15`. Chest is the prime mover; triceps lock out; front delts assist throughout. Consensus weights across most lifting literature.
- **Close-grip bench:** `triceps 0.5 / chest 0.35 / shoulders 0.15`. Narrower grip shifts emphasis to triceps; still a chest exercise but secondary.
- **Incline barbell (medium grip):** `chest 0.55 / shoulders 0.25 / triceps 0.2`. Incline angle pulls shoulder involvement up significantly; upper chest fibers do more work than lower.
- **Decline barbell:** `chest 0.7 / triceps 0.2 / shoulders 0.1`. Decline reduces shoulder involvement, biases lower pec.
- **Dumbbell variants:** Slightly higher shoulder share than barbell because of stabilization demands. Flat DB `0.6/0.2/0.2`, incline DB `0.5/0.3/0.2`.

### Squat family

- **Back squat (high or low bar default):** `quadriceps 0.55 / glutes 0.25 / hamstrings 0.1 / lower back 0.1`. Quad-dominant by default. Low-bar shifts toward more posterior chain but we're not modeling form variants.
- **Front squat:** `quadriceps 0.65 / glutes 0.2 / lower back 0.1 / hamstrings 0.05`. Upright torso position increases quad emphasis.
- **Box squat:** `quadriceps 0.45 / glutes 0.35`. Pause at parallel reduces stretch reflex, shifts more work to glutes.

### Deadlift family

- **Conventional barbell deadlift:** `hamstrings 0.3 / glutes 0.25 / lower back 0.2 / quadriceps 0.15 / traps 0.05 / lats 0.05`. Whole-body lift. Posterior chain dominant but quads do real work off the floor.
- **Sumo deadlift:** Shifts the lift's geometry — `glutes 0.3 / quadriceps 0.25 / hamstrings 0.2`. More quad/glute, less hamstring than conventional.
- **Romanian / stiff-leg:** `hamstrings 0.5 / glutes 0.3 / lower back 0.2`. No quad involvement to speak of; pure hip hinge.
- **Trap bar:** Sits between conventional and squat — more quad than conventional, more glute than front squat.

### Overhead press family

- **Standing barbell OHP:** `shoulders 0.6 / triceps 0.25 / chest 0.1 / traps 0.05`. Front and side delts do the work; triceps lock out; upper chest assists slightly.
- **Seated variants:** Slightly higher shoulder isolation (no leg drive), so shoulder share goes to 0.65.
- **Dumbbell variants:** Mirror barbell ratios with similar values; DB versions have marginal stabilization differences but not enough to model.

### Row family

- **Bent-over barbell row:** `lats 0.4 / middle back 0.25 / biceps 0.15 / lower back 0.1 / traps 0.1`. Compound horizontal pull. Lats lead; rhomboids/mid-back do significant work; biceps assist; lower back stabilizes isometrically.
- **T-bar / one-arm DB / seated cable:** Variants on the same theme with minor redistribution.

### Vertical pull family

- **Pull-ups:** `lats 0.5 / biceps 0.2 / middle back 0.15 / traps 0.1 / forearms 0.05`. Lats are the prime mover; biceps assist; mid-back and traps engage at the top.
- **Chin-ups:** Supinated grip increases bicep involvement substantially — `lats 0.4 / biceps 0.35`. Often called a back exercise but the bicep contribution is real.
- **Lat pulldown wide / close grip:** Mirror pull-ups but with slightly different ratios based on grip width.

### Dips

- **Chest-version dips:** `chest 0.55 / triceps 0.3 / shoulders 0.15`. Forward lean, elbows flared. Used as a chest builder.
- **Triceps-version dips:** `triceps 0.55 / chest 0.3 / shoulders 0.15`. Upright torso, elbows tucked. Used as a triceps builder.

## What's not curated

The following exercise categories stay on the default multiplier model (primary 1.0, secondary 0.5) because primary/secondary classification from Free Exercise DB is already accurate enough:

- All isolation movements (curls, extensions, raises, flyes, cable single-joint work)
- Machine-based compounds (leg press, hack squat, chest press machine) — these vary too much by machine geometry to curate generically
- Olympic lifts and their derivatives — too form-dependent to model with static weights
- Conditioning and bodyweight cardio movements

When adding new entries, add them to both this file and `muscle-weights.json`, and ensure the sum-to-1.0 rule holds.
