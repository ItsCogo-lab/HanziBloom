# Fuentes de datos

Todos los datos lingüísticos de HanziVocab vienen de fuentes abiertas. Nada
se escribe a mano ni se genera con IA. Hay dos formas de llegar a la app:

- **Generados con un script** (`npm run data:build`): HSK 1-4 y las copias
  locales de trazos y frases de HSK se suben a este repositorio; el
  diccionario completo se publica en un repositorio de datos aparte
  (`ItsCogo-lab/HanziVocab-Data`) y la app lo lee en tiempo de ejecución. Si
  hay que corregir algo, se cambia el script y se vuelve a generar.
- **Pedidos en tiempo de ejecución** a la fuente, con caché en el navegador:
  el diccionario completo (repositorio de datos en jsDelivr), el orden de
  trazos (jsDelivr) y las frases de ejemplo (API de Tatoeba). Ver
  [Fuentes en tiempo de ejecución](#fuentes-en-tiempo-de-ejecución).

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
| Salida | `src/data/`, `public/strokes/`, `public/examples/`; el diccionario completo en `data-release/` (no se sube) | Ver «Archivos generados» y «Repositorio de datos». |

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

El diccionario completo (fuera de HSK 1-4) sigue las mismas reglas, salvo
que no tiene nivel HSK y que el pinyin de sus palabras es el de CC-CEDICT. Ver
«Diccionario completo».

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
tal cual. Su pinyin se genera en el navegador (ver «Pinyin de las frases de
ejemplo»).

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

## Diccionario completo

Además de HSK 1-4, el build genera todo CC-CEDICT en `data-release/dictionary/`
(`buildFullEntries` en `fusion.ts`), que se publica en el repositorio de datos. Sirve para buscar cualquier palabra y
para añadirla a un set propio. Reglas:

1. **Qué entra:** las entradas escritas enteras con caracteres chinos y con
   lectura conocida. Se quedan fuera las que llevan letras, cifras o
   símbolos («T恤», «110», «%») y las que CC-CEDICT anota con pinyin
   desconocido (`xx5`, como 々).
2. **Sin repetir HSK:** las entradas que ya usa una palabra de HSK 1-4 no
   vuelven a aparecer, ni los caracteres de HSK 1-4.
3. **Caracteres:** una entrada de un solo carácter. Lleva todas sus
   lecturas; las de nombre propio («surname Xxx») solo cuentan si no tiene
   otras. Los demás campos (radical, trazos, descomposición, etimología,
   tradicional) salen de su fuente dueña, igual que en HSK.
4. **Palabras:** una por cada hanzi y pinyin distintos, con el pinyin de
   CC-CEDICT (las mayúsculas marcan nombres propios: 苹果 *Píng guǒ* es
   «Apple», aparte de 苹果 *píng guǒ* de HSK 1). Si hay otra palabra con el
   mismo hanzi, el id lleva el pinyin: `苹果[Píng guǒ]`.
5. **Palabras que no se pueden enseñar:** si un carácter de la palabra no
   tiene entrada propia (碁 en 宏碁), la palabra se deja fuera. Todo lo que
   se deja fuera aparece en `DATA_CONFLICTS.md`.
6. **Sin nivel HSK.** Las frases y la animación de trazos no van en estos
   archivos: la ficha las pide en tiempo de ejecución a Tatoeba y a jsDelivr,
   como las de HSK. De hanzi-writer-data solo se usa aquí el número de trazos.

Se reparte en 32 archivos (`CHUNK_COUNT` en
`src/features/dictionary/fullDictionary.ts`): cada entrada va en el del punto
de código de su primer carácter módulo 32. Así la app sabe qué archivo pedir
a partir del hanzi, sin índice aparte. Ocupa unos 18 MB (unos 4,7 MB con
gzip; el archivo más grande, unos 200 KB con gzip).

### Repositorio de datos

No hay ninguna API pública de CC-CEDICT, Unihan ni Make Me a Hanzi que se
pueda usar desde el navegador (ver la tabla de abajo), así que el diccionario
completo se publica en un repositorio público aparte,
[ItsCogo-lab/HanziVocab-Data](https://github.com/ItsCogo-lab/HanziVocab-Data),
y la app lo lee por jsDelivr. Así se actualiza sin tocar la app, y el
repositorio de la app no lleva 18 MB de datos.

- **Estructura:** `v1/manifest.json` (formato, versión actual, fecha de
  generación y versión de cada fuente) y `v1/<versión>/dictionary/0.json` a
  `31.json`. Una carpeta de versión no se modifica nunca; se conservan las dos
  anteriores.
- **Endpoints:** `https://cdn.jsdelivr.net/gh/ItsCogo-lab/HanziVocab-Data@main/v1/manifest.json`
  y `…@main/v1/<versión>/dictionary/<n>.json`.
- **Licencia y atribución:** las de las fuentes (CC BY-SA 4.0 por
  CC-CEDICT; Unicode License v3; LGPL 3.0+; Arphic), escritas en su README.
- **Límites:** jsDelivr no publica límites por usuario para archivos
  pequeños; la app hace como mucho 120 peticiones por minuto a esta fuente
  (una búsqueda completa son 33: el manifiesto y 32 trozos) y respeta los 429.
- **CORS:** `access-control-allow-origin: *` (comprobado desde GitHub Actions).
- **Autenticación:** ninguna; el repositorio es público y no hay claves.
- **Caché:** el manifiesto, 1 día (y jsDelivr lo guarda hasta 12 horas); cada
  trozo se guarda en IndexedDB con su versión y solo se vuelve a pedir cuando
  el manifiesto dice otra versión.
- **Si falla:** sin manifiesto ni red, se usan los trozos guardados (aunque
  sean de una versión anterior). Si no hay nada guardado, la búsqueda sigue
  en HSK 1-4 y lo dice («Couldn't load the full dictionary…»), y un set propio
  con palabras de fuera de HSK avisa de que no puede cargarlas. HSK, Learn y
  Study no dependen de esto.
- **Adaptador:** `src/features/dictionary/runtime/dictionarySource.ts`.

Publicar una versión nueva (sin PR ni build de la app):

1. Lanzar a mano el workflow **Publish data** con la versión nueva (mayor que
   la actual, p. ej. `1.1.0`). Descarga las fuentes, genera y valida el
   diccionario, escribe la carpeta de la versión y el manifiesto en
   HanziVocab-Data, hace commit en su `main` y avisa a jsDelivr. Necesita el
   secreto `DATA_REPO_TOKEN` (un token fine-grained con «Contents: Read and
   write» solo sobre HanziVocab-Data).
2. O a mano: `npm run data:fetch && npm run data:build && npm run data:validate`
   y `npm run data:release -- 1.1.0 <copia de HanziVocab-Data>`, y después
   commit y push en ese repositorio.

Si cambia el formato de los datos de forma incompatible, se sube `DATA_FORMAT`
en `dictionarySource.ts` y los datos van en `v2/`: las versiones de la app que
ya están publicadas siguen leyendo `v1/`.

## Fuentes en tiempo de ejecución

Antes de pasar nada a tiempo de ejecución se investigó qué APIs existen de
verdad para cada fuente (informe del 2026-09-29, comprobado desde GitHub
Actions porque el entorno de Claude no llega a esos dominios):

| Fuente | ¿API real? | Qué se hace |
| --- | --- | --- |
| hanzi-writer-data (trazos) | Sí: jsDelivr, el CDN desde el que Hanzi Writer los carga por defecto | En tiempo de ejecución |
| Tatoeba (frases) | Sí: API v1, pública y sin clave | En tiempo de ejecución |
| CC-CEDICT (significados, pinyin) | No: es un archivo. MDBG prohíbe el acceso automatizado; ccdb.hemiola.com solo va por HTTP | Generado por nosotros y leído en tiempo de ejecución del [repositorio de datos](#repositorio-de-datos); HSK 1-4, en la app |
| Unihan (radical, trazos) | No: Unicode solo publica archivos | Igual que CC-CEDICT |
| Make Me a Hanzi (descomposición, etimología) | No: un archivo de 2,5 MB en GitHub, que no es un CDN | Igual que CC-CEDICT |
| Lista HSK | No | Local, como pide el diseño |

### Trazos: hanzi-writer-data en jsDelivr

- **Por qué:** es la fuente que ya mandaba en los trazos y jsDelivr es de donde
  Hanzi Writer los carga por defecto. Con ella, la animación funciona en los
  ~9.500 caracteres que tiene hanzi-writer-data, no solo en los de HSK 1-4.
- **Endpoint:** `https://cdn.jsdelivr.net/npm/hanzi-writer-data@2.0.1/<carácter>.json`,
  con la versión fijada en la URL.
- **Licencia y atribución:** Arphic Public License (como la copia local).
- **Límites:** jsDelivr no publica un límite por usuario. La app hace como
  mucho 60 peticiones por minuto a esta fuente y, si recibe un 429, espera lo
  que diga `Retry-After` (o un minuto).
- **CORS:** `access-control-allow-origin: *` (comprobado).
- **Autenticación:** ninguna.
- **Caché:** 365 días. Los archivos de una versión no cambian
  (`cache-control: immutable`); la clave de caché lleva la versión, así que
  cambiar de versión es cambiar `STROKE_DATA_VERSION`.
- **Si falla:** en HSK 1-4, la copia local de `public/strokes/`. Fuera de HSK,
  la ficha dice «Stroke order unavailable offline.». Un 404 (carácter sin
  trazos) oculta la sección.
- **Campos:** `strokes`, `medians`, `radStrokes`. El número de trazos de la
  ficha sigue saliendo del dataset local.
- **Adaptador:** `src/features/dictionary/runtime/strokeSource.ts`

### Frases: API v1 de Tatoeba

- **Por qué:** es la API oficial de la fuente que ya se usaba; la antigua
  `api_v0` está obsoleta. Da frases nuevas y corregidas sin regenerar nada.
- **Endpoint:** `https://api.tatoeba.org/v1/sentences?lang=cmn&q="<término>"&sort=words&showtrans:lang=eng&trans:lang=eng&limit=50`.
  `sort=words` da primero las frases más cortas; 50 es el máximo por página.
- **Licencia y atribución:** CC BY 2.0 FR. Solo se usan frases y traducciones
  con esa licencia, con autor y no marcadas como dudosas; cada frase se
  muestra con su número, su autor y un enlace a su página.
- **Límites:** Tatoeba no publica límites, pero sus condiciones de uso
  prohíben saturar el servicio. La app hace como mucho 20 peticiones por
  minuto, una por ficha abierta (nunca al buscar), y respeta los 429.
- **CORS:** `access-control-allow-origin: *` (comprobado).
- **Autenticación:** ninguna.
- **Caché:** 7 días; pasado ese tiempo se enseña lo guardado y se pide de
  nuevo en segundo plano.
- **Si falla:** en HSK 1-4, las frases locales de `public/examples/`. Fuera de
  HSK, «Example sentences unavailable offline.».
- **Selección:** las mismas reglas que el script (16 caracteres como mucho,
  sin letras latinas ni cifras, con traducción inglesa directa), más: la frase
  debe contener el término tal cual (Tatoeba también devuelve frases en
  tradicional). Se muestran 3, primero las que solo usan caracteres de HSK 1-4
  o del propio término. Como traducción, la directa de id más bajo: las
  indirectas (traducción de una traducción) pueden no corresponder a la frase
  (好大！ salía como «God, this place is huge!»).
- **Adaptador:** `src/features/dictionary/runtime/tatoebaSource.ts`

### Pinyin de las frases de ejemplo

La API v1 de Tatoeba no devuelve transcripciones (comprobado desde GitHub
Actions el 2026-09-29: ni en `/v1/sentences/{id}` ni en la búsqueda). La
exportación `transcriptions.tar.bz2` sí tiene pinyin en números para unas
89.000 frases en chino, pero la mayoría están generadas automáticamente (sin
usuario que las revise), igual que haría un motor.

Por eso el pinyin de las frases de ejemplo, de Tatoeba en tiempo de ejecución
o de HSK 1-4, sale del mismo motor que las frases propias
(`customSets/pinyinEngine.ts`: pinyin-pro comprobado con el dataset HSK). Lo
que el motor no puede asegurar se marca con «?» y sin color. Límites:

- Los tonos neutros solo se corrigen con el dataset HSK 1-4 (朋友 péng you);
  fuera de HSK el motor puede dar tono pleno.
- Un carácter con varias lecturas fuera de una palabra conocida sale dudoso
  (谁 shéi / shuí).

### Qué se queda local

HSK 1-4 (niveles, sets de HSK y de temas), el progreso, los ajustes, los sets
propios con sus significados y frases (nunca se envían a ninguna parte), el
pinyin de las frases propias (pinyin-pro, en el navegador) y los colores de
tono. Learn y Study solo dependen de esto: si una fuente externa falla, se
sigue estudiando igual.

## Sets por temas

`src/data/topics.ts` es el único archivo de `src/data` escrito a mano. Define
17 temas (Food & drink, Family, Travel, School & university, Time & dates,
Numbers, Weather, Daily life, Emotions, Body & health, Shopping & money,
Transportation, Nature, Technology, Work, Animals, Colors). Criterios:

- Solo palabras que ya están en el dataset HSK 1-4. El archivo no añade
  vocabulario, pinyin ni significados. Un test comprueba que cada id existe.
- Una palabra entra en un tema si alguno de los significados que muestra la
  app (CC-CEDICT) pertenece al tema. Si ese sentido no aparece, no entra
  (点 no está en Time).
- Una palabra puede estar en varios temas; su progreso es uno solo.
- La app lo indica en la pestaña Topics: son una selección curada, no una
  lista oficial.

## Archivos generados

| Archivo | Contenido | Cómo se carga |
| --- | --- | --- |
| `src/data/hsk1/` a `hsk4/`: `characters.ts`, `words.ts` | Caracteres y palabras de cada nivel | En el bundle, en un archivo aparte del código de la app |
| `public/strokes/*.json` | Trazos de los caracteres de HSK 1-4 | Solo si jsDelivr no responde |
| `public/examples/hsk1.json` a `hsk4.json` | Frases de ejemplo de las palabras de cada nivel | Solo si Tatoeba no responde o no tiene frases |
| `data-release/dictionary/0.json` a `31.json` (no se sube) | Diccionario completo, fuera de HSK 1-4 | Se publica en HanziVocab-Data; la app pide un archivo al abrir una ficha o un set con esas entradas y todos al buscar |
| `docs/DATA_CONFLICTS.md` | Desacuerdos entre fuentes | Para revisarlo |
| `src/data/topics.ts` (no generado) | Temas curados a mano | En el bundle, con el dataset |

## Licencia de los datos

El código de la app no queda afectado por estas licencias. Los archivos
generados mantienen la de su fuente:

- `src/data/`: derivado de CC-CEDICT (CC BY-SA 4.0), con campos de Unihan
  (Unicode License v3) y Make Me a Hanzi (LGPL 3.0+).
- `public/strokes/`: Arphic Public License.
- `public/examples/`: CC BY 2.0 FR.
- HanziVocab-Data (diccionario completo): como `src/data/`.

Aviso de Unicode: Copyright © Unicode, Inc. Los datos de Unihan se
distribuyen bajo los términos de la Unicode License v3
(https://www.unicode.org/license.txt).

## Pendiente

- **Frecuencia** (`frequencyRank`): sin fuente elegida todavía.
- **Significados en español:** más adelante, en `meanings.es`.
- **Calidad de algunos significados:** CC-CEDICT no siempre pone primero el
  sentido de HSK 1 (点 empieza por «to touch briefly» antes que «o'clock»; 咸
  empieza por «all; everyone» antes que «salted»).
