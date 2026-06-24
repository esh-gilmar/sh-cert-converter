import { zodResolver } from '@hookform/resolvers/zod';

import type { CertificateConversionMetadata } from '@sh-cert-converter/shared';
import { useMutation } from '@tanstack/react-query';
import { Check, FileKey2, Loader2, LockKeyhole, ServerCog, ShieldCheck } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '../components/Button.js';
import { Card } from '../components/Card.js';
import { ConversionResultCard } from '../components/ConversionResultCard.js';
import { ErrorAlert } from '../components/ErrorAlert.js';
import { FileDropzone, validateClientFile } from '../components/FileDropzone.js';
import { PasswordField } from '../components/PasswordField.js';
import { convertCertificate } from '../services/certificateApi.js';

const formSchema = z.object({
  password: z.string().optional()
});

type FormValues = z.infer<typeof formSchema>;

interface ConversionResult {
  downloadUrl: string;
  filename: string;
  metadata: CertificateConversionMetadata;
}

const extractionItems = [
  {
    filename: 'certificate.crt',
    description: 'Certificado principal em PEM/X.509.'
  },
  {
    filename: 'private.key',
    description: 'Chave privada extraída.'
  },
  {
    filename: 'intermediate.crt',
    description: 'Opcional — gerado quando existir cadeia no PFX/P12.',
    badge: 'Opcional'
  }
];

const trustItems = [
  'Processamento temporário',
  'Sem persistência de arquivos',
  'Compatível com PFX/P12'
];

