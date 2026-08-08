import { useId, useState } from "react";

/**
 * Independent disclosure sections for per-client connector setup steps.
 * Driven by a `sections` data array — each item is `{ id, label, content }`.
 */
export function ConnectorSetupAccordion({ sections, defaultOpenIds = [] }) {
  const baseId = useId();
  const [openIds, setOpenIds] = useState(() => new Set(defaultOpenIds));

  function toggle(id) {
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div className="connector-setup-accordion">
      {sections.map((section) => {
        const open = openIds.has(section.id);
        const panelId = `${baseId}-${section.id}-panel`;
        return (
          <div key={section.id} className="connector-setup-accordion__section">
            <button
              type="button"
              className="connector-setup-accordion__trigger"
              aria-expanded={open}
              aria-controls={panelId}
              onClick={() => toggle(section.id)}
            >
              <span className="connector-setup-accordion__label">
                {section.label}
              </span>
              <span
                className="connector-setup-accordion__chevron"
                aria-hidden="true"
              >
                {open ? "▾" : "▸"}
              </span>
            </button>
            {open ? (
              <div
                id={panelId}
                className="connector-setup-accordion__panel"
                role="region"
                aria-label={section.label}
              >
                {section.content}
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
