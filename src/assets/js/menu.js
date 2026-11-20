/* menu.js — menú mòbil: es tanca amb Esc, en clicar fora o en triar una opció. */
const menu = document.querySelector('.menu');
if (menu) {
  const resum = menu.querySelector('summary');
  const tanca = () => { if (menu.open) { menu.open = false; resum.focus(); } };
  const sync = () => resum.setAttribute('aria-expanded', String(menu.open));
  sync();
  menu.addEventListener('toggle', sync);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') tanca(); });
  document.addEventListener('click', (e) => { if (menu.open && !menu.contains(e.target)) menu.open = false; });
  menu.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => { menu.open = false; }));
}

/* Galeria de la portada: la franja oberta segueix el ratolí o el focus */
const casa = document.querySelector('.casa');
if (casa) {
  const obre = (li) => casa.querySelectorAll('.casa__item').forEach((x) => x.classList.toggle('is-obert', x === li));
  casa.querySelectorAll('.casa__item').forEach((li) => {
    li.addEventListener('mouseenter', () => obre(li));
    li.addEventListener('focus', () => obre(li));
    li.addEventListener('click', () => obre(li));
  });
}

/* Reel de la portada: 3 fotos de la façana. La 1a entra amb l'efecte des de baix (CSS),
   després la 2a i la 3a entren amb una fosa i un zoom lent. Es pausa si la pestanya queda amagada. */
const heroi = document.querySelector('.heroi');
const quiet = matchMedia('(prefers-reduced-motion: reduce)').matches;
if (heroi && !quiet) {
  const fotos = [...heroi.querySelectorAll('.heroi__fons')];
  const barres = [...heroi.querySelectorAll('.heroi__reel span')];
  const DURADA = [7500, 6500, 6500];
  let i = 0, t = null, restant = DURADA[0], inici = 0, pausa = false;
  if (fotos.length === 3) {
    heroi.setAttribute('data-reel', '');
    fotos[0].classList.add('es-actiu');
    const marca = () => barres.forEach((b, k) => { b.classList.toggle('fet', k < i); b.classList.remove('ara'); });
    const arrenca = (ms) => {
      marca(); void barres[i].offsetWidth; barres[i].style.setProperty('--durada', ms + 'ms'); barres[i].classList.add('ara');
      inici = performance.now(); restant = ms; t = setTimeout(seguent, ms);
    };
    const seguent = () => {
      const ant = fotos[i];
      i = (i + 1) % 3;
      fotos.forEach((f) => f.classList.remove('surt', 'torna'));
      ant.classList.remove('es-actiu'); ant.classList.add('surt');
      const nova = fotos[i];
      nova.classList.remove('es-actiu'); void nova.offsetWidth;
      if (i === 0) nova.classList.add('torna');
      nova.classList.add('es-actiu');
      setTimeout(() => ant.classList.remove('surt'), 1700);
      arrenca(DURADA[i]);
    };
    // Només es pausa quan la pestanya no es veu (el hero ocupa tota la pantalla: pausar amb el ratolí l'encallava)
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) { if (pausa) return; pausa = true; clearTimeout(t); restant -= performance.now() - inici; }
      else if (pausa) { pausa = false; inici = performance.now(); t = setTimeout(seguent, Math.max(restant, 400)); }
    });
    arrenca(DURADA[0]);
  }
}
