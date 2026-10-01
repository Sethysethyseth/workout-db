/**
 * Table rows -> unvalidated LogChamp Block Format v1.
 * Spec: docs/specs/blocks-v2.md sections 4.2–4.4.
 */

const { normalizeHeaderKey } = require("./parseDelimited");
const { parsePrescriptionCell } = require("./importRecipe");

const WEEK_HEADERS = new Set(["week", "wk", "weeknumber", "weekno"]);
const WEEK_LABEL_HEADERS = new Set(["weeklabel", "phase"]);
const DAY_KEY_HEADERS = new Set(["day", "dayid", "dayno"]);
const DAY_NAME_HEADERS = new Set([
  "dayname",
  "workout",
  "workoutname",
  "session",
  "sessionname",
]);
const ORDER_HEADERS = new Set(["order", "seq"]);
const IGNORED_HEADERS = new Set(["slot", "slotid"]);
const EXERCISE_HEADERS = new Set([
  "exercise",
  "exercisename",
  "movement",
  "lift",
  "name",
]);
const SETS_HEADERS = new Set(["sets", "setcount"]);
const REPS_HEADERS = new Set([
  "reps",
  "rep",
  "repstime",
  "repsduration",
  "target",
]);
/** Combined sets×reps / scheme headers — same cells as recipe prescriptionColumn. */
const PRESCRIPTION_HEADERS = new Set([
  "setsxreps",
  "setsreps",
  "scheme",
  "prescription",
  "setxrep",
  "sxr",
]);
const WEIGHT_HEADERS = new Set([
  "load",
  "loadlb",
  "loadlbs",
  "loadkg",
  "weight",
  "weightlb",
  "weightlbs",
  "weightkg",
  "lb",
  "lbs",
  "kg",
]);
const LOAD_TYPE_HEADERS = new Set(["loadtype"]);
const RPE_HEADERS = new Set(["rpe", "targetrpe"]);
const RPE_CAP_HEADERS = new Set(["rpecap", "maxrpe"]);
const RIR_HEADERS = new Set(["rir", "targetrir"]);
const RIR_CAP_HEADERS = new Set(["rircap", "minrir"]);
const REST_SEC_HEADERS = new Set(["restsec", "restseconds"]);
const REST_MIN_HEADERS = new Set(["restmin"]);
const REST_PLAIN_HEADERS = new Set(["rest"]);
const SECTION_HEADERS = new Set(["block", "section", "settype"]);
const NOTES_HEADERS = new Set(["notes", "note", "comments", "cue", "cues"]);
const SETUP_HEADERS = new Set(["setup"]);
const TEMPO_HEADERS = new Set(["tempo"]);
const LEAD_SIDE_HEADERS = new Set(["leadside"]);
const JOB_HEADERS = new Set(["job"]);

const WARMUP_VALUES = new Set(["warmup", "warm-up", "wu", "w"]);

/**
 * @param {{ header: string[], rows: string[][], rowNumbers: number[] }} parsed
 * @param {{ name?: string, unit?: "lb"|"kg", skipWarmups?: boolean }} [options]
 */
