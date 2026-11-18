// agenda.js — filtre per tipus d'activitat a l'agenda.
const filtre = document.querySelector('.filtre');
const llista = document.querySelector('[data-agenda]');
if (filtre && llista) {
  filtre.hidden = false;
  filtre.addEventListener('click', (e) => {
    const b = e.target.closest('button[data-filtre]');
    if (!b) return;
    const cat = b.dataset.filtre;
    filtre.querySelectorAll('button').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    llista.querySelectorAll('.act').forEach((li) => { li.hidden = cat !== 'totes' && li.dataset.cat !== cat; });
  });
}
