import type { CertificateOutputFile } from '@sh-cert-converter/shared';
import { CheckCircle2, Download, FileCheck2, Info, RotateCcw } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { Button } from './Button.js';

interface ConversionResultCardProps {
  downloadUrl: string;
  filename: string;
  files: CertificateOutputFile[];
  hasIntermediateCertificate: boolean;
  onReset: () => void;
}

const fileLabels: Record<CertificateOutputFile, string> = {
  'certificate.crt': 'Certificado principal',
  'intermediate.crt': 'Cadeia intermediária',
  'private.key': 'Chave privada'
};

export function ConversionResultCard({
  downloadUrl,
  filename,
  files,
  hasIntermediateCertificate,
  onReset
}: ConversionResultCardProps) {
  const shouldReduceMotion = useReducedMotion();
  const extractedCountLabel = `${files.length} ${files.length === 1 ? 'arquivo extraído' : 'arquivos extraídos'}`;

  return (
    <motion.div
      initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.24, ease: 'easeOut' }}
      className={[
        'rounded-[1.1rem] border border-emerald-200/80 bg-gradient-to-br',
        'from-emerald-50 to-white p-5 text-emerald-950 shadow-sh-inset'
      ].join(' ')}
      aria-live="polite"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <div
          className={[
            'flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl',
            'bg-sh-green text-white shadow-sh-soft'
          ].join(' ')}
        >
          <CheckCircle2 aria-hidden="true" size={26} />
        </div>
        <div className="min-w-0 flex-1 space-y-4">
          <div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <h2 className="text-lg font-bold">Certificado convertido com sucesso.</h2>
              <span className="w-fit rounded-full border border-sh-orange/20 bg-sh-orange/10 px-2.5 py-1 text-xs font-bold text-sh-green">
                {extractedCountLabel}
              </span>
            </div>
            <p className="mt-1 text-sm text-emerald-900">
              O pacote ZIP está pronto com os arquivos encontrados no PFX enviado.
            </p>
          </div>

          <ul className="grid gap-2 text-sm sm:grid-cols-2" aria-label="Arquivos gerados">
            {files.map((file) => (
              <li
                key={file}
                className={[
                  'flex min-h-14 items-center gap-2 rounded-lg border border-emerald-900/10',
                  'bg-white/90 px-3 py-2 font-semibold shadow-sm transition',
                  'hover:border-sh-light/80 hover:shadow-sh-soft'
                ].join(' ')}
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sh-green/10 text-sh-green">
                  <FileCheck2 aria-hidden="true" size={18} />
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-slate-950">{file}</span>
                  <span className="block text-xs font-medium text-slate-500">
                    {fileLabels[file]}
                  </span>
                </span>
              </li>
            ))}
          </ul>

          {!hasIntermediateCertificate ? (
            <p
              className={[
                'flex gap-2 rounded-lg border border-sh-light/70 bg-sh-light/20',
                'px-3 py-2 text-sm text-emerald-950'
              ].join(' ')}
            >
              <Info aria-hidden="true" className="mt-0.5 shrink-0 text-sh-green" size={17} />
              <span>A cadeia intermediária não foi encontrada neste arquivo PFX.</span>
            </p>
          ) : null}

          <div className="flex flex-col gap-3 sm:flex-row">
            <motion.a
              whileTap={shouldReduceMotion ? undefined : { scale: 0.99 }}
              transition={{ duration: 0.16, ease: 'easeOut' }}
              className={[
                'inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-sh-green',
                'px-4 py-2 text-sm font-semibold text-white shadow-sh-soft transition',
                'hover:bg-[#014421] hover:shadow-sh-glow',
                'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2',
                'focus-visible:outline-sh-orange'
              ].join(' ')}
              href={downloadUrl}
              download={filename}
            >
              <Download aria-hidden="true" size={18} />
              <span>Baixar arquivos</span>
            </motion.a>
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
    </motion.div>
  );
}
