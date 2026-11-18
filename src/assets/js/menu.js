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
