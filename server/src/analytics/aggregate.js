const MS_PER_WEEK = 7 * 24 * 60 * 60 * 1000;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

function toDate(value) {
  return value instanceof Date ? value : new Date(value);
}

function round2(n) {
  return Math.round(n * 100) / 100;
}

function computeWeeksInRange(from, to) {
  const fromDate = toDate(from);
  const toDate_ = toDate(to);
  return Math.max(1, Math.ceil((toDate_ - fromDate) / MS_PER_WEEK));
}

function aggregateMuscleVolume(enrichedSets, { from, to }) {
  const fromDate = toDate(from);
  const toDate_ = toDate(to);
  const fromMs = fromDate.getTime();
  const toMs = toDate_.getTime();

  const inRange = enrichedSets.filter((s) => {
    const t = s.performedAt.getTime();
    return t >= fromMs && t <= toMs;
  });

  // muscle -> accumulator
  const acc = new Map();
  const getAcc = (muscle) => {
    let a = acc.get(muscle);
    if (!a) {
      a = {
        effectiveSetsTotal: 0,
        stimulatingSetsTotal: 0,
        hasRirData: false,
        sessions: new Set(),
        lastPerformedMs: null,
      };
      acc.set(muscle, a);
    }
    return a;
  };

  for (const set of inRange) {
    const eff = set.metrics.effectiveContribution;
    if (!eff) continue;
    const stim = set.metrics.stimulatingContribution;
    const performedMs = set.performedAt.getTime();

    for (const [muscle, fraction] of Object.entries(eff)) {
      if (!fraction) continue; // nonzero fractions only
      const a = getAcc(muscle);
      a.effectiveSetsTotal += fraction;
      a.sessions.add(performedMs);
      if (a.lastPerformedMs === null || performedMs > a.lastPerformedMs) {
        a.lastPerformedMs = performedMs;
      }
      if (stim !== null) {
        a.stimulatingSetsTotal += stim[muscle];
        a.hasRirData = true;
      }
    }
  }

  const weeks = computeWeeksInRange(fromDate, toDate_);

  return Array.from(acc.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([muscle, a]) => ({
      muscle,
      effectiveSets: round2(a.effectiveSetsTotal / weeks),
      stimulatingSets: a.hasRirData
        ? round2(a.stimulatingSetsTotal / weeks)
        : null,
      frequency: round2(a.sessions.size / weeks),
      daysSinceLast: Math.round((toMs - a.lastPerformedMs) / MS_PER_DAY),
    }));
}

module.exports = { computeWeeksInRange, aggregateMuscleVolume, MS_PER_WEEK };
