/* build.mjs — genera la web estàtica de La Moral a dist/.
   Ús: node build.mjs        (sense dependències)
   Variables d'entorn:
     INDEXAR=1     permet que els cercadors indexin la web
     SITE_URL=...  URL pública (Open Graph i canonical)
     FINAL=1       amaga les marques ⚑ de contingut pendent */

import { readFileSync, writeFileSync, mkdirSync, readdirSync, cpSync, rmSync, statSync } from 'node:fs';
import { join, basename } from 'node:path';

const SRC = 'src';
const OUT = 'dist';
const INDEXAR = process.env.INDEXAR === '1';
const FINAL = process.env.FINAL === '1';
const SITE_URL = (process.env.SITE_URL || 'https://lamoral.nexsocial.org').replace(/\/$/, '');

const llegeix = (p) => readFileSync(p, 'utf8');
const partial = (n) => llegeix(join(SRC, 'partials', `${n}.html`));
const agenda = JSON.parse(llegeix('data/activitats.json'));
const espais = JSON.parse(llegeix('data/espais.json'));
const versio = Date.now().toString(36);

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const vf = (txt) => `<span class="vf">${esc(txt)}</span>`;

/* Data d'avui a Europa/Madrid (AAAA-MM-DD). */
const avui = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Madrid' }).format(new Date());
const MESOS = ['gen.', 'febr.', 'març', 'abr.', 'maig', 'juny', 'jul.', 'ag.', 'set.', 'oct.', 'nov.', 'des.'];
const DIES = ['diumenge', 'dilluns', 'dimarts', 'dimecres', 'dijous', 'divendres', 'dissabte'];
const parts = (s) => { const [y, m, d] = s.split('-').map(Number); return { y, m, d, dw: new Date(Date.UTC(y, m - 1, d)).getUTCDay() }; };
const dataLlarga = (s) => { const p = parts(s); return `${DIES[p.dw]} ${p.d} ${MESOS[p.m - 1].replace('.', '')}`; };

const ordenades = [...agenda.activitats].sort((a, b) => a.data.localeCompare(b.data));
const properes = ordenades.filter((a) => a.data >= avui);
const anteriors = ordenades.filter((a) => a.data < avui).reverse();

/* <picture> amb webp + jpg; `petita` = sufix d'amplada si n'hi ha una versió reduïda. */
const MIDES = {
  'facana-detall': [1400, 1050, 800], 'facana-bandera': [1260, 946, 800], 'botiga-1934': [1400, 869, 800],
  'facana-sol': [700, 513], 'botiga-sepia': [700, 513], 'teatre-antic': [992, 727], 'taula-120': [700, 525],
  'junta-2024': [700, 482], 'moneda-social': [700, 978],
  'facana-panoramica': [1909, 502], 'cartell': [1100, 367, 560],
  'sala-actes-buida': [811, 823], 'facana-1929': [834, 812], 'sala-polivalent': [786, 838], 'sala-actes-cadires': [817, 811], 'sala-estar': [1100, 793],
  'facana-1926': [800, 1368], 'cafe-antic': [724, 435], 'carnisseria-antiga': [800, 600], 'facana-bandera-cat': [595, 805], 'facana-sol-2': [640, 480],
};
function foto(nom, alt, { sizes = '100vw', classe = '', lazy = true, prioritat = false } = {}) {
  const [w, h, petita] = MIDES[nom] || [800, 600];
  const set = (ext) => (petita ? `/assets/img/${nom}-${petita}.${ext} ${petita}w, /assets/img/${nom}.${ext} ${w}w` : `/assets/img/${nom}.${ext} ${w}w`);
  return `<picture${classe ? ` class="${classe}"` : ''}><source type="image/webp" srcset="${set('webp')}" sizes="${sizes}"><img src="/assets/img/${nom}${petita ? `-${petita}` : ''}.jpg" srcset="${set('jpg')}" sizes="${sizes}" alt="${esc(alt)}" width="${w}" height="${h}"${lazy ? ' loading="lazy"' : ''}${prioritat ? ' fetchpriority="high"' : ''} decoding="async"></picture>`;
}

