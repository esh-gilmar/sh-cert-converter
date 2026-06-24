import { FileArchive, Trash2, Upload } from 'lucide-react';
import { useId, useRef, useState } from 'react';
import { Button } from './Button.js';

const allowedExtensions = ['.pfx', '.p12'];
const maxSizeBytes = 10 * 1024 * 1024;

interface FileDropzoneProps {
  file?: File;
  error?: string;
  onFileChange: (file?: File) => void;
}

export function FileDropzone({ file, error, onFileChange }: FileDropzoneProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const selectFile = (candidate?: File) => {
    if (!candidate) {
      return;
    }
    onFileChange(candidate);
  };

  return (
    <div className="space-y-3">
      <label className="block text-sm font-semibold text-slate-800" htmlFor={inputId}>
        Arquivo PFX/P12
      </label>
      <div
        className={`rounded-lg border-2 border-dashed bg-white p-5 transition ${
          isDragging ? 'border-sh-orange bg-orange-50' : 'border-sh-teal/50'
        } ${error ? 'border-red-300' : ''}`}
        onDragEnter={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragOver={(event) => event.preventDefault()}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setIsDragging(false);
          selectFile(event.dataTransfer.files[0]);
        }}
      >
        <input
          ref={inputRef}
          id={inputId}
          className="sr-only"
          type="file"
          accept=".pfx,.p12,application/x-pkcs12,application/pkcs12"
          onChange={(event) => selectFile(event.target.files?.[0])}
          aria-describedby={error ? `${inputId}-error` : `${inputId}-hint`}
        />

        {file ? (
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-sh-green/10 text-sh-green">
                <FileArchive aria-hidden="true" size={22} />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-900">{file.name}</p>
                <p className="text-xs text-slate-600">{formatBytes(file.size)}</p>
              </div>
            </div>
            <Button
              type="button"
              variant="ghost"
              icon={<Trash2 aria-hidden="true" size={17} />}
              onClick={() => {
                if (inputRef.current) {
                  inputRef.current.value = '';
                }
                onFileChange(undefined);
              }}
            >
              Remover
            </Button>
          </div>
        ) : (
          <button
            type="button"
            className="flex w-full flex-col items-center gap-3 rounded-md px-3 py-7 text-center focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sh-orange"
            onClick={() => inputRef.current?.click()}
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-md bg-sh-green text-white">
              <Upload aria-hidden="true" size={24} />
            </span>
            <span className="text-base font-semibold text-sh-green">Selecionar arquivo</span>
            <span id={`${inputId}-hint`} className="text-sm text-slate-600">
              Arraste um arquivo .pfx ou .p12 de até {formatBytes(maxSizeBytes)}.
            </span>
          </button>
        )}
      </div>
      {error ? (
        <p id={`${inputId}-error`} className="text-sm text-red-700">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function validateClientFile(file?: File) {
  if (!file) {
    return 'Selecione um arquivo PFX antes de converter.';
  }

  const lowerName = file.name.toLowerCase();
  if (!allowedExtensions.some((extension) => lowerName.endsWith(extension))) {
    return 'Envie um arquivo de certificado no formato .pfx ou .p12.';
  }

  if (file.size > maxSizeBytes) {
    return 'O arquivo excede o tamanho máximo permitido.';
  }

  return undefined;
}

function formatBytes(bytes: number) {
  if (bytes === 0) {
    return '0 B';
  }

  const units = ['B', 'KB', 'MB'];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / 1024 ** index).toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
}
