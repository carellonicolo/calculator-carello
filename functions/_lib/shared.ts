/**
 * Helpers condivisi tra le Pages Functions della calcolatrice.
 *
 * Autenticazione: SSO centralizzato (auth.nicolocarello.it), cookie condiviso
 * `nc_session` verificato con la sola chiave pubblica (vedi _lib/sso.ts).
 *
 * Regole di accesso di QUESTA app (decise col docente):
 *  - Docente = `isTeacher || isSuperAdmin` dal dato fresco dell'IdP.
 *  - Studente: serve account attivo E almeno una classe approvata
 *    (chi è in attesa vede la schermata "account in attesa").
 */

import { verifySession, fetchUserInfo, type Identity } from './sso';

export interface Env {
  DB: D1Database;
}

export type { Identity };

export function jsonOk(payload: unknown): Response {
  return new Response(JSON.stringify(payload), {
    headers: { 'content-type': 'application/json' },
  });
}

export function jsonError(status: number, message: string, code?: string): Response {
  return new Response(JSON.stringify({ error: message, code }), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

export interface Access {
  identity: Identity;
  /** True se docente (isTeacher o isSuperAdmin sull'IdP). */
  isTeacher: boolean;
  /** Classi approvate dello studente (vuoto per il docente). */
  classes: string[];
}

/**
 * Gate d'ingresso dell'app: sessione valida + account attivo + (docente
 * oppure classe approvata). Usa il dato fresco dell'IdP, così approvazioni
 * e sospensioni hanno effetto immediato.
 */
export async function requireAccess(request: Request): Promise<Access | Response> {
  const identity = await verifySession(request);
  if (!identity) return jsonError(401, 'Accesso richiesto. Effettua il login.', 'unauthenticated');

  const info = await fetchUserInfo(request);
  if (!info) return jsonError(401, 'Sessione non valida. Effettua di nuovo il login.', 'unauthenticated');

  const isTeacher = !!(info.user.isTeacher || info.user.isSuperAdmin);
  if (!isTeacher && info.user.status !== 'active') {
    return jsonError(403, 'Account non attivo. Contatta il docente.', 'not_active');
  }

  const classes = (info.approvedClasses ?? []).map((c) => c.classe).filter(Boolean);
  if (!isTeacher && classes.length === 0) {
    return jsonError(
      403,
      'Il tuo account è in attesa di approvazione: la calcolatrice sarà disponibile quando il docente confermerà la tua classe.',
      'pending'
    );
  }

  return { identity, isTeacher, classes };
}

/** Solo docente (console e API di configurazione). */
export async function requireTeacher(request: Request): Promise<Access | Response> {
  const identity = await verifySession(request);
  if (!identity) return jsonError(401, 'Accesso docente richiesto.', 'unauthenticated');
  const info = await fetchUserInfo(request);
  if (!info) return jsonError(401, 'Sessione non valida. Effettua di nuovo il login.', 'unauthenticated');
  if (!(info.user.isTeacher || info.user.isSuperAdmin)) {
    return jsonError(403, 'Sezione riservata al docente.', 'forbidden');
  }
  return { identity, isTeacher: true, classes: [] };
}
