/** Pure verdict/comparison formatters for the Execution card. */

function formatDecimalCount(n) {
  if (n === null || n === undefined) return null;
  const rounded = Number(Number(n).toFixed(1));
  const s = rounded.toFixed(1);
  return s.endsWith(".0") ? s.slice(0, -2) : s;
}

function loadClause(loadAdherence) {
  if (loadAdherence === null) return null;
  if (loadAdherence < 0.97) return { priority: 1, news: true, text: "lifted lighter than planned" };
  if (loadAdherence > 1.03) return { priority: 1, news: true, text: "lifted heavier than planned" };
  return { priority: 1, news: false, text: "on-plan loads" };
}

function volumeClause(volumeAdherence) {
  if (volumeAdherence === null) return null;
  if (volumeAdherence < 1) return { priority: 0, news: true, text: "did fewer sets than planned" };
  if (volumeAdherence > 1) return { priority: 0, news: true, text: "did extra sets" };
  return { priority: 0, news: false, text: "hit every planned set" };
}

function effortClause(effortDrift) {
  if (effortDrift === null) return null;
  const n = Math.round(effortDrift);
  if (effortDrift >= 1) {
    const repWord = n === 1 ? "rep" : "reps";
    return { priority: 2, news: true, text: `stopped about ${n} ${repWord} short of planned effort` };
  }
  if (effortDrift <= -1) {
    const abs = Math.abs(n);
    const repWord = abs === 1 ? "rep" : "reps";
    return { priority: 2, news: true, text: `pushed about ${abs} ${repWord} past planned effort` };
  }
  return null;
}

function isLoadOnPlan(loadAdherence) {
  return loadAdherence !== null && loadAdherence >= 0.97 && loadAdherence <= 1.03;
}

function joinClauses(clauses) {
  if (clauses.length === 0) return "executed right on plan";
  if (clauses.length === 1) return clauses[0].text;
  return `${clauses[0].text} and ${clauses[1].text}`;
}

export function buildExecutionVerdict({ loadAdherence, volumeAdherence, effortDrift }) {
  if (loadAdherence === null && volumeAdherence === null && effortDrift === null) {
    return "not enough paired data";
  }

  const loadOnPlan = isLoadOnPlan(loadAdherence);
  const volumeOnPlan = volumeAdherence === 1;
  const effortOnTarget =
    effortDrift === null || (effortDrift > -1 && effortDrift < 1);

  if (volumeOnPlan && loadOnPlan && effortOnTarget) {
    return "executed right on plan";
  }

  /* Newsy clauses outrank on-plan filler: "hit every planned set and on-plan
     loads" must never crowd out a real effort drift. */
  const candidates = [volumeClause(volumeAdherence), loadClause(loadAdherence), effortClause(effortDrift)]
    .filter(Boolean)
    .sort((a, b) => (b.news - a.news) || (a.priority - b.priority))
    .slice(0, 2);

  return joinClauses(candidates);
}

function formatSide(prefix, obj, unit) {
  const sets = formatDecimalCount(obj.setsPerSession);
  const reps = formatDecimalCount(obj.reps);
  let line = prefix;

  if (sets !== null && reps !== null) {
    line += ` ${sets}×${reps}`;
  } else if (sets !== null) {
    line += ` ${sets} sets`;
  } else if (reps !== null) {
    line += ` ${reps} reps`;
  }

  if (obj.weight !== null) {
    line += ` @ ${formatDecimalCount(obj.weight)} ${unit}`;
  }
  if (obj.effortRir !== null) {
    line += ` @ ${formatDecimalCount(obj.effortRir)} RIR`;
  }

  return line;
}

export function formatPlanActual(planned, actual, unit) {
  return `${formatSide("Planned", planned, unit)} → ${formatSide("Did", actual, unit)}`;
}

export function formatPlannedSummary(planned, unit) {
  return formatSide("Planned", planned, unit).replace(/^Planned /, "");
}

export function formatActualSummary(actual, unit) {
  return formatSide("Did", actual, unit).replace(/^Did /, "");
}
