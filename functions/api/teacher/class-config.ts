/**
 * /api/teacher/class-config — configurazione di una classe.
 *  - PUT  { class, config }: salva (class '*' = configurazione predefinita).
 *  - DELETE ?class=X: rimuove la riga → la classe torna alla predefinita
 *    ('*' cancellata = si torna al "tutto attivo" di fabbrica).
 */
import { sanitizeConfig } from '../../_lib/calcconfig';
import { deleteClassConfig, upsertClassConfig } from '../../_lib/calcdb';
import { jsonOk, jsonError, requireTeacher, type Env } from '../../_lib/shared';

function normalizeClassName(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const cls = raw.trim();
  if (!cls || cls.length > 40) return null;
  return cls;
}

export const onRequestPut: PagesFunction<Env> = async ({ request, env }) => {
  const gate = await requireTeacher(request);
  if (gate instanceof Response) return gate;

  let body: { class?: unknown; config?: unknown };
  try {
    body = await request.json();
  } catch {
    return jsonError(400, 'JSON non valido.');
  }
  const cls = normalizeClassName(body.class);
  if (!cls) return jsonError(400, 'Nome classe mancante o troppo lungo.');
  const config = sanitizeConfig(body.config);

  try {
    await upsertClassConfig(env, cls, config, gate.identity.email);
    return jsonOk({ ok: true, class: cls, config });
  } catch (e) {
    return jsonError(500, `Errore DB: ${e instanceof Error ? e.message : String(e)}`);
  }
};

export const onRequestDelete: PagesFunction<Env> = async ({ request, env }) => {
  const gate = await requireTeacher(request);
  if (gate instanceof Response) return gate;

  const cls = normalizeClassName(new URL(request.url).searchParams.get('class'));
  if (!cls) return jsonError(400, 'Nome classe mancante.');

  try {
    await deleteClassConfig(env, cls);
    return jsonOk({ ok: true });
  } catch (e) {
    return jsonError(500, `Errore DB: ${e instanceof Error ? e.message : String(e)}`);
  }
};

export const onRequest: PagesFunction<Env> = () => new Response('Method not allowed', { status: 405 });
