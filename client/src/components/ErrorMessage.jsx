export function ErrorMessage({ error }) {
  if (!error) return null;
  const message = typeof error === "string" ? error : error.message || String(error);
  return (
    <div className="card error">
      <strong>Error</strong>
      <div className="mt-2">{message}</div>
    </div>
  );
}

