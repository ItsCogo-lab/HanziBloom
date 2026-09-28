# Fuentes de datos

El dataset de `src/data/` se genera con un script a partir de fuentes abiertas.
No se edita a mano: si hay que corregir algo, se cambia el script
(`scripts/dataset/build-hsk1.ts`) y se vuelve a generar.

## Fuentes

| Qué | Fuente | Licencia |
| --- | --- | --- |
| Lista de palabras HSK 2.0 nivel 1 (150) y su pinyin de examen | [clem109/hsk-vocabulary](https://github.com/clem109/hsk-vocabulary) (`hsk-level-1.json`) | MIT, © 2018 Clement Venard |
| Significados en inglés y lecturas de cada carácter | [CC-CEDICT](https://cc-cedict.org/wiki/), edición 2025-12-13, vía el paquete npm [`cedict-json`](https://www.npmjs.com/package/cedict-json) | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/), © MDBG y colaboradores de CC-CEDICT |

## Licencia del dataset

Como los significados vienen de CC-CEDICT, los archivos de `src/data/` son una
obra derivada y se distribuyen bajo **CC BY-SA 4.0**. Eso implica:

- **Atribución:** hay que citar CC-CEDICT allí donde se muestren los datos
  (cuando exista una pantalla «Acerca de» o en Ajustes).
- **Compartir igual:** si alguien redistribuye estos datos modificados, debe
  usar la misma licencia.

El código de la aplicación no queda afectado por esta licencia.

## Cómo se genera

```bash
npm run data:fetch   # descarga las fuentes en scripts/dataset/.cache (versiones fijadas)
npm run data:build   # genera src/data/hsk1/characters.ts y words.ts
```

Reglas del script:

1. **Palabras:** para cada palabra de la lista HSK se buscan las entradas de
   CC-CEDICT con el mismo hanzi y el mismo pinyin (incluidas las mayúsculas,
   que en CC-CEDICT marcan nombres propios: 苹果 *píng guǒ* es «apple», no la
   empresa).
2. **Caracteres:** son todos los caracteres que aparecen en las palabras. Su
   pinyin es la lectura con la que se usan en esas palabras. Si en la palabra
   llevan tono neutro, se usa la entrada neutra de CC-CEDICT si existe (吗 *ma*,
   们 *men*) y si no, la lectura con tono (东西 *dōng xi* → 西 *xī*).
3. **Significados:** se quitan notas que no son traducciones («variant of»,
   «surname», «used in», «CL:»...) y la notación interna de CC-CEDICT
   (`兩|两[liang3]` → `两`). Se guardan como máximo 6, en el orden de
   CC-CEDICT. Si una lectura solo tiene notas (漂 *piào*: «used in 漂亮»), se
   conservan porque son ciertas y útiles.
4. **Decisiones manuales:** están en `PREFERRED_TRADITIONAL`, con su motivo
   (p. ej. 里 «inside» en lugar de la unidad de longitud).
5. El script valida el resultado con `validateDictionaryData` y se detiene si
   algo no cuadra, indicando qué entrada falla.

## Pendiente

- **Número de trazos y radical:** las fuentes fiables (Unihan de Unicode) no
  son accesibles desde el entorno donde se generó el dataset, así que estos
  campos opcionales se han dejado vacíos en lugar de rellenarlos con datos
  dudosos. Se completarán con Unihan o con los datos de trazos que usemos para
  la escritura de caracteres.
- **Frecuencia:** sin fuente elegida todavía.
- **Significados en español:** se añadirán más adelante en el campo `meanings.es`.
- **Calidad de algunos significados:** CC-CEDICT no siempre pone primero el
  sentido de HSK 1 (点 empieza por «to touch briefly» antes que «o'clock»).
  Se puede afinar con más reglas en el script cuando lo veamos en la práctica.
