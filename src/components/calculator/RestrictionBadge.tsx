import { useState } from 'react';
import { ShieldAlert } from 'lucide-react';
import { countRestrictions, restrictionSummary, type CalcConfig } from '../../lib/config';

/**
 * Indicatore discreto di "modalità verifica": dice allo studente che alcune
 * funzioni mancano perché disattivate dal docente (non per un bug).
 */
export function RestrictionBadge({ config }: { config: CalcConfig }) {
  const [open, setOpen] = useState(false);
  const n = countRestrictions(config);
  if (n === 0) return null;
  const lines = restrictionSummary(config);
  return (
    <span
      className="restriction-chip"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onClick={() => setOpen((o) => !o)}
      role="button"
      tabIndex={0}
      aria-expanded={open}
    >
      <ShieldAlert size={14} aria-hidden="true" />
      Configurazione verifica
      {open && (
        <span className="restriction-pop">
          Il docente ha limitato alcune funzioni:
          <ul>
            {lines.map((l) => (
              <li key={l}>{l}</li>
            ))}
          </ul>
        </span>
      )}
    </span>
  );
}
