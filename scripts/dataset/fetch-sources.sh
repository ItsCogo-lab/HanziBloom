#!/usr/bin/env bash
# Descarga las fuentes del dataset en scripts/dataset/.cache (no se versiona).
# Las versiones están fijadas para que el resultado sea reproducible.
set -euo pipefail

CACHE_DIR="$(dirname "$0")/.cache"
mkdir -p "$CACHE_DIR"
cd "$CACHE_DIR"

# Lista oficial de HSK 2.0 nivel 1 (150 palabras) con el pinyin del examen. Licencia MIT.
curl -sSfL -o hsk-level-1.json \
  "https://raw.githubusercontent.com/clem109/hsk-vocabulary/master/hsk-vocab-json/hsk-level-1.json"

# CC-CEDICT en formato JSON (edición 2025-12-13). Licencia CC BY-SA 4.0.
npm pack cedict-json@1.3.20251213 --silent > /dev/null
tar -xzf cedict-json-1.3.20251213.tgz package/cedict.json
mv package/cedict.json cedict.json
rm -rf package cedict-json-1.3.20251213.tgz

echo "Fuentes descargadas en $CACHE_DIR"
