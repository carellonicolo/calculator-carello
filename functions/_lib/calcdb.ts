/**
 * Accesso alle tabelle `calc_*` nel database D1 condiviso `ccna1`.
 *
 * Il DB è riusato (limite di 10 database del piano free): le tabelle della
 * calcolatrice sono prefissate `calc_`. In sola lettura si attinge anche a
 * `class_exam_state` e `students` (tabelle del quiz CCNA1) per proporre al
 * docente l'elenco classi già noto alla piattaforma.
 */

import { type CalcConfig, DEFAULT_CONFIG, parseConfigJson } from './calcconfig';
import type { Env, Identity } from './shared';

/** Chiave della configurazione predefinita (classi senza riga propria). */
export const DEFAULT_CLASS = '*';

export interface ResolvedConfig {
  config: CalcConfig;
  /**
   * Impronta della configurazione applicata: cambia quando il docente salva.
   * Il client la confronta nel polling per capire se aggiornarsi.
   */
  stamp: string;
  /** Da dove viene la config: nome classe, '*' (default) o 'builtin'. */
  source: string;
}

/**
 * Risolve la configurazione per uno studente: prima riga esplicita di una
 * delle sue classi approvate (in ordine), poi la default '*', poi il
 * "tutto attivo" di fabbrica.
 */
export async function resolveConfig(env: Env, classes: string[]): Promise<ResolvedConfig> {
  const candidates = [...classes, DEFAULT_CLASS];
  const placeholders = candidates.map(() => '?').join(',');
  const { results } = await env.DB.prepare(
    `SELECT class, config, updated_at FROM calc_class_config WHERE class IN (${placeholders})`
  )
    .bind(...candidates)
    .all<{ class: string; config: string; updated_at: string }>();

  const byClass = new Map((results ?? []).map((r) => [r.class, r]));
  for (const c of candidates) {
    const row = byClass.get(c);
    if (row) {
      return {
        config: parseConfigJson(row.config),
        stamp: `${row.class}@${row.updated_at}`,
        source: row.class,
      };
    }
  }
  return { config: DEFAULT_CONFIG, stamp: 'builtin', source: 'builtin' };
}

export async function upsertClassConfig(
  env: Env,
  cls: string,
  config: CalcConfig,
  byEmail: string
): Promise<void> {
  const now = new Date().toISOString();
  await env.DB.prepare(
    `INSERT INTO calc_class_config (class, config, updated_at, updated_by)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(class) DO UPDATE SET
       config = excluded.config,
       updated_at = excluded.updated_at,
       updated_by = excluded.updated_by`
  )
    .bind(cls, JSON.stringify(config), now, byEmail)
    .run();
}

export async function deleteClassConfig(env: Env, cls: string): Promise<void> {
  await env.DB.prepare(`DELETE FROM calc_class_config WHERE class = ?`).bind(cls).run();
}

export interface ClassConfigRow {
  class: string;
  config: CalcConfig;
  updatedAt: string;
  updatedBy: string;
}

export async function listClassConfigs(env: Env): Promise<ClassConfigRow[]> {
  const { results } = await env.DB.prepare(
    `SELECT class, config, updated_at, updated_by FROM calc_class_config ORDER BY class`
  ).all<{ class: string; config: string; updated_at: string; updated_by: string }>();
  return (results ?? []).map((r) => ({
    class: r.class,
    config: parseConfigJson(r.config),
    updatedAt: r.updated_at,
    updatedBy: r.updated_by,
  }));
}

/**
 * Elenco classi note alla piattaforma: classi già configurate qui, classi del
 * quiz CCNA1 (class_exam_state), classi degli studenti validati e classi viste
 * nelle sessioni della calcolatrice. Le letture sulle tabelle CCNA1 sono
 * difensive: se un giorno cambiano schema, l'elenco degrada senza errori.
 */
export async function listKnownClasses(env: Env): Promise<string[]> {
  const found = new Set<string>();

  const collect = async (sql: string) => {
    try {
      const { results } = await env.DB.prepare(sql).all<{ c: string | null }>();
      for (const r of results ?? []) {
        const name = (r.c ?? '').trim();
        if (name && name !== DEFAULT_CLASS) found.add(name);
      }
    } catch {
      // Tabella assente o schema cambiato: ignora.
    }
  };

  await collect(`SELECT class AS c FROM calc_class_config`);
  await collect(`SELECT class AS c FROM class_exam_state`);
  await collect(`SELECT DISTINCT class AS c FROM students WHERE class IS NOT NULL AND status = 'validated'`);
  await collect(`SELECT DISTINCT class AS c FROM calc_sessions WHERE class IS NOT NULL`);

  return [...found].sort((a, b) => a.localeCompare(b, 'it', { numeric: true }));
}