function tableToBlock(parsed, options = {}) {
  const { header, rows, rowNumbers } = parsed;
  const warnings = [];
  const notices = {};

  const roles = mapHeaderRoles(header, warnings);
  if (roles.exercise == null) {
    const err = new Error(
      "Couldn't find an Exercise column. Name one column Exercise."
    );
    err.name = "TableToBlockError";
    throw err;
  }

  const hasRpeCol = roles.rpe != null || roles.rpeCap != null;
  const hasRirCol = roles.rir != null || roles.rirCap != null;
  if (hasRpeCol && hasRirCol) {
    // Check if any row has values in both before hard-erroring? Spec says
    // "Values in BOTH an RPE and an RIR column -> hard error"
    let bothHaveValues = false;
    for (const row of rows) {
      const rpeVal =
        (roles.rpe != null ? cell(row, roles.rpe) : "") ||
        (roles.rpeCap != null ? cell(row, roles.rpeCap) : "");
      const rirVal =
        (roles.rir != null ? cell(row, roles.rir) : "") ||
        (roles.rirCap != null ? cell(row, roles.rirCap) : "");
      if (rpeVal.trim() && rirVal.trim()) {
        bothHaveValues = true;
        break;
      }
    }
    if (bothHaveValues) {
      const err = new Error(
        "LogChamp plans use one effort scale - remove one column"
      );
      err.name = "TableToBlockError";
      throw err;
    }
  }

  const skipWarmups = Boolean(options.skipWarmups);
  let warmupRows = 0;

  // First column-header weight conversion (one sheet-level message).
  let columnConversionExample = null;

  // Parse each data row into a structured record
  const records = [];
  for (let i = 0; i < rows.length; i += 1) {
    const row = rows[i];
    const rowNum = rowNumbers[i];
    const exerciseName = cell(row, roles.exercise).trim();
    if (!exerciseName) {
      // spacer / blank exercise
      const hasAny = row.some((c) => String(c || "").trim() !== "");
      if (hasAny) {
        warnings.push({
          row: rowNum,
          message: "Row has no exercise name - skipped",
        });
      }
      continue;
    }

    const sectionRaw = roles.section != null ? cell(row, roles.section) : "";
    const isWarmup = WARMUP_VALUES.has(
      sectionRaw.trim().toLowerCase().replace(/\s+/g, "")
    );
    if (isWarmup) {
      warmupRows += 1;
      if (skipWarmups) continue;
    }

    const weekRaw = roles.week != null ? cell(row, roles.week) : "";
    const weekNum = parseWeekCell(weekRaw);
    const weekLabel =
      roles.weekLabel != null ? cell(row, roles.weekLabel).trim() : "";

    const dayKeyRaw = roles.dayKey != null ? cell(row, roles.dayKey) : "";
    const dayNameRaw = roles.dayName != null ? cell(row, roles.dayName) : "";
    const orderRaw = roles.order != null ? cell(row, roles.order) : "";
    const order = orderRaw.trim() === "" ? null : Number(orderRaw);

    let setCount = 1;
    let repsParsed = {
      reps: undefined,
      repsMax: undefined,
      durationSec: undefined,
      setsFromReps: undefined,
      notes: [],
    };
    let prescriptionWeightRaw = "";
    let prescriptionRpe;

    if (roles.prescription != null) {
      const prescriptionRaw = cell(row, roles.prescription);
      const parsed = parsePrescriptionCell(prescriptionRaw);
      if (parsed.warning) {
        warnings.push({ row: rowNum, message: parsed.warning });
      }
      if (parsed.sets != null) setCount = parsed.sets;
      if (parsed.durationSec != null) {
        repsParsed.durationSec = parsed.durationSec;
      } else if (parsed.reps != null) {
        repsParsed.reps = parsed.reps;
        if (parsed.repsMax != null) repsParsed.repsMax = parsed.repsMax;
      }
      if (parsed.weight != null) {
        prescriptionWeightRaw =
          parsed.weightUnit != null
            ? `${parsed.weight}${parsed.weightUnit}`
            : String(parsed.weight);
      }
      if (parsed.rpe != null) prescriptionRpe = parsed.rpe;
    } else {
      if (roles.sets != null) {
        const setsParsed = parseSetsCell(cell(row, roles.sets), rowNum, warnings);
        setCount = setsParsed;
      }

      const repsRaw = roles.reps != null ? cell(row, roles.reps) : "";
      repsParsed = parseRepsCell(repsRaw, rowNum, warnings);

      // Sets from reps shorthand (3x8) — filled Sets cell wins
      if (repsParsed.setsFromReps != null) {
        if (roles.sets != null && cell(row, roles.sets).trim() !== "") {
          if (repsParsed.setsFromReps !== setCount) {
            warnings.push({
              row: rowNum,
              message: `Sets cell (${setCount}) won over reps shorthand (${repsParsed.setsFromReps})`,
            });
          }
        } else {
          setCount = repsParsed.setsFromReps;
        }
      }
    }

    let weightRaw = roles.weight != null ? cell(row, roles.weight) : "";
    if (!String(weightRaw || "").trim() && prescriptionWeightRaw) {
      weightRaw = prescriptionWeightRaw;
    }
    const colUnit = roles.weightUnit || null;
    const targetUnit =
      options.unit === "kg" || options.unit === "lb" ? options.unit : null;
    const weightParsed = parseWeightCell(
      weightRaw,
      colUnit,
      targetUnit,
      rowNum,
      warnings
    );
    if (weightParsed.columnConverted && !columnConversionExample) {
      columnConversionExample = {
        header:
          roles.weightHeader ||
          (colUnit === "kg"
            ? "Load (kg)"
            : colUnit === "lb"
              ? "Load (lb)"
              : "Weight"),
        ...weightParsed.columnConverted,
      };
    }

    const loadType =
      roles.loadType != null ? cell(row, roles.loadType).trim() : "";

    let effortCap = false;
    let rpe;
    let rir;
    const rpeRaw =
      roles.rpe != null
        ? cell(row, roles.rpe)
        : roles.rpeCap != null
          ? cell(row, roles.rpeCap)
          : "";
    const rirRaw =
      roles.rir != null
        ? cell(row, roles.rir)
        : roles.rirCap != null
          ? cell(row, roles.rirCap)
          : "";
    if (roles.rpeCap != null && cell(row, roles.rpeCap).trim()) {
      effortCap = true;
    }
    if (roles.rirCap != null && cell(row, roles.rirCap).trim()) {
      effortCap = true;
    }
    if (rpeRaw.trim()) {
      const p = parseRpeCell(rpeRaw, rowNum, warnings);
      if (p) {
        rpe = p.value;
        if (p.effortCap) effortCap = true;
        if (p.note) repsParsed.notes.push(p.note);
      }
    } else if (prescriptionRpe != null) {
      rpe = prescriptionRpe;
    }
    if (rirRaw.trim()) {
      const p = parseRirCell(rirRaw, rowNum, warnings);
      if (p) {
        rir = p.value;
        if (p.effortCap) effortCap = true;
        if (p.note) repsParsed.notes.push(p.note);
      }
    }

    let restSec;
    if (roles.restSec != null && cell(row, roles.restSec).trim()) {
      restSec = parseRestCell(
        cell(row, roles.restSec),
        "sec",
        rowNum,
        warnings
      );
    } else if (roles.restMin != null && cell(row, roles.restMin).trim()) {
      restSec = parseRestCell(
        cell(row, roles.restMin),
        "min",
        rowNum,
        warnings
      );
    } else if (roles.rest != null && cell(row, roles.rest).trim()) {
      restSec = parseRestCell(cell(row, roles.rest), "plain", rowNum, warnings);
    }

    // Compose notes: notes, Setup, Tempo, Lead side, Job, Load
    const noteParts = [];
    if (roles.notes != null) {
      const n = cell(row, roles.notes).trim();
      if (n) noteParts.push(n);
    }
    if (roles.setup != null) {
      const n = cell(row, roles.setup).trim();
      if (n) noteParts.push(`Setup: ${n}`);
    }
    if (roles.tempo != null) {
      const n = cell(row, roles.tempo).trim();
      if (n) noteParts.push(`Tempo: ${n}`);
    }
    if (roles.leadSide != null) {
      const n = cell(row, roles.leadSide).trim();
      if (n) noteParts.push(`Lead side: ${n}`);
    }
    if (roles.job != null) {
      const n = cell(row, roles.job).trim();
      if (n) noteParts.push(`Job: ${n}`);
    }
    if (loadType) {
      noteParts.push(`Load: ${loadType}`);
    }
    for (const n of weightParsed.notes) noteParts.push(n);
    for (const n of repsParsed.notes) noteParts.push(n);

    const setTemplate = {};
    if (repsParsed.reps != null) setTemplate.reps = repsParsed.reps;
    if (repsParsed.repsMax != null) setTemplate.repsMax = repsParsed.repsMax;
    if (repsParsed.durationSec != null) {
      setTemplate.durationSec = repsParsed.durationSec;
    }
    if (weightParsed.weight != null) setTemplate.weight = weightParsed.weight;
    if (rpe != null) setTemplate.rpe = rpe;
    if (rir != null) setTemplate.rir = rir;

    const sets = [];
    for (let s = 0; s < setCount; s += 1) {
      sets.push({ ...setTemplate });
    }

    records.push({
      rowNum,
      weekNum,
      weekLabel,
      dayKeyRaw: dayKeyRaw.trim(),
      dayNameRaw: dayNameRaw.trim(),
      order: Number.isFinite(order) ? order : null,
      exerciseName,
      sets,
      notes: noteParts.join("\n"),
      restSec,
      effortCap,
    });
  }

  if (warmupRows > 0) notices.warmupRows = warmupRows;

  if (columnConversionExample) {
    const { header, from, to, raw, converted } = columnConversionExample;
    const fromWord = from === "kg" ? "kilograms" : "pounds";
    const toWord = to === "kg" ? "kilograms" : "pounds";
    warnings.push({
      message: `${header}: converted ${fromWord} to ${toWord} (${raw} ${from} -> ${converted} ${to})`,
    });
  }

  // Group into weeks / days / exercises
  const block = groupRecords(records, options, warnings);
  return { block, warnings, notices };
}

