import { useCallback, useEffect, useRef, useState } from "react";
import { searchExercises } from "../../../api/exerciseApi.js";
import { BuilderSheet } from "./BuilderSheet.jsx";
import { Chip } from "../ui/Chip.jsx";
import { createEmptyExercise } from "./blockBuilderState.js";

/**
 * Exercise picker: bottom sheet on phones, dialog on wide screens.
 * Debounced search + "Use '<typed text>'" name-only row (always last).
 * Server ranks results; search field stays pinned while the list scrolls.
 */
export function ExercisePicker({ open, onClose, onPick, title = "Add exercise" }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);
  const [searching, setSearching] = useState(false);
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

  const showResults = query.trim().length > 0;
  const moreCount = hasMore ? Math.max(0, total - results.length) : 0;

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
          {showResults ? (
            <li>
              <button type="button" className="bk-picker__row" onClick={pickCustom}>
                <span>
                  Use &lsquo;{query.trim()}&rsquo;
                </span>
                <Chip tone="warn">Not in library</Chip>
              </button>
            </li>
          ) : null}
        </ul>
      </div>
    </BuilderSheet>
  );
}
