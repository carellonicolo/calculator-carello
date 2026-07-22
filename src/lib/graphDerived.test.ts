import { describe, it, expect } from 'vitest';
import { fullPermissions } from './engine/evaluator';
import { defaultScene, makeFunction, PALETTE } from './graphScene';
import {
  buildNotables,
  buildRenders,
  resolvePins,
  togglePin,
  type GraphFeatures,
} from './graphDerived';

const permissions = fullPermissions();
const features: GraphFeatures = { paramPolar: true, analysis: true, calculus: true };

describe('catena dei pin (notevoli → toggle → resolve)', () => {
  it('appunta uno zero, lo risolve, lo toglie', () => {
    const scene = defaultScene('x^2-1');
    scene.tools.zeros = true;
    const renders = buildRenders(scene, permissions, {}, features);
    const notables = buildNotables(scene, renders, features);
    expect(notables.length).toBe(2);
    expect(notables[0].fid).toBe(scene.funcs[0].id);

    scene.pins = togglePin(scene, notables[0]);
    expect(scene.pins).toHaveLength(1);

    const resolved = resolvePins(scene, notables);
    expect(resolved).toHaveLength(1);
    expect(resolved[0].text).toContain('zero');
    expect(Math.abs(resolved[0].x + 1)).toBeLessThan(1e-4);

    scene.pins = togglePin(scene, notables[0]);
    expect(scene.pins).toHaveLength(0);
  });

  it('un pin senza punto corrispondente non si risolve', () => {
    const scene = defaultScene('x^2+1'); // niente zeri
    scene.tools.zeros = true;
    scene.pins = [{ kind: 'zero', fid: scene.funcs[0].id, x: 0 }];
    const renders = buildRenders(scene, permissions, {}, features);
    const notables = buildNotables(scene, renders, features);
    expect(resolvePins(scene, notables)).toEqual([]);
  });
});

describe('render delle successioni', () => {
  it('aₙ = 1/n produce punti discreti senza funzione compilata', () => {
    const scene = defaultScene('sin(x)');
    scene.funcs = [makeFunction({ color: PALETTE[0], kind: 'sequence', src: '1/n' })];
    scene.view = { xMin: 0.5, xMax: 5.5, yMin: -1, yMax: 2 };
    const [r] = buildRenders(scene, permissions, {}, features);
    expect(r.error).toBeNull();
    expect(r.fn).toBeNull();
    expect(r.pts.map((p) => p?.x)).toEqual([1, 2, 3, 4, 5]);
  });
});
