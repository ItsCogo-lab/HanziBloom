# Fuentes de datos

Todos los datos lingüísticos de HanziVocab vienen de fuentes abiertas. Se
descargan y se combinan con un script, y el resultado se sube al repositorio:
la app no llama a ninguna API externa cuando se usa. Nada se escribe a mano ni
se genera con IA: si hay que corregir algo, se cambia el script y se vuelve a
generar.

## Cómo se genera

```
fuentes → adaptadores → fusión → validación → archivos generados → app
```

| Paso | Dónde | Qué hace |
| --- | --- | --- |
| Descarga | `scripts/dataset/fetch-sources.sh` | Baja cada fuente, con versión fija, a `scripts/dataset/.cache` (no se versiona). |
| Adaptadores | `scripts/dataset/sources/*.ts` | Uno por fuente. Leen el formato original y devuelven solo los campos de los que esa fuente es dueña. No saben nada de las demás fuentes. |
| Fusión | `scripts/dataset/fusion.ts` | Combina los adaptadores campo a campo según `FIELD_SOURCES` y compara fuentes que dicen lo mismo. |
| Validación | `src/features/dictionary/validation.ts` | Comprueba el resultado. Si algo falla, no se escribe nada. |
| Salida | `src/data/`, `public/strokes/`, `public/examples/` | Ver «Archivos generados». |

```bash
npm run data:fetch      # descarga las fuentes
npm run data:build      # genera los archivos
npm run data:validate   # valida los archivos generados sin descargar nada
npm run check           # tipos, lint y tests (incluyen el dataset)
```

### Dónde ejecutarlo

`unicode.org` y `tatoeba.org` no son accesibles desde el entorno en la nube
donde trabaja Claude, así que `data:fetch` completo solo funciona:

- **En local**: `npm ci && npm run data:fetch && npm run data:build && npm run data:validate`.
  Necesita `curl`, `unzip` y `bunzip2`.
- **En GitHub Actions**: el workflow `Dataset` (`.github/workflows/dataset.yml`)
  se ejecuta al subir cambios en `scripts/dataset/` a cualquier rama que no
  sea `main`, y sube el dataset regenerado a esa rama. En `main` se lanza a
  mano y solo comprueba que el dataset está al día.

Para probar el script sin esas fuentes existe
`node scripts/dataset/build.ts --without=unihan,tatoeba`. Ese resultado está
incompleto y no se debe subir.

### Determinismo

Con los mismos archivos en `.cache`, el build produce siempre los mismos
archivos: no usa la fecha actual, ni aleatoriedad, ni ningún modelo de IA. Las
fuentes están fijadas a una versión (Unicode 18.0.0, un commit concreto de
Make Me a Hanzi, versiones exactas de los paquetes npm). La excepción es
Tatoeba, que publica una exportación nueva cada semana y no guarda las
anteriores: la fecha de la descarga queda en `exportDate` dentro de
`public/examples/hsk<n>.json`.

## Qué fuente manda en cada campo

Cada campo tiene una sola fuente dueña. Si esa fuente no tiene el dato, el
campo se queda vacío y la ficha no muestra esa sección: ninguna otra fuente lo
rellena.

| Entidad | Campo | Fuente |
| --- | --- | --- |
| Carácter | `hskLevel` | Lista HSK |
| Carácter | `pinyin` | CC-CEDICT (la lectura con la que aparece en las palabras de HSK) |
| Carácter | `meanings.en` | CC-CEDICT |
| Carácter | `strokeCount` | hanzi-writer-data (número de trazos de la animación) |
| Carácter | `radical`, `radicalNumber` | Unihan `kRSUnicode` + `CJKRadicals.txt` |
| Carácter | `traditional` | Unihan `kTraditionalVariant` |
| Carácter | `decomposition`, `etymology` | Make Me a Hanzi |
| Carácter | orden de trazos (`public/strokes/`) | hanzi-writer-data |
| Palabra | `hskLevel`, `pinyin` | Lista HSK |
| Palabra | `meanings.en`, `traditional` | CC-CEDICT |
| Frases | `public/examples/` | Tatoeba |

No se guardan porque se calculan: las palabras relacionadas de un carácter
(`getWordsWithCharacter`), los caracteres de una palabra y los componentes de
un carácter (a partir de `decomposition`).

### Comprobaciones entre fuentes

El build compara:

- el número de trazos de Unihan con el de hanzi-writer-data;
- el radical de Unihan con el de Make Me a Hanzi.

Si no coinciden, se usa la fuente dueña del campo (hanzi-writer-data para
los trazos, Unihan para el radical) y el desacuerdo se apunta en
[`DATA_CONFLICTS.md`](DATA_CONFLICTS.md) para revisarlo. No se elige en
silencio.

## Fuentes

### CC-CEDICT

