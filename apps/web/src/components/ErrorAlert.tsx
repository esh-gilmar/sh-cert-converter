import { AlertTriangle } from 'lucide-react';

export function ErrorAlert({ message }: { message: string }) {
  return (
    <div
      className="flex items-start gap-3 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
      role="alert"
      aria-live="assertive"
    >
      <AlertTriangle aria-hidden="true" className="mt-0.5 shrink-0" size={18} />
      <p>{message}</p>
    </div>
  );
}
