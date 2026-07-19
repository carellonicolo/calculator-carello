/**
 * CalcConfig — FONTE UNICA della forma di configurazione della calcolatrice.
 *
 * Usato sia dalle Pages Functions sia dalla SPA (src/lib/config.ts lo importa
 * direttamente): un solo posto da toccare quando si aggiunge un gruppo.
 *
 * Modello a due livelli ("ibrido"):
 *  - master switch per area (scientific/programmer/graphing/statistics);
 *  - toggle fini per gruppo dentro l'area.
 * La modalità Standard è sempre attiva; i suoi extra (percento, radice,
 * memoria) e la cronologia sono toggle singoli.
 */

export interface CalcConfig {
  standard: {
    /** Tasto % (postfisso: 50% → 0.5). */
    percent: boolean;
    /** Tasto √ (vale ovunque compaia la radice quadrata semplice). */
    sqrt: boolean;
    /** Memoria MC/MR/M+/M−. */
    memory: boolean;
  };
  scientific: {
    enabled: boolean;
    /** sin, cos, tan e inverse + selettore DEG/RAD. */
    trig: boolean;
    /** ln, log₁₀, eˣ, 10ˣ. */
    logExp: boolean;
    /** x², x³, xʸ, ∛, 1/x. */
    powRoot: boolean;
    /** n! */
    factorial: boolean;
    /** π ed e. */
    constants: boolean;
  };
  programmer: {
    enabled: boolean;
    /** Conversioni BIN/OCT/DEC/HEX con input in ogni base. */
    baseConv: boolean;
    /** AND, OR, XOR, NOT, shift. */
    bitwise: boolean;
  };
  graphing: { enabled: boolean };
  statistics: { enabled: boolean };
  history: { enabled: boolean };
}

export const DEFAULT_CONFIG: CalcConfig = {
  standard: { percent: true, sqrt: true, memory: true },
  scientific: {
    enabled: true,
    trig: true,
    logExp: true,
    powRoot: true,
    factorial: true,
    constants: true,
  },
  programmer: { enabled: true, baseConv: true, bitwise: true },
  graphing: { enabled: true },
  statistics: { enabled: true },
  history: { enabled: true },
};

function asBool(v: unknown, fallback: boolean): boolean {
  return typeof v === 'boolean' ? v : fallback;
}

/**
 * Riporta un JSON qualsiasi (dal DB o dal client) a un CalcConfig valido,
 * riempiendo i buchi con i default. Mai un throw: config corrotta → default.
 */
export function sanitizeConfig(raw: unknown): CalcConfig {
  const r = (raw ?? {}) as Record<string, Record<string, unknown>>;
  const d = DEFAULT_CONFIG;
  const std = r.standard ?? {};
  const sci = r.scientific ?? {};
  const prg = r.programmer ?? {};
  const gra = r.graphing ?? {};
  const sta = r.statistics ?? {};
  const his = r.history ?? {};
  return {
    standard: {
      percent: asBool(std.percent, d.standard.percent),
      sqrt: asBool(std.sqrt, d.standard.sqrt),
      memory: asBool(std.memory, d.standard.memory),
    },
    scientific: {
      enabled: asBool(sci.enabled, d.scientific.enabled),
      trig: asBool(sci.trig, d.scientific.trig),
      logExp: asBool(sci.logExp, d.scientific.logExp),
      powRoot: asBool(sci.powRoot, d.scientific.powRoot),
      factorial: asBool(sci.factorial, d.scientific.factorial),
      constants: asBool(sci.constants, d.scientific.constants),
    },
    programmer: {
      enabled: asBool(prg.enabled, d.programmer.enabled),
      baseConv: asBool(prg.baseConv, d.programmer.baseConv),
      bitwise: asBool(prg.bitwise, d.programmer.bitwise),
    },
    graphing: { enabled: asBool(gra.enabled, d.graphing.enabled) },
    statistics: { enabled: asBool(sta.enabled, d.statistics.enabled) },
    history: { enabled: asBool(his.enabled, d.history.enabled) },
  };
}

export function parseConfigJson(json: string | null | undefined): CalcConfig {
  if (!json) return sanitizeConfig(null);
  try {
    return sanitizeConfig(JSON.parse(json));
  } catch {
    return sanitizeConfig(null);
  }
}

/** Numero di interruttori spenti rispetto al default "tutto attivo". */
export function countRestrictions(c: CalcConfig): number {
  let n = 0;
  const areas: { enabled?: boolean; groups: boolean[] }[] = [
    { groups: [c.standard.percent, c.standard.sqrt, c.standard.memory] },
    {
      enabled: c.scientific.enabled,
      groups: [c.scientific.trig, c.scientific.logExp, c.scientific.powRoot, c.scientific.factorial, c.scientific.constants],
    },
    { enabled: c.programmer.enabled, groups: [c.programmer.baseConv, c.programmer.bitwise] },
    { enabled: c.graphing.enabled, groups: [] },
    { enabled: c.statistics.enabled, groups: [] },
    { groups: [c.history.enabled] },
  ];
  for (const a of areas) {
    if (a.enabled === false) {
      // Area intera spenta: conta 1 (i gruppi interni non si sommano).
      n += 1;
      continue;
    }
    n += a.groups.filter((g) => !g).length;
  }
  return n;
}
