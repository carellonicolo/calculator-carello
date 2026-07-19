# Calcolatrice — calculator.nicolocarello.it

Calcolatrice software per le **verifiche in classe**: il docente decide quali
funzioni sono disponibili (per classe, con preset riusabili) e le modifiche
arrivano **live** alle calcolatrici aperte degli studenti. Accesso riservato
agli utenti autenticati con l'SSO della piattaforma (`auth.nicolocarello.it`).

Stack identico alle altre app della piattaforma (VLSM, CCNA1):
**Vite + React 18 + TypeScript + Tailwind + Cloudflare Pages Functions + D1**,
header unificato `carello-shell`, tema caldo "Carello" con blob animati.

## Modalità

| Modalità | Contenuto | Controlli docente |
|---|---|---|
| Standard | 4 operazioni, parentesi, ± | %, √, memoria (M+/M−/MR/MC) |
| Scientifica | funzioni matematiche | master + trigonometria, log/exp, potenze/radici, fattoriale, costanti π·e |
| Programmatore | basi di numerazione | master + conversioni BIN/OCT/DEC/HEX, bitwise (AND/OR/XOR/NOT/shift), word 8/16/32 bit |
| Grafici | y = f(x) su piano cartesiano | master (le funzioni vietate valgono anche qui) |
| Statistica | media, mediana, σ, varianza… | master |
| Cronologia | storico calcoli sul dispositivo | master (spegnendola viene anche svuotata) |

Il modello dei controlli è **ibrido**: un interruttore *master* spegne
un'intera area in un clic; dentro l'area, interruttori fini per gruppo.
I tasti rimossi appaiono come **celle fantasma con lucchetto**: lo studente
capisce che mancano per scelta del docente, non per un bug.

## Come funziona

- **Accesso**: solo utenti SSO. Studenti: serve la **classe approvata**
  sull'IdP (chi è in attesa vede una schermata dedicata). Il **docente** è
  riconosciuto da auth (`isTeacher`/`isSuperAdmin`) e ha sempre la
  calcolatrice completa + la **Console docente** su `/admin`.
- **Configurazione per classe**: risoluzione `classe → predefinita ('*') →
  tutto attivo`. I **preset** salvati si applicano a più classi in un clic.
- **Live**: la calcolatrice fa polling leggero ogni ~10 s
  (`GET /api/student/config`), che funge anche da heartbeat per il tab
  **In diretta** (chi è online adesso, log aperture ultime 12 ore,
  ritenzione 60 giorni).
- **Enforcement unico**: i permessi passano tutti dal motore di calcolo
  (`src/lib/engine/evaluator.ts`) — una funzione disattivata è rifiutata
  anche se digitata nei grafici o da tastiera fisica.

## Struttura

```
functions/            Cloudflare Pages Functions (API)
  _lib/sso.ts         verificatore SSO (copiato da AUTH/integration)
  _lib/calcconfig.ts  FONTE UNICA della forma CalcConfig (usata anche dalla SPA)
  _lib/calcdb.ts      accesso alle tabelle calc_* su D1
  api/me.ts           identità SSO
  api/student/        state (bootstrap+sessione), config (polling live)
  api/teacher/        overview, class-config, presets, apply-preset, live
src/
  lib/engine/         evaluator (parser Pratt, niente eval), basi/bitwise, statistica, grafici
  hooks/              useAppState (gate+polling), useCalculator
  components/         calculator/ (5 modalità), admin/ (console), ui/, screens/
migrations/           0001_calc_init.sql (tabelle calc_*)
public/carello-shell.js  top bar unificata (THEME_KEY = calc_theme)
wrangler.toml         config Pages: output dist + binding D1 → ccna1
```

## Database

⚠️ **Nessun database dedicato**: si riusa il D1 esistente **`ccna1`**
(limite di 10 DB del piano free). Tutte le tabelle sono prefissate `calc_`
(`calc_class_config`, `calc_presets`, `calc_sessions`) e non toccano le
tabelle del quiz. In sola lettura si attinge a `class_exam_state`/`students`
per proporre l'elenco classi al docente.

Migrazione (già applicata):

```bash
npx wrangler d1 execute ccna1 --remote --file=migrations/0001_calc_init.sql
```

## Deploy

Cloudflare Pages, progetto `calculator-carello` (git-connected, push su
`main`). Build: `npm run build` → `dist`. **I binding vivono in
`wrangler.toml`** (diversamente da VLSM/CCNA1 che li hanno nel dashboard):
al deploy sostituisce le variabili del dashboard — le vecchie variabili
Supabase dell'app precedente spariscono da sole. Rollback: elimina
`wrangler.toml` e ricrea il binding `DB → ccna1` dal dashboard.

## Sviluppo locale

```bash
npm install
npm run build                # typecheck SPA + bundle
npm test                     # unit test del motore di calcolo
npm run typecheck:functions  # typecheck delle Functions

# Functions + D1 in locale (in un secondo terminale):
npx wrangler pages dev dist --port 8788 --d1 DB=ccna1
npm run dev                  # frontend con proxy /api → 8788
```

> Il login SSO completo funziona solo sul dominio `*.nicolocarello.it`
> (cookie condiviso): in locale le API rispondono 401, è il comportamento
> atteso.

## Note

- La configurazione limita **l'interfaccia e il motore lato client**: è uno
  strumento di supporto per le verifiche, non un sistema anti-manomissione.
- Log utilizzi: solo aperture + ultimo segnale (niente contenuto dei calcoli).