function cell(row, index) {
  if (index == null || index < 0) return "";
  return row[index] != null ? String(row[index]) : "";
}

function mapHeaderRoles(header, warnings) {
  const roles = {};
  const seenIgnored = new Set();
  /** @type {{ header: string, idx: number }[]} */
  const prescriptionCandidates = [];

  header.forEach((h, idx) => {
    const key = normalizeHeaderKey(h);
    if (!key) return;

    if (WEEK_HEADERS.has(key)) roles.week = idx;
    else if (WEEK_LABEL_HEADERS.has(key)) roles.weekLabel = idx;
    else if (DAY_KEY_HEADERS.has(key)) roles.dayKey = idx;
    else if (DAY_NAME_HEADERS.has(key)) roles.dayName = idx;
    else if (ORDER_HEADERS.has(key)) roles.order = idx;
    else if (IGNORED_HEADERS.has(key)) {
      // silent
    } else if (EXERCISE_HEADERS.has(key)) roles.exercise = idx;
    else if (SETS_HEADERS.has(key)) roles.sets = idx;
    else if (REPS_HEADERS.has(key)) roles.reps = idx;
    else if (PRESCRIPTION_HEADERS.has(key)) {
      prescriptionCandidates.push({ header: h, idx });
    } else if (WEIGHT_HEADERS.has(key)) {
      roles.weight = idx;
      roles.weightHeader = h;
      if (key.includes("kg")) roles.weightUnit = "kg";
      else if (
        key.includes("lb") ||
        key === "lb" ||
        key === "lbs" ||
        key === "loadlb" ||
        key === "loadlbs" ||
        key === "weightlb" ||
        key === "weightlbs"
      ) {
        roles.weightUnit = "lb";
      }
    } else if (LOAD_TYPE_HEADERS.has(key)) roles.loadType = idx;
    else if (RPE_CAP_HEADERS.has(key)) roles.rpeCap = idx;
    else if (RPE_HEADERS.has(key)) roles.rpe = idx;
    else if (RIR_CAP_HEADERS.has(key)) roles.rirCap = idx;
    else if (RIR_HEADERS.has(key)) roles.rir = idx;
    else if (REST_SEC_HEADERS.has(key)) roles.restSec = idx;
    else if (REST_MIN_HEADERS.has(key)) roles.restMin = idx;
    else if (REST_PLAIN_HEADERS.has(key)) roles.rest = idx;
    else if (SECTION_HEADERS.has(key)) roles.section = idx;
    else if (NOTES_HEADERS.has(key)) roles.notes = idx;
    else if (SETUP_HEADERS.has(key)) roles.setup = idx;
    else if (TEMPO_HEADERS.has(key)) roles.tempo = idx;
    else if (LEAD_SIDE_HEADERS.has(key)) roles.leadSide = idx;
    else if (JOB_HEADERS.has(key)) roles.job = idx;
    else if (!seenIgnored.has(h)) {
      seenIgnored.add(h);
      warnings.push({ message: `Column '${h}' was ignored` });
    }
  });

  // Separate Sets + Reps columns win over a combined sets×reps column.
  if (prescriptionCandidates.length > 0) {
    if (roles.sets != null && roles.reps != null) {
      for (const c of prescriptionCandidates) {
        if (!seenIgnored.has(c.header)) {
          seenIgnored.add(c.header);
          warnings.push({
            message: `Column '${c.header}' was ignored - separate Sets/Reps columns take priority`,
          });
        }
      }
    } else {
      roles.prescription = prescriptionCandidates[0].idx;
      for (let i = 1; i < prescriptionCandidates.length; i += 1) {
        const c = prescriptionCandidates[i];
        if (!seenIgnored.has(c.header)) {
          seenIgnored.add(c.header);
          warnings.push({ message: `Column '${c.header}' was ignored` });
        }
      }
    }
  }

  return roles;
}

