/**
 * Cascade: children rise into place top-to-bottom (index.css `.mx-cascade`,
 * pure CSS - no per-child JS). Re-key the element to replay the cascade on
 * a view switch. `axis` adds the shared-axis slide for the container itself
 * ("left" = content arrived from the left, i.e. the user moved to an earlier
 * tab; "right" = a later tab). Reduced motion collapses all of it to a fade.
 */
export function Cascade({ as: Tag = "div", axis = null, className = "", children, ...rest }) {
  const cls = [
    "mx-cascade",
    axis === "left" ? "mx-axis-left" : axis === "right" ? "mx-axis-right" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");
  return (
    <Tag className={cls} {...rest}>
      {children}
    </Tag>
  );
}

/** Direction of travel between two ordered options, for `Cascade axis`. */
export function axisBetween(order, from, to) {
  if (from == null || to == null || from === to) return null;
  const a = order.indexOf(from);
  const b = order.indexOf(to);
  if (a === -1 || b === -1) return null;
  return b > a ? "right" : "left";
}
