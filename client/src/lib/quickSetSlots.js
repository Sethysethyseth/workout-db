/**
 * Quick-logger set slots.
 *
 * Choice: a promoted draft KEEPS its slot until focus leaves the exercise's
 * set stack. Canonical order (saved sets by their array order, then the
 * remaining last-time ghosts) applies only after that. While held, the
 * created set binds to the slot key that promoted it, so the same row
 * component stays mounted and the row does not move.
 */

function draftSingle(seId, ghostIndex, { firstEmpty = false } = {}) {
  if (firstEmpty) {
    return {
      type: "single",
      key: `qslot-${seId}-0`,
      setId: null,
      isDraft: true,
      draftSlot: null,
      side: null,
      ghostIndex: null,
      ordinal: 1,
      pairOrdinal: null,
      labelOverride: null,
    };
  }
  return {
    type: "single",
    key: `qslot-${seId}-g-${ghostIndex}`,
    setId: null,
    isDraft: true,
    draftSlot: ghostIndex === 0 ? null : ghostIndex,
    side: null,
    ghostIndex,
    ordinal: ghostIndex + 1,
    pairOrdinal: null,
    labelOverride: ghostIndex === 0 ? null : `Set ${ghostIndex + 1}`,
  };
}

function savedSingle(seId, set, index, { ghostIndex = null, key = null, labelOverride = null } = {}) {
  return {
    type: "single",
    key: key || (index === 0 && ghostIndex == null ? `qslot-${seId}-0` : `qset-${set.id}`),
    setId: set.id,
    isDraft: false,
    draftSlot: null,
    side: set.side === "L" || set.side === "R" ? set.side : null,
    ghostIndex,
    ordinal: index + 1,
    pairOrdinal: null,
    labelOverride,
  };
}

function sideSlot(seId, side, index, set) {
  const label = side === "L" ? `Set ${index + 1} - Left` : `Set ${index + 1} - Right`;
  return {
    type: "single",
    key: `qslot-${seId}-${side}-${index}`,
    setId: set ? set.id : null,
    isDraft: !set,
    draftSlot: set ? null : `${side}-${index}`,
    side,
    ghostIndex: index,
    ordinal: index + 1,
    pairOrdinal: index + 1,
    labelOverride: label,
  };
}

function pairRow(seId, index, leftSet, rightSet) {
  return {
    type: "pair",
    key: `qpair-${seId}-${index}`,
    sides: [sideSlot(seId, "L", index, leftSet), sideSlot(seId, "R", index, rightSet)],
  };
}

function groupPerSide(sortedSets) {
  const units = [];
  let i = 0;
  let pairNum = 1;
  while (i < sortedSets.length) {
    if (i + 1 < sortedSets.length) {
      const a = sortedSets[i];
      const b = sortedSets[i + 1];
      const left = a.side === "R" ? b : a;
      const right = a.side === "R" ? a : b;
      units.push({ kind: "pair", index: pairNum - 1, pairOrdinal: pairNum, left, right });
      pairNum += 1;
      i += 2;
    } else {
      units.push({ kind: "single", index: pairNum - 1, pairOrdinal: pairNum, set: sortedSets[i] });
      pairNum += 1;
      i += 1;
    }
  }
  return units;
}

/**
 * @param {object} input
 * @param {number|string} input.seId
 * @param {{id: number, side?: string}[]} input.sortedSets already ordered
 * @param {boolean} input.perSideMode
 * @param {number[]} input.plainGhostIndexes last-time indexes that ghost
 * @param {number} input.sideGhostPairs max(L, R) last-time rows
 */
