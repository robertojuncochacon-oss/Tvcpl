# KinoBl · Catálogo de fuentes

Plugin de catálogo para Kino API v6 (**versión 1.0.3**). Incluye enlaces externos organizados por categorías y búsqueda por nombre, categoría, descripción o URL. No requiere claves de API ni servicios externos de metadatos.

## Instalación

1. Abre Kino TV y entra en Plugins.
2. Selecciona añadir/instalar desde repositorio, si tu versión lo permite.
3. Usa el repositorio `robertojuncochacon-oss/Tvcpl` y la rama `KinoBl`.
4. Si Kino pide el manifiesto directamente, prueba:
   `https://raw.githubusercontent.com/robertojuncochacon-oss/Tvcpl/KinoBl/kino-plugin.json`
5. Actualiza la lista de plugins o reinicia Kino TV y busca **KinoBl · Catálogo de fuentes**.

## Archivos

- `kino-plugin.json`: manifiesto del plugin (API v6).
- `plugin.js`: catálogo, agrupación por categorías y búsqueda.

## Alcance y limitaciones

KinoBl es un **directorio de enlaces externos**. No extrae enlaces directos de vídeo, no evade restricciones de acceso y no garantiza que los sitios abran o reproduzcan dentro del reproductor de Kino. La reproducción depende de cada web, su disponibilidad y las capacidades del navegador integrado. Si un sitio no reproduce dentro de Kino, prueba abrirlo en el navegador del teléfono.

## Diagnóstico

- Si el plugin no aparece, confirma que tu versión de Kino admita plugins API v6 y la instalación desde una rama o una URL de manifiesto.
- Si aparece pero la búsqueda no devuelve resultados, prueba con el nombre de una fuente o una categoría, por ejemplo `Anime`, `Deportes` o `Documentales`.
- Si un enlace abre pero no reproduce, puede ser una limitación del sitio o del reproductor integrado; este catálogo no convierte páginas externas en streams compatibles.
