// Formularis de la web (contacte, inscripció, reserva, alta de soci, proposta)
// → correu a la bústia de La Moral via Gmail (SMTP). No es desa res.
// Variables d'entorn a Vercel:
//   GMAIL_USER          compte que envia (lamoralcoop@gmail.com)
//   GMAIL_APP_PASSWORD  contrasenya d'aplicació de Google (16 caràcters)
//   FORMULARI_DESTI     opcional: on arriben els missatges (per defecte, GMAIL_USER)
import nodemailer from 'nodemailer';

const CONTACTE = 'lamoralcoop@gmail.com';
const LIMIT = { finestra: 10 * 60 * 1000, max: 6 };
const vistos = new Map(); // límit bàsic per IP (per instància)

const net = (v, max) => String(v ?? '').replace(/\r\n?/g, '\n').trim().slice(0, max);
const linia = (v, max) => net(v, max).replace(/[\n<>"]/g, ' ').trim();
const CORREU = /^[^\s@<>"]+@[^\s@<>"]+\.[^\s@<>"]{2,}$/;

/* Camps acceptats per tipus: [nom, etiqueta, màxim, obligatori] */
const TIPUS = {
  contacte: { titol: 'Missatge de contacte', ok: "Missatge enviat. Et respondrem al correu que ens has donat.",
    camps: [['tema', 'Tema', 60], ['missatge', 'Missatge', 4000, true]] },
  inscripcio: { titol: 'Inscripció a activitat', ok: "Inscripció rebuda! T'enviarem la confirmació per correu.",
    camps: [['activitat', 'Activitat', 120, true], ['places', 'Places', 3, true], ['telefon', 'Telèfon', 30], ['soci', 'És soci/sòcia', 3]] },
  reserva: { titol: "Sol·licitud d'espai", ok: 'Sol·licitud rebuda. Et respondrem amb disponibilitat i preu.',
    camps: [['espai', 'Espai', 40, true], ['data', 'Data', 10, true], ['horari', 'Horari', 40, true], ['activitat', "Tipus d'activitat", 80, true], ['persones', 'Persones', 4], ['entitat', 'Entitat', 100], ['telefon', 'Telèfon', 30, true], ['soci', 'És soci/sòcia', 3], ['missatge', 'Detalls', 2000]] },
  soci: { titol: "Sol·licitud d'alta de soci", ok: "Sol·licitud enviada! Recorda fer el pagament de la quota. La junta et confirmarà l'alta per correu.",
    camps: [['cognoms', 'Cognoms', 80, true], ['telefon', 'Telèfon', 30, true], ['adreca', 'Adreça', 150], ['cp', 'Codi postal', 5], ['poblacio', 'Població', 60], ['pagament', 'Pagament', 20, true], ['missatge', 'Interessos', 1000]] },
  proposta: { titol: "Proposta d'activitat", ok: 'Proposta rebuda. La junta la valorarà i et respondrem.',
    camps: [['missatge', 'Proposta', 3000, true]] },
};

function respon(req, res, estat, missatge) {
  const json = (req.headers.accept || '').includes('application/json');
  if (json) return res.status(estat).json({ ok: estat === 200, missatge });
  res.setHeader('Location', estat === 200 ? '/enviat' : '/no-enviat');
  return res.status(303).end();
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return res.status(405).end(); }

  const b = typeof req.body === 'object' && req.body ? req.body : {};
  // Paranys per a robots: camp ocult i enviament massa ràpid.
  if (net(b.web, 200)) return respon(req, res, 200, 'Enviat');
  const t = Number(b.t);
  if (t && Date.now() - t < 3000) return respon(req, res, 200, 'Enviat');

  const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'desconeguda';
  const ara = Date.now();
  const llista = (vistos.get(ip) || []).filter((x) => ara - x < LIMIT.finestra);
  if (llista.length >= LIMIT.max) return respon(req, res, 429, "Has enviat massa formularis seguits. Torna-ho a provar d'aquí a una estona.");
  llista.push(ara); vistos.set(ip, llista);

  const tipus = TIPUS[linia(b.tipus, 20)] ? linia(b.tipus, 20) : null;
  if (!tipus) return respon(req, res, 400, 'Formulari desconegut.');
  const def = TIPUS[tipus];

  const nom = linia(b.nom, 100);
  const correu = linia(b.correu, 200).toLowerCase();
  if (!nom || !CORREU.test(correu)) return respon(req, res, 400, 'Revisa el nom i el correu.');
  if (b.consentiment !== 'si' && b.consentiment !== true && b.consentiment !== 'on') return respon(req, res, 400, 'Cal que acceptis la política de privacitat.');

  const files = [];
  for (const [camp, etiqueta, max, obligatori] of def.camps) {
    const valor = max > 200 ? net(b[camp], max) : linia(b[camp], max);
    if (obligatori && !valor) return respon(req, res, 400, `Falta el camp «${etiqueta}».`);
    if (camp === 'missatge' && obligatori && valor.length < 10) return respon(req, res, 400, 'El missatge ha de tenir almenys 10 caràcters.');
    if (valor) files.push(`${etiqueta}: ${valor.includes('\n') ? '\n' + valor : valor}`);
  }

  const { GMAIL_USER, GMAIL_APP_PASSWORD, FORMULARI_DESTI } = process.env;
  if (!GMAIL_USER || !GMAIL_APP_PASSWORD) return respon(req, res, 503, `El formulari encara no està actiu. Escriu-nos a ${CONTACTE}.`);

  const nomComplet = tipus === 'soci' ? `${nom} ${linia(b.cognoms, 80)}` : nom;
  try {
    const transport = nodemailer.createTransport({ service: 'gmail', auth: { user: GMAIL_USER, pass: GMAIL_APP_PASSWORD } });
    await transport.sendMail({
      from: { name: 'Web La Moral', address: GMAIL_USER },
      to: FORMULARI_DESTI || GMAIL_USER,
      replyTo: { name: nomComplet, address: correu },
      subject: `[Web] ${def.titol} — ${nomComplet}`,
      text: `${def.titol}\n\nNom: ${nomComplet}\nCorreu: ${correu}\n${files.join('\n')}\n\n— \nHa acceptat la política de privacitat.\nEnviat des del formulari de la web. Per respondre, fes «Respon».`,
    });
    return respon(req, res, 200, def.ok);
  } catch (e) {
    console.error('formulari: error en enviar', e && e.code);
    return respon(req, res, 502, `No s'ha pogut enviar. Torna-ho a provar o escriu-nos a ${CONTACTE}.`);
  }
}
