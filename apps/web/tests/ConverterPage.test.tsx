import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AppShell } from '../src/components/AppShell.js';
import { appVersion, getCurrentYear } from '../src/config/appInfo.js';
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

    expect(
      screen.getByRole('heading', { name: 'Conversor de Certificado PFX' })
    ).toBeInTheDocument();
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

  it('shows generated files with intermediate certificate after conversion', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        headers: new Headers({
          'content-disposition': 'attachment; filename="certificados-extraidos.zip"',
          'x-certificate-files': encodeURIComponent(
            JSON.stringify(['certificate.crt', 'intermediate.crt', 'private.key'])
          )
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
    const generatedFiles = within(screen.getByRole('list', { name: 'Arquivos gerados' }));
    expect(generatedFiles.getByText('certificate.crt')).toBeInTheDocument();
    expect(generatedFiles.getByText('intermediate.crt')).toBeInTheDocument();
    expect(generatedFiles.getByText('private.key')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Baixar arquivos' })).toHaveAttribute(
      'href',
      'blob:download'
    );
  });

  it('does not show intermediate.crt as generated when the API omits it', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        headers: new Headers({
          'content-disposition': 'attachment; filename="certificados-extraidos.zip"',
          'x-certificate-files': encodeURIComponent(
            JSON.stringify(['certificate.crt', 'private.key'])
          )
        }),
        blob: async () => new Blob(['zip'])
      }))
    );
    renderPage();
    const file = new File(['content'], 'certificado.pfx', { type: 'application/octet-stream' });

    await userEvent.upload(screen.getByLabelText('Arquivo PFX/P12'), file);
    await userEvent.click(screen.getByRole('button', { name: 'Converter certificado' }));

    await waitFor(() =>
      expect(screen.getByText('Certificado convertido com sucesso.')).toBeInTheDocument()
    );
    const generatedFiles = within(screen.getByRole('list', { name: 'Arquivos gerados' }));
    expect(generatedFiles.getByText('certificate.crt')).toBeInTheDocument();
    expect(generatedFiles.getByText('private.key')).toBeInTheDocument();
    expect(generatedFiles.queryByText('intermediate.crt')).not.toBeInTheDocument();
    expect(
      screen.getByText('A cadeia intermediária não foi encontrada neste arquivo PFX.')
    ).toBeInTheDocument();
  });

  it('clears conversion state when converting another certificate', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        headers: new Headers({
          'content-disposition': 'attachment; filename="certificados-extraidos.zip"',
          'x-certificate-files': encodeURIComponent(
            JSON.stringify(['certificate.crt', 'private.key'])
          )
        }),
        blob: async () => new Blob(['zip'])
      }))
    );
    renderPage();
    const file = new File(['content'], 'certificado.pfx', { type: 'application/octet-stream' });

    await userEvent.upload(screen.getByLabelText('Arquivo PFX/P12'), file);
    await userEvent.click(screen.getByRole('button', { name: 'Converter certificado' }));
    await waitFor(() =>
      expect(screen.getByText('Certificado convertido com sucesso.')).toBeInTheDocument()
    );

    await userEvent.click(screen.getByRole('button', { name: 'Converter outro certificado' }));

    expect(screen.queryByText('Certificado convertido com sucesso.')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Converter certificado' })).toBeDisabled();
  });

  it('marks intermediate.crt as optional in the extraction card', () => {
    renderPage();

    expect(screen.getByText('intermediate.crt')).toBeInTheDocument();
    expect(screen.getByText('Opcional')).toBeInTheDocument();
    expect(
      screen.getByText('Opcional — gerado quando existir cadeia no PFX/P12.')
    ).toBeInTheDocument();
  });

  it('does not render the removed technical badge above the title', () => {
    renderPage();

    expect(screen.queryByText(/PFX\/P12 -> certificate\.crt/i)).not.toBeInTheDocument();
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

describe('AppShell', () => {
  it('renders the footer with current year and app version', () => {
    render(
      <AppShell>
        <span>Conteúdo</span>
      </AppShell>
    );

    expect(screen.getByText('Desenvolvido por')).toBeInTheDocument();
    expect(screen.getByText('TI SH')).toBeInTheDocument();
    expect(screen.getByText(String(getCurrentYear()))).toBeInTheDocument();
    expect(screen.getByText(`v${appVersion}`)).toBeInTheDocument();
    expect(screen.queryByText(/Não armazene certificados reais/i)).not.toBeInTheDocument();
  });
});