function parseWeekCell(raw) {
  const s = String(raw || "").trim();
  if (!s) return null;
  const m = s.match(/^(?:week\s*|w\s*)?(\d+)$/i);
  if (m) return Number(m[1]);
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

function parseSetsCell(raw, rowNum, warnings) {
  const s = String(raw || "").trim();
  if (!s) return 1;
  const n = Number(s);
  if (Number.isInteger(n) && n >= 1 && n <= 20) return n;
  warnings.push({
    row: rowNum,
    message: `Sets '${s}' wasn't a whole number 1-20 - defaulted to 1`,
  });
  return 1;
}

function parseRepsCell(raw, rowNum, warnings) {
  const result = { reps: undefined, repsMax: undefined, durationSec: undefined, setsFromReps: undefined, notes: [] };
  const s = String(raw || "").trim();
  if (!s) return result;

  let text = s;
  let perSide = false;
  const sideMatch = text.match(
    /\s*(\/side|per\s*side|each|ea|\/leg|\/arm)\s*$/i
  );
  if (sideMatch) {
    perSide = true;
    text = text.slice(0, sideMatch.index).trim();
  }

  // 3x8, 3 x 8, 3×8, 3x8-12, 3x45s
  const mult = text.match(
    /^(\d+)\s*[x×]\s*(.+)$/i
  );
  if (mult) {
    result.setsFromReps = Number(mult[1]);
    text = mult[2].trim();
  }

  // Duration forms
  const durSec = text.match(
    /^(\d+)\s*(sec|secs|seconds|s)\s*$/i
  );
  if (durSec) {
    result.durationSec = Number(durSec[1]);
    if (perSide) result.notes.push("Per side");
    return result;
  }
  const durMin = text.match(/^(\d+)\s*(min|mins|minutes|m)\s*$/i);
  if (durMin) {
    result.durationSec = Number(durMin[1]) * 60;
    if (perSide) result.notes.push("Per side");
    return result;
  }
  const durClock = text.match(/^(\d+):(\d{2})$/);
  if (durClock) {
    result.durationSec =
      Number(durClock[1]) * 60 + Number(durClock[2]);
    if (perSide) result.notes.push("Per side");
    return result;
  }

  // AMRAP / max
  if (/^(amrap|max)$/i.test(text)) {
    result.notes.push("AMRAP");
    if (perSide) result.notes.push("Per side");
    return result;
  }

  // 5+
  const plus = text.match(/^(\d+)\+$/);
  if (plus) {
    result.reps = Number(plus[1]);
    result.notes.push("AMRAP last set");
    if (perSide) result.notes.push("Per side");
    return result;
  }

  // Range: 8-10, 8 to 10, en dash
  const range =
    text.match(/^(\d+)\s*[-–—]\s*(\d+)$/) ||
    text.match(/^(\d+)\s+to\s+(\d+)$/i);
  if (range) {
    result.reps = Number(range[1]);
    result.repsMax = Number(range[2]);
    if (perSide) result.notes.push("Per side");
    return result;
  }

  // Plain number
  if (/^\d+(\.\d+)?$/.test(text)) {
    result.reps = Number(text);
    if (perSide) result.notes.push("Per side");
    return result;
  }

  result.notes.push(`Reps: ${s}`);
  warnings.push({
    row: rowNum,
    message: `Couldn't parse reps '${s}' - kept as a note`,
  });
  if (perSide) result.notes.push("Per side");
  return result;
}

/**
 * Parse a weight cell into the import's chosen unit.
 * Cell unit: per-cell suffix, else column header unit, else targetUnit.
 * Suffix mismatches keep a per-row warning; column-header mismatches return
 * columnConverted so the caller can emit one sheet-level message.
 *
 * @param {string} raw
 * @param {"lb"|"kg"|null|undefined} columnUnit
 * @param {"lb"|"kg"|null|undefined} targetUnit
 * @param {number} rowNum
 * @param {object[]} warnings
 */
function parseWeightCell(raw, columnUnit, targetUnit, rowNum, warnings) {
  const result = { weight: undefined, notes: [], columnConverted: null };
  const s = String(raw || "").trim();
  if (!s) return result;

  if (/^(bw|bodyweight|body\s*weight)$/i.test(s)) {
    result.notes.push("Bodyweight");
    return result;
  }

  if (s === "0") {
    warnings.push({
      row: rowNum,
      message: "Weight 0 omitted (never store 0)",
    });
    return result;
  }

  const pct = s.match(/^(\d+(?:\.\d+)?)\s*%(?:\s*(TM|1RM))?$/i);
  if (pct) {
    // Normalize 75% TM style
    let note;
    if (/75%\s*TM/i.test(s)) note = "Load: 75% TM";
    else if (pct[2]) {
      note = `Load: ${pct[1]}% ${pct[2].toUpperCase() === "1RM" ? "1RM" : "TM"}`;
    } else {
      note = `Load: ${pct[1]}%`;
    }
    result.notes.push(note);
    warnings.push({
      row: rowNum,
      message:
        "Percent loads aren't calculated yet - kept as a note",
    });
    return result;
  }

  const numSuffix = s.match(/^(\d+(?:\.\d+)?)\s*(lb|lbs|kg)?$/i);
  if (numSuffix) {
    let weight = Number(numSuffix[1]);
    const suffix = (numSuffix[2] || "").toLowerCase();
    const hasSuffix =
      suffix === "kg" || suffix === "lb" || suffix === "lbs";

    let cellUnit = null;
    if (suffix === "kg") cellUnit = "kg";
    else if (suffix === "lb" || suffix === "lbs") cellUnit = "lb";
    else if (columnUnit === "kg" || columnUnit === "lb") cellUnit = columnUnit;
    else if (targetUnit === "kg" || targetUnit === "lb") cellUnit = targetUnit;

    const toUnit =
      targetUnit === "kg" || targetUnit === "lb" ? targetUnit : cellUnit;

    if (cellUnit && toUnit && cellUnit !== toUnit) {
      const rawNum = weight;
      if (cellUnit === "kg" && toUnit === "lb") {
        weight = Math.round(weight * 2.20462 * 2) / 2;
      } else if (cellUnit === "lb" && toUnit === "kg") {
        weight = Math.round((weight / 2.20462) * 2) / 2;
      }
      if (hasSuffix) {
        warnings.push({
          row: rowNum,
          message: `Converted ${numSuffix[1]} ${
            cellUnit === "kg" ? "kg" : "lb"
          } to ${weight} ${toUnit}`,
        });
      } else {
        result.columnConverted = {
          from: cellUnit,
          to: toUnit,
          raw: rawNum,
          converted: weight,
        };
      }
    }
    result.weight = weight;
    return result;
  }

  result.notes.push(`Load: ${s}`);
  return result;
}

function parseRpeCell(raw, rowNum, warnings) {
  const s = String(raw || "").trim();
  if (!s) return null;

  // Caps: <=6, ≤6, <6, max 6, 6 max
  const cap = s.match(/^(?:<=|≤|<|max\s*)\s*(\d+(?:\.\d+)?)$/i) ||
    s.match(/^(\d+(?:\.\d+)?)\s*max$/i);
  if (cap) {
    const v = Number(cap[1]);
    if (v < 1 || v > 10) {
      warnings.push({ row: rowNum, message: `RPE '${s}' out of 1-10 - dropped` });
      return null;
    }
    return { value: v, effortCap: true };
  }

  const range = s.match(/^(\d+(?:\.\d+)?)\s*[-–—]\s*(\d+(?:\.\d+)?)$/);
  if (range) {
    const hi = Number(range[2]);
    if (hi < 1 || hi > 10) {
      warnings.push({ row: rowNum, message: `RPE '${s}' out of 1-10 - dropped` });
      return null;
    }
    return { value: hi, note: `RPE ${s}` };
  }

  const n = Number(s);
  if (!Number.isFinite(n) || n < 1 || n > 10) {
    warnings.push({ row: rowNum, message: `RPE '${s}' out of 1-10 - dropped` });
    return null;
  }
  return { value: n };
}

function parseRirCell(raw, rowNum, warnings) {
  const s = String(raw || "").trim();
  if (!s) return null;

  const cap = s.match(/^(?:>=|≥|min\s*)\s*(\d+)$/i) || s.match(/^(\d+)\+$/);
  if (cap) {
    const v = Number(cap[1]);
    if (v < 0 || v > 10) {
      warnings.push({ row: rowNum, message: `RIR '${s}' out of 0-10 - dropped` });
      return null;
    }
    return { value: v, effortCap: true };
  }

  const range = s.match(/^(\d+)\s*[-–—]\s*(\d+)$/);
  if (range) {
    const hi = Number(range[2]);
    return { value: hi, note: `RIR ${s}` };
  }

  const n = Number(s);
  if (!Number.isInteger(n) || n < 0 || n > 10) {
    warnings.push({ row: rowNum, message: `RIR '${s}' out of 0-10 - dropped` });
    return null;
  }
  return { value: n };
}

function parseRestCell(raw, mode, rowNum, warnings) {
  const s = String(raw || "").trim();
  if (!s) return undefined;

  const range = s.match(/^(\d+(?:\.\d+)?)\s*[-–—]\s*(\d+(?:\.\d+)?)\s*(min|m|mins)?$/i);
  if (range) {
    const low = Number(range[1]);
    const isMin = range[3] || mode === "min";
    warnings.push({
      row: rowNum,
      message: `Rest range '${s}' - used the low end`,
    });
    return Math.round(isMin ? low * 60 : low);
  }

  const clock = s.match(/^(\d+):(\d{2})$/);
  if (clock) return Number(clock[1]) * 60 + Number(clock[2]);

  const withUnit = s.match(/^(\d+(?:\.\d+)?)\s*(s|sec|secs|seconds|m|min|mins|minutes)?$/i);
  if (withUnit) {
    const n = Number(withUnit[1]);
    const u = (withUnit[2] || "").toLowerCase();
    if (u.startsWith("m")) return Math.round(n * 60);
    if (u.startsWith("s")) return Math.round(n);
    if (mode === "min") return Math.round(n * 60);
    if (mode === "sec") return Math.round(n);
    // plain rest: <=10 minutes, >10 seconds
    if (n <= 10) {
      warnings.push({
        row: rowNum,
        message: `Rest ${n} read as ${n} minutes`,
      });
      return Math.round(n * 60);
    }
    return Math.round(n);
  }

  warnings.push({
    row: rowNum,
    message: `Couldn't parse rest '${s}'`,
  });
  return undefined;
}

function groupRecords(records, options, warnings) {
  const hasWeek = records.some((r) => r.weekNum != null);
  const weekMap = new Map();

  function ensureWeek(num) {
    const key = hasWeek ? num : 1;
    if (!weekMap.has(key)) {
      weekMap.set(key, { label: "", days: new Map(), dayOrder: [] });
    }
    return weekMap.get(key);
  }

  for (const rec of records) {
    const wNum = hasWeek ? rec.weekNum : 1;
    if (hasWeek && wNum == null) {
      warnings.push({
        row: rec.rowNum,
        message: "Row missing week - skipped",
      });
      continue;
    }
    const week = ensureWeek(wNum);
    if (rec.weekLabel && !week.label) week.label = rec.weekLabel;

    let dayKey;
    if (rec.dayNameRaw) dayKey = `name:${rec.dayNameRaw}`;
    else if (rec.dayKeyRaw) dayKey = `key:${rec.dayKeyRaw}`;
    else dayKey = "name:Day 1";

    if (!week.days.has(dayKey)) {
      const name = rec.dayNameRaw
        ? rec.dayNameRaw
        : rec.dayKeyRaw
          ? `Day ${rec.dayKeyRaw}`
          : "Day 1";
      const dayKeyNum =
        rec.dayKeyRaw !== "" && Number.isFinite(Number(rec.dayKeyRaw))
          ? Number(rec.dayKeyRaw)
          : null;
      week.days.set(dayKey, {
        name,
        dayKeyNum,
        firstIndex: week.dayOrder.length,
        rows: [],
      });
      week.dayOrder.push(dayKey);
    }
    week.days.get(dayKey).rows.push(rec);
  }

  // Sort each day's rows by order, then merge consecutive identical names
  for (const week of weekMap.values()) {
    for (const day of week.days.values()) {
      day.rows.sort((a, b) => {
        if (a.order != null && b.order != null) return a.order - b.order;
        if (a.order != null) return -1;
        if (b.order != null) return 1;
        return 0;
      });
      day.exercises = [];
      for (const rec of day.rows) {
        const last = day.exercises[day.exercises.length - 1];
        if (last && last.name === rec.exerciseName) {
          last.sets.push(...rec.sets.map((s) => ({ ...s })));
          if (rec.notes) {
            const existing = new Set(last.notes.split("\n").filter(Boolean));
            for (const line of rec.notes.split("\n")) {
              if (line && !existing.has(line)) {
                last.notes = last.notes ? `${last.notes}\n${line}` : line;
              }
            }
          }
          if (last.restSec == null && rec.restSec != null) {
            last.restSec = rec.restSec;
          }
          if (rec.effortCap) last.effortCap = true;
        } else {
          day.exercises.push({
            name: rec.exerciseName,
            sets: rec.sets.map((s) => ({ ...s })),
            notes: rec.notes || "",
            restSec: rec.restSec,
            effortCap: rec.effortCap,
          });
        }
      }
    }
  }

  const weekNums = [...weekMap.keys()].sort((a, b) => a - b);
  if (hasWeek && weekNums.length > 0) {
    const min = weekNums[0];
    const max = weekNums[weekNums.length - 1];
    for (let w = min; w <= max; w += 1) {
      if (!weekMap.has(w)) {
        warnings.push({
          message: `Week ${w} wasn't in the file - weeks were renumbered`,
        });
      }
    }
  }

  const weeks = weekNums.map((wn) => {
    const w = weekMap.get(wn);
    const dayKeys = [...w.dayOrder];
    dayKeys.sort((a, b) => {
      const da = w.days.get(a);
      const db = w.days.get(b);
      if (da.dayKeyNum != null && db.dayKeyNum != null) {
        return da.dayKeyNum - db.dayKeyNum;
      }
      if (da.dayKeyNum != null) return -1;
      if (db.dayKeyNum != null) return 1;
      return da.firstIndex - db.firstIndex;
    });

    const days = dayKeys.map((dk) => {
      const d = w.days.get(dk);
      return {
        name: d.name,
        exercises: d.exercises.map((ex) => {
          const out = { name: ex.name, sets: ex.sets };
          if (ex.notes) out.notes = ex.notes;
          if (ex.restSec != null) out.restSec = ex.restSec;
          if (ex.effortCap) out.effortCap = true;
          return out;
        }),
      };
    });

    const weekOut = { days };
    if (w.label) weekOut.label = w.label;
    return weekOut;
  });

  const block = {
    format: "logchamp.block",
    version: 1,
    name: options.name || "Imported block",
    weeks: weeks.length ? weeks : [{ days: [] }],
  };
  if (options.unit) block.unit = options.unit;

  let sawRpe = false;
  let sawRir = false;
  for (const week of block.weeks) {
    for (const day of week.days) {
      for (const ex of day.exercises) {
        for (const s of ex.sets) {
          if (s.rpe != null) sawRpe = true;
          if (s.rir != null) sawRir = true;
        }
      }
    }
  }
  if (sawRpe) block.effort = "rpe";
  else if (sawRir) block.effort = "rir";

  return block;
}

module.exports = {
  tableToBlock,
};
