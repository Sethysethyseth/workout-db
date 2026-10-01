/**
 * Pure Excel-row -> TSV helpers for the block importer File tab.
 * No browser or React imports - runnable under plain Node.
 */

function cellToString(cell) {
  if (cell == null) return "";
  if (cell instanceof Date) {
    const y = cell.getUTCFullYear();
    const m = String(cell.getUTCMonth() + 1).padStart(2, "0");
    const d = String(cell.getUTCDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
  if (typeof cell === "number") return String(cell);
  if (typeof cell === "boolean") return cell ? "TRUE" : "FALSE";
  return String(cell)
    .trim()
    .replace(/[\t\n\r]+/g, " ");
}

/**
 * Convert a 2-D sheet (read-excel-file rows) to TSV text.
 * @param {unknown[][]} rows
 * @returns {string}
 */
export function xlsxRowsToTsv(rows) {
  if (!Array.isArray(rows) || rows.length === 0) return "";

  const stringRows = rows.map((row) => {
    if (!Array.isArray(row)) return [""];
    return row.map(cellToString);
  });

  let colCount = 0;
  for (const row of stringRows) {
    for (let c = row.length - 1; c >= 0; c -= 1) {
      if (row[c] !== "") {
        if (c + 1 > colCount) colCount = c + 1;
        break;
      }
    }
  }
  if (colCount === 0) return "";

  const trimmed = stringRows.map((row) => {
    const out = [];
    for (let c = 0; c < colCount; c += 1) {
      out.push(row[c] ?? "");
    }
    return out;
  });

  let end = trimmed.length;
  while (end > 0 && trimmed[end - 1].every((cell) => cell === "")) {
    end -= 1;
  }
  if (end === 0) return "";

  const lines = [];
  for (let r = 0; r < end; r += 1) {
    lines.push(trimmed[r].join("\t"));
  }
  return lines.join("\n");
}

/**
 * Default sheet: first name matching /program|plan|block|training/i,
 * else the first non-empty sheet (after xlsxRowsToTsv).
 * @param {{ name: string, rows: unknown[][] }[]} sheets
 * @returns {string|null}
 */
export function pickDefaultSheetName(sheets) {
  if (!Array.isArray(sheets) || sheets.length === 0) return null;
  const named = sheets.find((s) => /program|plan|block|training/i.test(s.name));
  if (named) return named.name;
  const nonEmpty = sheets.find((s) => xlsxRowsToTsv(s.rows).trim() !== "");
  return (nonEmpty || sheets[0]).name;
}
