/**
 * POST /api/teacher/apply-preset { presetId, classes: string[] }
 * Applica un preset a una o più classi in un colpo ('*' = predefinita).
 */
import { getPreset, upsertClassConfig } from '../../_lib/calcdb';
import { jsonOk, jsonError, requireTeacher, type Env } from '../../_lib/shared';

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const gate = await requireTeacher(request);
  if (gate instanceof Response) return gate;

  let body: { presetId?: unknown; classes?: unknown };
  try {
    body = await request.json();
  } catch {
    return jsonError(400, 'JSON non valido.');
  }

  const presetId = Number(body.presetId);
  if (!Number.isInteger(presetId) || presetId <= 0) return jsonError(400, 'Id preset non valido.');

  const classes = Array.isArray(body.classes)
    ? body.classes
        .filter((c): c is string => typeof c === 'string')
        .map((c) => c.trim())
        .filter((c) => c && c.length <= 40)
    : [];
  if (classes.length === 0) return jsonError(400, 'Seleziona almeno una classe.');

  try {
    const preset = await getPreset(env, presetId);
    if (!preset) return jsonError(404, 'Preset non trovato.');
    for (const cls of classes) {
      await upsertClassConfig(env, cls, preset.config, gate.identity.email);
    }
    return jsonOk({ ok: true, applied: classes });
  } catch (e) {
    return jsonError(500, `Errore DB: ${e instanceof Error ? e.message : String(e)}`);
  }
};

export const onRequest: PagesFunction<Env> = () => new Response('Method not allowed', { status: 405 });
