import { ShieldCheck } from 'lucide-react';
import type { ReactNode } from 'react';

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-sh-background text-[#183128]">
      <header className="border-b border-emerald-900/10 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-sh-green text-white">
              <ShieldCheck aria-hidden="true" size={22} />
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-normal text-sh-orange">
                Santa Helena
              </p>
              <p className="text-lg font-bold text-sh-green">Conversor de Certificado PFX</p>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 py-8 sm:py-12">{children}</main>

      <footer className="mx-auto max-w-6xl px-5 pb-6 text-xs text-slate-600">
        Conversão temporária em memória e diretório seguro. Não armazene certificados reais neste
        repositório.
      </footer>
    </div>
  );
}
