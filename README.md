# SH Cert Converter

Aplicação web para converter certificados `.pfx`/`.p12` em arquivos PEM/X.509, extraindo `certificate.crt`, `private.key` e, quando existir, `intermediate.crt` em um pacote `.zip`.

## Stack

- Monorepo npm workspaces
- API Node.js, TypeScript, Fastify, Zod, Helmet e OpenSSL via `spawn`
- Web React, TypeScript, Vite, React Hook Form, Zod, TanStack Query e TailwindCSS
- Testes com Vitest, Testing Library e mocks da camada OpenSSL
- Docker Compose com serviços `api` e `web`

## Estrutura

```text
apps/
  api/
    src/config
    src/modules/certificates
    src/shared
    tests/unit
    tests/integration
  web/
    src/components
    src/pages
    src/services
    src/styles
    tests
packages/
  shared/
scripts/
docker-compose.yml
.env.example
```

## Modos de Execução

### Desenvolvimento local

Use quando quiser rodar backend e frontend diretamente na máquina.

Pré-requisitos:

- Node.js instalado
- npm instalado
- OpenSSL instalado e disponível no `PATH`

Comandos:

```bash
npm install
npm run dev
```

O frontend roda em `http://localhost:3000` e chama a API por `/api`. O Vite redireciona `/api` para `http://localhost:3001` por proxy, sem URL fixa no código React.

### Desenvolvimento com Docker

Use quando quiser ambiente isolado e padronizado.

Pré-requisitos:

- Docker
- Docker Compose

Comando:

```bash
docker compose up --build
```

Acesse `http://localhost:3000`. No modo Docker, não é necessário instalar OpenSSL no host, porque o container da API instala e usa `/usr/bin/openssl`.

## Variáveis de Ambiente

Consulte `.env.example`.

```env
NODE_ENV=development
API_PORT=3001
WEB_PORT=3000
MAX_UPLOAD_SIZE_MB=10
OPENSSL_TIMEOUT_MS=15000
OPENSSL_BIN=openssl
TEMP_DIR=
VITE_API_PROXY_TARGET=http://localhost:3001
```

Regras relevantes:

- `TEMP_DIR` vazio usa `os.tmpdir()`.
- `OPENSSL_BIN` vazio usa `openssl`.
- Em Docker, `OPENSSL_BIN=/usr/bin/openssl` e `TEMP_DIR=/tmp/pfx-converter`.
- Todas as variáveis da API são validadas com Zod no startup.

## Gerar PFX Fictício para Teste

Os scripts abaixo geram apenas certificado fictício/autossinado para validação local. Eles criam `test.key`, `test.crt` e `test.pfx` em `tmp/test-cert`, com senha `123456`.

Windows PowerShell:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/generate-test-pfx.ps1
```

Linux/macOS:

```bash
sh scripts/generate-test-pfx.sh
```

Os arquivos gerados não devem ser versionados. O `.gitignore` bloqueia `.pfx`, `.p12`, `.crt`, `.key`, `.pem`, `.zip`, `tmp/` e `temp/`.

## Testes, Build e Lint

```bash
npm run test
npm run build
npm run lint
```

Também é possível executar por workspace:

```bash
npm run test --workspace @sh-cert-converter/api
npm run test --workspace @sh-cert-converter/web
```

## Validação Manual do MVP

### Local

Execute:

```bash
npm install
npm run build
npm run test
npm run lint
npm run dev
```

Depois:

1. Acessar `http://localhost:3000`.
2. Gerar ou selecionar um PFX fictício, por exemplo `tmp/test-cert/test.pfx`.
3. Informar a senha `123456`.
4. Converter o certificado.
5. Baixar o `.zip`.
6. Conferir se o `.zip` contém `certificate.crt`, `private.key` e, quando houver cadeia intermediária, `intermediate.crt`.
7. Se a cadeia intermediária não existir, conferir que o `.zip` não contém `intermediate.crt` e contém `README.txt`.
8. Conferir se os arquivos `.crt` e `.key` extraídos estão em PEM válido.

### Docker

Execute:

```bash
docker compose up --build
```

Depois:

1. Acessar `http://localhost:3000`.
2. Repetir a conversão com PFX fictício.
3. Confirmar que a API usa OpenSSL dentro do container (`OPENSSL_BIN=/usr/bin/openssl`).
4. Confirmar que o frontend chama `/api`, sem URL fixa nos componentes ou services.
5. Confirmar que nenhum arquivo temporário fica persistido após a requisição.

## Segurança

- A senha é enviada ao OpenSSL por `stdin`, não por argumento de processo.
- A API usa `spawn` com array de argumentos, sem concatenação de comando.
- Arquivos são gravados em workspace temporário único com permissão restrita.
- O workspace é removido em sucesso, erro e timeout.
- Senha, chave privada, certificados e buffers não são registrados em log.
- `certificate.crt`, `private.key` e `intermediate.crt` nunca recebem conteúdo informativo textual.
- Quando a cadeia intermediária não existe, `intermediate.crt` não é incluído no `.zip`; o aviso fica em `README.txt`.
- Helmet adiciona headers HTTP básicos, incluindo CSP, `nosniff`, `DENY` e `no-referrer`.
- Não versionar `.pfx`, `.p12`, `.crt`, `.key`, `.pem` ou `.zip`.

## Limitações Conhecidas

- O MVP retorna obrigatoriamente o `.zip`; downloads individuais e visualização do PEM ficam como evolução.
- PFX sem cadeia intermediária gera `.zip` com `README.txt` informativo e sem `intermediate.crt`.
- Não há autenticação, auditoria nominal, banco de dados ou histórico de conversões.

## Próximos Passos

- Autenticação corporativa.
- Auditoria segura.
- Rate limit por usuário.
- Criptografia adicional de arquivos temporários.
- HTTPS obrigatório em produção.
- Integração com Azure Key Vault.
- Exibição de metadados do certificado: Subject, Issuer, validade, SAN, Serial Number, algoritmo e thumbprint.
