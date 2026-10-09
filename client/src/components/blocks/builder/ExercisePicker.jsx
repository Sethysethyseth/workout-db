import { useCallback, useEffect, useRef, useState } from "react";
import { getExerciseIndex } from "../../../api/analyticsApi.js";
import { listCustomExercises, searchExercises } from "../../../api/exerciseApi.js";
import { BuilderSheet } from "./BuilderSheet.jsx";
import { Chip } from "../ui/Chip.jsx";
import { createEmptyExercise } from "./blockBuilderState.js";

const RECENT_LIMIT = 8;

function recentKey(row) {
  const identity = row?.identity || {};
  if (identity.userExerciseId != null) return `user:${identity.userExerciseId}`;
  if (identity.exerciseId) return `ex:${identity.exerciseId}`;
  return `name:${row?.name || ""}`;
}

function sortByLastPerformed(rows) {
  return rows.slice().sort((a, b) => {
    const ta = Date.parse(a?.lastPerformed) || 0;
    const tb = Date.parse(b?.lastPerformed) || 0;
    return tb - ta;
  });
}

/**
 * Exercise picker: bottom sheet on phones, dialog on wide screens.
 * Debounced search + "Use '<typed text>'" / "Add 'X' to your library" when
 * there is no exact (case-insensitive) library match.
 * An empty query shows recent logs, then custom exercises not already listed.
 * Server ranks results; search field stays pinned while the list scrolls.
 */
