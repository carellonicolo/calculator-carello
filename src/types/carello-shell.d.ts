// Tipi per il custom element <carello-shell> (web component esterno,
// servito da public/carello-shell.js). Serve solo a far accettare l'elemento
// dal type-checker TSX. Rollback: elimina questo file insieme allo <script>.
import type { DetailedHTMLProps, HTMLAttributes } from 'react';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'carello-shell': DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> & {
        'app-name'?: string;
        'app-icon'?: string;
        accent?: string;
        user?: string;
        'data-hub-url'?: string;
        'data-auth-url'?: string;
        'data-dash-url'?: string;
        'data-dash-label'?: string;
        'data-theme-key'?: string;
        'data-console-url'?: string;
        'data-console-label'?: string;
      };
    }
  }
}

export {};
