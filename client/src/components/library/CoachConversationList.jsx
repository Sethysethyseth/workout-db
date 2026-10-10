import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  deleteAllCoachConversations,
  deleteCoachConversation,
  listCoachConversations,
} from "../../api/coachApi.js";
import { useCoachSession } from "../../context/CoachSessionContext.jsx";
import { ConfirmPanel } from "../ConfirmPanel.jsx";
import "../../styles/coach-history.css";

const FOCUS_LABELS = {
  view: "Analytics",
  session: "Workout debrief",
  block: "Block",
  help: "Help",
  general: "General",
};

function dateParts(value) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return { day: "-", weekday: "", time: "" };
  return {
    day: String(d.getDate()),
    weekday: d.toLocaleDateString(undefined, { weekday: "short" }),
    time: d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" }),
  };
}

function monthKey(value) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "Undated";
  return d.toLocaleDateString(undefined, { month: "long", year: "numeric" });
}

function contextLabel(focusType) {
  if (!focusType) return null;
  return FOCUS_LABELS[focusType] || null;
}

function DeleteIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4 7h16M9 7V5h6v2M7 7l1 13h8l1-13"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function CoachConversationList() {
  const session = useCoachSession();
  const [items, setItems] = useState([]);
  const [nextBefore, setNextBefore] = useState(null);
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [confirmAll, setConfirmAll] = useState(false);
  const [busy, setBusy] = useState(false);
  const sentinelRef = useRef(null);
  const pagingRef = useRef(false);

  const applyPage = useCallback((page, mode) => {
    const incoming = Array.isArray(page?.items) ? page.items : [];
    setItems((prev) => {
      if (mode === "replace") return incoming;
      const seen = new Set(prev.map((row) => row.id));
      const extra = incoming.filter((row) => !seen.has(row.id));
      if (extra.length === 0) return prev;
      return [...prev, ...extra];
    });
    setNextBefore(page?.nextBefore || null);
    if (mode === "append" && incoming.length === 0) setNextBefore(null);
  }, []);

  const loadFirst = useCallback(() => {
    setStatus("loading");
    setError(null);
    listCoachConversations()
      .then((page) => {
        applyPage(page, "replace");
        setStatus("ready");
      })
      .catch((err) => {
        setError(err);
        setStatus("error");
      });
  }, [applyPage]);

  useEffect(() => {
    loadFirst();
  }, [loadFirst]);

  const loadMore = useCallback(() => {
    if (!nextBefore || pagingRef.current || status !== "ready") return;
    pagingRef.current = true;
    listCoachConversations({ before: nextBefore })
      .then((page) => {
        const incoming = Array.isArray(page?.items) ? page.items : [];
        setItems((prev) => {
          const seen = new Set(prev.map((row) => row.id));
          const extra = incoming.filter((row) => !seen.has(row.id));
          return extra.length === 0 ? prev : [...prev, ...extra];
        });
        setNextBefore(incoming.length > 0 && page?.nextBefore ? page.nextBefore : null);
      })
      .catch((err) => setError(err))
      .finally(() => {
        pagingRef.current = false;
      });
  }, [nextBefore, status]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !nextBefore) return undefined;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) loadMore();
      },
      { rootMargin: "240px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [nextBefore, loadMore]);

  async function confirmDeleteOne() {
    if (!pendingDelete || busy) return;
    setBusy(true);
    setError(null);
    try {
      await deleteCoachConversation(pendingDelete.id);
      if (Number(session.conversationId) === Number(pendingDelete.id)) {
        session.clearSession();
      }
      setItems((prev) => prev.filter((row) => row.id !== pendingDelete.id));
      setPendingDelete(null);
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  }

  async function confirmDeleteAll() {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      await deleteAllCoachConversations();
      session.clearSession();
      setItems([]);
      setNextBefore(null);
      setConfirmAll(false);
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  }

  const groups = useMemo(() => {
    const out = [];
    for (const row of items) {
      const key = monthKey(row.updatedAt || row.createdAt);
      const last = out[out.length - 1];
      if (last && last.key === key) last.items.push(row);
      else out.push({ key, items: [row] });
    }
    return out;
  }, [items]);

  if (status === "loading") {
    return <p className="coach-history__status">Loading conversations…</p>;
  }

  if (status === "error" && items.length === 0) {
    return (
      <div className="coach-history__empty">
        <p className="coach-history__empty-copy">Couldn&apos;t load conversations.</p>
        <button type="button" className="btn" onClick={loadFirst}>
          Try again
        </button>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="card stack coach-history__empty">
        <p className="coach-history__empty-copy">Your coach conversations show up here.</p>
        <Link className="btn" to="/coach">
          Ask the coach
        </Link>
      </div>
    );
  }

  return (
    <div className="coach-history stack">
      {error ? <p className="coach-history__status">Couldn&apos;t update the list. Try again.</p> : null}
      {groups.map((group) => (
        <section key={group.key} className="history-group" aria-label={group.key}>
          <h2 className="history-group__label">
            <span>{group.key}</span>
            <span className="history-group__count">
              {group.items.length} {group.items.length === 1 ? "conversation" : "conversations"}
            </span>
          </h2>
          <div className="card history-list">
            {group.items.map((row) => {
              const label = contextLabel(row.focusType);
              const when = dateParts(row.updatedAt || row.createdAt);
              return (
                <div key={row.id} className="history-row coach-history-row">
                  <span className="history-row__date" aria-hidden="true">
                    <span className="history-row__weekday">{when.weekday}</span>
                    <span className="history-row__day">{when.day}</span>
                  </span>
                  <Link className="history-row__main coach-history-row__open" to={`/coach?c=${row.id}`}>
                    <span className="history-row__title">{row.title}</span>
                    <span className="history-row__meta muted small">
                      {when.time}
                      {label ? (
                        <>
                          <span aria-hidden="true"> · </span>
                          {label}
                        </>
                      ) : null}
                    </span>
                  </Link>
                  <button
                    type="button"
                    className="coach-history__delete"
                    aria-label="Delete conversation"
                    onClick={() => setPendingDelete(row)}
                  >
                    <DeleteIcon />
                  </button>
                </div>
              );
            })}
          </div>
        </section>
      ))}
      {nextBefore ? (
        <div className="coach-history__more">
          <div ref={sentinelRef} className="coach-history__sentinel" aria-hidden="true" />
          <button type="button" className="btn btn-secondary" onClick={loadMore}>
            Load more
          </button>
        </div>
      ) : null}
      <div className="coach-history__footer">
        <button type="button" className="coach-history__delete-all" onClick={() => setConfirmAll(true)}>
          Delete all conversations
        </button>
      </div>
      <ConfirmPanel
        open={pendingDelete != null}
        tone="danger"
        title="Delete this conversation?"
        body="It's removed from your coach history. This can't be undone."
        confirmLabel="Delete conversation"
        cancelLabel="Keep conversation"
        busy={busy}
        onConfirm={() => void confirmDeleteOne()}
        onCancel={() => {
          if (!busy) setPendingDelete(null);
        }}
      />
      <ConfirmPanel
        open={confirmAll}
        tone="danger"
        title="Delete all coach conversations?"
        body="Every saved conversation is removed. This can't be undone."
        confirmLabel="Delete all"
        cancelLabel="Keep conversations"
        busy={busy}
        onConfirm={() => void confirmDeleteAll()}
        onCancel={() => {
          if (!busy) setConfirmAll(false);
        }}
      />
    </div>
  );
}
