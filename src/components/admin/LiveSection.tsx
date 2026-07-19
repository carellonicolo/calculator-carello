import { useEffect, useMemo, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { apiTeacherLive, type LiveSessionRow } from '../../lib/api';

/** "2 min fa", "adesso", "1 h fa" */
function relTime(iso: string): string {
  const delta = Date.now() - Date.parse(iso);
  if (!Number.isFinite(delta)) return '—';
  const min = Math.floor(delta / 60000);
  if (min < 1) return 'adesso';
  if (min < 60) return `${min} min fa`;
  const h = Math.floor(min / 60);
  return `${h} h fa`;
}

/** Log utilizzi (ultime 12 ore) con indicatore "online adesso", refresh 10 s. */
export function LiveSection() {
  const [sessions, setSessions] = useState<LiveSessionRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [classFilter, setClassFilter] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      const res = await apiTeacherLive();
      if (!alive) return;
      if (res.ok && res.data) {
        setSessions(res.data.sessions);
        setError(null);
      } else {
        setError(res.error ?? 'Errore');
      }
    };
    void load();
    const id = window.setInterval(() => void load(), 10_000);
    return () => {
      alive = false;
      window.clearInterval(id);
    };
  }, []);

  const classes = useMemo(() => {
    const set = new Set<string>();
    for (const s of sessions ?? []) if (s.class) set.add(s.class);
    return [...set].sort((a, b) => a.localeCompare(b, 'it', { numeric: true }));
  }, [sessions]);

  const filtered = useMemo(
    () => (sessions ?? []).filter((s) => !classFilter || s.class === classFilter),
    [sessions, classFilter]
  );

  const onlineCount = (sessions ?? []).filter((s) => s.online).length;

  return (
    <div className="rcard">
      <div className="admin-topline" style={{ marginBottom: 10 }}>
        <h3 className="rcard-title" style={{ margin: 0 }}>
          In diretta
        </h3>
        <span className="muted" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <span className={`online-dot${onlineCount > 0 ? ' on' : ''}`} />
          {onlineCount} online adesso · aggiornamento automatico <RefreshCw size={12} />
        </span>
      </div>

      {classes.length > 1 && (
        <div className="chip-select" style={{ marginBottom: 10 }}>
          <button
            type="button"
            className={`chip-check${classFilter === null ? ' on' : ''}`}
            onClick={() => setClassFilter(null)}
          >
            Tutte
          </button>
          {classes.map((c) => (
            <button
              key={c}
              type="button"
              className={`chip-check${classFilter === c ? ' on' : ''}`}
              onClick={() => setClassFilter(c)}
            >
              {c}
            </button>
          ))}
        </div>
      )}

      {error && <p style={{ color: 'var(--error)' }}>{error}</p>}
      {sessions === null ? (
        <p className="muted">Caricamento…</p>
      ) : filtered.length === 0 ? (
        <p className="muted">
          Nessuna apertura nelle ultime 12 ore{classFilter ? ` per la classe ${classFilter}` : ''}.
        </p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table className="live-table">
            <thead>
              <tr>
                <th></th>
                <th>Studente</th>
                <th>Classe</th>
                <th>Aperta</th>
                <th>Ultimo segnale</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s, i) => (
                <tr key={`${s.email}-${s.openedAt}-${i}`}>
                  <td>
                    <span className={`online-dot${s.online ? ' on' : ''}`} title={s.online ? 'Online adesso' : 'Non attivo'} />
                  </td>
                  <td>
                    <b>{s.fullName}</b>
                    <div className="muted" style={{ fontSize: 11.5 }}>
                      {s.email}
                    </div>
                  </td>
                  <td>{s.class ?? '—'}</td>
                  <td>
                    {new Date(s.openedAt).toLocaleTimeString('it-IT', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </td>
                  <td>{s.online ? 'adesso' : relTime(s.lastSeenAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
