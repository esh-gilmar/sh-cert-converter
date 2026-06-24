import { Eye, EyeOff } from 'lucide-react';
import { useId, useState } from 'react';
import type { UseFormRegisterReturn } from 'react-hook-form';

interface PasswordFieldProps {
  registration: UseFormRegisterReturn;
}

export function PasswordField({ registration }: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);
  const inputId = useId();

  return (
    <div className="space-y-2">
      <label className="block text-sm font-semibold text-slate-800" htmlFor={inputId}>
        Senha do certificado
      </label>
      <div className="relative">
        <input
          id={inputId}
          type={visible ? 'text' : 'password'}
          autoComplete="off"
          className="h-12 w-full rounded-lg border border-slate-200 bg-white px-3 pr-12 text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-sh-green focus:ring-4 focus:ring-sh-green/15"
          placeholder="Opcional"
          {...registration}
        />
        <button
          type="button"
          className="absolute inset-y-0 right-0 flex w-12 items-center justify-center rounded-r-lg text-slate-600 hover:text-sh-green focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sh-orange"
          onClick={() => setVisible((current) => !current)}
          aria-label={visible ? 'Ocultar senha' : 'Mostrar senha'}
        >
          {visible ? <EyeOff aria-hidden="true" size={19} /> : <Eye aria-hidden="true" size={19} />}
        </button>
      </div>
    </div>
  );
}
