# Cursor Task-Block Template

The drop-in prompt format. Claude emits these; you paste into Cursor (on Auto) with zero edits. Designed so Cursor stays scoped, doesn't wander, and produces a diff you can review in under a minute.

---

## The format

```
## TASK: <one-line title>

CONTEXT:
<1–2 sentences. What this is part of, why it matches the existing codebase.>

FILES TO TOUCH:
- path/to/file1   (what changes)
- path/to/file2   (what changes)
Do NOT modify anything outside these files.

CHANGE:
<Plain, specific description of exactly what to do. Reference existing
patterns/functions by name so Cursor matches the codebase style.>

ACCEPTANCE CRITERIA:
- <observable thing that proves it worked>
- <e.g. "npm run dev compiles with no errors">
- <e.g. "the list renders the seeded exercises">

STOP CONDITION:
When the above criteria are met, stop. Do not refactor unrelated code,
add dependencies, or expand scope. If a criterion can't be met, stop and
explain why instead of guessing.
```

---

## Why each section earns its place

- **FILES TO TOUCH + "do NOT modify anything outside"** → kills the #1 review red flag (unexpected files in the diff). Your scope check in Stage 5 becomes trivial.
- **Reference existing patterns by name** → Cursor matches your codebase instead of inventing a new style ("Fit" check).
- **ACCEPTANCE CRITERIA** → gives both Cursor and you an objective "done," so review is a yes/no, not a judgment call.
- **STOP CONDITION** → the single most important line. Agents sprawl when not told to stop. This keeps the diff small and the task one-session-sized.

---

## Worked example (workout app)

```
## TASK: Add exercises list component

CONTEXT:
Part of the workout app. We already have an /api/exercises route returning
JSON. This adds the UI that displays them, matching the existing component
style in src/components.

FILES TO TOUCH:
- src/components/ExerciseList.tsx   (new component)
- src/pages/Exercises.tsx           (render the new component)
Do NOT modify anything outside these files.

CHANGE:
Create ExerciseList.tsx that fetches from /api/exercises and renders each
exercise as a card. Follow the same data-fetching and card pattern used in
src/components/WorkoutList.tsx. Then import and render <ExerciseList /> in
Exercises.tsx.

ACCEPTANCE CRITERIA:
- npm run dev compiles with no errors
- Visiting /exercises shows a card per seeded exercise
- Styling matches WorkoutList cards

STOP CONDITION:
Stop when criteria are met. Don't add new dependencies, don't restyle
WorkoutList, don't touch the API route. If the API isn't returning data,
stop and say so.
```

---

## How to ask Claude for one

You usually won't write these by hand — that's the point. Just say:

> "Give me the Cursor task block for the next step."

or

> "Turn step 3 of the plan into a Cursor task block."

If a block's diff comes back too big to review in a minute, tell Claude: **"That was too big — split it into two blocks."**
