import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ConverterPage } from '../src/pages/ConverterPage.js';

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <ConverterPage />
    </QueryClientProvider>
  );
}

beforeEach(() => {
  vi.stubGlobal('URL', {
    createObjectURL: vi.fn(() => 'blob:download'),
    revokeObjectURL: vi.fn()
  });
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('ConverterPage', () => {
  it('renders the converter screen', () => {
    renderPage();

    expect(screen.getByRole('heading', { name: 'Conversor de Certificado PFX' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Converter certificado' })).toBeDisabled();
  });

  it('accepts a valid file upload', async () => {
    renderPage();
    const file = new File(['content'], 'certificado.pfx', { type: 'application/octet-stream' });

    await userEvent.upload(screen.getByLabelText('Arquivo PFX/P12'), file);

    expect(screen.getByText('certificado.pfx')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Converter certificado' })).toBeEnabled();
  });

  it('rejects invalid files', async () => {
    renderPage();
    const user = userEvent.setup({ applyAccept: false });
    const file = new File(['content'], 'certificado.txt', { type: 'text/plain' });

    await user.upload(screen.getByLabelText('Arquivo PFX/P12'), file);

    expect(
      screen.getByText('Envie um arquivo de certificado no formato .pfx ou .p12.')
    ).toBeInTheDocument();
  });

  it('toggles password visibility', async () => {
    renderPage();
    const password = screen.getByLabelText('Senha do certificado');

    expect(password).toHaveAttribute('type', 'password');
    await userEvent.click(screen.getByRole('button', { name: 'Mostrar senha' }));
    expect(password).toHaveAttribute('type', 'text');
  });

  it('shows success after conversion', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        headers: new Headers({
          'content-disposition': 'attachment; filename="certificados-extraidos.zip"'
        }),
        blob: async () => new Blob(['zip'])
      }))
    );
    renderPage();
    const file = new File(['content'], 'certificado.p12', { type: 'application/octet-stream' });

    await userEvent.upload(screen.getByLabelText('Arquivo PFX/P12'), file);
    await userEvent.click(screen.getByRole('button', { name: 'Converter certificado' }));

    await waitFor(() =>
      expect(screen.getByText('Certificado convertido com sucesso.')).toBeInTheDocument()
    );
    expect(screen.getByRole('link', { name: 'Baixar arquivos' })).toHaveAttribute(
      'href',
      'blob:download'
    );
  });

  it('shows backend error message', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: false,
        json: async () => ({
          error: {
            code: 'INVALID_PASSWORD',
            message: 'Não foi possível abrir o arquivo PFX. Verifique se a senha está correta.'
          }
        })
      }))
    );
    renderPage();
    const file = new File(['content'], 'certificado.pfx', { type: 'application/octet-stream' });

    await userEvent.upload(screen.getByLabelText('Arquivo PFX/P12'), file);
    await userEvent.click(screen.getByRole('button', { name: 'Converter certificado' }));

    await waitFor(() =>
      expect(
        screen.getByText('Não foi possível abrir o arquivo PFX. Verifique se a senha está correta.')
      ).toBeInTheDocument()
    );
  });
});
