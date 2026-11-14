/**
 * Arena view: a folded room stays folded across a change of tab (Seth,
 * Nov 14: arriving at the open room every time is a hassle when you are
 * after the data under it). ArenaStage records, on leaving an open page,
 * whether its room was folded to the rail, and how far the next open page
 * must scroll to be folded; RouteTransition starts the new page there
 * instead of at the top. Scrolling up brings the room back, and leaving a
 * page with the room open arrives open again. No DOM, no React.
 */

let folded = false;
let room = 0;

/** The page being left was an open page: was its room folded to the rail? */
export function noteArenaFold(value) {
  folded = Boolean(value);
}

/** Px of scroll that folds the current route's room; 0 when it has no open room. */
export function setArenaFoldRoom(px) {
  room = px > 0 ? px : 0;
}

/** Where a newly opened page starts: folded if the last open page was, else the top. */
export function arenaArrivalScroll() {
  return folded ? room : 0;
}
