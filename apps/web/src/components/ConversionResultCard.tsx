import { CheckCircle2, Download, RotateCcw } from 'lucide-react';
import { Button } from './Button.js';

interface ConversionResultCardProps {
  downloadUrl: string;
  filename: string;
  onReset: () => void;
}

export function ConversionResultCard({ downloadUrl, filename, onReset }: ConversionResultCardProps) {
  return (
    <div
      className="rounded-lg border border-emerald-200 bg-emerald-50 p-5 text-emerald-950"
      aria-live="polite"
    >
      <div className="flex items-start gap-3">
        <CheckCircle2 aria-hidden="true" className="mt-0.5 shrink-0 text-sh-green" size={22} />
        <div className="space-y-4">
          <div>
            <h2 className="text-base font-bold">Certificado convertido com sucesso.</h2>
            <p className="mt-1 text-sm text-emerald-900">
              O pacote contém os arquivos extraídos para uso seguro.
            </p>
          </div>

          <ul className="grid gap-2 text-sm sm:grid-cols-3">
            <li className="rounded-md bg-white px-3 py-2 font-semibold">certificate.crt</li>
            <li className="rounded-md bg-white px-3 py-2 font-semibold">intermediate.crt</li>
            <li className="rounded-md bg-white px-3 py-2 font-semibold">private.key</li>
          </ul>

          <div className="flex flex-col gap-3 sm:flex-row">
            <a
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-sh-green px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#014421] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sh-orange"
              href={downloadUrl}
              download={filename}
            >
              <Download aria-hidden="true" size={18} />
              <span>Baixar arquivos</span>
            </a>
            <Button
              type="button"
              variant="secondary"
              icon={<RotateCcw aria-hidden="true" size={18} />}
              onClick={onReset}
            >
              Converter outro certificado
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
