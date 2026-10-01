/**
 * AI layout import recipe: format, validator, sampler, and deterministic
 * table transform. Pure - no Prisma, no env. Spec/task: bks1.
 */

const RECIPE_VERSION = 1;
const SAMPLE_MAX_DATA_ROWS = 40;
const SAMPLE_MAX_CHARS = 12000;

const CANONICAL_ROLES = new Set([
  "week",
  "week label",
  "day",
  "day name",
  "exercise",
  "sets",
  "reps",
  "weight",
  "rpe",
  "rir",
  "rpe cap",
  "rir cap",
  "rest seconds",
  "rest minutes",
  "notes",
  "setup",
  "tempo",
  "lead side",
  "section",
  "ignore",
]);

const ROLE_TO_HEADER = {
  week: "Week",
  "week label": "Week label",
  day: "Day",
  "day name": "Day name",
  exercise: "Exercise",
  sets: "Sets",
  reps: "Reps",
  weight: "Weight",
  rpe: "RPE",
  rir: "RIR",
  "rpe cap": "RPE cap",
  "rir cap": "RIR cap",
  "rest seconds": "Rest sec",
  "rest minutes": "Rest min",
  notes: "Notes",
  setup: "Setup",
  tempo: "Tempo",
  "lead side": "Lead side",
  section: "Section",
};

const ALLOWED_TOP_KEYS = new Set([
  "version",
  "headerRow",
  "unit",
  "columns",
  "prescriptionColumn",
  "dayHeaderRows",
  "carryDown",
  "weekColumns",
]);

/**
 * Split physical lines (same rules as parseDelimited).
 * @param {string} text
 * @returns {string[]}
 */
function splitPhysicalLines(text) {
  const out = [];
  let cur = "";
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    if (ch === "\r") {
      out.push(cur);
      cur = "";
      if (text[i + 1] === "\n") i += 1;
    } else if (ch === "\n") {
      out.push(cur);
      cur = "";
    } else {
      cur += ch;
    }
  }
  out.push(cur);
  return out;
}

function parseCsvLine(line, delimiter) {
  const cells = [];
  let cur = "";
  let i = 0;
  let inQuotes = false;
  while (i < line.length) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          cur += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i += 1;
        continue;
      }
      cur += ch;
      i += 1;
    } else if (ch === '"') {
      inQuotes = true;
      i += 1;
    } else if (ch === delimiter) {
      cells.push(cur);
      cur = "";
      i += 1;
    } else {
      cur += ch;
      i += 1;
    }
  }
  cells.push(cur);
  return cells;
}

function parseRow(line, delimiter) {
  if (delimiter === "\t") return line.split("\t");
  return parseCsvLine(line, delimiter);
}

function detectDelimiter(line) {
  if (line.includes("\t")) return "\t";
  const semis = (line.match(/;/g) || []).length;
  const commas = (line.match(/,/g) || []).length;
  return semis > commas ? ";" : ",";
}

/**
 * All non-empty sheet rows as cells (titles + header + data).
 * Delimiter is taken from the densest separator line (usually the header).
 * @param {string} text
 * @returns {{ sheetRows: string[][], rowNumbers: number[], delimiter: string }}
 */
function sheetFromText(text) {
  if (typeof text !== "string") {
    return { sheetRows: [], rowNumbers: [], delimiter: "," };
  }
  const lines = splitPhysicalLines(text);
  const nonEmpty = [];
  for (let i = 0; i < lines.length; i += 1) {
    if (lines[i].trim() === "") continue;
    nonEmpty.push({ line: lines[i], rowNumber: i + 1 });
  }
  if (nonEmpty.length === 0) {
    return { sheetRows: [], rowNumbers: [], delimiter: "," };
  }

  let best = nonEmpty[0];
  let bestScore = -1;
  for (const entry of nonEmpty) {
    const tabs = (entry.line.match(/\t/g) || []).length;
    const commas = (entry.line.match(/,/g) || []).length;
    const semis = (entry.line.match(/;/g) || []).length;
    const score = Math.max(tabs * 3, commas, semis);
    if (score > bestScore) {
      bestScore = score;
      best = entry;
    }
  }
  const delimiter = detectDelimiter(best.line);

  const sheetRows = [];
  const rowNumbers = [];
  for (const entry of nonEmpty) {
    sheetRows.push(parseRow(entry.line, delimiter));
    rowNumbers.push(entry.rowNumber);
  }
  return { sheetRows, rowNumbers, delimiter };
}