function filaAgenda(a, { passada = false } = {}) {
  const p = parts(a.data);
  const titol = a.exemple ? `${vf('Exemple')} ${esc(a.titol)}` : esc(a.titol);
  const accio = passada ? '' : a.inscripcio
    ? `<a class="boto boto--linia boto--petit" href="/agenda?activitat=${esc(a.id)}#inscripcio">Inscriu-t'hi</a>`
    : a.nomesSocis ? `<span class="act__nota">Només socis</span>` : `<span class="act__nota">Entrada lliure</span>`;
  return `<li class="act" id="${esc(a.id)}" data-cat="${esc(a.cat)}">
  <time class="act__data" datetime="${a.data}"><b>${p.d}</b><span>${MESOS[p.m - 1]}</span>${passada ? `<span>${p.y}</span>` : ''}</time>
  <div class="act__cos">
    <p class="act__cat">${esc(a.cat)}</p>
    <h3>${titol}</h3>
    <p class="act__meta meta"><span>${esc(dataLlarga(a.data))}</span><span>${esc(a.hora)} h</span><span>${esc(a.lloc)}</span></p>
    ${a.text ? `<p class="act__text">${esc(a.text)}</p>` : ''}
  </div>
  <div class="act__peu">${passada ? '' : `<p class="act__preu">Socis <b>${esc(a.preuSoci)}</b><br>General <b>${esc(a.preu)}</b></p>`}${accio}</div>
</li>`;
}
const llista = (arr, o) => arr.length ? arr.map((a) => filaAgenda(a, o)).join('\n') : `<li class="act act--buida"><p>Ara mateix no hi ha activitats publicades. Segueix-nos a <a href="https://www.instagram.com/cooperativalamoral/" rel="noopener">Instagram</a> per estar al dia.</p></li>`;

function propersInici() {
  const tres = properes.slice(0, 3);
  if (!tres.length) return `<p class="buit">Aviat publicarem les properes activitats.</p>`;
  return `<ol class="propers">${tres.map((a) => { const p = parts(a.data); return `<li><a href="/agenda#${esc(a.id)}"><time datetime="${a.data}"><b>${p.d}</b> ${MESOS[p.m - 1]}</time><span class="propers__t">${a.exemple ? vf('Exemple') + ' ' : ''}${esc(a.titol)}</span><span class="propers__m meta"><span>${esc(a.hora)} h</span><span>${esc(a.lloc)}</span></span></a></li>`; }).join('')}</ol>`;
}

const habitualsHTML = () => agenda.habituals.map((h) => `<li class="hab">
  <h3>${esc(h.titol)}</h3>
  <p class="hab__quan">${esc(h.quan)}</p>
  <p>${esc(h.text)}</p>
  ${h.verificar ? `<p class="hab__vf">${vf(h.verificar)}</p>` : ''}
</li>`).join('\n');

const filtreHTML = () => {
  const cats = [...new Set(properes.map((a) => a.cat))];
  if (cats.length < 2) return '';
  return `<div class="filtre" role="group" aria-label="Filtra per tipus d'activitat" hidden><button type="button" data-filtre="totes" aria-pressed="true">Totes</button>${cats.map((c) => `<button type="button" data-filtre="${esc(c)}" aria-pressed="false">${esc(c)}</button>`).join('')}</div>`;
};
const opcionsActivitats = () => properes.filter((a) => a.inscripcio).map((a) => `<option value="${esc(a.id)}">${esc(dataLlarga(a.data))}, ${esc(a.titol)}</option>`).join('');

