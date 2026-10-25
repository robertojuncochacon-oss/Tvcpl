# KinoBl · Catálogo de fuentes

Plugin de catálogo para Kino API v6. Agrupa enlaces externos por categoría y permite buscar por nombre o categoría.

## Instalación

1. Abre Kino TV.
2. Entra en la sección de plugins y elige añadir/instalar desde repositorio (el nombre exacto puede variar según la versión).
3. Usa el repositorio `robertojuncochacon-oss/Tvcpl` y selecciona la rama `KinoBl`, si la aplicación permite indicar una rama.
4. Si Kino pide el manifiesto directamente, prueba esta URL:
   `https://raw.githubusercontent.com/robertojuncochacon-oss/Tvcpl/KinoBl/kino-plugin.json`
5. Reinicia o actualiza la lista de plugins y busca **KinoBl · Catálogo de fuentes**.

## Archivos

- `kino-plugin.json`: manifiesto del plugin (API v6).
- `plugin.js`: catálogo, agrupación por categorías y búsqueda.

## Alcance y limitaciones

KinoBl es un **directorio de enlaces externos**. No extrae enlaces directos de vídeo, no evade restricciones de acceso y no garantiza que los sitios abran o reproduzcan dentro del reproductor de Kino. La reproducción depende de cada web, de su disponibilidad y de lo que permita el navegador integrado de Kino. Los enlaces externos pueden abrirse en un navegador si Kino no los reproduce internamente.

No se necesita una clave de TMDB para este catálogo básico.

## Diagnóstico

Si el plugin no aparece, confirma que Kino acepte plugins API v6 y que admita instalar desde una rama o desde una URL de manifiesto. Si aparece pero un enlace no reproduce, prueba abrir ese enlace en el navegador del teléfono: eso distingue un problema del sitio de una limitación del reproductor integrado.