/**
 * Normalize a parseDelimited result or a sheet grid into sheet rows.
 * @param {{ header?: string[], rows?: string[][], rowNumbers?: number[], sheetRows?: string[][], delimiter?: string }} parsedTable
 */
function asSheet(parsedTable) {
  if (
    parsedTable &&
    Array.isArray(parsedTable.sheetRows) &&
    parsedTable.sheetRows.length > 0
  ) {
    return {
      sheetRows: parsedTable.sheetRows,
      rowNumbers: Array.isArray(parsedTable.rowNumbers)
        ? parsedTable.rowNumbers
        : parsedTable.sheetRows.map((_, i) => i + 1),
    };
  }
  const header = (parsedTable && parsedTable.header) || [];
  const rows = (parsedTable && parsedTable.rows) || [];
  const rowNumbers = (parsedTable && parsedTable.rowNumbers) || [];
  const sheetRows = [header, ...rows];
  const nums = [rowNumbers[0] != null ? rowNumbers[0] - 1 : 1, ...rowNumbers];
  // Prefer 1-based line of the header when unknown
  if (nums[0] < 1) nums[0] = 1;
  return { sheetRows, rowNumbers: nums };
}

function headerNamesAt(sheetRows, headerRow) {
  const idx =
    typeof headerRow === "number" && Number.isInteger(headerRow) && headerRow >= 0
      ? headerRow
      : 0;
  const row = sheetRows[idx] || [];
  return row.map((c) => String(c != null ? c : ""));
}

/**
 * @param {object} recipe
 * @param {string[]} [tableHeaders] exact header texts from the sheet
 * @returns {{ ok: boolean, recipe?: object, errors: { path: string, message: string }[] }}
 */