function espaisHTML() {
  return espais.espais.map((e, n) => {
    const dades = [
      ['Superfície', `${e.m2} m²`],
      ['Aforament', e.aforament ? esc(e.aforament) : vf('persones')],
      ...(e.planta ? [['Accés', esc(e.planta)]] : []),
    ].map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join('');
    const imatge = e.foto
      ? `<figure class="espai__foto arc">${foto(e.foto, e.alt, { sizes: '(min-width: 960px) 50vw, 92vw', lazy: n > 0 })}</figure>`
      : `<figure class="espai__foto arc arc--buit"><span>${vf('Foto de la ' + e.nom.toLowerCase())}</span></figure>`;
    const antiga = e.fotoAntiga ? `<figure class="espai__antiga">${foto(e.fotoAntiga, e.altAntiga, { sizes: '(min-width: 960px) 22vw, 60vw' })}<figcaption>La mateixa sala, fa dècades. Foto: L'Abans.</figcaption></figure>` : '';
    return `<section class="espai${n % 2 ? ' espai--inv' : ''}" id="${e.id}" aria-labelledby="t-${e.id}">
  ${imatge}
  <div class="espai__text">
    <p class="etiqueta">${esc(e.subtitol)}</p>
    <h2 id="t-${e.id}">${esc(e.nom)}</h2>
    <dl class="fitxa">${dades}</dl>
    ${e.text.map((p) => `<p>${esc(p)}</p>`).join('')}
    <ul class="xips">${e.usos.map((u) => `<li>${esc(u)}</li>`).join('')}</ul>
    <p><a class="boto" href="/espais?espai=${e.id}#reserva">Sol·licita aquest espai</a></p>
    ${antiga}
  </div>
</section>`;
  }).join('\n');
}
const opcionsEspais = () => espais.espais.map((e) => `<option value="${esc(e.id)}">${esc(e.nom)}</option>`).join('') + `<option value="no-ho-se">No ho sé, aconsella'm</option>`;
const condicionsHTML = () => espais.condicions.map((c) => `<li>${esc(c)}</li>`).join('');


const GALERIA = [
  ['sala-actes-cadires', "Sala d'actes", "140 butaques mirant l'escenari", "La sala d'actes preparada per a una funció, amb les cadires blaves en files"],
  ['sala-estar', 'Racó d\'estar', 'Butaques, llum càlida i l\'escala de fusta', 'Racó d\'estar amb butaques blaves, un llum de taula i una escala de fusta granat'],
  ['facana-1929', 'La façana', 'Josep Alemany i Juvé, de 1926 a 1929', "La façana rosada de La Moral amb els arcs, l'esgrafiat i la data 1929"],
  ['sala-polivalent', 'Sala polivalent', '123 m² per a tallers i assajos', 'Sala diàfana amb parquet i bigues granat'],
  ['sala-actes-buida', 'Pista de ball', 'La sala buida, a punt per ballar', "La sala d'actes buida amb el terra de parquet i el teló vermell de l'escenari"],
];
function galeriaHTML() {
  return `<ul class="casa">${GALERIA.map(([f, t, d, alt], i) => `<li class="casa__item${i === 0 ? ' is-obert' : ''}" tabindex="0">
    ${foto(f, alt, { sizes: '(min-width: 760px) 50vw, 82vw' })}
    <div class="casa__text"><p class="casa__t">${esc(t)}</p><p class="casa__d">${esc(d)}</p></div>
  </li>`).join('')}</ul>`;
}

const MEMORIA = [
  ['facana-1926', 'La façana acabada de construir, amb el tendal de la Cooperativa Obrera La Moral sobre la botiga.', 'alta'],
  ['cafe-antic', 'El cafè de la cooperativa: taules de marbre, el taulell i les ampolles al fons.', ''],
  ['carnisseria-antiga', 'La carnisseria de la botiga, una de les seccions més concorregudes.', ''],
  ['teatre-antic', "La sala d'actes amb les cadires de fusta i l'escenari amb l'escut de l'entitat.", 'ampla'],
  ['botiga-1934', 'La botiga de comestibles el 1934. Foto: Nyssen / Museu de Badalona, fons L\'Abans.', 'full'],
];
function memoriaHTML() {
  return `<ul class="memoria-galeria">${MEMORIA.map(([f, txt, cls]) => `<li class="mem${cls ? ' mem--' + cls : ''}"><figure>${foto(f, txt, { sizes: '(min-width: 960px) 40vw, 92vw' })}<figcaption>${esc(txt)}</figcaption></figure></li>`).join('')}</ul>`;
}

