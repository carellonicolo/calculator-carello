/**
 * GET /api/student/state — bootstrap dell'app dopo il login SSO.
 *
 * Un'unica chiamata: identità + gate d'accesso + configurazione risolta per
 * la classe + apertura della sessione (log utilizzi). Il docente riceve la
 * calcolatrice completa e nessuna sessione viene registrata per lui.
 */
import { DEFAULT_CONFIG } from '../../_lib/calcconfig';
import { resolveConfig, openSession } from '../../_lib/calcdb';
import { jsonOk, jsonError, requireAccess, type Env } from '../../_lib/shared';

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const access = await requireAccess(request);
  if (access instanceof Response) return access;

  try {
    if (access.isTeacher) {
      return jsonOk({
        user: {
          name: access.identity.name,
          email: access.identity.email,
          class: null,
          isTeacher: true,
        },
        config: DEFAULT_CONFIG,
        stamp: 'teacher',
        session: null,
      });
    }

    const resolved = await resolveConfig(env, access.classes);
    const cls = access.classes[0] ?? null;
    const session = await openSession(env, access.identity, cls);
    return jsonOk({
      user: {
        name: access.identity.name,
        email: access.identity.email,
        class: cls,
        isTeacher: false,
      },
      config: resolved.config,
      stamp: resolved.stamp,
      session,
    });
  } catch (e) {
    return jsonError(500, `Errore DB: ${e instanceof Error ? e.message : String(e)}`);
  }
};

export const onRequest: PagesFunction<Env> = () => new Response('Method not allowed', { status: 405 });
