// KinoBl — Kino API v6 catalog plugin. External directory only; no stream scraping.
const SOURCES = [
["Fly Stream","https://share.google/gmMvOn5uR4aExEUBK","Películas y series"],
["BingeBang","https://zoechip.bz/home","Películas y series"],
["Cinebros","https://cinebros.net/","Películas y series"],
["Zenox","https://zenox.lol/","Películas y series"],
["Redflix","https://redflix.one/","Películas y series"],
["Nexa","https://nexa.mov/","Películas y series"],
["Flixer","https://flixer.gd/","Películas y series"],
["Boredflix","https://boredflix.to/","Películas y series"],
["Anichi","https://anichi.to/home","Anime"],
["AnimeSalt","https://animesalt.to/","Anime"],
["AniHQ","https://anihq.org/home","Anime"],
["Mirrors","https://mirrors.st/","Anime"],
["GoStreamEast","https://gostreameast.link/","Deportes en directo"],
["STRMD","https://strmd.link/","Deportes en directo"],
["TheTVApp","https://thetvapp.st/","TV en directo"],
["AuraSports","https://aurasports.xyz/","Deportes en directo"],
["DamiTV","https://damitv.st/","TV en directo"],
["Documentary Mania","https://www.documentarymania.com/","Documentales"],
["Documentary Tube","https://www.documentarytube.com/","Documentales"],
["Footballia","https://footballia.net/","Fútbol histórico"],
["MLB Live","https://mlblive.net/","Deportes"],
["Time Soccer TV","https://timesoccertv.com/","Guías de fútbol"],
["FMHY Video Tools","https://fmhy.net/video-tools/#video-download","Herramientas de vídeo"],
["FMHY Downloading","https://fmhy.net/downloading","Herramientas de descarga"],
["LeonFlix","https://leonflix.net/","Herramientas multimedia"],
["GNU Wget","https://www.gnu.org/software/wget/","Herramientas de descarga"],
["Orionoid","https://orionoid.com/","Herramientas multimedia"],
["SANET","https://sanet.st/full/","Recursos web"],
["Hatt (GitHub)","https://github.com/FrenchGithubUser/Hatt","Herramientas multimedia"],
["WCO Stream","https://www.wcostream.org/","Animación"],
["KissCartoon","https://kisscartoon.nz/","Animación"],
["KimCartoon","https://kimcartoon.li/","Animación"],
["Internet Archive","https://archive.org/","Archivo digital y dominio público"]
].map(([title,url,category],i)=>({
 id:"kinobl-"+i,
 ref:"source|"+i,
 title,
 kind:"source",
 overview:category+" · Fuente externa; disponibilidad y reproducción dependen del sitio.",
 url,
 category
}));

export async function home() {
 const categories=[...new Set(SOURCES.map(source=>source.category))];
 return categories.map((category,index)=>({
  id:"kinobl-category-"+index,
  title:category,
  items:SOURCES.filter(source=>source.category===category)
 }));
}

export async function search(query) {
 const raw=typeof query==="string" ? query : (query && (query.q || query.query)) || "";
 const q=String(raw).trim().toLocaleLowerCase();
 if(!q) return SOURCES.slice(0,40);
 return SOURCES.filter(source =>
  source.title.toLocaleLowerCase().includes(q) ||
  source.category.toLocaleLowerCase().includes(q) ||
  source.overview.toLocaleLowerCase().includes(q) ||
  source.url.toLocaleLowerCase().includes(q)
 ).slice(0,40);
}
