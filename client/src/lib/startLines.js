/**
 * What Home's start button says for a raw log (a workout with no template or
 * block behind it). One is picked each time the button mounts. Seth's list -
 * add to it freely; keep each line short enough for one row at 360px.
 */
export const RAW_LOG_LINES = [
  "Straight raw loggin' it?",
  "Raw log it",
  "Let's get loggin'",
  "Log now, plan never",
  "Roll a fresh log",
  "Time to chop some wood",
  "Lumber up",
  "Go against the grain",
  "Timber! Start lifting",
  "Log in. Lift. Log out.",
];

export function pickRawLogLine(random = Math.random) {
  return RAW_LOG_LINES[Math.floor(random() * RAW_LOG_LINES.length)] || RAW_LOG_LINES[0];
}
