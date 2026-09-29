/**
 * Delimited text parser (CSV / TSV / semicolon). Pure.
 * Spec: docs/specs/blocks-v2.md section 4.1.
 */

class ParseDelimitedError extends Error {
  constructor(message) {
    super(message);
    this.name = "ParseDelimitedError";
  }
}

/**
 * @param {string} text
 * @returns {{ header: string[], rows: string[][], rowNumbers: number[] }}
 */
function parseDelimited(text) {
  if (typeof text !== "string") {
    throw new ParseDelimitedError("Expected plain text to parse.");
  }

  const lines = splitPhysicalLines(text);
  let headerLineIndex = -1;
  let headerRaw = null;
  for (let i = 0; i < lines.length; i += 1) {
    if (lines[i].trim() !== "") {
      headerLineIndex = i;
      headerRaw = lines[i];
      break;
    }
  }
  if (headerRaw == null) {
    throw new ParseDelimitedError("Couldn't find a header row in the file.");
  }

  let delimiter;
  if (headerRaw.includes("\t")) {
    delimiter = "\t";
  } else {
    const semis = (headerRaw.match(/;/g) || []).length;
    const commas = (headerRaw.match(/,/g) || []).length;
    delimiter = semis > commas ? ";" : ",";
  }

  const header = parseRow(headerRaw, delimiter);
  if (header.length === 0 || header.every((c) => c.trim() === "")) {
    throw new ParseDelimitedError("Couldn't find a header row in the file.");
  }

  const rows = [];
  const rowNumbers = [];

  // For CSV with quoted newlines, re-scan from after header using a streaming parse
  if (delimiter === "\t") {
    for (let i = headerLineIndex + 1; i < lines.length; i += 1) {
      const line = lines[i];
      if (line.trim() === "") continue;
      const cells = parseRow(line, delimiter);
      if (cells.every((c) => c.trim() === "")) continue;
      rows.push(cells);
      // 1-based source line number in the original text's physical lines
      rowNumbers.push(i + 1);
    }
  } else {
    // CSV / semicolon: handle quoted newlines by parsing the remainder as a stream
    const afterHeader = text.slice(indexAfterLine(text, headerLineIndex));
    const parsed = parseCsvRecords(afterHeader, delimiter, headerLineIndex + 2);
    for (const rec of parsed) {
      if (rec.cells.every((c) => c.trim() === "")) continue;
      rows.push(rec.cells);
      rowNumbers.push(rec.rowNumber);
    }
  }

  return { header, rows, rowNumbers };
}

/** Split on \n / \r\n / \r without respecting quotes (physical lines). */
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

function indexAfterLine(text, lineIndex) {
  let line = 0;
  for (let i = 0; i < text.length; i += 1) {
    if (line === lineIndex) {
      // find end of this line
      let j = i;
      while (j < text.length && text[j] !== "\n" && text[j] !== "\r") j += 1;
      if (text[j] === "\r" && text[j + 1] === "\n") return j + 2;
      if (text[j] === "\n" || text[j] === "\r") return j + 1;
      return j;
    }
    if (text[i] === "\r") {
      line += 1;
      if (text[i + 1] === "\n") i += 1;
    } else if (text[i] === "\n") {
      line += 1;
    }
  }
  return text.length;
}

/**
 * Parse one physical line (TSV or simple CSV without embedded newlines).
 */
function parseRow(line, delimiter) {
  if (delimiter === "\t") {
    return line.split("\t");
  }
  return parseCsvLine(line, delimiter);
}

/** RFC 4180 CSV line (no unescaped newline expected). */
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

/**
 * Stream-parse CSV records that may contain quoted newlines.
 * startRowNumber is 1-based row number of the first data record.
 */
function parseCsvRecords(text, delimiter, startRowNumber) {
  const records = [];
  let cells = [];
  let cur = "";
  let inQuotes = false;
  let rowNumber = startRowNumber;
  let i = 0;

  function commitRecord() {
    // Skip wholly blank trailing content
    const isBlank =
      cells.length === 0 ||
      (cells.length === 1 && cells[0] === "" && cur === "" && !inQuotes);
    if (!isBlank || cur !== "" || cells.length > 1) {
      cells.push(cur);
      // Drop a single empty record from a trailing newline
      if (!(cells.length === 1 && cells[0] === "")) {
        records.push({ cells, rowNumber });
      }
    }
    cells = [];
    cur = "";
  }

  while (i < text.length) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          cur += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i += 1;
        continue;
      }
      if (ch === "\r" && text[i + 1] === "\n") {
        cur += "\n";
        i += 2;
        continue;
      }
      if (ch === "\n" || ch === "\r") {
        cur += "\n";
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
    } else if (ch === "\r" || ch === "\n") {
      commitRecord();
      if (ch === "\r" && text[i + 1] === "\n") i += 2;
      else i += 1;
      rowNumber += 1;
    } else {
      cur += ch;
      i += 1;
    }
  }
  // Final record if any content remains
  if (cur !== "" || cells.length > 0) {
    commitRecord();
  }
  return records;
}

function normalizeHeaderKey(raw) {
  return String(raw || "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

module.exports = {
  parseDelimited,
  ParseDelimitedError,
  normalizeHeaderKey,
};
