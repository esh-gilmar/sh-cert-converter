import type { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  icon?: ReactNode;
}

const variants = {
  primary:
    'bg-sh-green text-white hover:bg-[#014421] focus-visible:outline-sh-orange disabled:bg-slate-300',
  secondary:
    'border border-sh-green text-sh-green hover:bg-sh-green hover:text-white focus-visible:outline-sh-orange disabled:border-slate-300 disabled:text-slate-400',
  ghost: 'text-sh-green hover:bg-sh-green/10 focus-visible:outline-sh-orange disabled:text-slate-400'
};

export function Button({ children, className = '', variant = 'primary', icon, ...props }: ButtonProps) {
  return (
    <button
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed ${variants[variant]} ${className}`}
      {...props}
    >
      {icon}
      <span>{children}</span>
    </button>
  );
}
