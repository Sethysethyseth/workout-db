/**
 * Display copy for analytics honesty notes. The engine still emits
 * "N set(s)"; this turns that into a real plural. Other notes pass through.
 */
export function formatHonestyNote(note) {
  if (typeof note !== "string") return note;
  return note.replace(/^(\d+) set\(s\)/, (_, raw) => {
    const count = Number(raw);
    const noun = count === 1 ? "set" : "sets";
    return `${count} ${noun}`;
  });
}
