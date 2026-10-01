/**
 * Split author/plan notes into a short always-visible cue (Setup /
 * Lead side + first freeform line) and longer coach copy for the
 * collapsible "Coach note".
 *
 * @param {string | null | undefined} notes
 * @returns {{ cue: string, coach: string }}
 */
export function splitPlanNotes(notes) {
  const text = notes != null ? String(notes).trim() : "";
  if (!text) return { cue: "", coach: "" };

  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const cueLines = [];
  const coachLines = [];

  for (const line of lines) {
    if (/^Setup:/i.test(line) || /^Lead side:/i.test(line)) {
      cueLines.push(line);
    } else if (
      /^Tempo:/i.test(line) ||
      /^Job:/i.test(line) ||
      /^Load:/i.test(line)
    ) {
      coachLines.push(line);
    } else if (cueLines.length === 0 && coachLines.length === 0) {
      // First freeform line is the short cue; further freeform goes to coach.
      cueLines.push(line);
    } else {
      coachLines.push(line);
    }
  }

  return {
    cue: cueLines.join("\n"),
    coach: coachLines.join("\n"),
  };
}

/**
 * Parse "Lead side: left|right" from plan notes (any case).
 * @param {string | null | undefined} notes
 * @returns {"L" | "R" | null}
 */
export function parseLeadSide(notes) {
  const text = notes != null ? String(notes) : "";
  const m = text.match(/Lead\s*side:\s*(left|right)\b/i);
  if (!m) return null;
  return m[1].toLowerCase() === "right" ? "R" : "L";
}
