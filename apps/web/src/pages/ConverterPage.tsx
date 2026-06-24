import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { Loader2, LockKeyhole } from 'lucide-react';
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
}

export function ConverterPage() {
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
    onSuccess: ({ blob, filename }) => {
      setErrorMessage(undefined);
      setResult((current) => {
        if (current) {
          URL.revokeObjectURL(current.downloadUrl);
        }

        return {
          downloadUrl: URL.createObjectURL(blob),
          filename
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
    <div className="grid gap-8 lg:grid-cols-[1fr_380px] lg:items-start">
      <section className="space-y-6">
        <div className="max-w-3xl">
          <h1 className="text-3xl font-bold tracking-normal text-sh-green sm:text-4xl">
            Conversor de Certificado PFX
          </h1>
          <p className="mt-3 text-base leading-7 text-slate-700">
            Extraia certificado X.509, cadeia intermediária e chave privada a partir de um arquivo
            .pfx.
          </p>
        </div>

        <Card className="p-5 sm:p-7">
          <form className="space-y-6" onSubmit={onSubmit} noValidate>
            <FileDropzone
              file={file}
              error={fileError}
              onFileChange={(candidate) => {
                setFile(candidate);
                setFileError(validateClientFile(candidate));
                setErrorMessage(undefined);
                setResult(undefined);
              }}
            />
            <PasswordField registration={register('password')} />

            {errorMessage ? <ErrorAlert message={errorMessage} /> : null}
            {result ? (
              <ConversionResultCard
                downloadUrl={result.downloadUrl}
                filename={result.filename}
                onReset={resetFlow}
              />
            ) : null}

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
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
          </form>
        </Card>
      </section>

      <aside className="rounded-lg border border-sh-teal/30 bg-white p-5">
        <h2 className="text-sm font-bold uppercase tracking-normal text-sh-green">Arquivos gerados</h2>
        <div className="mt-4 space-y-3 text-sm text-slate-700">
          <p>
            <strong>certificate.crt</strong> com o certificado principal em PEM/X.509.
          </p>
          <p>
            <strong>intermediate.crt</strong> com a cadeia intermediária quando disponível.
          </p>
          <p>
            <strong>private.key</strong> com a chave privada extraída sem criptografia adicional.
          </p>
        </div>
      </aside>
    </div>
  );
}
