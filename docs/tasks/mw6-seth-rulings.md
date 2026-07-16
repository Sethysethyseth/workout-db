# Seth's rulings on the MW4/MW5 semantics questions (July 16, 2026)

Raw answers, recorded verbatim for Fable to interpret when finalizing MW6
and authoring the follow-on fix blocks. Not pre-interpreted by Sonnet -
see `mw6-per-side-auto-first-pair.md` (DRAFT) and the two FINDINGS docs
(`mw4-per-side-analytics-audit-FINDINGS.md`,
`mw5-decimal-values-audit-FINDINGS.md`) for full question context.

## MW4 questions

**1. Volume / stimulating sets / StatTiles / weekly report — pair = 1 or 2
effective sets?**
> "2 sets"

Ratifies current behavior (each side gets full attribution, no halving) -
reads as no code change needed on this surface, but Fable should confirm
nothing else was implied.

**2. Plan adherence — `actualRows/planned` or `pairs/planned`?**
> "whatever leads to better/easier ui"

No directional preference given - Seth is deferring to whichever
implementation is simpler/cleaner, not stating a semantics preference.
Fable's call.

**3. e1RM / top set / rep targets — equal footing with bilateral, or
tagged/scaled/separated?**
> "if you search it as singgle it should show analytics sets for each side
> and compare them, if theyre the same then it states, if they are
> different show the difference, ui might have to change to adjust to
> this"

Reads as a new per-side comparison feature, not a pure ruling on the
existing surfaces: when viewing analytics for a unilateral exercise, show
each side's sets/analytics separately, then a same/different comparison
(e.g. L vs R e1RM or working weight). Seth flags this may require UI
changes beyond the current exercise-detail views. Likely scope-note for
Fable: this may be bigger than MW6's "auto-create first pair" contract and
could warrant its own follow-on block rather than folding into MW6 -
Fable's call on sequencing.

**4. Sessions list "Sets: N" — raw DB rows or pair-aware count?**
> "whatever leads to better/easier ui"

Same as #2 - implementation-led, no semantics preference stated.

**5. Collapsed "Last W x R" — show side, or combined L/R summary?**
> "whatever leads to better/easier ui experience"

Same as #2/#4 - implementation-led.

## MW5 question

**Decimal RIR (1.5) — reject cleanly (current) or widen the schema?**

Not directly re-asked this session; diagnosis recommendation (REJECT, use
RPE 8.5 instead) was presented but Seth did not override it in this pass -
Fable should treat it as tentatively ratified unless it revisits the
question explicitly.

---

## Fable interpretation (July 16, brainstormed with Seth same day)

Every ruling above is now dispositioned; nothing here is still open.

1. **Pair = 2 sets — RATIFIED, zero engine code.** All counting surfaces
   already behave this way. The heading's raw row count ("2 sets") is
   therefore CORRECT and stays; the MW4 "BROKEN display" fix is resolved
   by vocabulary instead (see 2/4/5 below).
2. **Adherence — DEFERRED into the per-side comparison unit.** Templates
   are side-blind (zero `side` refs in the template pages), so a planned
   "3 sets" on a unilateral exercise means 3 pairs and the current 2.0
   adherence misleads. The better-UI answer is pairs/planned, but that
   needs `side` visible to the engine — the exact plumbing ruling 3
   needs — so it rides that unit rather than being hacked separately.
3. **Per-side L/R comparison analytics — NEW FEATURE, own unit, NEXT
   wave (Seth confirmed via brainstorm).** Scope when authored: plumb
   `side` from the analytics controllers into `enrichSet` (engine is
   currently side-blind by construction), per-side splits in
   `exerciseDetail`, comparison UI in the Exercises tab (each side's
   numbers + a same/different verdict, show the delta). Adherence
   (ruling 2) rides it. Registered as a QUEUE.md candidate; needs a
   Fable design pass before authoring.
4. **Sessions list "Sets: N" — keep raw rows.** Consistent with ruling 1
   (each side IS a set); zero code.
5. **Collapsed "Last W × R" — side letter when sided** ("Last R 60 ×
   10"). Folded into MW6.

**Display vocabulary (Seth chose from previews):** the stepper — the one
control that OPERATES in pairs — is relabeled "Pairs" in per-side mode;
everything that COUNTS says sets. Heading "· 2 sets" + toolbar "Pairs: 1"
coexist without contradiction. Folded into MW6.

**MW5 RIR — REJECT ratified, plus a client gate (Seth: "make it
impossible to or inform the user it won't count").** Schema untouched,
server 400 stays; the live RIR input either blocks decimal entry or
informs inline and never sends the PATCH. Folded into MW6 (same file);
the 5 Math.round reps-display sites became MW8.
