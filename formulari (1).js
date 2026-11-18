// formulari.js — envia qualsevol formulari [data-formulari] a /api/formulari sense recarregar.
// Sense JS, el formulari s'envia igualment i el servidor redirigeix a /enviat o /no-enviat.
const CONTACTE = 'lamoralcoop@gmail.com';

// Omple selects a partir de la URL: ?activitat=…, ?espai=…, ?tema=…
const params = new URLSearchParams(location.search);
for (const nom of ['activitat', 'espai', 'tema']) {
  const v = params.get(nom);
  if (!v) continue;
  document.querySelectorAll(`select[name="${nom}"]`).forEach((s) => {
    if ([...s.options].some((o) => o.value === v)) s.value = v;
  });
}

document.querySelectorAll('[data-formulari]').forEach((form) => {
  const estat = form.querySelector('.formulari__estat');
  const boto = form.querySelector('button[type="submit"]');
  const marca = () => { form.elements.t.value = String(Date.now()); };
  marca();
  const avisa = (text, tipus) => { estat.textContent = text; estat.dataset.tipus = tipus; };

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!form.checkValidity()) {
      const primer = form.querySelector(':invalid');
      avisa(primer?.type === 'checkbox' ? 'Cal que acceptis la política de privacitat.' : 'Revisa els camps marcats amb *.', 'error');
      form.classList.add('formulari--revisat');
      primer?.focus();
      return;
    }
    boto.disabled = true;
    avisa('Enviant…', 'info');
    try {
      const r = await fetch(form.action, {
        method: 'POST',
        headers: { Accept: 'application/json', 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(new FormData(form)),
      });
      const dades = await r.json().catch(() => ({}));
      if (r.ok) {
        form.reset(); marca(); form.classList.remove('formulari--revisat');
        avisa(dades.missatge || 'Rebut! Et respondrem aviat.', 'ok');
      } else {
        avisa(dades.missatge || `No s'ha pogut enviar. Escriu-nos a ${CONTACTE}.`, 'error');
      }
    } catch {
      avisa(`No hi ha connexió. Torna-ho a provar o escriu-nos a ${CONTACTE}.`, 'error');
    } finally { boto.disabled = false; }
  });
});
