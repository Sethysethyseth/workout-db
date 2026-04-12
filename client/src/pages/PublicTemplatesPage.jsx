import { Navigate } from "react-router-dom";

/** @deprecated Use Programs with the Community tab; kept for bookmarks and old links. */
export function PublicTemplatesPage() {
  return <Navigate to="/templates?area=community" replace />;
}