- **URL:** https://cc-cedict.org/wiki/ (vía el paquete npm [`cedict-json`](https://www.npmjs.com/package/cedict-json))
- **Versión:** edición 2025-12-13 (`cedict-json@1.3.20251213`)
- **Licencia:** [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/), © MDBG y colaboradores de CC-CEDICT
- **Atribución:** citar CC-CEDICT donde se muestren los datos (Ajustes → About the data). Los datos derivados se comparten con la misma licencia.
- **Campos:** significados en inglés de caracteres y palabras, lectura de cada carácter, forma tradicional de cada palabra.
- **Adaptador:** `sources/cedict.ts`

Reglas del adaptador:

1. **Palabras:** se buscan las entradas con el mismo hanzi y el mismo pinyin
   (incluidas las mayúsculas, que marcan nombres propios: 苹果 *píng guǒ* es
   «apple», no la empresa).
2. **Caracteres:** su pinyin es la lectura con la que se usan en las palabras.
   Con tono neutro se usa la entrada neutra si existe (吗 *ma*) y si no, la
   lectura con tono (东西 *dōng xi* → 西 *xī*).
3. **Significados:** se quitan las notas que no son traducciones («variant
   of», «surname», «CL:»...) y la notación interna (`兩|两[liang3]` → `两`).
   Como máximo 6, en el orden de CC-CEDICT. Si una lectura solo tiene notas
   (柠 *níng*: «used in 柠檬»), se conservan.
4. **Tradicional de las palabras:** la forma de las entradas con traducciones.
   Si hay dos distintas (回 y 迴 para *huí*), no se elige ninguna.
5. **Decisiones manuales:** `PREFERRED_TRADITIONAL`, con su motivo (里 «inside»
   en lugar de la unidad de longitud).

### Unicode Unihan

