import { mod97 } from './checks';

/** Replace letters with numbers (A=10 … Z=35) as required by ISO 13616. */
export function lettersToDigits(value: string): string {
  return value
    .toUpperCase()
    .split('')
    .map((c) => (c >= 'A' && c <= 'Z' ? String(c.charCodeAt(0) - 55) : c))
    .join('');
}

export function makeIban(countryCode: string, bban: string): string {
  const check = 98 - mod97(lettersToDigits(bban + countryCode + '00'));
  return countryCode + String(check).padStart(2, '0') + bban;
}

export function isValidIbanChecksum(iban: string): boolean {
  const clean = iban.replace(/\s+/g, '').toUpperCase();
  return mod97(lettersToDigits(clean.slice(4) + clean.slice(0, 4))) === 1;
}

export function formatIban(iban: string): string {
  return iban.replace(/(.{4})/g, '$1 ').trim();
}
