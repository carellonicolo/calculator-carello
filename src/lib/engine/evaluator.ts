/**
 * Motore di calcolo — tokenizer + parser Pratt + valutatore su AST.
 * Niente eval(): l'espressione è analizzata in un AST controllato.
 *
 * I permessi (gruppi disattivati dal docente) sono applicati QUI: è l'unico
 * punto di enforcement, condiviso da calcolatrice e grafici. Se una funzione
 * è disattivata, anche digitandola nel grafico si ottiene un errore.
 */

export type AngleMode = 'deg' | 'rad';

export interface EnginePermissions {
  /** Nomi funzione ammessi (sin, cos, ln, ...). */
  functions: ReadonlySet<string>;
  /** Costanti π ed e. */
  constants: boolean;
  /** Fattoriale postfisso n! */
  factorial: boolean;
  /** Percentuale postfissa (50% → 0.5). */
  percent: boolean;
  /** Operatore potenza ^. */
  power: boolean;
}

export const ALL_FUNCTIONS = [
  'sin', 'cos', 'tan', 'asin', 'acos', 'atan',
  'sinh', 'cosh', 'tanh',
  'ln', 'log', 'sqrt', 'cbrt', 'exp', 'pow10', 'abs',
  'floor', 'ceil', 'round', 'sign',
  'se', 'min', 'max',
] as const;

/** Arità ammessa per funzione (min/max argomenti, separati da ";"). */
const FN_ARITY: Record<string, { min: number; max: number }> = {
  se: { min: 3, max: 3 },
  min: { min: 2, max: 8 },
  max: { min: 2, max: 8 },
};

function arityOf(name: string): { min: number; max: number } {
  return FN_ARITY[name] ?? { min: 1, max: 1 };
}

export function fullPermissions(): EnginePermissions {
  return {
    functions: new Set<string>(ALL_FUNCTIONS),
    constants: true,
    factorial: true,
    percent: true,
    power: true,
  };
}

/** Errore di calcolo (sintassi, dominio, divisione per zero...). */
export class CalcError extends Error {}

/** Errore per funzione/operazione disattivata dal docente. */
export class CalcPermissionError extends CalcError {}

interface EvalOptions {
  angleMode: AngleMode;
  permissions: EnginePermissions;
  /** Nomi di variabile ammessi (es. ['x'] per i grafici). */
  variables?: readonly string[];
}

// ---------------------------------------------------------------- Tokenizer

type Tok =
  | { kind: 'num'; value: number }
  | { kind: 'ident'; name: string }
  | { kind: 'op'; op: string };

const OPS = new Set(['+', '-', '*', '/', '^', '(', ')', '!', '%']);

function tokenize(src: string): Tok[] {
  const toks: Tok[] = [];
  let i = 0;
  while (i < src.length) {
    const c = src[i];
    if (c === ' ' || c === '\t') {
      i++;
      continue;
    }
    // Confronti (per le funzioni a tratti): < > <= >= e i simboli ≤ ≥.
    if (c === '<' || c === '>') {
      const op = src[i + 1] === '=' ? c + '=' : c;
      toks.push({ kind: 'op', op });
      i += op.length;
      continue;
    }
    if (c === '≤') {
      toks.push({ kind: 'op', op: '<=' });
      i++;
      continue;
    }
    if (c === '≥') {
      toks.push({ kind: 'op', op: '>=' });
      i++;
      continue;
    }
    // Separatore degli argomenti: se(x<0; -x; x^2).
    if (c === ';') {
      toks.push({ kind: 'op', op: ';' });
      i++;
      continue;
    }
    if (OPS.has(c)) {
      toks.push({ kind: 'op', op: c });
      i++;
      continue;
    }
    // Simboli greci di uso comune: θ come variabile, π come costante.
    if (c === 'θ') {
      toks.push({ kind: 'ident', name: 'theta' });
      i++;
      continue;
    }
    if (c === 'π') {
      toks.push({ kind: 'ident', name: 'pi' });
      i++;
      continue;
    }
    // Numeri: il separatore decimale è il punto O la virgola (0,5 ≡ 0.5).
    // La virgola conta come decimale solo se seguita da una cifra.
    const isDigit = (k: number) => src[k] >= '0' && src[k] <= '9';
    const startsNumber = isDigit(i) || c === '.' || (c === ',' && i + 1 < src.length && isDigit(i + 1));
    if (startsNumber) {
      let j = i;
      let dots = 0;
      while (j < src.length) {
        const ch = src[j];
        if (isDigit(j)) {
          j++;
          continue;
        }
        if (ch === '.' || (ch === ',' && j + 1 < src.length && isDigit(j + 1))) {
          dots++;
          j++;
          continue;
        }
        break;
      }
      const text = src.slice(i, j).replace(/,/g, '.');
      if (dots > 1 || text === '.') throw new CalcError('Numero non valido');
      toks.push({ kind: 'num', value: parseFloat(text) });
      i = j;
      continue;
    }
    if (c === ',') {
      throw new CalcError('Per separare gli argomenti usa ";" (la virgola è il separatore decimale)');
    }
    if (/[a-zA-Z]/.test(c)) {
      let j = i;
      while (j < src.length && /[a-zA-Z0-9]/.test(src[j])) j++;
      toks.push({ kind: 'ident', name: src.slice(i, j) });
      i = j;
      continue;
    }
    throw new CalcError(`Simbolo non riconosciuto: "${c}"`);
  }
  return toks;
}

