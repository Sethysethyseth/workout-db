# Stimulus Curve Rationale

This document explains the reasoning behind the RIR-to-stimulus-multiplier
mapping in `server/src/analytics/stimulusCurve.js`. When tuning these numbers,
update this document at the same time. Numbers without rationale are numbers we
can't defend.

## Principles

- **RIR (reps in reserve) is a proxy for proximity to failure.** The closer a
  set is taken to failure, the more of its working reps are near-maximal and
  stimulative. The multiplier scales each set's muscle contribution by how hard
  it actually was, so that a set left at RIR 5 does not count the same as a
  grinding RIR 0 set.
- **These are estimates.** The exact stimulus-vs-proximity relationship is not
  settled science; it varies by individual, exercise, and rep range. The
  honesty principle (master prompt) requires that we never present the
  "stimulating sets" number as measured truth in the UI - it is surfaced as an
  estimate with a "how is this calculated?" affordance.
- **Missing RIR is never guessed.** A null/undefined RIR returns `null`, not a
  default multiplier. The caller degrades to the always-on tier (raw effective
  sets, flagged as un-weighted) rather than fabricating a stimulus value.
- **The taper accelerates past RIR 3.** Near-zero RIR is true proximity to
  failure and earns ~full stimulus. Each added rep-in-reserve tapers the
  stimulus, and the taper steepens beyond RIR 3 because sets that far from
  failure stop being meaningfully "hard" and contribute disproportionately less
  growth stimulus per set.

## Entries

The curve is stored as an ordered array of `{ maxRir, multiplier }` bands in
`stimulusCurve.js`. A given RIR takes the multiplier of the first band whose
`maxRir` it does not exceed:

- **RIR 0-1 -> 1.0.** At or within one rep of failure. Effectively maximal
  effort; the whole set counts.
- **RIR 2 -> 0.95.** Still very hard, a marginal discount. Two reps in reserve
  is widely treated as a productive hypertrophy target, so it stays close to 1.
- **RIR 3 -> 0.85.** Hard but clearly submaximal. The first meaningful step
  down.
- **RIR 4 -> 0.6.** The taper accelerates here - a RIR 4 set is no longer
  "close to failure" and its stimulus drops off sharply.
- **RIR 5+ -> 0.3.** Far from failure. Counts as light stimulus; kept nonzero
  because the volume still does something, but heavily discounted.
- **Null / undefined RIR -> null.** Unweighted. Not a band - see the
  "missing RIR is never guessed" principle above.

## Honesty and maintenance

Like `muscle-weights.json`, these values are a defensible starting model, not
ground truth, and they are meant to be re-tuned as we learn more. Any future
change to the values in `stimulusCurve.js` must update this document in the same
commit, so the numbers and their justification never drift apart.