function validateImportRecipe(recipe, tableHeaders) {
  const errors = [];
  if (recipe == null || typeof recipe !== "object" || Array.isArray(recipe)) {
    return {
      ok: false,
      errors: [{ path: "", message: "recipe must be an object" }],
    };
  }

  for (const key of Object.keys(recipe)) {
    if (!ALLOWED_TOP_KEYS.has(key)) {
      errors.push({
        path: key,
        message: `Unknown recipe field '${key}'`,
      });
    }
  }

  if (recipe.version !== RECIPE_VERSION) {
    errors.push({
      path: "version",
      message: `version must be ${RECIPE_VERSION}`,
    });
  }

  if (recipe.headerRow != null) {
    if (
      typeof recipe.headerRow !== "number" ||
      !Number.isInteger(recipe.headerRow) ||
      recipe.headerRow < 0
    ) {
      errors.push({
        path: "headerRow",
        message: "headerRow must be a non-negative integer",
      });
    }
  }

  if (recipe.unit != null && recipe.unit !== "lb" && recipe.unit !== "kg") {
    errors.push({ path: "unit", message: 'unit must be "lb" or "kg"' });
  }

  if (
    recipe.columns == null ||
    typeof recipe.columns !== "object" ||
    Array.isArray(recipe.columns)
  ) {
    errors.push({ path: "columns", message: "columns must be an object" });
  } else {
    for (const [header, role] of Object.entries(recipe.columns)) {
      if (typeof role !== "string" || !CANONICAL_ROLES.has(role)) {
        errors.push({
          path: `columns.${header}`,
          message: `Unknown role '${role}'`,
        });
      }
    }
  }

  const headerSet =
    Array.isArray(tableHeaders) && tableHeaders.length > 0
      ? new Set(tableHeaders.map((h) => String(h)))
      : null;

  function requireHeader(name, path) {
    if (!headerSet) return;
    if (!headerSet.has(name)) {
      errors.push({
        path,
        message: `Header '${name}' is not in the table`,
      });
    }
  }

  if (recipe.columns && typeof recipe.columns === "object") {
    for (const header of Object.keys(recipe.columns)) {
      requireHeader(header, `columns.${header}`);
    }
  }

  if (recipe.prescriptionColumn != null) {
    if (typeof recipe.prescriptionColumn !== "string") {
      errors.push({
        path: "prescriptionColumn",
        message: "prescriptionColumn must be a string",
      });
    } else {
      requireHeader(recipe.prescriptionColumn, "prescriptionColumn");
    }
  }

  if (recipe.dayHeaderRows != null) {
    if (
      typeof recipe.dayHeaderRows !== "object" ||
      Array.isArray(recipe.dayHeaderRows) ||
      typeof recipe.dayHeaderRows.column !== "string"
    ) {
      errors.push({
        path: "dayHeaderRows",
        message: "dayHeaderRows must be { column: string }",
      });
    } else {
      requireHeader(recipe.dayHeaderRows.column, "dayHeaderRows.column");
    }
  }

  if (recipe.carryDown != null) {
    if (!Array.isArray(recipe.carryDown)) {
      errors.push({ path: "carryDown", message: "carryDown must be an array" });
    } else {
      recipe.carryDown.forEach((h, i) => {
        if (typeof h !== "string") {
          errors.push({
            path: `carryDown[${i}]`,
            message: "carryDown entries must be strings",
          });
        } else {
          requireHeader(h, `carryDown[${i}]`);
        }
      });
    }
  }

  if (recipe.weekColumns != null) {
    if (!Array.isArray(recipe.weekColumns)) {
      errors.push({
        path: "weekColumns",
        message: "weekColumns must be an array",
      });
    } else {
      recipe.weekColumns.forEach((entry, i) => {
        if (!entry || typeof entry !== "object") {
          errors.push({
            path: `weekColumns[${i}]`,
            message: "weekColumns entry must be an object",
          });
          return;
        }
        if (typeof entry.header !== "string") {
          errors.push({
            path: `weekColumns[${i}].header`,
            message: "header must be a string",
          });
        } else {
          requireHeader(entry.header, `weekColumns[${i}].header`);
        }
        if (
          typeof entry.week !== "number" ||
          !Number.isInteger(entry.week) ||
          entry.week < 1
        ) {
          errors.push({
            path: `weekColumns[${i}].week`,
            message: "week must be a positive integer",
          });
        }
      });
    }
  }

  if (errors.length > 0) return { ok: false, errors };
  return { ok: true, recipe, errors: [] };
}

/**
 * Parse a combined prescription cell into sets / reps / weight / rpe pieces.
 * AMRAP and %1RM-style cells never guess - warning + blank reps.
 * @param {string} raw
 * @returns {{
 *   sets?: number,
 *   reps?: number,
 *   repsMax?: number,
 *   durationSec?: number,
 *   weight?: number,
 *   weightUnit?: "lb"|"kg",
 *   rpe?: number,
 *   warning?: string,
 * }}
 */
