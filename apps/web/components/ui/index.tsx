import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from 'react';

export function Button({
  variant = 'primary',
  className = '',
  ...p
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'ghost' }) {
  const base =
    'inline-flex min-h-11 items-center justify-center rounded-md px-4 text-sm font-semibold transition disabled:opacity-50';
  const v =
    variant === 'primary'
      ? 'bg-navy text-white hover:bg-navy-700'
      : 'border border-navy/20 bg-white text-navy hover:bg-navy-100';
  return <button className={`${base} ${v} ${className}`} {...p} />;
}

export function Field({
  label,
  error,
  ...p
}: InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string }) {
  const id = p.id ?? p.name;
  return (
    <div className="space-y-1">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      <input
        id={id}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-err` : undefined}
        className="min-h-11 w-full rounded-md border border-navy/20 bg-white px-3 text-base"
        {...p}
      />
      {error && (
        <p id={`${id}-err`} role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  );
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl border border-navy/10 bg-white p-5 shadow-sm ${className}`}>
      {children}
    </div>
  );
}

export function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <Card className="text-center">
      <p className="font-semibold">{title}</p>
      <p className="mt-1 text-sm text-navy/70">{body}</p>
    </Card>
  );
}

export function Alert({
  kind = 'error',
  children,
}: {
  kind?: 'error' | 'ok' | 'warn';
  children: ReactNode;
}) {
  const c = {
    error: 'border-danger text-danger',
    ok: 'border-ok text-ok',
    warn: 'border-warn text-warn',
  }[kind];
  return (
    <div
      role={kind === 'error' ? 'alert' : 'status'}
      className={`rounded-md border bg-white p-3 text-sm ${c}`}
    >
      {children}
    </div>
  );
}
