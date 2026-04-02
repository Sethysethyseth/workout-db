/** Client-side IDs for React keys / local state. `randomUUID` is not available on insecure origins (e.g. LAN HTTP). */
export function makeId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