// -------------------------------------------------------------------- AST

type CmpOp = '<' | '<=' | '>' | '>=';

type Ast =
  | { t: 'num'; v: number }
  | { t: 'const'; name: 'pi' | 'e' }
  | { t: 'var'; name: string }
  | { t: 'neg'; a: Ast }
  | { t: 'bin'; op: '+' | '-' | '*' | '/' | '^'; a: Ast; b: Ast }
  | { t: 'cmp'; op: CmpOp; a: Ast; b: Ast }
  | { t: 'post'; op: '!' | '%'; a: Ast }
  | { t: 'fn'; name: string; args: Ast[] };

const FN_SET = new Set<string>(ALL_FUNCTIONS);

class Parser {
  private pos = 0;
  constructor(
    private toks: Tok[],
    private variables: readonly string[]
  ) {}

  parse(): Ast {
    if (this.toks.length === 0) throw new CalcError('Espressione vuota');
    const ast = this.expr(0);
    if (this.pos < this.toks.length) throw new CalcError('Sintassi non valida');
    return ast;
  }

  private peek(): Tok | undefined {
    return this.toks[this.pos];
  }

  private next(): Tok {
    const t = this.toks[this.pos];
    if (!t) throw new CalcError('Espressione incompleta');
    this.pos++;
    return t;
  }

  private expect(op: string): void {
    const t = this.peek();
    if (!t || t.kind !== 'op' || t.op !== op) {
      throw new CalcError(op === ')' ? 'Parentesi non chiusa' : `Atteso "${op}"`);
    }
    this.pos++;
  }

  /** Il token può iniziare un operando? (per la moltiplicazione implicita) */
  private startsOperand(t: Tok): boolean {
    return t.kind === 'num' || t.kind === 'ident' || (t.kind === 'op' && t.op === '(');
  }

  private nud(): Ast {
    const t = this.next();
    if (t.kind === 'num') return { t: 'num', v: t.value };
    if (t.kind === 'ident') {
      if (t.name === 'pi' || t.name === 'e') return { t: 'const', name: t.name };
      if (FN_SET.has(t.name)) {
        this.expect('(');
        const args: Ast[] = [this.expr(0)];
        while (this.peek()?.kind === 'op' && (this.peek() as { op: string }).op === ';') {
          this.pos++;
          args.push(this.expr(0));
        }
        this.expect(')');
        const { min, max } = arityOf(t.name);
        if (args.length < min || args.length > max) {
          if (t.name === 'se') {
            throw new CalcError('se richiede 3 argomenti: se(condizione; se_vera; se_falsa)');
          }
          throw new CalcError(
            min === max
              ? `${t.name} richiede ${min} argoment${min === 1 ? 'o' : 'i'}`
              : `${t.name} richiede da ${min} a ${max} argomenti (separati da ";")`
          );
        }
        return { t: 'fn', name: t.name, args };
      }
      if (this.variables.includes(t.name)) return { t: 'var', name: t.name };
      throw new CalcError(`Funzione o simbolo sconosciuto: "${t.name}"`);
    }
    // t.kind === 'op'
    if (t.op === '(') {
      const a = this.expr(0);
      this.expect(')');
      return a;
    }
    // Meno unario: lega meno stretto di ^ (così -2^2 = -(2^2) = -4).
    if (t.op === '-') return { t: 'neg', a: this.expr(25) };
    if (t.op === '+') return this.expr(25);
    throw new CalcError('Sintassi non valida');
  }

