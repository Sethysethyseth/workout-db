# Exercise Aliases Rationale

This document explains `exercise-aliases.json` — the curated map from
colloquial lift names to canonical catalog ids. When adding, removing, or
retargeting an alias, update this document in the same commit. An alias
without a defensible target is a silent attribution error.

## Why this exists (A6)

The vendored catalog (free-exercise-db, 873 entries) has no bare-name
entries for the lifts people actually type: "Bench Press" exists only as
qualified variants ("Barbell Bench Press - Medium Grip", "Dumbbell Bench
Press", ...). With exact-normalized matching only, 9 of 10 common
colloquial names failed to resolve (July 5, 2026 smoke finding), so the
tracked-exercise indicator read "Not tracked" for most real-world logging.

## Principles

- **Aliases are vendored data, not schema.** The catalog itself is a
  vendored file that never touches the database; its aliases live beside
  it. No migration, no per-user state — user-specific names are L3's
  custom-exercise feature, a different layer.
- **Curated and deterministic, never fuzzy.** A fuzzy matcher's false
  positive silently books volume against the wrong muscles. The honesty
  principle prefers a true "Not tracked" over a confident wrong match.
  Every alias maps to exactly one hand-picked target.
- **An alias may not shadow a real catalog name.** `loadCatalog()` warns
  and drops any alias whose normalized form collides with a real entry
  (real names always win at resolve time anyway).
- **One mechanical fold rides along:** a trailing-"s" plural fold (never
  applied after another "s", so "press" is safe) is applied to both
  catalog names and incoming queries at lookup. This resolves "squats",
  "push ups", and singular queries against plural catalog names ("seated
  cable row" -> "Seated Cable Rows") without curating every plural.
- **When a colloquial name is ambiguous, pick the variant a typical
  intermediate lifter means, and prefer targets with curated
  muscle-weights entries.** Attribution differences between variants of
  the same movement are small; being resolved at all matters more.

## Judgment calls (the ambiguous targets)

- **"bench press" / "bench" -> Barbell Bench Press - Medium Grip.** The
  unqualified name means the flat barbell lift; medium grip is the
  catalog's standard variant and has curated weights.
- **"shoulder press" -> Barbell Shoulder Press; "overhead press" / "ohp" /
  "military press" -> Standing Military Press.** Both families are
  shoulders/triceps; the OHP family maps to the standing barbell entry
  because that is what those names mean in lifting vocabulary.
- **"dumbbell press" -> Dumbbell Bench Press.** In a logging context the
  unqualified DB press is the flat bench movement; the overhead one is
  almost always written "shoulder press".
- **"dip" -> Dips - Triceps Version.** The upright parallel-bar dip;
  chest-lean dips are usually logged with a qualifier. Secondary chest
  credit still flows either way.
- **"chest press" -> Machine Bench Press.** "Chest press" is
  machine-context vocabulary.
- **"pec deck" / "pec fly" / "machine fly" -> Butterfly** (the catalog's
  name for the pec-deck machine).
- **"lat pulldown" / "pulldown" -> Wide-Grip Lat Pulldown.** The default
  gym pulldown station movement.
- **"dumbbell row" -> One-Arm Dumbbell Row.** Unqualified DB row means the
  single-arm bench-supported row.
- **"lunge" -> Dumbbell Lunges.** Logged lunges are usually weighted;
  quad/glute attribution is identical across variants.
- **"glute bridge" -> Butt Lift (Bridge)** (bodyweight bridge); the
  barbell version resolves exactly as "Barbell Glute Bridge", and
  "hip thrust" maps to Barbell Hip Thrust.
- **"leg curl" / "hamstring curl" -> Lying Leg Curls.** The classic
  machine; "Seated Leg Curl" already resolves exactly.
- **"tricep extension" family -> Cable Rope Overhead Triceps Extension.**
  Any extension variant attributes triceps-primary the same way; the
  cable-rope entry is the most common gym default.
- **"curl" / "bicep curl" -> Barbell Curl.** The unqualified curl.
- **"rear delt fly" / "reverse fly" -> Seated Bent-Over Rear Delt Raise.**
  The standard dumbbell movement those names describe.
- **Deliberately NOT aliased: "bulgarian split squat", "pendlay row"** and
  other movements the catalog genuinely lacks. Aliasing them to a
  nearest-neighbor entry would misattribute; they are the motivating
  examples for L3 user-defined exercises. "split squat" resolves to the
  catalog's "Split Squats" via the plural fold.
