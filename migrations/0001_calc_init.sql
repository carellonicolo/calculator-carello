-- Migrazione 0001 — Calcolatrice per verifiche (calculator.nicolocarello.it).
--
-- ⚠️ Queste tabelle vivono nel database D1 CONDIVISO `ccna1` (limite di 10 DB
-- del piano free quasi raggiunto). Tutte le tabelle della calcolatrice sono
-- prefissate `calc_` e non toccano le tabelle del quiz CCNA1.
--
-- Applicare con:
--   npx wrangler d1 execute ccna1 --remote --file=migrations/0001_calc_init.sql

-- Configurazione della calcolatrice per classe.
-- class = '*' è la configurazione PREDEFINITA usata dalle classi senza riga
-- propria. config è il JSON CalcConfig (vedi functions/_lib/calc.ts).
CREATE TABLE IF NOT EXISTS calc_class_config (
  class      TEXT PRIMARY KEY,
  config     TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  updated_by TEXT NOT NULL DEFAULT ''
);

-- Preset riusabili del docente (es. "Verifica conversioni di base").
CREATE TABLE IF NOT EXISTS calc_presets (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  name       TEXT NOT NULL UNIQUE,
  config     TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- Log utilizzi: una riga per apertura della calcolatrice da parte di uno
-- studente. last_seen_at è aggiornato dal polling della configurazione
-- (throttle lato server) → "online adesso" = last_seen_at recente.
CREATE TABLE IF NOT EXISTS calc_sessions (
  id           TEXT PRIMARY KEY,
  user_id      TEXT NOT NULL,
  email        TEXT NOT NULL,
  full_name    TEXT NOT NULL,
  class        TEXT,
  opened_at    TEXT NOT NULL,
  last_seen_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_calc_sessions_opened ON calc_sessions(opened_at DESC);
CREATE INDEX IF NOT EXISTS idx_calc_sessions_user   ON calc_sessions(user_id, opened_at DESC);
