import { useId, useState } from "react";

export function PasswordInput({
  label,
  value,
  onChange,
  autoComplete,
  required,
  minLength,
}) {
  const id = useId();
  const [visible, setVisible] = useState(false);

  return (
    <label htmlFor={id}>
      {label}
      <div className="password-field">
        <input
          id={id}
          type={visible ? "text" : "password"}
          value={value}
          onChange={onChange}
          autoComplete={autoComplete}
          required={required}
          minLength={minLength}
        />
        <button
          type="button"
          className="btn btn-secondary password-toggle"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "Hide password" : "Show password"}
        >
          {visible ? "Hide" : "Show"}
        </button>
      </div>
    </label>
  );
}
