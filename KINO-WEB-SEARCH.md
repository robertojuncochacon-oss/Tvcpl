# Kino Web Search (experimental)

Plugin experimental para usar Kino como punto de entrada a páginas web, por ejemplo FrameXTV.

## Instalar
En Kino: Ajustes → Plugins → Agregar, si tu versión permite instalar plugins desde una rama:

`robertojuncochacon-oss/Tvcpl@kino-web-browser`

Manifiesto:
https://raw.githubusercontent.com/robertojuncochacon-oss/Tvcpl/kino-web-browser/kino-web-plugin.json

## Configuración
En los ajustes del plugin puedes configurar una página inicial HTTPS. La búsqueda admite una URL o genera un enlace a una búsqueda web.

## Limitación importante
Este plugin no puede por sí solo crear una barra de direcciones persistente ni una WebView interactiva si el SDK de Kino no expone esa interfaz. Devolver una URL HTML como resultado de `resolve` puede hacer que Kino intente tratarla como medio reproducible y no como página web. La navegación completa con botones Atrás/Adelante requiere una vista de navegador soportada por Kino o una modificación de la aplicación Android.

Por eso, este código es una prueba experimental de entrada/enlaces, no una garantía de que FrameXTV se muestre como Chrome. El sitio puede impedir iframes o reproducción integrada mediante sus políticas de seguridad.

Usa únicamente contenidos que tengas derecho a reproducir.
