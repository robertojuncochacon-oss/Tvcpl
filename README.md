# TVCPL Kino

Plugin de Kino para buscar películas, series y anime mediante TMDB y, cuando el proveedor lo permita, reproducirlos a través de FrameXTV.

## Archivos del plugin

- `kino-plugin.json`: manifiesto que Kino lee al instalar.
- `plugin.js`: módulo ES único que implementa `search`, `home`, `episodes` y `resolve`.
- `.github/workflows/kino-plugin-check.yml`: comprobaciones automáticas de sintaxis y manifiesto.

## Instalar esta rama en Kino

En Kino entra en **Ajustes → Plugins → Agregar** y escribe:

```
robertojuncochacon-oss/Tvcpl@kino-plugin
```

También puedes pegar el manifiesto de esta rama:

`https://raw.githubusercontent.com/robertojuncochacon-oss/Tvcpl/kino-plugin/kino-plugin.json`

La rama `kino-plugin` está separada de `main`, que conserva el proyecto web React/Vite.

## Configurar TMDB

En los ajustes del plugin pega una clave API v3 o un Read Access Token v4 de TMDB. La clave se guarda en la configuración local de Kino; no la añadas al código ni a GitHub.

## Permisos de reproducción

El manifiesto declara `browser: true` y `streamHosts: "any"` porque FrameXTV usa una página de embed y el flujo real puede venir de un CDN distinto. Kino solicitará aprobación explícita para estas capacidades. La reproducción solo funcionará si el embed expone un flujo compatible HLS, DASH o MP4. Algunos títulos pueden no estar disponibles.

## Validación

El workflow de GitHub Actions comprueba el JSON del manifiesto, los campos esenciales y la sintaxis JavaScript. Esto no sustituye una prueba de instalación y reproducción dentro de Kino. Para una validación completa con el SDK oficial, consulta la guía de plugins: https://kinotvapp.github.io/kino-plugins/

## Fuentes y uso responsable

TVCPL usa la API de TMDB para metadatos. FrameXTV es un proveedor externo independiente. Utiliza únicamente contenidos que tengas derecho a reproducir.