const nav = [
  ['inici', '/', 'Inici'],
  ['historia', '/historia', 'Història'],
  ['qui-som', '/qui-som', 'Qui som'],
  ['agenda', '/agenda', 'Agenda'],
  ['espais', '/espais', 'Espais'],
  ['raco-del-soci', '/raco-del-soci', 'Racó del soci'],
  ['contacte', '/contacte', 'Contacte'],
];
const navHTML = (actiu) => nav.map(([id, href, txt]) => `<li><a href="${href}"${id === actiu ? ' aria-current="page"' : ''}${id === 'raco-del-soci' ? ' class="nav__soci"' : ''}>${txt}</a></li>`).join('');

const camps = `<input type="text" name="web" class="trampa" tabindex="-1" autocomplete="off" aria-hidden="true"><input type="hidden" name="t" value="">`;
const consentiment = `<label class="chk"><input type="checkbox" name="consentiment" value="si" required="required"><span>He llegit la <a href="/privacitat">política de privacitat</a> i accepto que La Moral faci servir aquestes dades només per respondre'm. *</span></label>`;
const estat = `<p class="formulari__estat" role="status" aria-live="polite"></p>`;

function render(fitxer) {
  let html = llegeix(fitxer);
  const m = html.match(/^<!--meta\s+(\{[\s\S]*?\})\s*-->\s*/);
  if (!m) throw new Error(`Falta el bloc <!--meta {...} --> a ${fitxer}`);
  const meta = JSON.parse(m[1]);
  html = html.slice(m[0].length);

  const titol = meta.title ? `${meta.title} | Cooperativa La Moral` : 'Cooperativa La Moral · Ateneu i centre cultural de Badalona des de 1904';
  const ruta = meta.path ?? `/${basename(fitxer, '.html')}`;
  const head = partial('head')
    .replaceAll('{{title}}', esc(titol))
    .replaceAll('{{desc}}', esc(meta.desc || ''))
    .replaceAll('{{url}}', SITE_URL + ruta)
    .replaceAll('{{site}}', SITE_URL)
    .replaceAll('{{robots}}', INDEXAR ? 'index, follow' : 'noindex, nofollow')
    .replaceAll('{{v}}', versio);

  const js = (n) => `<script type="module" src="/assets/js/${n}.js?v=${versio}"></script>`;
  const subs = {
    '{{header}}': partial('header').replaceAll('{{nav}}', navHTML(meta.nav)),
    '{{footer}}': partial('footer').replaceAll('{{any}}', avui.slice(0, 4)),
    '{{agenda:inici}}': propersInici(),
    '{{agenda:properes}}': llista(properes),
    '{{agenda:anteriors}}': llista(anteriors, { passada: true }),
    '{{agenda:habituals}}': habitualsHTML(),
    '{{agenda:filtre}}': filtreHTML(),
    '{{agenda:opcions}}': opcionsActivitats(),
    '{{espais}}': espaisHTML(),
    '{{galeria:casa}}': galeriaHTML(),
    '{{espais:opcions}}': opcionsEspais(),
    '{{espais:condicions}}': condicionsHTML(),
    '{{form:camps}}': camps,
    '{{form:consentiment}}': consentiment,
    '{{form:estat}}': estat,
    '{{foto:facana-detall}}': foto('facana-detall', "La façana de La Moral, amb l'esgrafiat «Cooperativa Obrera de Consumo La Moral» entre els arcs", { sizes: '(min-width: 960px) 52vw, 100vw', lazy: false, prioritat: true }),
    '{{foto:heroi-fons}}': foto('facana-panoramica', '', { sizes: '100vw', classe: 'heroi__fons', lazy: false, prioritat: true }),
    '{{foto:heroi-2}}': foto('facana-1929', '', { sizes: '100vw', classe: 'heroi__fons heroi__fons--2', lazy: false }),
    '{{foto:heroi-3}}': foto('facana-detall', '', { sizes: '100vw', classe: 'heroi__fons heroi__fons--3', lazy: false }),
    '{{memoria}}': memoriaHTML(),
    '{{foto:cartell}}': foto('cartell', 'Societat Cooperativa de Consum La Moral', { sizes: '(min-width: 760px) 560px, 86vw', classe: 'heroi__cartell', lazy: false }),
    '{{foto:facana-bandera}}': foto('facana-bandera', 'La façana de Güell i Ferrer, 86, amb la bandera de la cooperació i la pancarta dels 120 anys', { sizes: '(min-width: 960px) 50vw, 100vw' }),
    '{{foto:botiga-1934}}': foto('botiga-1934', "L'interior de la botiga de la cooperativa el 1934, amb prestatges plens i sacs de gra al llarg del taulell", { sizes: '100vw' }),
    '{{foto:botiga-sepia}}': foto('botiga-sepia', 'La botiga de la cooperativa vista des del fons, amb els taulells i les finestres', { sizes: '(min-width: 960px) 40vw, 92vw' }),
    '{{foto:teatre-antic}}': foto('teatre-antic', "La sala d'actes antiga amb les cadires de fusta mirant l'escenari", { sizes: '(min-width: 960px) 40vw, 92vw' }),
    '{{foto:taula-120}}': foto('taula-120', "Taula rodona dels 120 anys a l'escenari de la sala d'actes, amb la bandera de la cooperació al fons", { sizes: '(min-width: 960px) 45vw, 92vw' }),
    '{{foto:junta-2024}}': foto('junta-2024', "Membres de la junta i de l'equip impulsor de La Moral a la sala de reunions", { sizes: '(min-width: 960px) 45vw, 92vw' }),
    '{{foto:moneda-social}}': foto('moneda-social', "Paper moneda de la Unió de Cooperadors de Badalona i fitxes de consum de la Cooperativa La Moral", { sizes: '(min-width: 960px) 30vw, 70vw' }),
    '{{foto:facana-sol}}': foto('facana-sol', "La façana el 2024, amb les dates 1926 i 1929 a l'esgrafiat i la pancarta dels 120 anys", { sizes: '(min-width: 960px) 40vw, 92vw' }),
    '{{js:menu}}': js('menu'),
    '{{js:formulari}}': js('formulari'),
    '{{js:agenda}}': js('agenda'),
  };
  html = html.replace('{{head}}', head);
  for (const [k, v] of Object.entries(subs)) html = html.replaceAll(k, v);
  if (!FINAL) html = html.replace('<body', '<body data-marques');
  const resta = html.match(/\{\{[^}]+\}\}/);
  if (resta) throw new Error(`Marcador sense substituir ${resta[0]} a ${fitxer}`);
  return html;
}

rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });
cpSync(join(SRC, 'assets'), join(OUT, 'assets'), { recursive: true });
try { cpSync(join(SRC, 'docs'), join(OUT, 'docs'), { recursive: true }); } catch {}
for (const f of ['favicon.svg', 'favicon.ico', 'favicon-32.png', 'apple-touch-icon.png', 'icon-512.png']) { try { statSync(join(SRC, f)); cpSync(join(SRC, f), join(OUT, f)); } catch {} }

const pagines = readdirSync(join(SRC, 'pages')).filter((f) => f.endsWith('.html'));
for (const p of pagines) writeFileSync(join(OUT, p), render(join(SRC, 'pages', p)));
writeFileSync(join(OUT, 'robots.txt'), INDEXAR ? `User-agent: *\nAllow: /\nSitemap: ${SITE_URL}/sitemap.xml\n` : `User-agent: *\nDisallow: /\n`);
writeFileSync(join(OUT, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${nav.map(([, h]) => `  <url><loc>${SITE_URL}${h}</loc></url>`).join('\n')}\n</urlset>\n`);

console.log(`✓ ${pagines.length} pàgines a ${OUT}/ · ${properes.length} activitats properes, ${anteriors.length} anteriors · ${INDEXAR ? 'indexable' : 'NO indexable'} · ${FINAL ? 'sense marques' : 'amb marques ⚑'}`);
