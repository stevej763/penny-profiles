import type { CountryModule } from '../core/types';
import type { Rng } from '../core/rng';
import { birthDate, email, pickGender, type BirthDate, pickBank, bankName } from '../core/person';
import { formatIban, makeIban } from '../core/iban';
import { pad, weightedSum } from '../core/checks';
import { postalAddress } from '../core/iso20022';
import { NAMES, surnameFor } from './names';

/** Bank sort code (numer rozliczeniowy): 7 digits + check, weights 3,9,7,1,3,9,7. */
export function plSortCodeCheck(first7: string): number {
  return (10 - (weightedSum(first7, [3, 9, 7, 1, 3, 9, 7]) % 10)) % 10;
}

/** PESEL check digit: weights 1,3,7,9,1,3,7,9,1,3. */
export function peselCheck(first10: string): number {
  return (10 - (weightedSum(first10, [1, 3, 7, 9, 1, 3, 7, 9, 1, 3]) % 10)) % 10;
}

function pesel(rng: Rng, dob: BirthDate, male: boolean): string {
  // Month carries the century: +0 for 1900s, +20 for 2000s.
  const month = dob.month + (dob.year >= 2000 ? 20 : 0);
  let sexDigit: number;
  do sexDigit = rng.int(0, 9);
  while ((sexDigit % 2 === 1) !== male);
  const body = pad(dob.year % 100, 2) + pad(month, 2) + pad(dob.day, 2) + rng.digits(3) + sexDigit;
  return body + peselCheck(body);
}

const CITIES = [
  { city: 'Warszawa', region: 'mazowieckie', pc: [1, 4999] },
  { city: 'Kraków', region: 'małopolskie', pc: [30001, 31999] },
  { city: 'Wrocław', region: 'dolnośląskie', pc: [50001, 54999] },
  { city: 'Poznań', region: 'wielkopolskie', pc: [60001, 61999] },
  { city: 'Gdańsk', region: 'pomorskie', pc: [80001, 80999] },
  { city: 'Łódź', region: 'łódzkie', pc: [90001, 94999] },
];
const STREETS = ['ul. Marszałkowska', 'ul. Długa', 'ul. Piotrkowska', 'ul. Mickiewicza', 'ul. Kościuszki', 'ul. Słowackiego', 'al. Jerozolimskie', 'ul. Floriańska'];
const BANKS = [
  { name: 'PKO Bank Polski', bic: 'BPKOPLPW', code: '102' },
  { name: 'Bank Pekao', bic: 'PKOPPLPW', code: '124' },
  { name: 'mBank', bic: 'BREXPLPW', code: '114' },
  { name: 'ING Bank Śląski', bic: 'INGBPLPW', code: '105' },
  { name: 'Santander Bank Polska', bic: 'WBKPPLPP', code: '109' },
];

export const pl: CountryModule = {
  code: 'PL',
  name: 'Poland',
  flag: '🇵🇱',
  currency: 'PLN',
  group: 'Europe (non-euro)',
  banks: BANKS.map(bankName),
  generate(rng, options) {
    const gender = pickGender(rng, options);
    const given = rng.pick(NAMES.PL[gender]);
    const family = surnameFor(rng.pick(NAMES.PL.family), gender);
    const dob = birthDate(rng, options);
    const place = rng.pick(CITIES);
    const pcDigits = pad(rng.int(place.pc[0], place.pc[1]), 5);
    const postcode = `${pcDigits.slice(0, 2)}-${pcDigits.slice(2)}`;
    const street = rng.pick(STREETS);
    const number = rng.int(1, 150);
    const flat = rng.bool(0.6) ? rng.int(1, 120) : undefined;

    const bank = pickBank(rng, BANKS, options);
    const sort7 = bank.code + rng.digits(4);
    const sortCode = sort7 + plSortCodeCheck(sort7);
    const account = rng.digits(16);
    const iban = makeIban('PL', sortCode + account);
    const nrb = iban.slice(2);

    return {
      gender,
      name: { full: `${given} ${family}`, given, family, accountHolder: `${given} ${family}`.toUpperCase() },
      dateOfBirth: dob.iso,
      age: dob.age,
      nationality: 'Polish',
      address: {
        lines: [`${street} ${number}${flat ? ` m. ${flat}` : ''}`, `${postcode} ${place.city}`],
        structured: postalAddress({ StrtNm: street, BldgNb: number, Room: flat && `m. ${flat}`, PstCd: postcode, TwnNm: place.city, CtrySubDvsn: place.region, Ctry: 'PL' }),
      },
      phone: `+48 ${rng.pick(['5', '6', '7', '8'])}${rng.digits(2)} ${rng.digits(3)} ${rng.digits(3)}`,
      email: email(rng, given, family),
      identity: [{ label: 'PESEL', value: pesel(rng, dob, gender === 'male'), check: 'PESEL check digit' }],
      bank: {
        bankName: bank.name,
        bic: bank.bic,
        currency: 'PLN',
        domestic: [
          { label: 'Account number (NRB)', value: nrb.replace(/^(\d{2})(\d+)$/, (_, c, rest) => `${c} ${rest.replace(/(\d{4})(?=\d)/g, '$1 ')}`), check: 'NRB mod 97' },
          { label: 'Bank sort code', value: sortCode, check: 'Sort code check digit (3-9-7-1)' },
        ],
        international: [
          { label: 'IBAN', value: formatIban(iban), check: 'ISO 13616 mod 97' },
          { label: 'BIC / SWIFT', value: bank.bic },
        ],
      },
    };
  },
};
