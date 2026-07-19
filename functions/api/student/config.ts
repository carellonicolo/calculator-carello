/**
 * GET /api/student/config?sid=... — polling leggero della configurazione.
 *
 * Chiamato ogni ~10s dalla calcolatrice aperta: le modifiche del docente
 * arrivano live. Verifica SOLO la firma del cookie (niente round-trip
 * all'IdP) e usa la classe salvata nella sessione; aggiorna il last_seen
 * (heartbeat "online adesso" per la console docente, con throttle).
 */
import { verifySession } from '../../_lib/sso';
import { resolveConfig, touchSession } from '../../_lib/calcdb';
import { jsonOk, jsonError, type Env } from '../../_lib/shared';

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const identity = await verifySession(request);
  if (!identity) return jsonError(401, 'Sessione scaduta. Effettua di nuovo il login.', 'unauthenticated');

  const sid = new URL(request.url).searchParams.get('sid') ?? '';
  if (!sid) return jsonError(400, 'Parametro sid mancante.');

  try {
    const session = await touchSession(env, sid, identity.userId);
    if (!session) return jsonError(404, 'Sessione non trovata.', 'session_lost');

    const resolved = await resolveConfig(env, session.class ? [session.class] : []);
    return jsonOk({ config: resolved.config, stamp: resolved.stamp });
  } catch (e) {
    return jsonError(500, `Errore DB: ${e instanceof Error ? e.message : String(e)}`);
  }
};

export const onRequest: PagesFunction<Env> = () => new Response('Method not allowed', { status: 405 });
