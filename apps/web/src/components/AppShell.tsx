import { motion, MotionConfig, useReducedMotion } from 'motion/react';

import type { ReactNode } from 'react';
import { appVersion, getCurrentYear } from '../config/appInfo.js';

export function AppShell({ children }: { children: ReactNode }) {
  const currentYear = getCurrentYear();
  const shouldReduceMotion = useReducedMotion();
  const entranceInitial = shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: -6 };
  const entranceAnimate = { opacity: 1, y: 0 };

  return (
    <MotionConfig reducedMotion="user">
      <div
        className={[
          'flex min-h-screen flex-col text-[#183128]',
          'bg-[radial-gradient(circle_at_top_left,rgba(179,217,140,0.30),transparent_34%),linear-gradient(135deg,#f8fbf6_0%,#eef6ef_46%,#f8faf8_100%)]'
        ].join(' ')}
      >
        <motion.header
          initial={entranceInitial}
          animate={entranceAnimate}
          transition={{ duration: 0.28, ease: 'easeOut' }}
          className={[
            'relative border-b border-emerald-900/10 bg-white/90',
            'shadow-[0_8px_28px_rgba(0,85,43,0.06)] backdrop-blur'
          ].join(' ')}
        >
          <div className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-sh-orange via-sh-light to-transparent" />
          <div className="mx-auto flex max-w-[1440px] items-center justify-between px-5 py-3 sm:px-8">
            <div className="flex items-center gap-3">
              <div
                className={[
                  'relative flex h-12 w-[4.25rem] items-center justify-center rounded-xl',
                  'bg-white/80 p-1.5 shadow-[0_10px_26px_rgba(0,85,43,0.10)]',
                  'ring-1 ring-emerald-900/10 before:absolute before:-left-1 before:top-2',
                  "before:h-7 before:w-1 before:rounded-full before:bg-sh-orange before:content-['']"
                ].join(' ')}
              >
                <img
                  src="/assets/sh_toolbar_transp.png"
                  alt="Santa Helena"
                  className="max-h-full max-w-full object-contain"
                />
              </div>
              <div className="space-y-0.5">
                <p className="text-xs font-bold uppercase text-sh-orange">SANTA HELENA</p>
                <p className="text-sm font-semibold text-slate-600">Ferramentas internas</p>
              </div>
            </div>
          </div>
        </motion.header>

        <motion.main
          initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut', delay: 0.04 }}
          className="mx-auto w-full max-w-[1440px] flex-1 px-5 py-5 sm:px-8 sm:py-6"
        >
          {children}
        </motion.main>

        <footer className="mx-auto w-full max-w-[1440px] px-5 pb-6 text-xs text-slate-600 sm:px-8">
          <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 border-t border-emerald-900/10 pt-3 sm:justify-end">
            <span>Desenvolvido por</span>
            <span className="font-bold text-sh-orange">TI SH</span>
            <span aria-hidden="true" className="text-sh-orange">
              •
            </span>
            <span>{currentYear}</span>
            <span aria-hidden="true" className="text-sh-orange">
              •
            </span>
            <span>v{appVersion}</span>
          </div>
        </footer>
      </div>
    </MotionConfig>
  );
}
