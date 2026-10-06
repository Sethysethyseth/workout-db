import { useEffect, useId, useRef } from "react";

/**
 * Focus Cancel (or a provided ref) when an overlay opens; Escape calls onClose;
 * restore focus to the opener on unmount.
 */
export function useOverlayFocus({ open, onClose, focusRef }) {
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return undefined;
    const prev =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const t = window.setTimeout(() => {
      const target = focusRef?.current;
      if (target && typeof target.focus === "function") {
        target.focus();
      }
    }, 0);
    function onKey(e) {
      if (e.key === "Escape") {
        e.stopPropagation();
        onCloseRef.current?.();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener("keydown", onKey);
      if (prev && typeof prev.focus === "function" && document.contains(prev)) {
        prev.focus();
      }
    };
  }, [open, focusRef]);
}

/**
 * Phone: bottom sheet. Wide (>=720px): centered dialog.
 * Escape / backdrop closes; focus returns to the control that opened it.
 */
export function BuilderSheet({
  open,
  title,
  onClose,
  children,
  footer = null,
  wide = false,
  className = "",
}) {
  const titleId = useId();
  const panelRef = useRef(null);
  const returnFocusRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    returnFocusRef.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    function onKey(e) {
      if (e.key === "Escape") onClose?.();
    }
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
      const el = returnFocusRef.current;
      returnFocusRef.current = null;
      if (el && typeof el.focus === "function" && document.contains(el)) {
        el.focus();
      }
    };
  }, [open, onClose]);

  useEffect(() => {
    if (!open || !panelRef.current) return;
    const focusable = panelRef.current.querySelector(
      "input, textarea, button, [tabindex]:not([tabindex='-1'])"
    );
    if (focusable) focusable.focus();
  }, [open]);

  if (!open) return null;

  const cls = [
    "bk-sheet",
    wide ? "bk-sheet--wide" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={cls} role="dialog" aria-modal="true" aria-labelledby={titleId}>
      <button
        type="button"
        className="bk-sheet__backdrop"
        aria-label="Close"
        onClick={onClose}
      />
      <div className="bk-sheet__panel" ref={panelRef}>
        <div className="bk-sheet__header">
          <h2 id={titleId} className="bk-sheet__title">
            {title}
          </h2>
          <button
            type="button"
            className="bk-sheet__close"
            aria-label="Close"
            onClick={onClose}
          >
            ×
          </button>
        </div>
        <div className="bk-sheet__body">{children}</div>
        {footer != null ? <div className="bk-sheet__footer">{footer}</div> : null}
      </div>
    </div>
  );
}
