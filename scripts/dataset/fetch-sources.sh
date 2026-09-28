#!/usr/bin/env bash
# Descarga las fuentes del dataset en scripts/dataset/.cache (no se versiona).
# Las versiones están fijadas para que el resultado sea reproducible.
set -euo pipefail

CACHE_DIR="$(dirname "$0")/.cache"
mkdir -p "$CACHE_DIR"
cd "$CACHE_DIR"

# Listas de HSK 2.0, niveles 1 a 4, con el pinyin del examen. Licencia MIT.
# Fijadas a un commit para que el resultado sea reproducible.
HSK_COMMIT=f3dc9d12ae00d04fa3676b0bd4c43cd58de2c264
for level in 1 2 3 4; do
  curl -sSfL -o "hsk-level-${level}.json" \
    "https://raw.githubusercontent.com/clem109/hsk-vocabulary/${HSK_COMMIT}/hsk-vocab-json/hsk-level-${level}.json"
done

# CC-CEDICT en formato JSON (edición 2025-12-13). Licencia CC BY-SA 4.0.
npm pack cedict-json@1.3.20251213 --silent > /dev/null
tar -xzf cedict-json-1.3.20251213.tgz package/cedict.json
mv package/cedict.json cedict.json
rm -rf package cedict-json-1.3.20251213.tgz

# Make Me a Hanzi, dictionary.txt fijado a un commit. Licencia LGPL 3.0 o posterior.
MAKEMEAHANZI_COMMIT=bddc96d41bef78427ed0e034e9f7e31d71fd1b92
curl -sSfL -o makemeahanzi-dictionary.txt \
  "https://raw.githubusercontent.com/skishore/makemeahanzi/${MAKEMEAHANZI_COMMIT}/dictionary.txt"

# Unihan y la lista de radicales de Unicode 18.0. Unicode License v3.
# unicode.org no es accesible desde el entorno en la nube de Claude: este paso
# se ejecuta en local o en GitHub Actions (.github/workflows/dataset.yml).
UNICODE_VERSION=18.0.0
mkdir -p unihan
curl -sSfL -o Unihan.zip "https://www.unicode.org/Public/${UNICODE_VERSION}/ucd/Unihan.zip"
unzip -o -q Unihan.zip Unihan_IRGSources.txt Unihan_Variants.txt -d unihan
rm Unihan.zip
curl -sSfL -o unihan/CJKRadicals.txt "https://www.unicode.org/Public/${UNICODE_VERSION}/ucd/CJKRadicals.txt"

# Tatoeba: frases en chino y en inglés y sus enlaces. Licencia CC BY 2.0 FR.
# Tatoeba publica una exportación nueva cada semana y no guarda las antiguas,
# así que se anota la fecha de descarga junto a los archivos.
# tatoeba.org tampoco es accesible desde el entorno en la nube de Claude.
TATOEBA_EXPORTS=https://downloads.tatoeba.org/exports/per_language
mkdir -p tatoeba
for file in cmn/cmn_sentences_detailed cmn/cmn-eng_links eng/eng_sentences_detailed; do
  curl -sSfL "${TATOEBA_EXPORTS}/${file}.tsv.bz2" | bunzip2 > "tatoeba/$(basename "$file").tsv"
done
date -u +%Y-%m-%d > tatoeba/export-date.txt

echo "Fuentes descargadas en $CACHE_DIR"