function parsePrescriptionCell(raw) {
  const result = {};
  let s = String(raw || "").trim();
  if (!s) return result;

  if (/amrap/i.test(s)) {
    result.warning = `Couldn't parse prescription '${String(raw).trim()}' - left blank`;
    return result;
  }
  if (/%/.test(s) && /1\s*rm/i.test(s)) {
    result.warning = `Couldn't parse prescription '${String(raw).trim()}' - left blank`;
    return result;
  }
  if (/^\d+(?:\.\d+)?\s*%/.test(s)) {
    result.warning = `Couldn't parse prescription '${String(raw).trim()}' - left blank`;
    return result;
  }

  const rpeMatch = s.match(/(?:@\s*)?RPE\s*(\d+(?:\.\d+)?)/i);
  if (rpeMatch) {
    const v = Number(rpeMatch[1]);
    if (v >= 1 && v <= 10) result.rpe = v;
    s = `${s.slice(0, rpeMatch.index)}${s.slice(rpeMatch.index + rpeMatch[0].length)}`.trim();
  }

  const weightMatch = s.match(/@\s*(\d+(?:\.\d+)?)\s*(kg|lb|lbs)?/i);
  if (weightMatch) {
    result.weight = Number(weightMatch[1]);
    const suffix = (weightMatch[2] || "").toLowerCase();
    if (suffix === "kg") result.weightUnit = "kg";
    else if (suffix === "lb" || suffix === "lbs") result.weightUnit = "lb";
    s = `${s.slice(0, weightMatch.index)}${s.slice(weightMatch.index + weightMatch[0].length)}`.trim();
  }

  s = s.replace(/\s+/g, " ").replace(/^[,;]+|[,;]+$/g, "").trim();
  if (!s) return result;

  const mult = s.match(/^(\d+)\s*[x×]\s*(.+)$/i);
  if (mult) {
    result.sets = Number(mult[1]);
    const rest = mult[2].trim();
    const durSec = rest.match(/^(\d+)\s*(sec|secs|seconds|s)\s*$/i);
    if (durSec) {
      result.durationSec = Number(durSec[1]);
      return result;
    }
    const durMin = rest.match(/^(\d+)\s*(min|mins|minutes|m)\s*$/i);
    if (durMin) {
      result.durationSec = Number(durMin[1]) * 60;
      return result;
    }
    const range =
      rest.match(/^(\d+)\s*[-–—]\s*(\d+)$/) ||
      rest.match(/^(\d+)\s+to\s+(\d+)$/i);
    if (range) {
      result.reps = Number(range[1]);
      result.repsMax = Number(range[2]);
      return result;
    }
    if (/^\d+$/.test(rest)) {
      result.reps = Number(rest);
      return result;
    }
    result.warning = `Couldn't parse prescription '${String(raw).trim()}' - left blank`;
    delete result.sets;
    return result;
  }

  result.warning = `Couldn't parse prescription '${String(raw).trim()}' - left blank`;
  return result;
}

function cellAt(row, index) {
  if (index == null || index < 0) return "";
  return row[index] != null ? String(row[index]) : "";
}

function indexOfHeader(headers, name) {
  const exact = headers.indexOf(name);
  if (exact >= 0) return exact;
  // Fallback: trim match
  const trimmed = String(name).trim();
  return headers.findIndex((h) => String(h).trim() === trimmed);
}

function weightHeaderForUnit(unit) {
  if (unit === "kg") return "Load (kg)";
  if (unit === "lb") return "Load (lb)";
  return "Weight";
}

/**
 * Detect lb/kg from a source header's own text (kg, kgs, kilo, lb, lbs, pounds).
 * Case-insensitive; parentheses allowed.
 * @param {string} header
 * @returns {"kg"|"lb"|null}
 */
function unitFromHeaderText(header) {
  const tokens = String(header || "")
    .toLowerCase()
    .match(/[a-z]+/g);
  if (!tokens) return null;
  for (const t of tokens) {
    if (t === "kg" || t === "kgs" || t === "kilo") return "kg";
    if (t === "lb" || t === "lbs" || t === "pound" || t === "pounds") return "lb";
  }
  return null;
}

/**
 * Weight column unit: recipe.unit, then source header text, then import unit.
 * (Per-cell suffixes are applied later when a prescription supplies them.)
 * @param {object} recipe
 * @param {string|null} weightSourceHeader
 * @param {"lb"|"kg"|null|undefined} importUnit
 * @returns {{
 *   unit: "lb"|"kg"|null,
 *   from: "recipe"|"header"|"import"|null,
 *   sourceHeader: string|null,
 * }}
 */
