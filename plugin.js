// TVCPL Kino plugin — single ES module, no imports or Node/browser globals.
// Requires apiVersion 6 because playback capture uses kino.browser.capture.

const TMDB = "https://api.themoviedb.org/3";
const POSTER = "https://image.tmdb.org/t/p/w500";
const BACKDROP = "https://image.tmdb.org/t/p/w1280";
const FRAME = "https://framextv.xyz";

function auth() {
  const value = String(kino.config.get("tmdbKey") || "").trim();
  if (!value) throw kino.error("configuration", "Configura tu clave API o Read Access Token de TMDB en los ajustes de TVCPL Kino.");
  // TMDB v4 Read Access Tokens are JWTs; v3 keys are sent as api_key.
  return value.startsWith("eyJ") ? { token: value, key: "" } : { token: "", key: value };
}

function url(path, params = {}) {
  const a = auth();
  const query = [];
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") {
      query.push(encodeURIComponent(key) + "=" + encodeURIComponent(String(value)));
    }
  }
  if (a.key) query.push("api_key=" + encodeURIComponent(a.key));
  return TMDB + path + (query.length ? "?" + query.join("&") : "");
}

async function getJson(path, params = {}) {
  // Kino 0.9.53+ provides its own cached TMDB client and key fallback.
  // Keep the plugin setting as a fallback for older Kino versions.
  if (typeof kino.tmdb === "function") {
    return kino.tmdb(path, params);
  }

  const a = auth();
  const response = await kino.fetch(url(path, params), {
    headers: a.token ? { Authorization: "Bearer " + a.token } : {}
  });
  if (!response.ok) {
    const status = response.status;
    const code = status === 401 || status === 403
      ? "auth_required"
      : status === 429
        ? "rate_limited"
        : status === 404
          ? "not_found"
          : "unavailable";
    throw kino.error(code, "TMDB respondió HTTP " + status + ". Comprueba tu clave en Ajustes de TVCPL Kino.");
  }
  return response.json();
}

function itemFrom(result, forcedType) {
  const type = forcedType || result.media_type || (result.first_air_date !== undefined ? "tv" : "movie");
  if (type !== "movie" && type !== "tv") return null;
  const id = String(result.id || "");
  if (!/^\d{1,12}$/.test(id)) return null;

  const title = result.title || result.name || result.original_title || result.original_name || "Sin título";
  const date = result.release_date || result.first_air_date || "";
  return {
    id: type + "-" + id,
    ref: type + "|" + id,
    title: String(title).slice(0, 200),
    kind: type === "tv" ? "series" : "movie",
    year: date ? String(date).slice(0, 4) : undefined,
    poster: result.poster_path ? POSTER + result.poster_path : undefined,
    backdrop: result.backdrop_path ? BACKDROP + result.backdrop_path : undefined,
    overview: result.overview || undefined,
    rating: typeof result.vote_average === "number" ? result.vote_average : undefined,
    ids: { tmdb: Number(id) }
  };
}

function mapItems(results) {
  return (Array.isArray(results) ? results : []).map((r) => itemFrom(r)).filter(Boolean);
}

function preferType(items, requestedType) {
  const preferred = requestedType === "series" ? "series" : requestedType === "movie" ? "movie" : "";
  if (!preferred) return items;
  return items.slice().sort((a, b) => Number(b.kind === preferred) - Number(a.kind === preferred));
}

export async function search(query) {
  const q = String(query && query.q || "").trim();
  if (!q) return [];
  const data = await getJson("/search/multi", {
    query: q,
    include_adult: "false",
    language: "es-ES",
    page: 1
  });
  return preferType(mapItems(data.results), query.type).slice(0, 40);
}

export async function home() {
  const data = await getJson("/trending/all/week", { language: "es-ES", page: 1 });
  const items = mapItems(data.results).slice(0, 20);
  return items.length ? [{ id: "tvcpl-trending", title: "TVCPL · Tendencias", items }] : [];
}

export async function episodes(ref) {
  const parts = String(ref || "").split("|");
  if (parts[0] !== "tv" || !/^\d+$/.test(parts[1] || "")) return { episodes: [] };

  const showId = parts[1];
  const seriesData = await getJson("/tv/" + showId, { language: "es-ES" });
  const seasons = (seriesData.seasons || []).filter((s) =>
    Number(s.season_number) > 0 && Number(s.episode_count) > 0
  );
  const requestedSeason = Number(parts[2]);
  const seasonNumber = Number.isInteger(requestedSeason) && requestedSeason > 0
    ? requestedSeason
    : (seasons[0] ? Number(seasons[0].season_number) : 1);

  const seasonData = await getJson("/tv/" + showId + "/season/" + seasonNumber, { language: "es-ES" });
  return {
    series: {
      title: seriesData.name || "Serie",
      poster: seriesData.poster_path ? POSTER + seriesData.poster_path : undefined,
      backdrop: seriesData.backdrop_path ? BACKDROP + seriesData.backdrop_path : undefined,
      overview: seriesData.overview || undefined,
      year: seriesData.first_air_date ? String(seriesData.first_air_date).slice(0, 4) : undefined,
      ids: { tmdb: Number(showId) }
    },
    seasons: seasons.slice(0, 50).map((s) => ({
      id: "tvcpl-season-" + showId + "-" + s.season_number,
      ref: "tv|" + showId + "|" + Number(s.season_number),
      title: "Temporada " + s.season_number,
      number: Number(s.season_number),
      current: Number(s.season_number) === seasonNumber
    })),
    episodes: (seasonData.episodes || []).map((ep) => ({
      season: Number(ep.season_number) || seasonNumber,
      number: Number(ep.episode_number) || 1,
      ref: "tv|" + showId + "|" + seasonNumber + "|" + Number(ep.episode_number),
      title: ep.name || ("Episodio " + ep.episode_number),
      still: ep.still_path ? POSTER + ep.still_path : undefined,
      overview: ep.overview || undefined,
      airDate: ep.air_date || undefined,
      runtimeMinutes: Number(ep.runtime) > 0 ? Number(ep.runtime) : undefined
    }))
  };
}

export async function resolve(ref) {
  const parts = String(ref || "").split("|");
  const type = parts[0];
  const tmdbId = parts[1];
  if ((type !== "movie" && type !== "tv") || !/^\d{1,12}$/.test(tmdbId || "")) {
    throw kino.error("unavailable", "No se reconoce el título seleccionado.");
  }

  let embed = FRAME + "/embed/" + tmdbId + "?autoplay=1&muted=0";
  if (type === "tv") {
    const season = Number(parts[2]);
    const episode = Number(parts[3]);
    if (!Number.isInteger(season) || season < 1 || !Number.isInteger(episode) || episode < 1) {
      throw kino.error("unavailable", "Selecciona una temporada y un episodio válidos.");
    }
    embed = FRAME + "/embed/" + tmdbId + "/" + season + "/" + episode + "?autoplay=1&muted=0";
  }

  // The embed URL is not itself a media stream. Capture the real HLS/DASH/MP4
  // request only when the person presses Play, then preserve the player headers.
  const captured = await kino.browser.capture(embed, { timeoutMs: 22000 });
  const media = Array.isArray(captured.media) ? captured.media : [];
  if (!media.length) {
    throw kino.error("unavailable", "FrameXTV no entregó un flujo de vídeo compatible para este título.");
  }

  const first = media[0];
  return {
    url: first.url,
    headers: first.headers || {},
    alternatives: media.slice(1, 8).map((m) => ({ url: m.url, headers: m.headers || {} })),
    label: "FrameXTV"
  };
}
