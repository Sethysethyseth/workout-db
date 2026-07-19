# Gym context (location-aware analytics) - DESIGN (Fable pass, July 18 2026)

Status: DESIGN COMPLETE - ready for Opus to author blocks. Fable is
unavailable after July 18; escalate to Opus judgment against this spec.

## The problem (Seth, July 18)

Different gym -> different machines/stacks -> logged weights shift for
equipment reasons, not strength reasons, and trends/PRs read wrong.
Live example in the July 18 staging screenshot: "Single arm lat
pulldown -52.5 lbs - matched effort -119 lbs" - almost certainly a
different machine, not a strength collapse. Seth's ask: use location
so the app KNOWS the user is away from the home gym and analytics can
make sense of the shift.

## Named criteria (the bar this was designed against)

1. Privacy-minimal: store the user's named gyms (optional coords),
   never a location trail. Location use is OPT-IN via a settings
   toggle, off by default.
2. Annotate, never adjust: the honesty layer forbids silently
   correcting numbers. Context explains variance; it does not rewrite
   statistics. (Seth's "implement factors not messing up statistics"
   lands as annotation + a user-controlled filter, NOT as normalization
   factors - a normalization layer was considered and REJECTED: it
   would cook the very numbers the honesty layer promises are raw.)
3. Zero-friction: no permission prompt spam; tagging works fully
   manually with location never granted.
4. PWA-realistic: no background tracking or geofencing - a PWA only
   gets location while open. One-shot check at session start is
   sufficient because the app IS open when you start logging.
   (Continuous tracking REJECTED on battery + permission + PWA grounds;
   Seth's detection goal is preserved by the one-shot check.)

## v1 design

Schema (MIGRATION - Seth's manual track, RUNBOOK ritual):
- `Gym`: id, userId, name, lat/lng (nullable), radiusM (default 150),
  isHome (bool). Cross-user isolation: userId on every query.
- `Session.gymId`: nullable FK, ON DELETE SET NULL.

Client:
- Settings toggle "Use location to tag gyms" (off). When on, at LIVE
  session creation: one `getCurrentPosition` (coarse OK). Haversine
  match against saved gyms within radiusM -> auto-tag. No match ->
  quiet non-blocking chip on the session: "Different gym? Tag it" ->
  minimal name-it sheet, or dismiss (dismiss = untagged, never re-asks
  that session).
- Manual path always available: gym picker in the session meta row
  (works with location off). First-run: any session can be tagged
  retroactively from the completed view.

Analytics (annotate + filter, never adjust):
- Strength trend rows: sessions at a non-home gym get a visually
  distinct marker (hollow/outlined dot, legend-keyed, tokens-only).
- A trend row whose range mixes gyms appends "- mixed gyms" to its
  delta line; Data quality gains "N sessions in this range were at a
  different gym".
- PRs still count (a PR is a PR) but carry the gym tag in the PR list.
- Strength view gains a "Home gym only" filter chip, rendered ONLY
  when the range actually contains mixed-gym data. Deterministic,
  user-controlled, default off.

## Block plan (Opus authors from this spec)

- G1: schema + server (Gym CRUD, session gymId, migration file -
  MIGRATION-CARRYING: Seth applies per RUNBOOK before code deploys).
- G2: client tagging (settings toggle, one-shot match, chip + sheet,
  manual picker). After G1 lands AND its migration is applied.
- G3: analytics annotations + Data-quality line + home-only filter.
  Collides with strength-view UI units (FP-wave, SS3) - serialize
  explicitly in QUEUE at authoring time.
- Sequencing: G-wave starts only after the FP-wave core lands; G1's
  migration gate makes this wave NON-AUTONOMOUS at two points (G1
  land -> Seth migrates -> G2 dispatch).
