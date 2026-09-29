/**
 * Pure path-to-words helper for import validation errors (BK6).
 * Translates JSON-pointer-ish paths into plain language using names from
 * the submitted block when present.
 *
 * @param {string} path e.g. "weeks[1].days[0].exercises[2].sets[3].reps"
 * @param {object|null|undefined} block submitted JSON (for day/exercise names)
 * @param {string} [message] validator message
 * @returns {string}
 */
export function pathToWords(path, block, message = "") {
  const msg = message == null ? "" : String(message);
  const raw = path == null ? "" : String(path).trim();
  if (!raw) return msg;

  const tokens = [];
  const re = /([a-zA-Z_][\w]*)(?:\[(\d+)\])?/g;
  let m;
  while ((m = re.exec(raw)) !== null) {
    tokens.push({
      key: m[1],
      index: m[2] !== undefined ? Number(m[2]) : null,
    });
  }
  if (tokens.length === 0) return msg;

  const parts = [];
  let week = null;
  let day = null;
  let exercise = null;
  let leafField = null;

  for (const tok of tokens) {
    const { key, index } = tok;
    if (key === "weeks" && index != null) {
      week = Array.isArray(block?.weeks) ? block.weeks[index] : null;
      parts.push(`Week ${index + 1}`);
    } else if (key === "days" && index != null) {
      day = Array.isArray(week?.days) ? week.days[index] : null;
      const dayName =
        day && typeof day.name === "string" && day.name.trim()
          ? day.name.trim()
          : `Day ${index + 1}`;
      parts.push(dayName);
    } else if (key === "exercises" && index != null) {
      exercise = Array.isArray(day?.exercises) ? day.exercises[index] : null;
      const exName =
        exercise && typeof exercise.name === "string" && exercise.name.trim()
          ? exercise.name.trim()
          : `Exercise ${index + 1}`;
      parts.push(exName);
    } else if (key === "sets" && index != null) {
      parts.push(`Set ${index + 1}`);
    } else if (index == null) {
      // Leaf field (reps, weight, name, …) or a bare segment
      leafField = key;
    } else {
      parts.push(`${key} ${index + 1}`);
    }
  }

  if (leafField) {
    const fieldBit = msg ? `${leafField}: ${msg}` : leafField;
    parts.push(fieldBit);
    return parts.join(" › ");
  }

  if (msg) {
    if (parts.length === 0) return msg;
    return `${parts.join(" › ")}: ${msg}`;
  }
  return parts.join(" › ");
}
