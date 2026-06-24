param(
  [string]$OutputDir = "tmp/test-cert",
  [string]$Password = "123456"
)

$ErrorActionPreference = "Stop"

if (-not (Get-Command openssl -ErrorAction SilentlyContinue)) {
  throw "OpenSSL nao encontrado no PATH. Instale o OpenSSL ou use o modo Docker."
}

$resolvedOutputDir = Join-Path (Resolve-Path -LiteralPath ".").Path $OutputDir
New-Item -ItemType Directory -Path $resolvedOutputDir -Force | Out-Null

$keyPath = Join-Path $resolvedOutputDir "test.key"
$crtPath = Join-Path $resolvedOutputDir "test.crt"
$pfxPath = Join-Path $resolvedOutputDir "test.pfx"

& openssl req -x509 -newkey rsa:2048 -keyout $keyPath -out $crtPath -days 365 -nodes -subj "/CN=teste.local"
& openssl pkcs12 -export -out $pfxPath -inkey $keyPath -in $crtPath -passout "pass:$Password"

Write-Host "PFX ficticio gerado em: $pfxPath"
Write-Host "Senha: $Password"
