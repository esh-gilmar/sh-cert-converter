import type { ReactNode } from 'react';

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-lg border border-emerald-900/10 bg-white shadow-soft ${className}`}>
      {children}
    </section>
  );
}