export function ConverterPage() {
  const shouldReduceMotion = useReducedMotion();
  const [file, setFile] = useState<File | undefined>();
  const [fileError, setFileError] = useState<string | undefined>();
  const [result, setResult] = useState<ConversionResult | undefined>();
  const [errorMessage, setErrorMessage] = useState<string | undefined>();

  const { register, handleSubmit, reset } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      password: ''
    }
  });

  const mutation = useMutation({
    mutationFn: convertCertificate,
    onSuccess: ({ blob, filename, metadata }) => {
      setErrorMessage(undefined);
      setResult((current) => {
        if (current) {
          URL.revokeObjectURL(current.downloadUrl);
        }

        return {
          downloadUrl: URL.createObjectURL(blob),
          filename,
          metadata
        };
      });
    },
    onError: (error) => {
      setResult(undefined);
      setErrorMessage(
        error instanceof Error ? error.message : 'Não foi possível converter o certificado enviado.'
      );
    }
  });

  useEffect(() => {
    return () => {
      if (result) {
        URL.revokeObjectURL(result.downloadUrl);
      }
    };
  }, [result]);

  const onSubmit = handleSubmit((values) => {
    const validationError = validateClientFile(file);
    setFileError(validationError);

    if (validationError || !file) {
      return;
    }

    mutation.mutate({
      file,
      password: values.password
    });
  });

  const resetFlow = () => {
    reset({ password: '' });
    setFile(undefined);
    setFileError(undefined);
    setErrorMessage(undefined);
    setResult((current) => {
      if (current) {
        URL.revokeObjectURL(current.downloadUrl);
      }
      return undefined;
    });
  };

  return (
    <div
      className={[
        'grid gap-6 lg:items-start',
        'lg:grid-cols-[minmax(0,1.65fr)_minmax(380px,0.9fr)] lg:gap-8',
        'xl:grid-cols-[minmax(0,1.7fr)_minmax(420px,0.95fr)] xl:gap-10',
        '2xl:grid-cols-[minmax(0,1.75fr)_minmax(460px,1fr)] 2xl:gap-12'
      ].join(' ')}
    >
      <section className="min-w-0 space-y-4">
        <div className="max-w-3xl">
          <div className="space-y-2.5">
            <h1 className="text-3xl font-bold tracking-normal text-sh-green sm:text-4xl">
              Conversor de Certificado PFX
            </h1>
            <div className="h-1 w-24 rounded-full bg-gradient-to-r from-sh-orange via-sh-light to-transparent" />
          </div>
          <p className="mt-2.5 text-base leading-7 text-slate-700">
            Extraia certificado X.509, cadeia intermediária e chave privada a partir de um arquivo
            .pfx.
          </p>
        </div>

        <Card className="p-4 sm:p-5">
          <form className="space-y-4" onSubmit={onSubmit} noValidate>
            <FileDropzone
              file={file}
              error={fileError}
              onFileChange={(candidate) => {
                setFile(candidate);
                setFileError(validateClientFile(candidate));
                setErrorMessage(undefined);
                setResult((current) => {
                  if (current) {
                    URL.revokeObjectURL(current.downloadUrl);
                  }
                  return undefined;
                });
              }}
            />
            <PasswordField registration={register('password')} />

            {errorMessage ? <ErrorAlert message={errorMessage} /> : null}
            {result ? (
              <ConversionResultCard
                downloadUrl={result.downloadUrl}
                filename={result.filename}
                files={result.metadata.files}
                hasIntermediateCertificate={result.metadata.hasIntermediateCertificate}
                onReset={resetFlow}
              />
            ) : null}

            {!result ? (
              <div className="flex flex-col gap-3 border-t border-emerald-900/10 pt-1.5 sm:flex-row sm:items-center">
                <Button
                  type="submit"
                  disabled={!file || Boolean(fileError) || mutation.isPending}
                  icon={
                    mutation.isPending ? (
                      <Loader2 aria-hidden="true" className="animate-spin" size={18} />
                    ) : (
                      <LockKeyhole aria-hidden="true" size={18} />
                    )
                  }
                >
                  {mutation.isPending ? 'Convertendo certificado...' : 'Converter certificado'}
                </Button>
              </div>
            ) : null}
          </form>
        </Card>
      </section>

      <aside className="min-w-0 space-y-4">
        <motion.section
          initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28, ease: 'easeOut', delay: 0.08 }}
          className={[
            'relative isolate min-h-[320px] overflow-hidden rounded-[1.35rem]',
            'lg:h-[300px] lg:min-h-0 xl:h-[320px] 2xl:h-[400px]',
            '[@media(min-width:1280px)_and_(max-height:800px)]:!h-[300px]',
            'bg-sh-green shadow-sh-card'
          ].join(' ')}
          style={{
            backgroundImage: "url('/assets/bg.jpg')",
            backgroundPosition: 'center',
            backgroundSize: 'cover'
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-sh-green/78 via-sh-green/42 to-sh-teal/24" />
          <div className="absolute inset-0 bg-gradient-to-b from-sh-green/5 via-sh-green/38 to-sh-green/72" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_78%_12%,rgba(230,120,23,0.12),transparent_28%),radial-gradient(circle_at_18%_100%,rgba(0,85,43,0.20),transparent_36%)]" />
          <div className="absolute inset-x-0 bottom-0 h-52 bg-gradient-to-t from-sh-green/72 to-transparent" />
          <div className="absolute left-0 top-0 h-1 w-24 bg-gradient-to-r from-sh-orange/90 to-transparent" />
          <div className="relative flex min-h-[320px] flex-col justify-between p-5 text-white lg:h-full lg:min-h-0 xl:p-6">
            <div
              className={[
                'w-fit rounded-2xl border border-white/30 bg-white/25 p-2.5 shadow-sh-soft',
                'backdrop-blur-lg ring-1 ring-white/10',
                '[@media(min-width:1280px)_and_(max-height:800px)]:hidden'
              ].join(' ')}
            >
              <img
                src="/assets/sh_toolbar_transp.png"
                alt="Santa Helena"
                className="h-12 w-28 object-contain"
              />
            </div>

            <div className="space-y-3.5 xl:space-y-4">
              <div>
                <p className="mb-2 flex items-center gap-2 text-xs font-bold uppercase text-sh-orange drop-shadow-[0_1px_3px_rgba(0,45,20,0.80)]">
                  <ShieldCheck aria-hidden="true" className="text-white" size={15} />
                  Ambiente controlado
                </p>
                <h2 className="max-w-md text-xl font-bold leading-tight drop-shadow-[0_2px_10px_rgba(0,45,20,0.65)] xl:text-2xl">
                  Conversão segura e temporária de certificados.
                </h2>
                <div className="mt-3 h-0.5 w-14 rounded-full bg-sh-orange" />
              </div>
              <ul className="grid gap-1.5 text-sm font-semibold xl:gap-2">
                {trustItems.map((item) => (
                  <li
                    key={item}
                    className={[
                      'flex items-center gap-2 rounded-lg border border-white/20 bg-white/15',
                      'px-3 py-2 ring-1 ring-black/5 backdrop-blur transition hover:bg-white/25',
                      'xl:px-3.5'
                    ].join(' ')}
                  >
                    <Check aria-hidden="true" className="shrink-0 text-sh-orange" size={16} />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </motion.section>

        <section
          className={[
            'rounded-[1.1rem] border border-sh-teal/20 bg-white/90 p-4 xl:p-5',
            '[@media(min-width:1280px)_and_(max-height:800px)]:!p-3',
            'shadow-sh-soft ring-1 ring-white/70'
          ].join(' ')}
        >
          <div className="flex items-start gap-3">
            <div
              className={[
                'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
                'bg-sh-orange/10 text-sh-orange'
              ].join(' ')}
            >
              <ServerCog aria-hidden="true" size={20} />
            </div>
            <div>
              <h2 className="text-sm font-bold uppercase text-sh-green">O que pode ser extraído</h2>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                A cadeia intermediária depende do conteúdo original do arquivo PFX/P12.
              </p>
            </div>
          </div>
          <div className="mt-4 grid gap-2.5 text-sm text-slate-700 [@media(min-width:1280px)_and_(max-height:800px)]:!mt-3 [@media(min-width:1280px)_and_(max-height:800px)]:!gap-2 [@media(min-width:1280px)_and_(max-height:800px)]:grid-cols-2">
            {extractionItems.map((item) => (
              <div
                key={item.filename}
                className={[
                  'rounded-xl border border-emerald-900/10 bg-white/80 p-3 shadow-sm transition',
                  '[@media(min-width:1280px)_and_(max-height:800px)]:!py-2',
                  'hover:border-sh-light/70 hover:shadow-sh-soft',
                  item.badge
                    ? '[@media(min-width:1280px)_and_(max-height:800px)]:col-span-2'
                    : ''
                ].join(' ')}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-2">
                    <FileKey2 aria-hidden="true" className="shrink-0 text-sh-teal" size={16} />
                    <strong className="truncate text-slate-950">{item.filename}</strong>
                  </div>
                  {item.badge ? (
                    <span className="rounded-full bg-sh-orange/10 px-2 py-0.5 text-xs font-bold text-sh-orange">
                      {item.badge}
                    </span>
                  ) : null}
                </div>
                <p className="mt-0.5 pl-6 text-xs leading-5 text-slate-600">{item.description}</p>
              </div>
            ))}
          </div>
        </section>
      </aside>
    </div>
  );
}
