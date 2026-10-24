# TVCPL — Cine, series y anime

Catálogo web responsive construido con React + Vite. Incluye tendencias, búsqueda, películas, series, anime, fichas de título, lista de favoritos guardada en el navegador, enlaces a fuentes externas y un reproductor iframe de terceros configurable para películas y episodios.

## Ejecutar localmente

Requiere Node.js 20 o superior.

```bash
npm install
npm run dev
```

Abre la dirección local que indique Vite.

## Configurar TMDB

1. Crea o inicia sesión en [The Movie Database](https://www.themoviedb.org/).
2. Entra en [Ajustes de API](https://www.themoviedb.org/settings/api) y crea una API key / Read Access Token.
3. Abre TVCPL y pulsa el engranaje de Ajustes. Pega el **API Read Access Token** y guarda.
4. La clave se guarda en el almacenamiento local de ese navegador; no está escrita en el repositorio.

**Seguridad:** no publiques una clave real en código o en un repositorio. Como la app consulta TMDB desde el navegador, un token utilizado en cliente puede ser inspeccionado por un usuario avanzado. Para producción con una clave que deba mantenerse secreta, usa un backend/proxy.

## Publicar en GitHub Pages

El workflow `.github/workflows/deploy.yml` construye y publica el sitio cuando hay un push a `main`. En el repositorio, ve a **Settings → Pages** y configura **Build and deployment → Source: GitHub Actions**. Después revisa **Actions** para ver el resultado del despliegue. La URL habitual será `https://robertojuncochacon-oss.github.io/Tvcpl/` una vez que Pages complete la publicación.

## Reproductor externo

El reproductor utiliza un iframe de FrameXTV con el ID TMDB seleccionado. La disponibilidad, compatibilidad con iframes y derechos del contenido dependen del proveedor externo. Un ID de TMDB identifica una obra, pero no garantiza que el proveedor disponga de ella. Usa únicamente contenido para el que tengas autorización.

## Fuentes

- [TBCPL](https://tbcpl.lol/)
- [IMDb](https://www.imdb.com/)
- [BestFreeStreaming](https://bestfreestreaming.org/)
- [TMDB](https://www.themoviedb.org/)

Los nombres y enlaces externos pertenecen a sus respectivos titulares. TVCPL es un catálogo independiente y no afirma estar afiliado a esas plataformas.


## Instalar como plugin de Kino

Este repositorio también incluye los archivos de plugin de Kino en la raíz:

- `kino-plugin.json`: manifiesto que Kino lee al instalar.
- `plugin.js`: búsqueda, Inicio, episodios y resolución de reproducción.

En Kino abre **Ajustes → Plugins → Agregar** y escribe:

```
robertojuncochacon-oss/Tvcpl
```

O pega el manifiesto:
`https://raw.githubusercontent.com/robertojuncochacon-oss/Tvcpl/main/kino-plugin.json`

Al instalarlo, Kino pedirá permiso para usar el navegador oculto y capturar un flujo de vídeo de FrameXTV. Acepta solo si quieres habilitar esa función. El catálogo necesita una clave o Read Access Token de TMDB: entra en los ajustes del plugin y pégalo allí; no lo guardes en el código ni lo publiques.

**Compatibilidad real:** el manifiesto y el archivo JavaScript siguen el formato de plugins de Kino, pero la reproducción de cada título depende de que FrameXTV exponga un flujo HLS/DASH/MP4 que Kino pueda capturar. Este paso debe probarse dentro de Kino en tu dispositivo.
