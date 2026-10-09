import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  deleteAllCoachConversations,
  deleteCoachConversation,
  listCoachConversations,
} from "../../api/coachApi.js";
import { ConfirmPanel } from "../ConfirmPanel.jsx";
import "../../styles/coach-history.css";

const FOCUS_LABELS = {
  view: "Analytics",
  session: "Workout debrief",
  block: "Block",
  help: "Help",
  general: "General",
};

function formatRelativeDate(value) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  const startOf = (x) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const days = Math.round((startOf(new Date()) - startOf(d)) / 86400000);
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 7) return `${days} days ago`;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
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
      setItems([]);
      setNextBefore(null);
      setConfirmAll(false);
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  }

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
      <div className="coach-history__empty">
        <p className="coach-history__empty-copy">Your coach conversations show up here.</p>
        <Link className="btn" to="/coach">
          Ask the coach
        </Link>
      </div>
    );
  }

  return (
    <div className="coach-history">
      {error ? <p className="coach-history__status">Couldn&apos;t update the list. Try again.</p> : null}
      <ul className="coach-history__list">
        {items.map((row) => {
          const label = contextLabel(row.focusType);
          const when = formatRelativeDate(row.updatedAt);
          const meta = [label, when].filter(Boolean).join(", ");
          return (
            <li key={row.id} className="coach-history__row">
              <Link className="coach-history__open" to={`/coach?c=${row.id}`}>
                <span className="coach-history__title">{row.title}</span>
                {meta ? <span className="coach-history__meta">{meta}</span> : null}
              </Link>
              <button
                type="button"
                className="coach-history__delete"
                aria-label="Delete conversation"
                onClick={() => setPendingDelete(row)}
              >
                <DeleteIcon />
              </button>
            </li>
          );
        })}
      </ul>
      {nextBefore ? <div ref={sentinelRef} className="coach-history__sentinel" aria-hidden="true" /> : null}
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