function resolveWeightColumnUnit(recipe, weightSourceHeader, importUnit) {
  const sourceHeader =
    typeof weightSourceHeader === "string" && weightSourceHeader.trim()
      ? weightSourceHeader
      : null;
  if (recipe && (recipe.unit === "kg" || recipe.unit === "lb")) {
    return { unit: recipe.unit, from: "recipe", sourceHeader };
  }
  if (sourceHeader) {
    const fromHeader = unitFromHeaderText(sourceHeader);
    if (fromHeader) {
      return { unit: fromHeader, from: "header", sourceHeader };
    }
  }
  if (importUnit === "kg" || importUnit === "lb") {
    return { unit: importUnit, from: "import", sourceHeader };
  }
  return { unit: null, from: null, sourceHeader };
}

/**
 * Human-readable unit notice for the preview changes list.
 * Column-header unit mismatches convert inside tableToBlock (one sheet-level
 * message there) - skip the soft "read as" notice in that case so the preview
 * does not contradict the stored numbers.
 * @param {{ unit: "lb"|"kg"|null, from: string|null, sourceHeader: string|null }} meta
 * @param {"lb"|"kg"|null|undefined} importUnit
 * @param {boolean} [willConvert] recipe.unit vs import unit (validateBlockDraft)
 */
function weightUnitNoticeMessage(meta, importUnit, willConvert) {
  if (!meta || (meta.from !== "recipe" && meta.from !== "header") || !meta.unit) {
    return null;
  }
  // Header unit differs from import unit: tableToBlock emits the conversion.
  if (
    meta.from === "header" &&
    importUnit &&
    meta.unit !== importUnit
  ) {
    return null;
  }
  const label =
    meta.sourceHeader && String(meta.sourceHeader).trim()
      ? String(meta.sourceHeader).trim()
      : weightHeaderForUnit(meta.unit);
  const asWord = meta.unit === "kg" ? "kilograms" : "pounds";
  let message = `${label} read as ${asWord}`;
  if (
    willConvert &&
    importUnit &&
    meta.unit !== importUnit
  ) {
    message += `; converted to ${importUnit}`;
  }
  return message;
}

/**
 * Apply a validated recipe to a parsed table / sheet grid.
 * @param {object} parsedTable
 * @param {object} recipe
 * @param {{ unit?: "lb"|"kg" }} [options] import's chosen unit (fallback for weight header)
 * @returns {{
 *   header: string[],
 *   rows: string[][],
 *   rowNumbers: number[],
 *   warnings: object[],
 *   weightColumn: { unit: "lb"|"kg"|null, from: string|null, sourceHeader: string|null },
 * }}
 */
