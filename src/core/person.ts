import type { Gender, GenerateOptions } from './types';
import type { Rng } from './rng';
import { pad } from './checks';
import { foldToLatin } from './latin';

export interface BirthDate {
  year: number;
  month: number;
  day: number;
  iso: string;
  age: number;
}

export function pickGender(rng: Rng, options: Required<GenerateOptions>): Gender {
  if (options.gender !== 'any') return options.gender;
  return rng.bool() ? 'male' : 'female';
}

/**
 * Picks a bank, honouring `options.bank`. The random draw is always made so that choosing a
 * bank leaves the rest of the persona generated from a seed unchanged.
 */
export function pickBank<T extends NamedBank>(rng: Rng, banks: readonly T[], options: Required<GenerateOptions>): T {
  const random = rng.pick(banks);
  return banks.find((b) => bankName(b) === options.bank) ?? random;
}

/** Bank tables key their Latin-script name as `name`, or `en` where there is also a native name. */
type NamedBank = { name: string } | { en: string };
export const bankName = (bank: NamedBank) => ('name' in bank ? bank.name : bank.en);

export function birthDate(rng: Rng, options: Required<GenerateOptions>, today = new Date()): BirthDate {
  const age = rng.int(options.minAge, options.maxAge);
  // Pick a random day within the year that yields exactly `age` today.
  const latest = Date.UTC(today.getUTCFullYear() - age, today.getUTCMonth(), today.getUTCDate());
  const earliest = Date.UTC(today.getUTCFullYear() - age - 1, today.getUTCMonth(), today.getUTCDate()) + 86_400_000;
  const d = new Date(earliest + Math.floor(rng.next() * ((latest - earliest) / 86_400_000 + 1)) * 86_400_000);
  const year = d.getUTCFullYear();
  const month = d.getUTCMonth() + 1;
  const day = d.getUTCDate();
  return { year, month, day, age, iso: `${year}-${pad(month, 2)}-${pad(day, 2)}` };
}

/** Strip diacritics so names can be used in emails and Latin-only identifiers. */
export function ascii(value: string): string {
  return foldToLatin(value);
}

const EMAIL_DOMAINS = ['example.com', 'example.net', 'example.org'];

/** Emails always use the IANA-reserved example domains so they can never reach a real inbox. */
export function email(rng: Rng, given: string, family: string): string {
  const clean = (s: string) => ascii(s).toLowerCase().replace(/[^a-z]/g, '');
  const style = rng.int(0, 2);
  const local =
    style === 0
      ? `${clean(given)}.${clean(family)}`
      : style === 1
        ? `${clean(given)[0]}${clean(family)}${rng.int(1, 99)}`
        : `${clean(given)}${clean(family)[0]}${rng.int(70, 2005)}`;
  return `${local}@${rng.pick(EMAIL_DOMAINS)}`;
}

/** A pair of male/female values, used for name pools and gendered word forms. */
export type Gendered<T> = Record<Gender, T>;
