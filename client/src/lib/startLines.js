/**
 * What Home's start button says. Almost always the plain line; once in a
 * while (RARE_CHANCE) one of the rare ones. Seth's list - add rare lines
 * here; keep each short enough for one row at 360px.
 */
export const START_LINE = "Start workout";
export const RARE_START_LINES = ["Straight raw loggin' it?"];
export const RARE_CHANCE = 0.05;

export function pickStartLine(random = Math.random) {
  if (!(random() < RARE_CHANCE)) return START_LINE;
  return RARE_START_LINES[Math.floor(random() * RARE_START_LINES.length)] || START_LINE;
}
