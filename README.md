# Web de la Cooperativa La Moral

Web de la Cooperativa La Moral de Badalona (fundada el 1904). Mentre està en proves es publica a
`lamoral.nexsocial.org`. Té la mateixa arquitectura que la web de l'AVV Canyadó.

Fet amb HTML, CSS i JS, sense dependències al navegador. Un sol script (`build.mjs`) munta les pàgines a `dist/`.
Els formularis van a una funció de Vercel (`api/formulari.js`) que els envia per correu a La Moral. No es desa res.

## Estructura

| On | Què |
|---|---|
| `data/activitats.json` | **Agenda.** Les activitats noves van a `activitats`. Les passades passen soles a «Anteriors». `habituals` són les activitats de cada setmana |
| `data/espais.json` | **Espais**: sala d'actes i sala polivalent (textos, mides, fotos, condicions) |
| `src/pages/` | Una pàgina per fitxer, amb un bloc `<!--meta {...} -->` a dalt |
| `src/partials/` | `<head>`, capçalera i peu comuns |
| `src/assets/css/site.css` | Estil. Marca: pedra i rosa de la façana, granat de les fusteries i la bandera de la cooperació |
| `src/assets/img/` | Fotos en webp + jpg |
| `api/formulari.js` | Formularis: contacte, inscripció, sol·licitud d'espai, alta de soci i proposta |

## Afegir una activitat

Afegeix un objecte a `data/activitats.json` → `activitats`:

```json
{ "id": "ball-carnaval-2027", "titol": "Ball de Carnaval", "data": "2027-02-13", "hora": "18.00",
  "cat": "Ball", "lloc": "Sala d'actes", "preuSoci": "Gratuït", "preu": "5 €",
  "inscripcio": true, "text": "Text curt." }
```

- Amb `"inscripcio": true` surt el botó «Inscriu-t'hi» i l'activitat apareix al desplegable del formulari.
- Amb `"nomesSocis": true` surt la indicació «Només socis».
- Les activitats amb `"exemple": true` són inventades i surten marcades amb ⚑. **Esborra-les quan hi hagi l'agenda real.**

Fes commit: Vercel la publica en un minut.

## Contingut pendent (⚑)

Tot el que surt ratllat en groc amb ⚑ s'ha de confirmar amb la junta. Quan estigui tot validat, afegeix a Vercel la
variable `FINAL=1` i les marques desapareixen.

- Quota anual, número de Bizum i IBAN
- Avantatges reals de ser soci (descomptes, tarifes de sales, prioritat)
- Horari d'atenció
- Junta actual (càrrecs i noms) i entitats que fan activitat a la casa
- Aforament i foto de la sala polivalent
- Agenda real i dies/horaris de les activitats habituals
- Estatuts, darrera acta i NIF (F08173510, tret de registres públics)
- Revisió de la política de privacitat

## Publicació (Vercel)

1. Importa el repo a Vercel. El `vercel.json` ja defineix el build i la sortida `dist`.
2. Variables d'entorn:
   - `GMAIL_USER` = `lamoralcoop@gmail.com`
   - `GMAIL_APP_PASSWORD` = contrasenya d'aplicació de Google (cal tenir activada la verificació en dos passos al compte)
   - opcional `FORMULARI_DESTI` si els formularis han d'anar a una altra bústia
3. Domini: `lamoral.nexsocial.org` amb un registre CNAME a `cname.vercel-dns.com`, configurat a IONOS.
4. **Mentre està en proves la web no s'indexa** (`noindex` + `robots.txt`). Quan passi al domini definitiu:
   `INDEXAR=1` i `SITE_URL=https://…`.

Sense les variables de Gmail, els formularis responen «encara no està actiu» i mostren el correu de contacte.

## Local

```bash
node build.mjs            # genera dist/
npm run dev               # genera i serveix a http://localhost:4321
```

## Fotos i drets

- Fotos històriques: L'Abans i Museu de Badalona (botiga, 1934, foto Nyssen), via Badalona Recuerdos.
- Façana amb la bandera i junta: Tomeu Ferrer (L'Independent de Badalona).
- Detall de l'esgrafiat de la façana: blog Redescubriendo Barcelona (2019).
- Taula rodona dels 120 anys: Badalona Comunicació.

**Abans de publicar en obert cal el permís dels autors o substituir-les per fotos pròpies de La Moral.**
Les fotos més importants per substituir: portada (façana), sala d'actes i sala polivalent.

## Privacitat

No hi ha galetes, analítica ni recursos de tercers, excepte el mapa d'OpenStreetMap a Contacte. Les tipografies
(Libre Caslon Display, Libre Caslon Text i Public Sans, llicència OFL) se serveixen des del mateix domini.
El formulari d'alta no demana el DNI ni el compte bancari: es recullen quan la junta valida l'alta.

## Fase 2 (no inclosa)

Panell d'admin d'activitats, inscripcions i reserves, pagament de quotes en línia, àrea privada de socis i carnet digital.