- **URL:** https://www.unicode.org/reports/tr38/ (archivos `Unihan.zip` y `CJKRadicals.txt` de https://www.unicode.org/Public/18.0.0/ucd/)
- **Versión:** Unicode 18.0.0
- **Licencia:** [Unicode License v3](https://www.unicode.org/license.txt)
- **Atribución:** incluir el aviso de copyright de Unicode en la documentación (este archivo) y citar la fuente en Ajustes.
- **Campos:** `radical` y `radicalNumber` (primer valor de `kRSUnicode`; `149'` es la forma simplificada del radical 149, 讠), `traditional` (`kTraditionalVariant`). Su número de trazos (primer valor de `kTotalStrokes`) solo se usa para comprobar el de hanzi-writer-data: en algunos caracteres cuenta un trazo más (菜 12, la animación dibuja 11).
- **Adaptador:** `sources/unihan.ts`
- **Descarga:** no accesible desde el entorno en la nube de Claude (ver «Dónde ejecutarlo»).

### Make Me a Hanzi

- **URL:** https://github.com/skishore/makemeahanzi (`dictionary.txt`)
- **Versión:** commit `bddc96d41bef78427ed0e034e9f7e31d71fd1b92`
- **Licencia:** `dictionary.txt` bajo [LGPL 3.0 o posterior](https://www.gnu.org/licenses/lgpl-3.0.html) (derivado de Unihan y cjklib)
- **Atribución:** citar el proyecto; los datos derivados de este archivo siguen bajo LGPL.
- **Campos:** `decomposition` (secuencia IDS, p. ej. `⿰木宁`; si empieza por `？` es desconocida y no se usa), `etymology` (tipo, pista, componente semántico y fonético). Su `radical` solo se usa para comprobar el de Unihan.
- **Adaptador:** `sources/makemeahanzi.ts`

Es la misma fuente de la que salía la etimología de la app Tofu Learn.

### Hanzi Writer y hanzi-writer-data

- **URL:** https://github.com/chanind/hanzi-writer y https://github.com/chanind/hanzi-writer-data
- **Versión:** `hanzi-writer@3.7.3` (dependencia de la app) y `hanzi-writer-data@2.0.1` (dependencia de desarrollo, solo para el build)
- **Licencia:** la librería, MIT. Los datos de trazos, [Arphic Public License](https://github.com/chanind/hanzi-writer-data/blob/master/ARPHICPL.TXT) (vienen de Make Me a Hanzi, que los extrajo de fuentes tipográficas de Arphic Technology).
- **Atribución:** citar hanzi-writer-data y Arphic Technology; se pueden redistribuir y modificar bajo la misma licencia.
- **Campos:** trazos de cada carácter, copiados sin cambios a `public/strokes/<punto de código>.json` (柠 → `67e0.json`). También da `strokeCount`, el número de trazos, para que coincida siempre con la animación.
- **Adaptador:** `sources/hanziWriter.ts`

### Tatoeba

- **URL:** https://tatoeba.org (exportaciones de https://downloads.tatoeba.org/exports/per_language/: `cmn_sentences_detailed.tsv`, `eng_sentences_detailed.tsv`, `cmn-eng_links.tsv`)
- **Versión:** la exportación semanal del día en que se ejecuta `data:fetch`; su fecha queda en `exportDate`.
- **Licencia:** [CC BY 2.0 FR](https://creativecommons.org/licenses/by/2.0/fr/). Algunas frases también están disponibles como CC0, pero todas tienen al menos la CC BY.
- **Atribución:** cada frase se muestra con su número de Tatoeba, su autor y un enlace a su página, donde también está la traducción.
- **Campos:** frase china, traducción inglesa, ids y autores de ambas, palabras para las que se eligió.
- **Adaptador:** `sources/tatoeba.ts`
- **Descarga:** no accesible desde el entorno en la nube de Claude (ver «Dónde ejecutarlo»).

Criterio de selección (determinista): frases chinas con autor, de 16
caracteres como mucho, sin letras latinas ni cifras y cuyos caracteres chinos
sean todos del mismo nivel HSK o de uno anterior (quien estudia HSK 1 puede
leer entera una frase de HSK 1). Por palabra, las 3 más cortas (a igual longitud, la
de id más bajo), con la traducción inglesa de id más bajo. Las frases se copian
tal cual; el pinyin de las frases no se muestra porque todavía no se usa la
exportación de transcripciones de Tatoeba.

### Lista HSK 2.0

- **URL:** https://github.com/clem109/hsk-vocabulary (`hsk-vocab-json/hsk-level-1.json` a `hsk-level-4.json`)
- **Versión:** commit `f3dc9d12ae00d04fa3676b0bd4c43cd58de2c264`
- **Licencia:** MIT, © 2018 Clement Venard
- **Atribución:** citar el repositorio.
- **Campos:** las palabras de HSK 1 a 4 y su pinyin de examen. Sus traducciones no se usan.
- **Adaptador:** `sources/hsk.ts`

Reglas al juntar los niveles (`buildBaseEntries` en `fusion.ts`):

1. **Nivel de un carácter:** el de la primera palabra en la que aparece
   (他 es HSK 1 aunque también esté en palabras de HSK 3).
2. **Homógrafos:** si la lista tiene la misma palabra con dos
   pronunciaciones (长 *cháng* «largo» y 长 *zhǎng* «crecer»; 得, 还, 只),
   son dos palabras distintas y su id lleva el pinyin: `长[cháng]`,
   `长[zhǎng]`. El resto de palabras usa el hanzi como id.
3. **Repeticiones:** si la lista repite una palabra con el mismo pinyin
   (等, 对 y 过 en HSK 4, con dos sentidos cada una), se guarda una vez.
4. **Tono neutro:** la lista HSK pone el tono en algunas sílabas que
   CC-CEDICT anota en tono neutro (关系 *guān xì* / *guān xi*). Se considera
   la misma palabra y se muestra el pinyin de la lista HSK.
5. **«also pr.»:** si CC-CEDICT dice que un carácter también se pronuncia de
   otra forma (钥 *yuè*: «also pr. [yao4]»), esa lectura vale para las
   palabras que la usan (钥匙 *yào shi*).
6. **Sin entrada en CC-CEDICT:** la palabra se deja fuera (no hay de dónde
   sacar su significado) y aparece en `DATA_CONFLICTS.md`. Hoy es solo
   打篮球 (HSK 2), que CC-CEDICT no tiene como entrada.

Por eso los niveles no tienen exactamente el número oficial de palabras
(150/150/300/600): HSK 1 tiene 150, HSK 2 149, HSK 3 299 (la lista de
clem109 trae 299) y HSK 4 598 (la lista trae 601, con 3 repeticiones).

## Archivos generados

| Archivo | Contenido | Cómo se carga |
| --- | --- | --- |
| `src/data/hsk1/` a `hsk4/`: `characters.ts`, `words.ts` | Caracteres y palabras de cada nivel | En el bundle, en un archivo aparte del código de la app |
| `public/strokes/*.json` | Trazos de cada carácter | Al abrir la ficha de un carácter |
| `public/examples/hsk1.json` a `hsk4.json` | Frases de ejemplo de las palabras de cada nivel | Al abrir una ficha |
| `docs/DATA_CONFLICTS.md` | Desacuerdos entre fuentes | Para revisarlo |

## Licencia de los datos

El código de la app no queda afectado por estas licencias. Los archivos
generados mantienen la de su fuente:

- `src/data/`: derivado de CC-CEDICT (CC BY-SA 4.0), con campos de Unihan
  (Unicode License v3) y Make Me a Hanzi (LGPL 3.0+).
- `public/strokes/`: Arphic Public License.
- `public/examples/`: CC BY 2.0 FR.

Aviso de Unicode: Copyright © Unicode, Inc. Los datos de Unihan se
distribuyen bajo los términos de la Unicode License v3
(https://www.unicode.org/license.txt).

## Pendiente

- **Frecuencia** (`frequencyRank`): sin fuente elegida todavía.
- **Pinyin de las frases de ejemplo:** Tatoeba publica transcripciones
  (`cmn_transcriptions.tsv`); falta decidir si usarlas.
- **Significados en español:** más adelante, en `meanings.es`.
- **Calidad de algunos significados:** CC-CEDICT no siempre pone primero el
  sentido de HSK 1 (点 empieza por «to touch briefly» antes que «o'clock»).
