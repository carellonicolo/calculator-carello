/**
 * GET /api/teacher/live — log utilizzi delle ultime 12 ore.
 * "Online adesso" = heartbeat (last_seen) negli ultimi 90 secondi.
 * Fa anche pulizia best-effort delle sessioni più vecchie di 60 giorni.
 */
import { listRecentSessions, pruneOldSessions, type LiveSession } from '../../_lib/calcdb';
import { jsonOk, jsonError, requireTeacher, type Env } from '../../_lib/shared';

const ONLINE_WINDOW_MS = 90_000;

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const gate = await requireTeacher(request);
  if (gate instanceof Response) return gate;

  try {
    const since = new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString();
    const sessions = await listRecentSessions(env, since);
    const now = Date.now();
    const withOnline = sessions.map((s: LiveSession) => ({
      ...s,
      online: now - Date.parse(s.lastSeenAt) < ONLINE_WINDOW_MS,
    }));
    await pruneOldSessions(env);
    return jsonOk({ sessions: withOnline });
  } catch (e) {
    return jsonError(500, `Errore DB: ${e instanceof Error ? e.message : String(e)}`);
  }
};

export const onRequest: PagesFunction<Env> = () => new Response('Method not allowed', { status: 405 });
