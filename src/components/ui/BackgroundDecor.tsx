/**
 * Sfondo decorativo del tema Carello: blob sfumati animati (come VLSM/CCNA1)
 * + simboli matematici fluttuanti quasi impercettibili, il "particolare"
 * di questa app.
 */

const SYMBOLS: { glyph: string; top: string; left: string; size: number; delay: number }[] = [
  { glyph: 'π', top: '14%', left: '7%', size: 58, delay: 0 },
  { glyph: '√', top: '68%', left: '5%', size: 74, delay: -6 },
  { glyph: '∑', top: '22%', left: '88%', size: 66, delay: -3 },
  { glyph: '÷', top: '78%', left: '90%', size: 54, delay: -10 },
  { glyph: '∞', top: '8%', left: '55%', size: 48, delay: -14 },
  { glyph: '≈', top: '55%', left: '72%', size: 44, delay: -8 },
  { glyph: 'ƒ(x)', top: '84%', left: '38%', size: 38, delay: -17 },
  { glyph: '0b101', top: '38%', left: '13%', size: 26, delay: -11 },
];

export function BackgroundDecor() {
  return (
    <div className="bg-decor" aria-hidden="true">
      <div className="bg-blob bg-blob-1" />
      <div className="bg-blob bg-blob-2" />
      <div className="bg-blob bg-blob-3" />
      {SYMBOLS.map((s) => (
        <span
          key={s.glyph}
          className="bg-symbol"
          style={{
            top: s.top,
            left: s.left,
            fontSize: s.size,
            animationDelay: `${s.delay}s`,
          }}
        >
          {s.glyph}
        </span>
      ))}
    </div>
  );
}
