import { useEffect, useMemo, useState } from 'react';

const API = 'https://api.themoviedb.org/3';
const IMG = 'https://image.tmdb.org/t/p/w500';
const BACKDROP = 'https://image.tmdb.org/t/p/w1280';
function tmdbUrl(path, key) {
  const isReadToken = key.startsWith('eyJ') || key.split('.').length === 3;
  if (isReadToken) return API + path;
  return API + path + (path.includes('?') ? '&' : '?') + 'api_key=' + encodeURIComponent(key);
}
function tmdbHeaders(key) {
  const isReadToken = key.startsWith('eyJ') || key.split('.').length === 3;
  return isReadToken ? { accept: 'application/json', Authorization: `Bearer ${key}` } : { accept: 'application/json' };
}
const SOURCES = [
  { name: 'TBCPL', url: 'https://tbcpl.lol/', note: 'Catálogo externo' },
  { name: 'IMDb', url: 'https://www.imdb.com/', note: 'Información y valoraciones' },
  { name: 'BestFreeStreaming', url: 'https://bestfreestreaming.org/', note: 'Fuente externa' },
];

function readKey() {
  try { return localStorage.getItem('tvcpl_tmdb_key') || ''; } catch { return ''; }
}
function mediaLabel(item) { return item.media_type === 'tv' || item.first_air_date ? 'Serie' : 'Película'; }
function year(item) { return (item.release_date || item.first_air_date || '').slice(0, 4); }