function applyImportRecipe(parsedTable, recipe, options = {}) {
  const warnings = [];
  const importUnit =
    options && (options.unit === "kg" || options.unit === "lb")
      ? options.unit
      : null;
  const { sheetRows, rowNumbers } = asSheet(parsedTable);
  const headerRowIdx =
    typeof recipe.headerRow === "number" && recipe.headerRow >= 0
      ? recipe.headerRow
      : 0;

  if (headerRowIdx >= sheetRows.length) {
    warnings.push({
      message: `headerRow ${headerRowIdx} is past the end of the sheet`,
    });
    return { header: [], rows: [], rowNumbers: [], warnings };
  }

  const headers = headerNamesAt(sheetRows, headerRowIdx);
  let dataRows = sheetRows.slice(headerRowIdx + 1).map((r) => r.slice());
  let dataRowNums = rowNumbers.slice(headerRowIdx + 1);

  // carryDown: blank cells inherit nearest non-blank above
  if (Array.isArray(recipe.carryDown) && recipe.carryDown.length > 0) {
    const idxs = recipe.carryDown
      .map((h) => indexOfHeader(headers, h))
      .filter((i) => i >= 0);
    const last = {};
    for (const row of dataRows) {
      for (const idx of idxs) {
        const v = cellAt(row, idx).trim();
        if (v) last[idx] = v;
        else if (last[idx] != null) row[idx] = last[idx];
      }
    }
  }

  // dayHeaderRows: a row with only that column filled starts a new day
  let dayColIdx = -1;
  if (recipe.dayHeaderRows && typeof recipe.dayHeaderRows.column === "string") {
    dayColIdx = indexOfHeader(headers, recipe.dayHeaderRows.column);
  }
  let currentDayName = "";
  const afterDayHeaders = [];
  for (let i = 0; i < dataRows.length; i += 1) {
    const row = dataRows[i];
    const rowNum = dataRowNums[i];
    if (dayColIdx >= 0) {
      const dayText = cellAt(row, dayColIdx).trim();
      let onlyDay = dayText !== "";
      if (onlyDay) {
        for (let c = 0; c < Math.max(row.length, headers.length); c += 1) {
          if (c === dayColIdx) continue;
          if (cellAt(row, c).trim() !== "") {
            onlyDay = false;
            break;
          }
        }
      }
      if (onlyDay) {
        currentDayName = dayText;
        continue;
      }
    }
    afterDayHeaders.push({ row, rowNum, dayName: currentDayName });
  }

  // weekColumns unpivot
  const weekCols = Array.isArray(recipe.weekColumns) ? recipe.weekColumns : [];
  const weekColIdxs = weekCols.map((wc) => ({
    week: wc.week,
    idx: indexOfHeader(headers, wc.header),
    header: wc.header,
  }));

  /** @type {{ row: string[], rowNum: number, dayName: string, week?: number, prescription?: string }[]} */
  const expanded = [];
  for (const entry of afterDayHeaders) {
    if (weekColIdxs.length > 0) {
      for (const wc of weekColIdxs) {
        if (wc.idx < 0) continue;
        const cell = cellAt(entry.row, wc.idx).trim();
        if (!cell) continue; // blank = absent that week
        expanded.push({
          row: entry.row,
          rowNum: entry.rowNum,
          dayName: entry.dayName,
          week: wc.week,
          prescription: cell,
        });
      }
    } else {
      expanded.push({
        row: entry.row,
        rowNum: entry.rowNum,
        dayName: entry.dayName,
      });
    }
  }

  const columns =
    recipe.columns && typeof recipe.columns === "object" ? recipe.columns : {};
  const roleToSourceIdx = new Map();
  for (const [sourceHeader, role] of Object.entries(columns)) {
    if (role === "ignore") continue;
    const idx = indexOfHeader(headers, sourceHeader);
    if (idx < 0) {
      warnings.push({
        message: `Column '${sourceHeader}' was ignored`,
      });
      continue;
    }
    roleToSourceIdx.set(role, idx);
  }

  // Headers mapped in recipe.columns as ignore, or left out entirely, warn once
  const mappedSources = new Set(Object.keys(columns));
  headers.forEach((h) => {
    if (!h || !String(h).trim()) return;
    if (mappedSources.has(h)) return;
    if (weekCols.some((wc) => wc.header === h)) return;
    if (
      recipe.prescriptionColumn &&
      h === recipe.prescriptionColumn
    ) {
      return;
    }
    if (
      recipe.dayHeaderRows &&
      h === recipe.dayHeaderRows.column &&
      !mappedSources.has(h)
    ) {
      // day header column may only be used for dayHeaderRows
      return;
    }
    warnings.push({ message: `Column '${h}' was ignored` });
  });

  const prescriptionIdx =
    typeof recipe.prescriptionColumn === "string"
      ? indexOfHeader(headers, recipe.prescriptionColumn)
      : -1;

  let weightSourceHeader = null;
  for (const [sourceHeader, role] of Object.entries(columns)) {
    if (role === "weight") {
      weightSourceHeader = sourceHeader;
      break;
    }
  }
  const weightColumn = resolveWeightColumnUnit(
    recipe,
    weightSourceHeader,
    importUnit
  );
  // Column unit for the emitted header (recipe / source header / import).
  // recipe.unit alone still drives block.unit in importPreview (conversion).
  const unit = weightColumn.unit;
  const needsDayName =
    Boolean(recipe.dayHeaderRows) || roleToSourceIdx.has("day name");
  const needsWeek =
    weekColIdxs.length > 0 || roleToSourceIdx.has("week");
  const needsSets =
    prescriptionIdx >= 0 ||
    weekColIdxs.length > 0 ||
    roleToSourceIdx.has("sets");
  const needsReps =
    prescriptionIdx >= 0 ||
    weekColIdxs.length > 0 ||
    roleToSourceIdx.has("reps");
  const needsWeight =
    prescriptionIdx >= 0 ||
    weekColIdxs.length > 0 ||
    roleToSourceIdx.has("weight");
  const needsRpe =
    prescriptionIdx >= 0 ||
    weekColIdxs.length > 0 ||
    roleToSourceIdx.has("rpe");

  // Build canonical header list in a stable order
  const outRoles = [];
  const pushRole = (role) => {
    if (!outRoles.includes(role)) outRoles.push(role);
  };
  if (needsWeek) pushRole("week");
  if (roleToSourceIdx.has("week label")) pushRole("week label");
  if (roleToSourceIdx.has("day")) pushRole("day");
  if (needsDayName) pushRole("day name");
  pushRole("exercise");
  if (needsSets) pushRole("sets");
  if (needsReps) pushRole("reps");
  if (needsWeight) pushRole("weight");
  if (needsRpe) pushRole("rpe");
  for (const role of CANONICAL_ROLES) {
    if (role === "ignore") continue;
    if (roleToSourceIdx.has(role)) pushRole(role);
  }

  const outHeader = outRoles.map((role) => {
    if (role === "weight") return weightHeaderForUnit(unit);
    return ROLE_TO_HEADER[role] || role;
  });

  // recipe.unit still wins for "was this an explicit recipe unit?" (per-cell below)
  const recipeUnit =
    recipe.unit === "kg" || recipe.unit === "lb" ? recipe.unit : null;

  const outRows = [];
  const outRowNums = [];

  for (const entry of expanded) {
    const src = entry.row;
    const rowNum = entry.rowNum;
    const cells = outRoles.map(() => "");

    const setCell = (role, value) => {
      const i = outRoles.indexOf(role);
      if (i >= 0 && value != null && value !== "") cells[i] = String(value);
    };

    for (const [role, idx] of roleToSourceIdx.entries()) {
      if (role === "ignore") continue;
      // Sets/reps come from the prescription cell when one is in play;
      // weight/rpe still read from mapped columns unless the prescription
      // supplies them (applied below).
      if (
        (prescriptionIdx >= 0 || entry.prescription != null) &&
        (role === "sets" || role === "reps")
      ) {
        continue;
      }
      setCell(role, cellAt(src, idx).trim());
    }

    if (entry.week != null) setCell("week", String(entry.week));
    if (entry.dayName && !cellAt(cells, outRoles.indexOf("day name")).trim()) {
      setCell("day name", entry.dayName);
    }
    // If day name came only from dayHeaderRows and columns didn't map a day name source
    if (entry.dayName && needsDayName) {
      const existing = cells[outRoles.indexOf("day name")];
      if (!existing || !String(existing).trim()) setCell("day name", entry.dayName);
    }

    const prescriptionRaw =
      entry.prescription != null
        ? entry.prescription
        : prescriptionIdx >= 0
          ? cellAt(src, prescriptionIdx)
          : "";

    if (prescriptionRaw && String(prescriptionRaw).trim()) {
      const parsed = parsePrescriptionCell(prescriptionRaw);
      if (parsed.warning) {
        warnings.push({ row: rowNum, message: parsed.warning });
      }
      if (parsed.sets != null) setCell("sets", String(parsed.sets));
      if (parsed.durationSec != null) {
        setCell("reps", `${parsed.durationSec}s`);
      } else if (parsed.reps != null) {
        if (parsed.repsMax != null) {
          setCell("reps", `${parsed.reps}-${parsed.repsMax}`);
        } else {
          setCell("reps", String(parsed.reps));
        }
      }
      if (parsed.weight != null) setCell("weight", String(parsed.weight));
      if (parsed.rpe != null) setCell("rpe", String(parsed.rpe));
      // Prefer per-cell unit for weight header when nothing stronger was set
      if (parsed.weightUnit && recipeUnit == null && weightColumn.from !== "header") {
        const wi = outRoles.indexOf("weight");
        if (wi >= 0) {
          outHeader[wi] = weightHeaderForUnit(parsed.weightUnit);
          if (weightColumn.unit == null) {
            weightColumn.unit = parsed.weightUnit;
            weightColumn.from = "cell";
          }
        }
      }
    }

    // Exercise is required for a useful row; skip blank exercise rows silently
    const exIdx = outRoles.indexOf("exercise");
    if (exIdx >= 0 && !String(cells[exIdx] || "").trim()) {
      const hasAny = cells.some((c) => String(c || "").trim() !== "");
      if (hasAny) {
        warnings.push({
          row: rowNum,
          message: "Row has no exercise name - skipped",
        });
      }
      continue;
    }

    outRows.push(cells);
    outRowNums.push(rowNum);
  }

  return {
    header: outHeader,
    rows: outRows,
    rowNumbers: outRowNums,
    warnings,
    weightColumn,
  };
}

