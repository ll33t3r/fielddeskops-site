export default function FormField({ id, label, required = false, error, children, helperText }) {
  return (
    <div className="space-y-1">
      {label ? (
        <label htmlFor={id} className="text-sm font-medium text-[var(--text-primary)]">
          {label} {required ? <span className="text-red-500">*</span> : null}
        </label>
      ) : null}
      {children}
      {error ? (
        <p className="text-xs text-red-500">{error}</p>
      ) : helperText ? (
        <p className="text-xs text-[var(--text-sub)]">{helperText}</p>
      ) : null}
    </div>
  );
}
