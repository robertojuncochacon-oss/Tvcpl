// Kino Web Search — experimental web-entry plugin for Kino API v6.
// Note: a plugin cannot create a full interactive WebView unless Kino exposes
// a supported browser-view UI. This plugin provides a safe starting link only.
const DEFAULT_URL = "https://framextv.xyz/";

function normalizeUrl(value) {
  const raw = String(value || "").trim();
  if (!raw) return DEFAULT_URL;
  const candidate = /^[a-z][a-z0-9+.-]*:\/\//i.test(raw) ? raw : "https://" + raw;
  let parsed;
  try { parsed = new URL(candidate); } catch (_) {
    throw kino.error("invalid_input", "Introduce una dirección web válida, por ejemplo https://framextv.xyz/");
  }
  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    throw kino.error("invalid_input", "Solo se permiten direcciones HTTP o HTTPS.");
  }
  return parsed.toString();
}

export async function home() {
  const configured = String(kino.config.get("startUrl") || "").trim();
  const target = normalizeUrl(configured || DEFAULT_URL);
  return [{
    id: "kino-web-start",
    title: "Kino Web · Abrir página",
    items: [{
      id: "kino-web-framextv",
      ref: target,
      title: "Abrir FrameXTV",
      kind: "web",
      overview: "Abre la página externa si tu versión de Kino admite navegación web para plugins.",
      url: target
    }]
  }];
}

export async function search(query) {
  const q = String(query && query.q || "").trim();
  if (!q) return [];
  // Treat a URL as a web destination. Search-engine queries are not silently
  // sent to a third-party provider; users can enter a full search URL instead.
  if (/^(https?:\/\/|[\w.-]+\.[a-z]{2,})(\/|\?|#|$)/i.test(q)) {
    const target = normalizeUrl(q);
    return [{
      id: "kino-web-result",
      ref: target,
      title: target,
      kind: "web",
      overview: "Destino web introducido por el usuario.",
      url: target
    }];
  }
  return [{
    id: "kino-web-search-hint",
    ref: "https://www.google.com/search?q=" + encodeURIComponent(q),
    title: "Buscar en la web: " + q,
    kind: "web",
    overview: "Abre una búsqueda web. La navegación dentro de Kino depende del soporte de navegador de la aplicación.",
    url: "https://www.google.com/search?q=" + encodeURIComponent(q)
  }];
}

export async function resolve(ref) {
  const target = normalizeUrl(ref);
  return { url: target, mime: "text/html", label: "Kino Web" };
}
