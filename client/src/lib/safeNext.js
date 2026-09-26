/**
 * Guard a `?next=` search param: same-origin relative paths only.
 * Must start with `/` and must not start with `//` or `/\` (URL parsing
 * treats a backslash as a slash, so `/\host` is protocol-relative);
 * otherwise `/`.
 */
export function safeNextPath(searchParams) {
  const raw = searchParams.get("next") || "/";
  if (!raw.startsWith("/") || raw.startsWith("//") || raw.startsWith("/\\")) {
    return "/";
  }
  return raw;
}
