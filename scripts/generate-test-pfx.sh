#!/usr/bin/env sh
set -eu

OUTPUT_DIR="${1:-tmp/test-cert}"
PASSWORD="${PFX_PASSWORD:-123456}"

if ! command -v openssl >/dev/null 2>&1; then
  echo "OpenSSL nao encontrado no PATH. Instale o OpenSSL ou use o modo Docker." >&2
  exit 1
fi

mkdir -p "$OUTPUT_DIR"

openssl req -x509 -newkey rsa:2048 \
  -keyout "$OUTPUT_DIR/test.key" \
  -out "$OUTPUT_DIR/test.crt" \
  -days 365 \
  -nodes \
  -subj "/CN=teste.local"

openssl pkcs12 -export \
  -out "$OUTPUT_DIR/test.pfx" \
  -inkey "$OUTPUT_DIR/test.key" \
  -in "$OUTPUT_DIR/test.crt" \
  -passout "pass:$PASSWORD"

chmod 600 "$OUTPUT_DIR/test.key" "$OUTPUT_DIR/test.pfx" 2>/dev/null || true

echo "PFX ficticio gerado em: $OUTPUT_DIR/test.pfx"
echo "Senha: $PASSWORD"
