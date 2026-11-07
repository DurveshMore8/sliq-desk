import { useState, type InputHTMLAttributes } from "react";

interface FormFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

function EyeIcon({ crossedOut }: { crossedOut: boolean }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {crossedOut ? (
        <>
          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
          <line x1="1" y1="1" x2="23" y2="23" />
        </>
      ) : (
        <>
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
          <circle cx="12" cy="12" r="3" />
        </>
      )}
    </svg>
  );
}

export function FormField({
  label,
  error,
  id,
  type,
  ...inputProps
}: FormFieldProps) {
  const [visible, setVisible] = useState(false);
  const inputId = id ?? inputProps.name;
  const isPassword = type === "password";

  const input = (
    <input
      id={inputId}
      type={isPassword && visible ? "text" : type}
      aria-invalid={error ? true : undefined}
      {...inputProps}
    />
  );

  return (
    <div className="field">
      <label htmlFor={inputId}>{label}</label>
      {isPassword ? (
        <div className="input-wrap">
          {input}
          <button
            type="button"
            className="toggle-visibility"
            onClick={() => setVisible((v) => !v)}
            aria-label={visible ? "Hide password" : "Show password"}
            aria-pressed={visible}
          >
            <EyeIcon crossedOut={visible} />
          </button>
        </div>
      ) : (
        input
      )}
      {error && <span className="field-error">{error}</span>}
    </div>
  );
}
