/** Checksum algorithms shared across countries. */

export const toDigits = (s: string): number[] => s.split('').map(Number);

/** Sum of digit × weight, over the first `weights.length` digits of `value`. */
export function weightedSum(value: string, weights: readonly number[]): number {
  return weights.reduce((sum, w, i) => sum + Number(value[i]) * w, 0);
}

/** Luhn (mod 10, doubling every second digit from the right). */
export function luhnValid(value: string): boolean {
  let sum = 0;
  const digits = toDigits(value).reverse();
  digits.forEach((d, i) => {
    if (i % 2 === 1) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
  });
  return sum % 10 === 0;
}

export function luhnCheckDigit(partial: string): string {
  return solveCheckDigit((d) => luhnValid(partial + d));
}

/** Remainder of a long numeric string modulo 97 (ISO 7064 MOD 97-10). */
export function mod97(numeric: string): number {
  let remainder = 0;
  for (let i = 0; i < numeric.length; i += 7) {
    remainder = Number(String(remainder) + numeric.slice(i, i + 7)) % 97;
  }
  return remainder;
}

const VERHOEFF_D = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 2, 3, 4, 0, 6, 7, 8, 9, 5],
  [2, 3, 4, 0, 1, 7, 8, 9, 5, 6],
  [3, 4, 0, 1, 2, 8, 9, 5, 6, 7],
  [4, 0, 1, 2, 3, 9, 5, 6, 7, 8],
  [5, 9, 8, 7, 6, 0, 4, 3, 2, 1],
  [6, 5, 9, 8, 7, 1, 0, 4, 3, 2],
  [7, 6, 5, 9, 8, 2, 1, 0, 4, 3],
  [8, 7, 6, 5, 9, 3, 2, 1, 0, 4],
  [9, 8, 7, 6, 5, 4, 3, 2, 1, 0],
];
const VERHOEFF_P = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 5, 7, 6, 2, 8, 3, 0, 9, 4],
  [5, 8, 0, 3, 7, 9, 6, 1, 4, 2],
  [8, 9, 1, 6, 0, 4, 3, 5, 2, 7],
  [9, 4, 5, 3, 1, 2, 8, 7, 0, 6],
  [4, 2, 8, 6, 5, 7, 3, 9, 1, 0],
  [2, 7, 9, 3, 8, 0, 6, 4, 1, 5],
  [7, 0, 4, 6, 9, 1, 3, 2, 5, 8],
];

export function verhoeffValid(value: string): boolean {
  let c = 0;
  toDigits(value)
    .reverse()
    .forEach((d, i) => {
      c = VERHOEFF_D[c][VERHOEFF_P[i % 8][d]];
    });
  return c === 0;
}

/**
 * Find the single character that makes `isValid` pass. Used where an algorithm is
 * easiest to express as a validator; returns '' if no character works.
 */
export function solveCheckDigit(isValid: (candidate: string) => boolean, alphabet = '0123456789'): string {
  for (const c of alphabet) if (isValid(c)) return c;
  return '';
}

export const pad = (value: string | number, length: number): string => String(value).padStart(length, '0');