  private expr(rbp: number): Ast {
    let left = this.nud();
    for (;;) {
      const t = this.peek();
      if (!t) break;
      if (t.kind === 'op') {
        if (t.op === '+' || t.op === '-') {
          if (10 <= rbp) break;
          this.pos++;
          left = { t: 'bin', op: t.op, a: left, b: this.expr(10) };
          continue;
        }
        if (t.op === '*' || t.op === '/') {
          if (20 <= rbp) break;
          this.pos++;
          left = { t: 'bin', op: t.op, a: left, b: this.expr(20) };
          continue;
        }
        if (t.op === '^') {
          if (30 <= rbp) break;
          this.pos++;
          // Associativa a destra: 2^3^2 = 2^(3^2).
          left = { t: 'bin', op: '^', a: left, b: this.expr(29) };
          continue;
        }
        if (t.op === '!' || t.op === '%') {
          if (45 <= rbp) break;
          this.pos++;
          left = { t: 'post', op: t.op, a: left };
          continue;
        }
        // Confronti: legano meno di + e − (x+1 < 2x è (x+1) < (2x)).
        if (t.op === '<' || t.op === '<=' || t.op === '>' || t.op === '>=') {
          if (5 <= rbp) break;
          this.pos++;
          left = { t: 'cmp', op: t.op as CmpOp, a: left, b: this.expr(6) };
          continue;
        }
        if (t.op === ')' || t.op === ';') break;
        // "2(3+4)": parentesi aperta dopo un operando → moltiplicazione implicita.
        if (t.op === '(') {
          if (20 <= rbp) break;
          left = { t: 'bin', op: '*', a: left, b: this.expr(20) };
          continue;
        }
        throw new CalcError('Sintassi non valida');
      }
      // Moltiplicazione implicita: 2π, 2sin(30), 2x...
      if (this.startsOperand(t)) {
        if (20 <= rbp) break;
        left = { t: 'bin', op: '*', a: left, b: this.expr(20) };
        continue;
      }
      throw new CalcError('Sintassi non valida');
    }
    return left;
  }
}

// -------------------------------------------------------------- Valutatore

const DEG2RAD = Math.PI / 180;
const RAD2DEG = 180 / Math.PI;

function factorial(v: number): number {
  if (!Number.isInteger(v) || v < 0) {
    throw new CalcError('Il fattoriale è definito solo per interi ≥ 0');
  }
  if (v > 170) throw new CalcError('Fattoriale troppo grande (max 170!)');
  let r = 1;
  for (let k = 2; k <= v; k++) r *= k;
  return r;
}

function applyFn(name: string, x: number, mode: AngleMode): number {
  switch (name) {
    case 'sin':
      return Math.sin(mode === 'deg' ? x * DEG2RAD : x);
    case 'cos':
      return Math.cos(mode === 'deg' ? x * DEG2RAD : x);
    case 'tan':
      return Math.tan(mode === 'deg' ? x * DEG2RAD : x);
    case 'asin':
      if (x < -1 || x > 1) throw new CalcError('asin: fuori dal dominio [−1, 1]');
      return mode === 'deg' ? Math.asin(x) * RAD2DEG : Math.asin(x);
    case 'acos':
      if (x < -1 || x > 1) throw new CalcError('acos: fuori dal dominio [−1, 1]');
      return mode === 'deg' ? Math.acos(x) * RAD2DEG : Math.acos(x);
    case 'atan':
      return mode === 'deg' ? Math.atan(x) * RAD2DEG : Math.atan(x);
    case 'ln':
      if (x <= 0) throw new CalcError('Logaritmo di un numero non positivo');
      return Math.log(x);
    case 'log':
      if (x <= 0) throw new CalcError('Logaritmo di un numero non positivo');
      return Math.log10(x);
    case 'sqrt':
      if (x < 0) throw new CalcError('Radice quadrata di un numero negativo');
      return Math.sqrt(x);
    case 'cbrt':
      return Math.cbrt(x);
    case 'exp':
      return Math.exp(x);
    case 'pow10':
      return Math.pow(10, x);
    case 'abs':
      return Math.abs(x);
    case 'sinh':
      return Math.sinh(x);
    case 'cosh':
      return Math.cosh(x);
    case 'tanh':
      return Math.tanh(x);
    case 'floor':
      return Math.floor(x);
    case 'ceil':
      return Math.ceil(x);
    case 'round':
      return Math.round(x);
    case 'sign':
      return Math.sign(x);
    default:
      throw new CalcError(`Funzione sconosciuta: "${name}"`);
  }
}

