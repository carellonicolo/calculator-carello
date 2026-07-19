import type { Config } from 'tailwindcss';

// Il grosso dello stile vive in src/index.css (classi calc-*, variabili tema
// caldo "Carello"). Tailwind resta disponibile per le utility di layout
// (flex/grid/spacing) nella console docente e nei pannelli.
const config: Config = {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {},
  },
  plugins: [],
};

export default config;
