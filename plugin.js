// TVCPL Kino plugin: TMDB catalog + optional FrameXTV stream capture.
// Kino loads this file as a single ES module. No imports, browser APIs, or Node APIs.

const TMDB = "https://api.themoviedb.org/3";
const IMAGE = "https://image.tmdb.org/t/p/w500";
const FRAME = "https://framextv.xyz";

function auth() {
  const key = String(kino.config.get("tmdbKey") || "").trim();
  if (!key) return { key: "", headers: {} };
  if (key.startsWith("eyJ")) return { key: "", headers: { Authorization: "Bearer " + key } };
  return { key, headers: {} };
}

function apiUrl(path, params = {}) {
  const a = auth();
  const query = [];
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== "") query.push(encodeURIComponent(k) + "=" + encodeURIComponent(String(v)));
  }
  if (a.key) query.push("api_key=" + encodeURIComponent(a.key));
  return TMDB + path + (query.length ? "?" + query.join("&") : "");
}

async function getJson(path, params = {}) {
  const a = auth();
  if (!a.key && !a.headers.Authorization) {
    throw kino.error("configuration", "Abre Ajustes del plugin TVCPL y añade tu clave API o Read Access Token de TMDB.");
  }
  const response = await kino.fetch(apiUrl(path, params), { headers: a.headers });
  if (!response.ok) throw kino.error("unavailable", "TMDB respondió " + response.status + ". Revisa la clave en Ajustes de TVCPL.");
  return response.json();
}

function itemFrom(result, forcedType) {
  const mediaType = forcedType || result.media_type || (result.first_air_date !== undefined ? "tv" : "movie");
  if (mediaType !== "movie" && mediaType !== "tv") return null;
  const rawId = String(result.id || "");
  if (!/^\d{1,12}$/.test(rawId)) return null;
  const title = result.title || result.name || result.original_title || result.original_name || "Sin título";
  const date = result.release_date || result.first_air_date || "";
  const posterPath = result.poster_path || "";
  return {
    id: mediaType + "-" + rawId,
    ref: mediaType + "|" + rawId,
    title: String(title),
    kind: mediaType === "tv" ? "series" : "movie",
    year: date ? String(date).slice(0, 4) : undefined,
    poster: posterPath ? IMAGE + posterPath : undefined,
    backdrop: result.backdrop_path ? "https://image.tmdb.org/t/p/w1280" + result.backdrop_path : undefined,
    overview: result.overview || undefined,
    rating: typeof result.vote_average === "number" ? result.vote_average : undefined,
    ids: { tmdb: Number(rawId) }
  };
}

function asItems(results) {
  return (Array.isArray(results) ? results : []).map((r) => itemFrom(r)).filter(Boolean);
}

export async function search(query) {
  const q = String(query && query.q || "").trim();
  if (!q) return [];
  const data = await getJson("/search/multi", { query: q, include_adult: "false", language: "es-ES", page: 1 });
  const items = asItems(data.results);
  // Put the kind Kino requested first without discarding cross-type matches.
  const preferSeries = query.type === "series";
  items.sort((a, b) => (a.kind === (preferSeries ? "series" : "movie") ? -1 : 0) - (b.kind === (preferSeries ? "series" : "movie") ? -1 : 0));
  return items.slice(0, 40);
}

export async function home() {
  const data = await getJson("/trending/all/week", { language: "es-ES", page: 1 });
  const items = asItems(data.results).slice(0, 20);
  return items.length ? [{ id: "tvcpl-tendencias", title: "TVCPL · Tendencias", items }] : [];
}