// ------------------------------------------------------------------ Preset

export interface PresetRow {
  id: number;
  name: string;
  config: CalcConfig;
  updatedAt: string;
}

export async function listPresets(env: Env): Promise<PresetRow[]> {
  const { results } = await env.DB.prepare(
    `SELECT id, name, config, updated_at FROM calc_presets ORDER BY name`
  ).all<{ id: number; name: string; config: string; updated_at: string }>();
  return (results ?? []).map((r) => ({
    id: r.id,
    name: r.name,
    config: parseConfigJson(r.config),
    updatedAt: r.updated_at,
  }));
}

export async function upsertPreset(env: Env, name: string, config: CalcConfig): Promise<void> {
  const now = new Date().toISOString();
  await env.DB.prepare(
    `INSERT INTO calc_presets (name, config, updated_at) VALUES (?, ?, ?)
     ON CONFLICT(name) DO UPDATE SET config = excluded.config, updated_at = excluded.updated_at`
  )
    .bind(name, JSON.stringify(config), now)
    .run();
}

export async function getPreset(env: Env, id: number): Promise<PresetRow | null> {
  const row = await env.DB.prepare(`SELECT id, name, config, updated_at FROM calc_presets WHERE id = ?`)
    .bind(id)
    .first<{ id: number; name: string; config: string; updated_at: string }>();
  if (!row) return null;
  return { id: row.id, name: row.name, config: parseConfigJson(row.config), updatedAt: row.updated_at };
}

export async function deletePreset(env: Env, id: number): Promise<void> {
  await env.DB.prepare(`DELETE FROM calc_presets WHERE id = ?`).bind(id).run();
}

// --------------------------------------------------------------- Sessioni

/** Heartbeat: last_seen è aggiornato solo se più vecchio di questa soglia. */
const TOUCH_THROTTLE_MS = 45_000;

export async function openSession(env: Env, identity: Identity, cls: string | null): Promise<string> {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  await env.DB.prepare(
    `INSERT INTO calc_sessions (id, user_id, email, full_name, class, opened_at, last_seen_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(id, identity.userId, identity.email, identity.name, cls, now, now)
    .run();
  return id;
}

export interface SessionRow {
  id: string;
  class: string | null;
  lastSeenAt: string;
}

/**
 * Aggiorna (con throttle) il last_seen della sessione e la restituisce.
 * null se la sessione non esiste o non appartiene all'utente → il client
 * riapre lo stato con /api/student/state.
 */
export async function touchSession(env: Env, sid: string, userId: string): Promise<SessionRow | null> {
  const row = await env.DB.prepare(
    `SELECT id, class, last_seen_at FROM calc_sessions WHERE id = ? AND user_id = ?`
  )
    .bind(sid, userId)
    .first<{ id: string; class: string | null; last_seen_at: string }>();
  if (!row) return null;

  const now = Date.now();
  const last = Date.parse(row.last_seen_at);
  if (!Number.isFinite(last) || now - last > TOUCH_THROTTLE_MS) {
    const iso = new Date(now).toISOString();
    await env.DB.prepare(`UPDATE calc_sessions SET last_seen_at = ? WHERE id = ?`).bind(iso, sid).run();
    return { id: row.id, class: row.class, lastSeenAt: iso };
  }
  return { id: row.id, class: row.class, lastSeenAt: row.last_seen_at };
}

export interface LiveSession {
  fullName: string;
  email: string;
  class: string | null;
  openedAt: string;
  lastSeenAt: string;
}

export async function listRecentSessions(env: Env, sinceIso: string): Promise<LiveSession[]> {
  const { results } = await env.DB.prepare(
    `SELECT full_name, email, class, opened_at, last_seen_at
     FROM calc_sessions WHERE opened_at >= ?
     ORDER BY opened_at DESC LIMIT 500`
  )
    .bind(sinceIso)
    .all<{ full_name: string; email: string; class: string | null; opened_at: string; last_seen_at: string }>();
  return (results ?? []).map((r) => ({
    fullName: r.full_name,
    email: r.email,
    class: r.class,
    openedAt: r.opened_at,
    lastSeenAt: r.last_seen_at,
  }));
}

/** Ritenzione log: 60 giorni. Chiamata best-effort dalla console docente. */
export async function pruneOldSessions(env: Env): Promise<void> {
  const cutoff = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString();
  try {
    await env.DB.prepare(`DELETE FROM calc_sessions WHERE opened_at < ?`).bind(cutoff).run();
  } catch {
    // best-effort
  }
}