export function buildCanonicalQuickSlots(input) {
  const seId = input.seId;
  const sortedSets = Array.isArray(input.sortedSets) ? input.sortedSets : [];
  const perSideMode = Boolean(input.perSideMode);
  const plainGhostIndexes = Array.isArray(input.plainGhostIndexes) ? input.plainGhostIndexes : [];
  const sideGhostPairs = Number.isInteger(input.sideGhostPairs) ? input.sideGhostPairs : 0;

  if (perSideMode) {
    if (sortedSets.length === 0 && sideGhostPairs === 0) {
      return { kind: "message", rows: [] };
    }
    if (sortedSets.length === 0) {
      const rows = [];
      for (let i = 0; i < sideGhostPairs; i += 1) rows.push(pairRow(seId, i, null, null));
      return { kind: "rows", rows };
    }
    const loggedPairs = Math.max(
      sortedSets.filter((s) => s.side === "L").length,
      sortedSets.filter((s) => s.side === "R").length
    );
    const units = groupPerSide(sortedSets);
    const rows = units.map((unit) => {
      if (unit.kind === "pair") return pairRow(seId, unit.index, unit.left, unit.right);
      const set = unit.set;
      const side = set.side === "L" || set.side === "R" ? set.side : null;
      const label = side === "L" ? `Set ${unit.pairOrdinal} - Left` : side === "R" ? `Set ${unit.pairOrdinal} - Right` : null;
      return savedSingle(seId, set, unit.index, {
        key: `qset-${set.id}`,
        ghostIndex: unit.index,
        labelOverride: label,
      });
    });
    for (let i = loggedPairs; i < sideGhostPairs; i += 1) {
      rows.push(pairRow(seId, i, null, null));
    }
    return { kind: "rows", rows };
  }

  if (sortedSets.length === 0 && plainGhostIndexes.length === 0) {
    return { kind: "rows", rows: [draftSingle(seId, 0, { firstEmpty: true })] };
  }
  if (sortedSets.length === 0) {
    return { kind: "rows", rows: plainGhostIndexes.map((i) => draftSingle(seId, i)) };
  }

  if (plainGhostIndexes.length === 0) {
    return {
      kind: "rows",
      rows: sortedSets.map((set, i) => savedSingle(seId, set, i)),
    };
  }

  const rows = sortedSets.map((set, i) => {
    const ghostIndex = i < plainGhostIndexes.length ? plainGhostIndexes[i] : null;
    return savedSingle(seId, set, i, {
      ghostIndex,
      key: ghostIndex != null ? `qslot-${seId}-g-${ghostIndex}` : `qset-${set.id}`,
      labelOverride: null,
    });
  });
  const usedGhost = new Set(rows.map((r) => r.ghostIndex).filter((n) => n != null));
  for (const ghostIndex of plainGhostIndexes) {
    if (usedGhost.has(ghostIndex)) continue;
    if (ghostIndex < sortedSets.length) continue;
    rows.push(draftSingle(seId, ghostIndex));
  }
  return { kind: "rows", rows };
}

function reviveSlot(slot, sortedSets, bindings, used) {
  const bound = bindings && typeof bindings.get === "function" ? bindings.get(slot.key) : null;
  const setId = bound != null ? bound : slot.setId;
  const set = setId != null ? sortedSets.find((s) => s.id === setId) : null;
  if (!set) {
    return { ...slot, setId: null, isDraft: true };
  }
  used.add(set.id);
  return { ...slot, setId: set.id, isDraft: false };
}

function extraSingle(set) {
  return {
    type: "single",
    key: `qset-${set.id}`,
    setId: set.id,
    isDraft: false,
    draftSlot: null,
    side: set.side === "L" || set.side === "R" ? set.side : null,
    ghostIndex: null,
    ordinal: null,
    pairOrdinal: null,
    labelOverride: null,
  };
}

/**
 * Held shape wins. Bindings fill the slot that promoted. Sets that belong
 * to none of those slots append after them, so a row never jumps upward
 * while the hold is active.
 */
export function applyQuickHold(heldRows, sortedSets, bindings) {
  const sets = Array.isArray(sortedSets) ? sortedSets : [];
  const held = Array.isArray(heldRows) ? heldRows : [];
  const used = new Set();
  const rows = held.map((row) => {
    if (row.type === "pair") {
      return { ...row, sides: row.sides.map((side) => reviveSlot(side, sets, bindings, used)) };
    }
    return reviveSlot(row, sets, bindings, used);
  });
  for (const set of sets) {
    if (used.has(set.id)) continue;
    rows.push(extraSingle(set));
    used.add(set.id);
  }
  return { kind: rows.length === 0 ? "message" : "rows", rows };
}

export function cloneQuickRows(rows) {
  return (rows || []).map((row) =>
    row.type === "pair" ? { ...row, sides: row.sides.map((side) => ({ ...side })) } : { ...row }
  );
}
