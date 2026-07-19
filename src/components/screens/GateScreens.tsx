import { Calculator, Hourglass, ShieldX, WifiOff } from 'lucide-react';
import { redirectToLogout } from '../../lib/auth';

export function LoadingScreen() {
  return (
    <div className="gate-wrap" aria-busy="true">
      <div className="gate-icon">
        <Calculator size={30} />
      </div>
      <h1 className="gate-title">Calcolatrice</h1>
      <p className="gate-text">Verifica dell'accesso in corso…</p>
    </div>
  );
}

export function PendingScreen({ message }: { message: string | null }) {
  return (
    <div className="gate-wrap">
      <div className="gate-icon">
        <Hourglass size={30} />
      </div>
      <h1 className="gate-title">Account in attesa</h1>
      <p className="gate-text">
        {message ??
          'Il tuo account è registrato ma la classe non è ancora stata approvata dal docente. Riprova più tardi.'}
      </p>
      <button type="button" className="btn btn-secondary" onClick={redirectToLogout}>
        Esci
      </button>
    </div>
  );
}

export function NotActiveScreen({ message }: { message: string | null }) {
  return (
    <div className="gate-wrap">
      <div className="gate-icon">
        <ShieldX size={30} />
      </div>
      <h1 className="gate-title">Accesso non disponibile</h1>
      <p className="gate-text">{message ?? 'Il tuo account non è attivo. Contatta il docente.'}</p>
      <button type="button" className="btn btn-secondary" onClick={redirectToLogout}>
        Esci
      </button>
    </div>
  );
}

export function ErrorScreen({ message, onRetry }: { message: string | null; onRetry: () => void }) {
  return (
    <div className="gate-wrap">
      <div className="gate-icon">
        <WifiOff size={30} />
      </div>
      <h1 className="gate-title">Qualcosa non va</h1>
      <p className="gate-text">{message ?? 'Errore di rete.'}</p>
      <button type="button" className="btn" onClick={onRetry}>
        Riprova
      </button>
    </div>
  );
}