export function ExercisePicker({
  open,
  onClose,
  onPick,
  onAddToLibrary,
  title = "Add exercise",
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);
  const [searching, setSearching] = useState(false);
  const [recents, setRecents] = useState([]);
  const [yourExercises, setYourExercises] = useState([]);
  const [rosterReady, setRosterReady] = useState(false);
  const searchRef = useRef(null);
  const wide =
    typeof window !== "undefined" ? window.matchMedia("(min-width: 720px)").matches : false;

  const handleClose = useCallback(() => {
    setQuery("");
    setResults([]);
    setHasMore(false);
    setTotal(0);
    setSearching(false);
    onClose?.();
  }, [onClose]);

  useEffect(() => {
    if (!open) return undefined;
    const t = window.setTimeout(() => {
      searchRef.current?.focus();
    }, 30);
    return () => window.clearTimeout(t);
  }, [open]);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      getExerciseIndex().catch(() => null),
      listCustomExercises().catch(() => null),
    ]).then(([indexData, customData]) => {
      if (cancelled) return;
      const exercises = Array.isArray(indexData?.exercises) ? indexData.exercises : [];
      const recent = sortByLastPerformed(exercises).slice(0, RECENT_LIMIT);
      const recentNames = new Set(
        recent.map((row) => String(row.name || "").trim().toLowerCase()).filter(Boolean)
      );
      const recentUserIds = new Set(
        recent
          .map((row) => row?.identity?.userExerciseId)
          .filter((id) => id != null)
      );
      const customs = Array.isArray(customData?.userExercises) ? customData.userExercises : [];
      const yours = customs.filter((row) => {
        const name = String(row?.name || "").trim();
        if (!name) return false;
        if (recentNames.has(name.toLowerCase())) return false;
        if (row.id != null && recentUserIds.has(row.id)) return false;
        return true;
      });
      setRecents(recent);
      setYourExercises(yours);
      setRosterReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!open) return undefined;
    const q = query.trim();
    if (!q) {
      return undefined;
    }
    let cancelled = false;
    const t = window.setTimeout(() => {
      setSearching(true);
      searchExercises(q, { limit: 40 })
        .then((data) => {
          if (cancelled) return;
          const list = Array.isArray(data?.results)
            ? data.results
            : Array.isArray(data?.exercises)
              ? data.exercises
              : Array.isArray(data)
                ? data
                : [];
          setResults(list);
          const more = Boolean(data?.hasMore);
          setHasMore(more);
          const tCount = Number(data?.total);
          setTotal(Number.isFinite(tCount) ? tCount : list.length);
        })
        .catch(() => {
          if (!cancelled) {
            setResults([]);
            setHasMore(false);
            setTotal(0);
          }
        })
        .finally(() => {
          if (!cancelled) setSearching(false);
        });
    }, 150);
    return () => {
      cancelled = true;
      window.clearTimeout(t);
    };
  }, [open, query]);

  function pickLibrary(name) {
    onPick?.(
      createEmptyExercise({
        exerciseName: name,
        notInLibrary: false,
      })
    );
    handleClose();
  }

  function pickCustom() {
    const name = query.trim();
    if (!name) return;
    onPick?.(
      createEmptyExercise({
        exerciseName: name,
        notInLibrary: true,
      })
    );
    handleClose();
  }

  function addTypedToLibrary() {
    const name = query.trim();
    if (!name || !onAddToLibrary) return;
    onAddToLibrary(name);
    handleClose();
  }

  const trimmedQuery = query.trim();
  const showResults = trimmedQuery.length > 0;
  const hasExactMatch = results.some((row) => {
    const name = String(row.name || row.exerciseName || "").trim();
    return name.toLowerCase() === trimmedQuery.toLowerCase();
  });
  // Both free-text rows only when search has text and no exact library hit.
  const showCustomRows = showResults && !hasExactMatch;
  const moreCount = hasMore ? Math.max(0, total - results.length) : 0;
  const showEmptyDirection =
    rosterReady && recents.length === 0 && yourExercises.length === 0;

  return (
    <BuilderSheet
      open={open}
      title={title}
      onClose={handleClose}
      wide={wide}
      className="bk-sheet--picker"
    >
      <div className="bk-picker">
        <label className="bk-picker__search-label">
          <span className="bk-visually-hidden">Search exercises</span>
          <input
            ref={searchRef}
            className="bk-picker__search"
            type="search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              if (!e.target.value.trim()) {
                setResults([]);
                setHasMore(false);
                setTotal(0);
                setSearching(false);
              }
            }}
            placeholder="Search exercises"
            autoComplete="off"
            autoFocus={open}
          />
        </label>
        <ul className="bk-picker__list">
          {showResults ? (
            <>
              {searching ? (
                <li className="bk-picker__status">Searching…</li>
              ) : (
                results.map((row) => {
                  const name = row.name || row.exerciseName || "";
                  const key = row.exerciseId || row.userExerciseId || row.id || name;
                  return (
                    <li key={key}>
                      <button
                        type="button"
                        className="bk-picker__row"
                        onClick={() => pickLibrary(name)}
                      >
                        <span>{name}</span>
                      </button>
                    </li>
                  );
                })
              )}
              {!searching && moreCount > 0 ? (
                <li className="bk-picker__more" role="status">
                  {moreCount} more - keep typing to narrow
                </li>
              ) : null}
              {showCustomRows ? (
                <>
                  <li>
                    <button type="button" className="bk-picker__row" onClick={pickCustom}>
                      <span>
                        Use &lsquo;{trimmedQuery}&rsquo;
                      </span>
                      <Chip tone="warn">Not in library</Chip>
                    </button>
                  </li>
                  {typeof onAddToLibrary === "function" ? (
                    <li>
                      <button
                        type="button"
                        className="bk-picker__row"
                        onClick={addTypedToLibrary}
                      >
                        <span>
                          Add &lsquo;{trimmedQuery}&rsquo; to your library
                        </span>
                      </button>
                    </li>
                  ) : null}
                </>
              ) : null}
            </>
          ) : (
            <>
              {recents.length > 0 ? (
                <li className="bk-picker__section">Recent</li>
              ) : null}
              {recents.map((row) => {
                const name = row.name || "";
                return (
                  <li key={recentKey(row)}>
                    <button
                      type="button"
                      className="bk-picker__row"
                      onClick={() => pickLibrary(name)}
                    >
                      <span>{name}</span>
                    </button>
                  </li>
                );
              })}
              {yourExercises.length > 0 ? (
                <li className="bk-picker__section">Your exercises</li>
              ) : null}
              {yourExercises.map((row) => {
                const name = row.name || "";
                return (
                  <li key={`custom:${row.id ?? name}`}>
                    <button
                      type="button"
                      className="bk-picker__row"
                      onClick={() => pickLibrary(name)}
                    >
                      <span>{name}</span>
                    </button>
                  </li>
                );
              })}
              {showEmptyDirection ? (
                <li className="bk-picker__status">Search for an exercise to add it.</li>
              ) : null}
            </>
          )}
        </ul>
      </div>
    </BuilderSheet>
  );
}
