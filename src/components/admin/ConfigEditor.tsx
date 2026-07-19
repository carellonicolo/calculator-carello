import clsx from 'clsx';
import { AREAS, getFlag, withFlag, type CalcConfig } from '../../lib/config';

interface Props {
  config: CalcConfig;
  onChange: (next: CalcConfig) => void;
}

function Switch({ on, onToggle, label }: { on: boolean; onToggle: () => void; label: string }) {
  return (
    <button
      type="button"
      className={clsx('switch', on && 'on')}
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={onToggle}
    />
  );
}

/**
 * Editor "ibrido" della configurazione: master switch per area + toggle fini
 * per gruppo. Spegnere l'area disattiva tutto in un colpo; i gruppi restano
 * ricordati (ma ininfluenti) finché l'area è spenta.
 */
export function ConfigEditor({ config, onChange }: Props) {
  return (
    <div className="config-editor">
      {AREAS.map((area) => {
        const masterOn = area.hasMaster ? getFlag(config, area.area, 'enabled') : true;
        return (
          <div key={area.area} className={clsx('config-area', area.hasMaster && !masterOn && 'area-off')}>
            <div className="config-area-head">
              <div>
                <div className="config-area-title">{area.label}</div>
                <div className="config-area-hint">{area.hint}</div>
              </div>
              {area.hasMaster && (
                <Switch
                  on={masterOn}
                  label={`Area ${area.label}`}
                  onToggle={() => onChange(withFlag(config, area.area, 'enabled', !masterOn))}
                />
              )}
            </div>
            {area.groups.length > 0 && (
              <div className={clsx('config-groups', area.hasMaster && !masterOn && 'dimmed')}>
                {area.groups.map((g) => {
                  const on = getFlag(config, g.area, g.key);
                  return (
                    <div key={g.key} className="switch-row">
                      <div>
                        <div className="switch-label">{g.label}</div>
                        <div className="switch-hint">{g.hint}</div>
                      </div>
                      <Switch
                        on={on}
                        label={g.label}
                        onToggle={() => onChange(withFlag(config, g.area, g.key, !on))}
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