/**
 * Header region plus at most 40 data rows, capped at 12,000 characters.
 * For a plain table, that is the header line plus exactly 40 data rows.
 * @param {string} text
 * @returns {string}
 */
function sampleForRecipe(text) {
  if (typeof text !== "string" || !text) return "";
  const lines = splitPhysicalLines(text);
  let headerLineIndex = -1;
  for (let i = 0; i < lines.length; i += 1) {
    if (lines[i].trim() !== "") {
      headerLineIndex = i;
      break;
    }
  }
  if (headerLineIndex < 0) return "";

  // Include any blank/title lines before the first non-empty? Task says
  // "header region plus at most 40 data rows". For the 216-row fixture the
  // first non-empty IS the header. Keep leading content up to that line.
  const outLines = [];
  for (let i = 0; i <= headerLineIndex; i += 1) {
    outLines.push(lines[i]);
  }

  let dataCount = 0;
  for (let i = headerLineIndex + 1; i < lines.length; i += 1) {
    if (lines[i].trim() === "") continue;
    outLines.push(lines[i]);
    dataCount += 1;
    if (dataCount >= SAMPLE_MAX_DATA_ROWS) break;
  }

  let sample = outLines.join("\n");
  if (sample.length > SAMPLE_MAX_CHARS) {
    sample = sample.slice(0, SAMPLE_MAX_CHARS);
  }
  return sample;
}

/**
 * Resolve headers for a recipe against raw import text (respects headerRow).
 * @param {string} text
 * @param {object} recipe
 * @returns {string[]}
 */
function headersForRecipe(text, recipe) {
  const sheet = sheetFromText(text);
  const headerRow =
    recipe && typeof recipe.headerRow === "number" ? recipe.headerRow : 0;
  return headerNamesAt(sheet.sheetRows, headerRow);
}

module.exports = {
  RECIPE_VERSION,
  SAMPLE_MAX_DATA_ROWS,
  SAMPLE_MAX_CHARS,
  CANONICAL_ROLES,
  ROLE_TO_HEADER,
  validateImportRecipe,
  applyImportRecipe,
  sampleForRecipe,
  parsePrescriptionCell,
  sheetFromText,
  headersForRecipe,
  headerNamesAt,
  unitFromHeaderText,
  resolveWeightColumnUnit,
  weightUnitNoticeMessage,
  weightHeaderForUnit,
};