export default function App() {
  const [apiKey, setApiKey] = useState(readKey);
  const [keyDraft, setKeyDraft] = useState(readKey);
  const [showSettings, setShowSettings] = useState(!readKey());
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('trending');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState(null);
  const [details, setDetails] = useState(null);
  const [favorites, setFavorites] = useState(() => { try { return JSON.parse(localStorage.getItem('tvcpl_favs') || '[]'); } catch { return []; } });
  const [player, setPlayer] = useState(null);
  const [season, setSeason] = useState('1');
  const [episode, setEpisode] = useState('1');
  const [playerUrl, setPlayerUrl] = useState('');

  useEffect(() => {
    try { localStorage.setItem('tvcpl_favs', JSON.stringify(favorites)); } catch {}
  }, [favorites]);

  useEffect(() => {
    if (!apiKey) { setItems([]); return; }
    const controller = new AbortController();
    async function load() {
      setLoading(true); setError('');
      try {
        let endpoint;
        if (query.trim()) endpoint = `/search/multi?query=${encodeURIComponent(query.trim())}&include_adult=false&language=es-ES`;
        else if (category === 'movies') endpoint = '/trending/movie/week?language=es-ES';
        else if (category === 'series') endpoint = '/trending/tv/week?language=es-ES';
        else if (category === 'anime') endpoint = '/discover/tv?with_genres=16&with_original_language=ja&sort_by=popularity.desc&language=es-ES';
        else if (category === 'favorites') { setItems(favorites); setLoading(false); return; }
        else endpoint = '/trending/all/week?language=es-ES';
        const response = await fetch(tmdbUrl(endpoint, apiKey), { headers: tmdbHeaders(apiKey), signal: controller.signal });
        if (!response.ok) throw new Error(response.status === 401 ? 'TMDB rechazó la clave. Revísala en Ajustes.' : `TMDB respondió con error ${response.status}.`);
        const data = await response.json();
        setItems((data.results || []).filter(x => x.media_type !== 'person' && (x.poster_path || x.backdrop_path)).map(x => ({...x, media_type: x.media_type || (x.first_air_date ? 'tv' : 'movie')})));
      } catch (e) { if (e.name !== 'AbortError') { setError(e.message || 'No se pudo cargar el catálogo.'); setItems([]); } }
      finally { if (!controller.signal.aborted) setLoading(false); }
    }
    load();
    return () => controller.abort();
  }, [apiKey, category, query, favorites]);

  useEffect(() => {
    if (!selected || !apiKey) { setDetails(null); return; }
    const kind = selected.media_type === 'tv' ? 'tv' : 'movie';
    fetch(tmdbUrl(`/${kind}/${selected.id}?language=es-ES`, apiKey), { headers: tmdbHeaders(apiKey) })
      .then(r => { if (!r.ok) throw new Error('No se pudo cargar la ficha'); return r.json(); })
      .then(setDetails).catch(() => setDetails(selected));
  }, [selected, apiKey]);

  const hero = useMemo(() => items.find(x => x.backdrop_path) || items[0], [items]);
  function saveKey(e) {
    e.preventDefault();
    const value = keyDraft.trim();
    setApiKey(value);
    try { if (value) localStorage.setItem('tvcpl_tmdb_key', value); else localStorage.removeItem('tvcpl_tmdb_key'); } catch {}
    setShowSettings(false);
  }
  function toggleFavorite(item) {
    setFavorites(old => old.some(x => x.id === item.id && x.media_type === item.media_type)
      ? old.filter(x => !(x.id === item.id && x.media_type === item.media_type))
      : [{...item}, ...old]);
  }
  function openPlayer(item) {
    setPlayer(item);
    setPlayerUrl(item.media_type === 'tv'
      ? `https://framextv.xyz/embed/${item.id}/${Math.max(1, Number(season) || 1)}/${Math.max(1, Number(episode) || 1)}?autoplay=1&muted=0`
      : `https://framextv.xyz/embed/${item.id}?autoplay=1&muted=0`);
  }
  function updateEpisode() {
    if (player) setPlayerUrl(`https://framextv.xyz/embed/${player.id}/${Math.max(1, Number(season) || 1)}/${Math.max(1, Number(episode) || 1)}?autoplay=1&muted=0`);
  }
  const isFav = item => favorites.some(x => x.id === item.id && x.media_type === item.media_type);

  return <div className="app-shell">
    <header className="topbar">
      <a className="brand" href="#" onClick={() => { setCategory('trending'); setQuery(''); }}><span className="brand-mark">T</span><span>TVCPL<span className="brand-dot">.</span><small>CINE · SERIES · ANIME</small></span></a>
      <nav className="main-nav">
        {[['trending','Inicio'],['movies','Películas'],['series','Series'],['anime','Anime'],['favorites','Mi lista']].map(([id,label]) =>
          <button key={id} className={category === id && !query ? 'nav-link active' : 'nav-link'} onClick={() => { setCategory(id); setQuery(''); }}>{label}</button>)}
      </nav>
      <div className="top-actions"><label className="search-box"><span>⌕</span><input aria-label="Buscar" placeholder="Buscar títulos..." value={query} onChange={e => {setQuery(e.target.value); if(e.target.value) setCategory('trending');}} /></label><button className="icon-btn" title="Ajustes" onClick={() => {setKeyDraft(apiKey); setShowSettings(true);}}>⚙</button></div>
    </header>

    {!apiKey && <section className="welcome"><div className="eyebrow">TU UNIVERSO DE ENTRETENIMIENTO</div><h1>Todo lo que quieres ver.<br/><em>En un solo lugar.</em></h1><p>Explora películas, series y anime con fichas, pósteres, búsqueda y tu lista personal.</p><button className="primary-btn" onClick={() => setShowSettings(true)}>Configurar catálogo <span>→</span></button><div className="welcome-art"><div className="orb orb-one"></div><div className="orb orb-two"></div><div className="poster-stack"><div className="poster poster-a">CINE</div><div className="poster poster-b">SERIES</div><div className="poster poster-c">ANIME</div></div></div></section>}

    {apiKey && hero && !query && category !== 'favorites' && <section className="hero" style={{backgroundImage: hero.backdrop_path ? `linear-gradient(90deg, #090b12 0%, rgba(9,11,18,.88) 35%, rgba(9,11,18,.2) 100%), linear-gradient(0deg,#090b12 0%,transparent 55%), url(${BACKDROP + hero.backdrop_path})` : undefined}}>
      <div className="hero-copy"><div className="eyebrow"><span className="live-dot"></span> TENDENCIAS DE LA SEMANA</div><h1>{hero.title || hero.name}</h1><div className="hero-meta"><span className="rating">★ {(hero.vote_average || 0).toFixed(1)}</span><span>{year(hero) || 'Estreno'}</span><span>{mediaLabel(hero)}</span></div><p>{hero.overview || 'Descubre los títulos que están dando de qué hablar.'}</p><div className="hero-buttons"><button className="primary-btn" onClick={() => setSelected(hero)}>Ver detalles <span>→</span></button><button className="ghost-btn" onClick={() => toggleFavorite(hero)}>{isFav(hero) ? '✓ En mi lista' : '+ Mi lista'}</button></div></div>
      <div className="hero-label">TVCPL <span>ORIGINAL DISCOVERY</span></div>
    </section>}

    <main className="content">
      <div className="section-heading"><div><div className="eyebrow">{query ? 'RESULTADOS DE BÚSQUEDA' : category === 'favorites' ? 'TU COLECCIÓN' : 'SELECCIÓN PARA TI'}</div><h2>{query ? `Buscar: “${query}”` : ({trending:'En tendencia',movies:'Películas populares',series:'Series populares',anime:'Anime',favorites:'Mi lista'})[category]}</h2></div><span className="result-count">{items.length} títulos</span></div>
      {error && <div className="notice error">{error} <button onClick={() => setShowSettings(true)}>Abrir ajustes</button></div>}
      {loading && <div className="loading-grid">{Array.from({length:8},(_,i)=><div className="skeleton" key={i}></div>)}</div>}
      {!loading && apiKey && !error && items.length === 0 && <div className="empty-state"><span>✦</span><h3>{category === 'favorites' ? 'Tu lista empieza aquí' : 'No encontramos títulos'}</h3><p>{category === 'favorites' ? 'Guarda películas y series con el botón + Mi lista.' : 'Prueba otra búsqueda o categoría.'}</p></div>}
      {!loading && <div className="movie-grid">{items.map(item => <article className="movie-card" key={`${item.media_type}-${item.id}`}>
        <button className="poster-button" onClick={() => setSelected(item)} aria-label={`Detalles de ${item.title || item.name}`}>
          {item.poster_path ? <img src={IMG + item.poster_path} alt={item.title || item.name} loading="lazy"/> : <div className="poster-fallback">TVCPL</div>}
          <span className="card-rating">★ {(item.vote_average || 0).toFixed(1)}</span><span className="poster-overlay">Ver ficha ↗</span>
        </button>
        <div className="card-info"><button className="card-title" onClick={() => setSelected(item)}>{item.title || item.name}</button><div className="card-meta"><span>{year(item) || 'Sin fecha'}</span><span>{mediaLabel(item)}</span><button className={isFav(item) ? 'fav-mini saved' : 'fav-mini'} onClick={() => toggleFavorite(item)} title="Guardar en mi lista">{isFav(item) ? '♥' : '♡'}</button></div></div>
      </article>)}</div>}
      {!apiKey && <div className="setup-callout"><strong>Falta conectar TMDB</strong><p>Configura tu clave API de TMDB para cargar pósteres, búsquedas y fichas.</p><button className="primary-btn" onClick={() => setShowSettings(true)}>Configurar ahora →</button></div>}
    </main>

    <section className="sources"><div><div className="eyebrow">TUS FUENTES</div><h2>Explora también</h2></div><div className="source-list">{SOURCES.map(s=><a className="source-card" key={s.name} href={s.url} target="_blank" rel="noreferrer"><span className="source-icon">↗</span><strong>{s.name}</strong><small>{s.note}</small></a>)}</div><p className="source-note">Los enlaces externos pertenecen a sus respectivos sitios. TVCPL no aloja ni garantiza la disponibilidad de contenido de terceros.</p></section>
    <footer><a className="footer-brand" href="#">TVCPL<span>.</span></a><span>Tu catálogo personal de entretenimiento.</span><span>Datos de películas: TMDB</span></footer>

    {showSettings && <div className="modal-backdrop" role="presentation" onMouseDown={e => {if(e.target === e.currentTarget) setShowSettings(false);}}><section className="modal settings-modal" role="dialog" aria-modal="true" aria-labelledby="settings-title"><button className="close-btn" onClick={() => setShowSettings(false)}>×</button><div className="eyebrow">CONFIGURACIÓN</div><h2 id="settings-title">Conecta el catálogo</h2><p>Introduce tu clave de API de TMDB. Se guarda solo en este navegador y no se incluye en el repositorio.</p><form onSubmit={saveKey}><label className="field-label" htmlFor="tmdb-key">TMDB API Read Access Token</label><input id="tmdb-key" className="text-field" type="password" autoComplete="off" value={keyDraft} onChange={e => setKeyDraft(e.target.value)} placeholder="Pega aquí tu token de TMDB"/><div className="settings-actions"><a href="https://www.themoviedb.org/settings/api" target="_blank" rel="noreferrer">Obtener clave TMDB ↗</a><button className="primary-btn" type="submit">Guardar y cargar</button></div></form><p className="fine-print">Por seguridad, no pegues claves en código público. La API de TMDB está sujeta a sus términos de uso.</p></section></div>}

    {selected && <div className="modal-backdrop" role="presentation" onMouseDown={e => {if(e.target === e.currentTarget) setSelected(null);}}><section className="modal detail-modal" role="dialog" aria-modal="true"><button className="close-btn" onClick={() => setSelected(null)}>×</button><div className="detail-backdrop" style={{backgroundImage: (details?.backdrop_path || selected.backdrop_path) ? `linear-gradient(0deg,#11131c,transparent),url(${BACKDROP + (details?.backdrop_path || selected.backdrop_path)})` : undefined}}></div><div className="detail-body"><div className="eyebrow">{mediaLabel(selected)} · {year(details || selected) || 'Fecha no disponible'}</div><h2>{details?.title || details?.name || selected.title || selected.name}</h2><div className="hero-meta"><span className="rating">★ {(selected.vote_average || 0).toFixed(1)} / 10</span><span>{details?.runtime ? `${details.runtime} min` : details?.number_of_seasons ? `${details.number_of_seasons} temporadas` : ''}</span></div><p>{details?.overview || selected.overview || 'No hay sinopsis disponible en español.'}</p>{details?.genres?.length > 0 && <div className="genre-list">{details.genres.map(g=><span key={g.id}>{g.name}</span>)}</div>}<div className="detail-actions"><button className="primary-btn" onClick={() => {setSelected(null); openPlayer(selected);}}>▶ Abrir reproductor</button><button className="ghost-btn" onClick={() => toggleFavorite(selected)}>{isFav(selected) ? '♥ En mi lista' : '♡ Añadir a mi lista'}</button><a className="ghost-btn link-button" href={`https://www.imdb.com/find/?q=${encodeURIComponent(selected.title || selected.name || '')}`} target="_blank" rel="noreferrer">Buscar en IMDb ↗</a></div><div className="provider-note">El reproductor usa un proveedor externo y puede no tener disponible todos los títulos. Los identificadores de TMDB no garantizan disponibilidad de reproducción.</div></div></section></div>}

    {player && <div className="modal-backdrop player-backdrop" role="presentation"><section className="modal player-modal" role="dialog" aria-modal="true"><div className="player-header"><div><div className="eyebrow">REPRODUCTOR EXTERNO</div><h2>{player.title || player.name}</h2></div><button className="close-btn inline-close" onClick={() => {setPlayer(null);setPlayerUrl('');}}>×</button></div>{player.media_type === 'tv' && <div className="episode-controls"><label>Temporada <input type="number" min="1" max="99" value={season} onChange={e=>setSeason(e.target.value)}/></label><label>Episodio <input type="number" min="1" max="999" value={episode} onChange={e=>setEpisode(e.target.value)}/></label><button className="ghost-btn" onClick={updateEpisode}>Cargar episodio</button></div>}<div className="video-frame"><iframe key={playerUrl} src={playerUrl} title={`Reproductor para ${player.title || player.name}`} allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowFullScreen referrerPolicy="strict-origin-when-cross-origin"></iframe></div><p className="provider-note">Contenido servido por un tercero. Si el vídeo no carga, puede que el proveedor esté caído, bloquee la reproducción integrada o no disponga de ese título. No introduzcas datos personales en páginas externas.</p></section></div>}
  </div>;
}
