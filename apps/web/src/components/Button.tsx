import { motion, useReducedMotion, type HTMLMotionProps } from 'motion/react';
import type { ReactNode } from 'react';

interface ButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  children?: ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost';
  icon?: ReactNode;
}

const variants = {
  primary:
    'bg-sh-green text-white shadow-sh-soft hover:bg-[#014421] hover:shadow-sh-glow focus-visible:outline-sh-orange disabled:bg-slate-300 disabled:shadow-none',
  secondary:
    'border border-sh-green/30 bg-white text-sh-green shadow-sm hover:border-sh-green hover:bg-sh-green hover:text-white focus-visible:outline-sh-orange disabled:border-slate-300 disabled:text-slate-400',
  ghost:
    'text-sh-green hover:bg-sh-green/10 focus-visible:outline-sh-orange disabled:text-slate-400'
};

export function Button({ children, className = '', variant = 'primary', icon, ...props }: ButtonProps) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.button
      whileTap={props.disabled || shouldReduceMotion ? undefined : { scale: 0.99 }}
      transition={{ duration: 0.16, ease: 'easeOut' }}
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed ${variants[variant]} ${className}`}
      {...props}
    >
      {icon}
      <span>{children}</span>
    </motion.button>
  );
}
