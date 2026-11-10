/**
 * Safe Mathematical & Scientific Expression Parser and Evaluator.
 * Implements a recursive descent parser respecting standard PEMDAS order of operations.
 * NO eval() or Function() constructor is used.
 */

export interface EvaluationResult {
  value?: number;
  formatted?: string;
  error?: string;
}

export interface EvalOptions {
  angleMode?: 'deg' | 'rad';
}

export function evaluateExpression(
  rawInput: string,
  options: EvalOptions = { angleMode: 'deg' }
): EvaluationResult {
  try {
    if (!rawInput || rawInput.trim().length === 0) {
      return { value: 0, formatted: '0' };
    }

    const isDeg = options.angleMode !== 'rad';

    // Normalize operators and constants
    let normalized = rawInput
      .replace(/×/g, '*')
      .replace(/÷/g, '/')
      .replace(/−/g, '-')
      .replace(/π/g, String(Math.PI))
      .replace(/\bpi\b/gi, String(Math.PI))
      .replace(/\be\b/g, String(Math.E))
      .replace(/\s+/g, '');

    // Tokenizer
    const tokens: string[] = [];
    let i = 0;
    while (i < normalized.length) {
      const ch = normalized[i];

      if ('+-*/%^()'.includes(ch)) {
        tokens.push(ch);
        i++;
      } else if (/[0-9.]/.test(ch)) {
        let numStr = '';
        while (i < normalized.length && /[0-9.]/.test(normalized[i])) {
          numStr += normalized[i];
          i++;
        }
        tokens.push(numStr);
      } else if (/[a-zA-Z]/.test(ch)) {
        let funcName = '';
        while (i < normalized.length && /[a-zA-Z]/.test(normalized[i])) {
          funcName += normalized[i];
          i++;
        }
        tokens.push(funcName.toLowerCase());
      } else {
        return { error: 'Invalid character: ' + ch };
      }
    }

    let tokenIndex = 0;

    function peek(): string | undefined {
      return tokens[tokenIndex];
    }

    function consume(expected?: string): string {
      const token = tokens[tokenIndex];
      if (expected && token !== expected) {
        throw new Error(`Expected '${expected}', got '${token}'`);
      }
      tokenIndex++;
      return token;
    }

    const KNOWN_FUNCS = ['sin', 'cos', 'tan', 'asin', 'acos', 'atan', 'sqrt', 'cbrt', 'log', 'ln', 'abs'];

    function toRad(angle: number): number {
      return isDeg ? (angle * Math.PI) / 180 : angle;
    }

    function fromRad(val: number): number {
      return isDeg ? (val * 180) / Math.PI : val;
    }

    function applyFunction(fn: string, arg: number): number {
      switch (fn) {
        case 'sin':
          return Math.sin(toRad(arg));
        case 'cos':
          return Math.cos(toRad(arg));
        case 'tan':
          return Math.tan(toRad(arg));
        case 'asin':
          return fromRad(Math.asin(arg));
        case 'acos':
          return fromRad(Math.acos(arg));
        case 'atan':
          return fromRad(Math.atan(arg));
        case 'sqrt':
          if (arg < 0) throw new Error('Cannot square root negative number');
          return Math.sqrt(arg);
        case 'cbrt':
          return Math.cbrt(arg);
        case 'log':
          if (arg <= 0) throw new Error('Logarithm undefined for non-positive');
          return Math.log10(arg);
        case 'ln':
          if (arg <= 0) throw new Error('Ln undefined for non-positive');
          return Math.log(arg);
        case 'abs':
          return Math.abs(arg);
        default:
          throw new Error(`Unknown function: ${fn}`);
      }
    }

    // Grammar:
    // parseExpression -> parseTerm ( ('+' | '-') parseTerm )*
    // parseTerm       -> parsePower ( ('*' | '/' | '%') parsePower )*
    // parsePower      -> parseFactor ( '^' parsePower )?
    // parseFactor     -> ('+' | '-')? ( NUMBER | FUNC '(' parseExpression ')' | '(' parseExpression ')' )

    function parseFactor(): number {
      const current = peek();
      if (!current) {
        throw new Error('Unexpected end of expression');
      }

      // Unary +/-
      if (current === '+' || current === '-') {
        consume();
        const factor = parseFactor();
        return current === '-' ? -factor : factor;
      }

      // Known function e.g. sin(30)
      if (KNOWN_FUNCS.includes(current)) {
        const fn = consume();
        let arg: number;
        if (peek() === '(') {
          consume('(');
          arg = parseExpression();
          if (peek() !== ')') {
            throw new Error("Missing ')' for " + fn);
          }
          consume(')');
        } else {
          arg = parseFactor();
        }
        return applyFunction(fn, arg);
      }

      if (current === '(') {
        consume('(');
        const val = parseExpression();
        if (peek() !== ')') {
          throw new Error("Missing ')'");
        }
        consume(')');
        return val;
      }

      // Must be a number
      const numStr = consume();
      const val = parseFloat(numStr);
      if (isNaN(val)) {
        throw new Error(`Invalid number: ${numStr}`);
      }
      return val;
    }

    function parsePower(): number {
      let val = parseFactor();
      if (peek() === '^') {
        consume('^');
        const exponent = parsePower(); // right-associative
        val = Math.pow(val, exponent);
      }
      return val;
    }

    function parseTerm(): number {
      let val = parsePower();
      while (tokenIndex < tokens.length) {
        const op = peek();
        if (op === '*' || op === '/' || op === '%') {
          consume();
          const nextPower = parsePower();
          if (op === '*') {
            val *= nextPower;
          } else if (op === '/') {
            if (nextPower === 0) {
              throw new Error('Cannot divide by zero');
            }
            val /= nextPower;
          } else if (op === '%') {
            if (nextPower === 0) {
              throw new Error('Cannot divide by zero');
            }
            val %= nextPower;
          }
        } else {
          break;
        }
      }
      return val;
    }

    function parseExpression(): number {
      let val = parseTerm();
      while (tokenIndex < tokens.length) {
        const op = peek();
        if (op === '+' || op === '-') {
          consume();
          const nextTerm = parseTerm();
          if (op === '+') {
            val += nextTerm;
          } else {
            val -= nextTerm;
          }
        } else {
          break;
        }
      }
      return val;
    }

    const result = parseExpression();

    if (tokenIndex < tokens.length) {
      return { error: 'Syntax error' };
    }

    if (!isFinite(result)) {
      return { error: 'Result is undefined' };
    }

    // Clean floating point precision inaccuracies (e.g. 0.1 + 0.2 = 0.3)
    const rounded = Math.round(result * 1e10) / 1e10;
    const formatted = rounded.toLocaleString('en-US', {
      maximumFractionDigits: 8,
      useGrouping: true,
    });

    return { value: rounded, formatted };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error';
    return { error: message };
  }
}
