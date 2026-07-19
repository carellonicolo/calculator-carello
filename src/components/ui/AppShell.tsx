import type { ReactNode } from 'react';
import { AUTH_ORIGIN } from '../../lib/auth';
import { BackgroundDecor } from './BackgroundDecor';
import { Footer } from './Footer';

interface Props {
  children: ReactNode;
}

/**
 * Guscio dell'app: top bar unificata Carello (web component, vedi
 * public/carello-shell.js) + sfondo decorativo + footer.
 * Tema e launcher sono gestiti dalla shell; l'avatar apre Profilo/Logout SSO.
 */
export function AppShell({ children }: Props) {
  return (
    <div className="shell">
      <carello-shell
        app-name="Calcolatrice"
        app-icon="Calculator"
        accent="#E0662B"
        user="NC"
        data-hub-url="https://nicolocarello.it"
        data-auth-url={AUTH_ORIGIN}
      />
      <BackgroundDecor />
      {children}
      <Footer />
    </div>
  );
}
