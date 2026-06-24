import { motion, useReducedMotion } from 'motion/react';
import type { ReactNode } from 'react';

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.section
      initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.24, ease: 'easeOut' }}
      className={`rounded-[1.35rem] border border-emerald-900/10 bg-white/95 shadow-sh-card shadow-sh-green/10 ring-1 ring-white/70 backdrop-blur ${className}`}
    >
      {children}
    </motion.section>
  );
}
