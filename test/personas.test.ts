import { createRequire } from 'node:module';
import { describe, expect, it } from 'vitest';
import * as ibantools from 'ibantools';
import { COUNTRIES, generatePersona } from '../src/countries';
import type { Persona } from '../src/core/types';
import { luhnValid, verhoeffValid } from '../src/core/checks';
import { irdValid, nzAccountValid, tfnValid, cnIdCheck } from '../src/countries/asia-pacific';
import { innPersonalValid, iranNationalCodeValid, ruAccountValid } from '../src/countries/russia-iran';
import { abaValid, cpfValid } from '../src/countries/americas';
import { nubanCheck } from '../src/countries/ng';

const require = createRequire(import.meta.url);
const oracle = require('uk-modulus-checking');
const UkModulusChecking = oracle.default ?? oracle;

const SAMPLES = 250;
const field = (p: Persona, label: string) => {
  const all = [...p.identity, ...p.bank.domestic, ...p.bank.international, ...(p.bank.extras ?? [])];
  const f = all.find((x) => x.label.startsWith(label));
  if (!f) throw new Error(`${p.country.code}: no field ${label}`);
  return f.value;
};
const digits = (s: string) => s.replace(/\D/g, '');

function personas(code: string): Persona[] {
  return Array.from({ length: SAMPLES }, (_, i) => generatePersona(code, {}, 1000 + i));
}

describe.each(COUNTRIES.map((c) => c.code))('%s', (code) => {
  const list = personas(code);

  it('has a valid BIC for the right country', () => {
    for (const p of list) {
      expect(ibantools.isValidBIC(p.bank.bic), p.bank.bic).toBe(true);
      expect(p.bank.bic.slice(4, 6)).toBe(code);
    }
  });

  it('has a valid IBAN wherever one is shown', () => {
    for (const p of list) {
      const iban = p.bank.international.find((f) => f.label.startsWith('IBAN'));
      if (!iban || iban.value.startsWith('Not used')) continue;
      const electronic = ibantools.electronicFormatIBAN(iban.value)!;
      expect(electronic.slice(0, 2)).toBe(code);
      expect(ibantools.isValidIBAN(electronic), electronic).toBe(true);
    }
  });

  it('respects gender and age options', () => {
    const p = generatePersona(code, { gender: 'female', minAge: 30, maxAge: 30 }, 42);
    expect(p.gender).toBe('female');
    expect(p.age).toBe(30);
  });

  it('is reproducible from its seed', () => {
    const { generatedAt: _a, ...a } = generatePersona(code, {}, 7);
    const { generatedAt: _b, ...b } = generatePersona(code, {}, 7);
    expect(a).toEqual(b);
  });

  it('uses reserved example email domains', () => {
    for (const p of list) expect(p.email).toMatch(/@example\.(com|net|org)$/);
  });
});

describe('country-specific identifiers', () => {
  it('GB sort code + account pass the Vocalink modulus check (independent implementation)', () => {
    for (const p of personas('GB')) {
      const sortCode = digits(field(p, 'Sort code'));
      const accountNumber = field(p, 'Account number');
      expect(new UkModulusChecking({ sortCode, accountNumber }).isValid(), `${sortCode} ${accountNumber}`).toBe(true);
    }
  });

  it('AU TFN', () => personas('AU').forEach((p) => expect(tfnValid(digits(field(p, 'Tax File Number')))).toBe(true)));

  it('NZ account and IRD', () => {
    for (const p of personas('NZ')) {
      const [bank, branch, base, suffix] = field(p, 'Account number').split('-');
      expect(nzAccountValid(bank, branch, base, suffix)).toBe(true);
      expect(irdValid(digits(field(p, 'IRD')))).toBe(true);
    }
  });

  it('CN card Luhn and resident ID', () => {
    for (const p of personas('CN')) {
      expect(luhnValid(digits(field(p, 'Account / card')))).toBe(true);
      const id = field(p, 'Resident');
      expect(cnIdCheck(id.slice(0, 17))).toBe(id[17]);
      expect(id.slice(6, 14)).toBe(p.dateOfBirth.replace(/-/g, ''));
    }
  });

  it('IN Aadhaar and IFSC', () => {
    for (const p of personas('IN')) {
      expect(verhoeffValid(digits(field(p, 'Aadhaar')))).toBe(true);
      expect(field(p, 'IFSC')).toMatch(/^[A-Z]{4}0[A-Z0-9]{6}$/);
      expect(field(p, 'PAN')).toMatch(/^[A-Z]{3}P[A-Z]\d{4}[A-Z]$/);
    }
  });

  it('RU account key and INN', () => {
    for (const p of personas('RU')) {
      expect(ruAccountValid(field(p, 'BIK'), field(p, 'Account (расчётный'))).toBe(true);
      expect(innPersonalValid(field(p, 'INN'))).toBe(true);
    }
  });

  it('IR national code and card', () => {
    for (const p of personas('IR')) {
      expect(iranNationalCodeValid(digits(field(p, 'National code')))).toBe(true);
      expect(luhnValid(digits(field(p, 'Card number')))).toBe(true);
    }
  });

  it('US routing number', () => personas('US').forEach((p) => expect(abaValid(field(p, 'Routing number'))).toBe(true)));

  it('MX CLABE and CURP shape', () => {
    for (const p of personas('MX')) {
      expect(field(p, 'CLABE')).toMatch(/^\d{18}$/);
      expect(field(p, 'CURP')).toMatch(/^[A-Z]{4}\d{6}[HM][A-Z]{5}[0-9A-Z]\d$/);
    }
  });

  it('BR CPF', () => personas('BR').forEach((p) => expect(cpfValid(field(p, 'CPF'))).toBe(true)));
});

it('KR resident registration numbers use place-of-birth codes 00–96', () => {
  for (let i = 0; i < 300; i++) {
    const p = generatePersona('KR', {}, i);
    const rrn = field(p, 'Resident registration').replace('-', '');
    expect(Number(rrn.slice(7, 9))).toBeLessThanOrEqual(96);
  }
});

describe('batch 4 identifiers', () => {
  it('AE Emirates ID: 784, birth year, Luhn', () => {
    for (let i = 0; i < 300; i++) {
      const p = generatePersona('AE', {}, i);
      const id = digits(field(p, 'Emirates ID'));
      expect(id.slice(0, 3)).toBe('784');
      expect(id.slice(3, 7)).toBe(p.dateOfBirth.slice(0, 4));
      expect(luhnValid(id)).toBe(true);
    }
  });
  it('NG NUBAN check digit matches the bank code', () => {
    for (let i = 0; i < 300; i++) {
      const p = generatePersona('NG', {}, i);
      const nuban = field(p, 'Account number (NUBAN)');
      expect(nubanCheck(field(p, 'Bank code'), nuban.slice(0, 9))).toBe(Number(nuban[9]));
    }
  });
  it('AE mixes Emirati and expatriate residents', () => {
    const nationalities = new Set(Array.from({ length: 200 }, (_, i) => generatePersona('AE', {}, i).nationality));
    expect(nationalities.size).toBeGreaterThanOrEqual(4);
  });
});