export async function episodes(ref) {
  const parts = String(ref || "").split("|");
  if (parts.length < 2 || parts[0] !== "tv" || !/^\d+$/.test(parts[1])) return { episodes: [] };
  const showId = parts[1];
  const data = await getJson("/tv/" + showId, { language: "es-ES" });
  const seasons = (data.seasons || []).filter((s) => Number(s.season_number) > 0 && Number(s.episode_count) > 0);
  const currentSeason = parts.length >= 3 ? Number(parts[2]) : (seasons[0] ? Number(seasons[0].season_number) : 1);
  const seasonData = await getJson("/tv/" + showId + "/season/" + currentSeason, { language: "es-ES" });
  return {
    series: {
      title: data.name || "Serie",
      poster: data.poster_path ? IMAGE + data.poster_path : undefined,
      backdrop: data.backdrop_path ? "https://image.tmdb.org/t/p/w1280" + data.backdrop_path : undefined,
      overview: data.overview || undefined,
      year: data.first_air_date ? String(data.first_air_date).slice(0, 4) : undefined,
      ids: { tmdb: Number(showId) }
    },
    seasons: seasons.map((s) => ({
      id: "tvcpl-season-" + showId + "-" + s.season_number,
      ref: "tv|" + showId + "|" + s.season_number,
      title: "Temporada " + s.season_number,
      number: Number(s.season_number),
      current: Number(s.season_number) === currentSeason
    })),
    episodes: (seasonData.episodes || []).map((ep) => ({
      season: Number(ep.season_number) || currentSeason,
      number: Number(ep.episode_number) || 1,
      ref: "tv|" + showId + "|" + currentSeason + "|" + Number(ep.episode_number),
      title: ep.name || ("Episodio " + ep.episode_number),
      still: ep.still_path ? "https://image.tmdb.org/t/p/w500" + ep.still_path : undefined,
      overview: ep.overview || undefined,
      airDate: ep.air_date || undefined,
      runtimeMinutes: Number(ep.runtime) || undefined
    }))
  };
}

export async function resolve(ref) {
  const parts = String(ref || "").split("|");
  const mediaType = parts[0];
  const tmdbId = parts[1];
  if (!/^\d+$/.test(tmdbId || "") || (mediaType !== "movie" && mediaType !== "tv")) {
    throw kino.error("unavailable", "No se reconoce la referencia del título.");
  }
  let embed = FRAME + "/embed/" + tmdbId + "?autoplay=1&muted=0";
  if (mediaType === "tv") {
    const season = Number(parts[2]);
    const episode = Number(parts[3]);
    if (!Number.isInteger(season) || season < 1 || !Number.isInteger(episode) || episode < 1) {
      throw kino.error("unavailable", "Selecciona una temporada y un episodio válidos.");
    }
    embed = FRAME + "/embed/" + tmdbId + "/" + season + "/" + episode + "?autoplay=1&muted=0";
  }
  // FrameXTV is an embed page, not a direct video URL. Ask Kino's approved hidden
  // browser to capture a real HLS/DASH/MP4 request from the player.
  let captured;
  try {
    captured = await kino.browser.capture(embed, { timeoutMs: 25000, autoplay: true });
  } catch (error) {
    const reason = String(error && (error.message || error.code) || "sin respuesta");
    if (/timeout/i.test(reason)) {
      throw kino.error("unavailable", "FrameXTV tardó demasiado y Kino no detectó el vídeo. Prueba otro título o vuelve a intentarlo más tarde.");
    }
    if (/blocked|captcha|human/i.test(reason)) {
      throw kino.error("unavailable", "FrameXTV bloqueó la captura o pidió una verificación. Kino no puede resolver verificaciones humanas; prueba otro servidor autorizado.");
    }
    throw kino.error("unavailable", "Kino no pudo abrir el reproductor de FrameXTV (" + reason.slice(0, 120) + "). Comprueba tu conexión y prueba otro título.");
  }

  const media = (Array.isArray(captured && captured.media) ? captured.media : [])
    .filter((m) => m && typeof m.url === "string" && /^https?:\/\//i.test(m.url));
  if (!media.length) {
    throw kino.error("unavailable", "FrameXTV abrió la página, pero no entregó a Kino una URL de vídeo compatible (HLS, DASH o MP4). Puede que el título no esté disponible o que el proveedor haya cambiado.");
  }

  // Kino needs the actual media request, not the embed HTML page. Keep the
  // request headers captured from the player; some providers return 403 without them.
  const streams = media.map((m) => ({
    url: m.url,
    headers: m.headers && typeof m.headers === "object" ? m.headers : {},
    label: /\.m3u8(?:$|[?#])/i.test(m.url) ? "FrameXTV · HLS" : /\.mpd(?:$|[?#])/i.test(m.url) ? "FrameXTV · DASH" : "FrameXTV · MP4"
  }));
  return { ...streams[0], alternatives: streams.slice(1) };
}
