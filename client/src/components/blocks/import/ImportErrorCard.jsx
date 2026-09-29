import { Card } from "../ui/Card.jsx";
import { pathToWords } from "./pathToWords.js";

/**
 * 422 preview errors: "We couldn't read that yet" with path-to-words lines.
 * @param {{ path?: string, message?: string }[]} errors
 * @param {object|null} [submitted] JSON used for name lookup when present
 */
export function ImportErrorCard({ errors = [], submitted = null, onRetry = null }) {
  const list = Array.isArray(errors) ? errors : [];

  return (
    <Card className="bk-import-error">
      <h2 className="bk-import-error__title">We couldn&apos;t read that yet</h2>
      {list.length > 0 ? (
        <ul className="bk-import-error__list">
          {list.map((err, i) => {
            const path = err?.path != null ? String(err.path) : "";
            const message = err?.message != null ? String(err.message) : "Something went wrong";
            const line = pathToWords(path, submitted, message);
            return <li key={`${path}-${i}`}>{line || message}</li>;
          })}
        </ul>
      ) : (
        <p className="bk-import-error__fallback">Check the input and try again.</p>
      )}
      {onRetry ? (
        <button type="button" className="btn btn-secondary bk-import-error__retry" onClick={onRetry}>
          Try again
        </button>
      ) : null}
    </Card>
  );
}
