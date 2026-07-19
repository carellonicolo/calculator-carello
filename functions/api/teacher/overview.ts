/**
 * GET /api/teacher/overview — tutto ciò che serve alla console docente:
 * classi note, configurazioni per classe, configurazione predefinita, preset.
 */
import { DEFAULT_CONFIG } from '../../_lib/calcconfig';
import {
  DEFAULT_CLASS,
  listClassConfigs,
  listKnownClasses,
  listPresets,
} from '../../_lib/calcdb';
import { jsonOk, jsonError, requireTeacher, type Env } from '../../_lib/shared';

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const gate = await requireTeacher(request);
  if (gate instanceof Response) return gate;

  try {
    const [classes, configs, presets] = await Promise.all([
      listKnownClasses(env),
      listClassConfigs(env),
      listPresets(env),
    ]);

    const byClass = new Map(configs.map((c) => [c.class, c]));
    const def = byClass.get(DEFAULT_CLASS) ?? null;

    return jsonOk({
      defaultConfig: {
        config: def?.config ?? DEFAULT_CONFIG,
        updatedAt: def?.updatedAt ?? null,
        customized: !!def,
      },
      classes: classes.map((name) => {
        const row = byClass.get(name);
        return {
          class: name,
          config: row?.config ?? null,
          updatedAt: row?.updatedAt ?? null,
        };
      }),
      presets,
    });
  } catch (e) {
    return jsonError(500, `Errore DB: ${e instanceof Error ? e.message : String(e)}`);
  }
};

export const onRequest: PagesFunction<Env> = () => new Response('Method not allowed', { status: 405 });