function evalAst(ast: Ast, opts: EvalOptions, vars: Record<string, number>): number {
  switch (ast.t) {
    case 'num':
      return ast.v;
    case 'const':
      if (!opts.permissions.constants) {
        throw new CalcPermissionError('Costanti disattivate dal docente');
      }
      return ast.name === 'pi' ? Math.PI : Math.E;
    case 'var': {
      const v = vars[ast.name];
      if (v === undefined) throw new CalcError(`Variabile "${ast.name}" senza valore`);
      return v;
    }
    case 'neg':
      return -evalAst(ast.a, opts, vars);
    case 'bin': {
      if (ast.op === '^' && !opts.permissions.power) {
        throw new CalcPermissionError('Potenze disattivate dal docente');
      }
      const a = evalAst(ast.a, opts, vars);
      const b = evalAst(ast.b, opts, vars);
      switch (ast.op) {
        case '+':
          return a + b;
        case '-':
          return a - b;
        case '*':
          return a * b;
        case '/':
          if (b === 0) throw new CalcError('Divisione per zero');
          return a / b;
        case '^': {
          const r = Math.pow(a, b);
          if (Number.isNaN(r)) throw new CalcError('Potenza non definita');
          return r;
        }
      }
      // Irraggiungibile (il tipo di ast.op è esaustivo).
      throw new CalcError('Operatore non valido');
    }
    case 'post': {
      if (ast.op === '!') {
        if (!opts.permissions.factorial) {
          throw new CalcPermissionError('Fattoriale disattivato dal docente');
        }
        return factorial(evalAst(ast.a, opts, vars));
      }
      if (!opts.permissions.percent) {
        throw new CalcPermissionError('Percentuale disattivata dal docente');
      }
      return evalAst(ast.a, opts, vars) / 100;
    }
    case 'cmp': {
      const a = evalAst(ast.a, opts, vars);
      const b = evalAst(ast.b, opts, vars);
      switch (ast.op) {
        case '<':
          return a < b ? 1 : 0;
        case '<=':
          return a <= b ? 1 : 0;
        case '>':
          return a > b ? 1 : 0;
        case '>=':
          return a >= b ? 1 : 0;
      }
      throw new CalcError('Confronto non valido');
    }
    case 'fn': {
      if (!opts.permissions.functions.has(ast.name)) {
        throw new CalcPermissionError('Funzione disattivata dal docente');
      }
      // se(cond; a; b) è pigra: valuta SOLO il ramo scelto, così
      // se(x>0; ln(x); 0) non esplode dove ln non è definito.
      if (ast.name === 'se') {
        const cond = evalAst(ast.args[0], opts, vars);
        return evalAst(cond !== 0 ? ast.args[1] : ast.args[2], opts, vars);
      }
      if (ast.name === 'min' || ast.name === 'max') {
        const vals = ast.args.map((a) => evalAst(a, opts, vars));
        return ast.name === 'min' ? Math.min(...vals) : Math.max(...vals);
      }
      return applyFn(ast.name, evalAst(ast.args[0], opts, vars), opts.angleMode);
    }
  }
}

/**
 * Valuta un'espressione. Lancia CalcError su qualsiasi problema.
 * `vars` dà il valore delle variabili dichiarate in opts.variables
 * (es. ans = ultimo risultato, mem = memoria).
 */
export function evaluate(src: string, opts: EvalOptions, vars: Record<string, number> = {}): number {
  const ast = new Parser(tokenize(src), opts.variables ?? []).parse();
  const r = evalAst(ast, opts, vars);
  if (!Number.isFinite(r)) throw new CalcError('Risultato non definito');
  return r;
}

/**
 * Compila un'espressione con variabili (es. f(x) per i grafici): il parsing
 * avviene una sola volta, la valutazione per ogni x. Gli errori di permesso
 * emergono alla prima valutazione (CalcPermissionError).
 */
export function compile(src: string, opts: EvalOptions): (vars: Record<string, number>) => number {
  const ast = new Parser(tokenize(src), opts.variables ?? []).parse();
  return (vars) => evalAst(ast, opts, vars);
}

/**
 * Formatta un risultato per il display: massimo 12 cifre significative
 * (elimina il rumore del floating point: 0.1+0.2 → "0.3"), notazione
 * esponenziale per valori molto grandi o molto piccoli.
 */
export function formatResult(n: number): string {
  if (Object.is(n, -0)) n = 0;
  if (n === 0) return '0';
  const abs = Math.abs(n);
  if (abs >= 1e12 || abs < 1e-9) {
    return n
      .toExponential(8)
      .replace(/\.?0+e/, 'e')
      .replace('e+', 'e');
  }
  return String(parseFloat(n.toPrecision(12)));
}
