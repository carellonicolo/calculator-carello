/**
 * /api/teacher/presets — preset riusabili di configurazione.
 *  - GET: elenco.
 *  - POST { name, config }: crea o aggiorna (upsert per nome).
 *  - DELETE ?id=N: elimina.
 */
import { sanitizeConfig } from '../../_lib/calcconfig';
import { deletePreset, listPresets, upsertPreset } from '../../_lib/calcdb';
import { jsonOk, jsonError, requireTeacher, type Env } from '../../_lib/shared';

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const gate = await requireTeacher(request);
  if (gate instanceof Response) return gate;
  try {
    return jsonOk({ presets: await listPresets(env) });
  } catch (e) {
    return jsonError(500, `Errore DB: ${e instanceof Error ? e.message : String(e)}`);
  }
};

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const gate = await requireTeacher(request);
  if (gate instanceof Response) return gate;

  let body: { name?: unknown; config?: unknown };
  try {
    body = await request.json();
  } catch {
    return jsonError(400, 'JSON non valido.');
  }
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  if (!name || name.length > 60) return jsonError(400, 'Nome preset mancante o troppo lungo (max 60).');

  try {
    await upsertPreset(env, name, sanitizeConfig(body.config));
    return jsonOk({ presets: await listPresets(env) });
  } catch (e) {
    return jsonError(500, `Errore DB: ${e instanceof Error ? e.message : String(e)}`);
  }
};

export const onRequestDelete: PagesFunction<Env> = async ({ request, env }) => {
  const gate = await requireTeacher(request);
  if (gate instanceof Response) return gate;

  const id = Number(new URL(request.url).searchParams.get('id'));
  if (!Number.isInteger(id) || id <= 0) return jsonError(400, 'Id preset non valido.');

  try {
    await deletePreset(env, id);
    return jsonOk({ presets: await listPresets(env) });
  } catch (e) {
    return jsonError(500, `Errore DB: ${e instanceof Error ? e.message : String(e)}`);
  }
};

export const onRequest: PagesFunction<Env> = () => new Response('Method not allowed', { status: 405 });
