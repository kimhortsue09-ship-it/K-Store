import type { ReactNode } from 'react';

/** Centred empty/placeholder state used across list pages. */
export function EmptyState({
  emoji,
  title,
  subtitle,
  children,
}: {
  emoji: string;
  title: string;
  subtitle?: string;
  children?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-2 px-6 py-16 text-center">
      <div className="text-5xl">{emoji}</div>
      <h3 className="text-lg font-semibold">{title}</h3>
      {subtitle && <p className="max-w-xs text-sm text-muted">{subtitle}</p>}
      {children && <div className="mt-2">{children}</div>}
    </div>
  );
}
