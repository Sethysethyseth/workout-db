/**
 * Tab navigation used to ask before leaving a live workout. It now works
 * like Back: no dialog. Before the route changes, flush any set
 * value still inside its debounce, using the same function the field runs
 * on blur (registered by the set row). Blur the focused field first so a
 * row that only saves from its blur handler (block logger) takes that path.
 * The calls start the save; they do not wait on the network.
 */

const flushers = new Set();

export function registerLiveSetDraftFlush(fn) {
  flushers.add(fn);
  return () => {
    flushers.delete(fn);
  };
}

export function flushLiveSessionDrafts() {
  if (typeof document !== "undefined") {
    const active = document.activeElement;
    if (active && active !== document.body && typeof active.blur === "function") {
      active.blur();
    }
  }
  for (const fn of [...flushers]) {
    try {
      fn();
    } catch {
      /* a flush error must not block navigation */
    }
  }
}
