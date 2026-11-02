import type { CountryModule } from '../core/types';
import type { Rng } from '../core/rng';
import { birthDate, email, pickGender, type BirthDate, pickBank, bankName } from '../core/person';
import { formatIban, makeIban } from '../core/iban';
import { pad, weightedSum } from '../core/checks';
import { postalAddress } from '../core/iso20022';
import { NAMES } from './names';

/** Norwegian 11-digit account: weights 6,7,8,9,4,5,6,7,8,9 mod 11 gives the check; 10 is never valid. */
export function noAccountCheck(first10: string): number {
  return weightedSum(first10, [6, 7, 8, 9, 4, 5, 6, 7, 8, 9]) % 11;
}

/** Fødselsnummer: two mod-11 check digits; returns null if either would be 10. */
export function fodselsnummerChecks(first9: string): string | null {
  const k = (digits: string, weights: number[]) => {
    const r = 11 - (weightedSum(digits, weights) % 11);
    return r === 11 ? 0 : r;
  };
  const k1 = k(first9, [3, 7, 6, 1, 8, 9, 4, 5, 2]);
  if (k1 === 10) return null;
  const k2 = k(first9 + k1, [5, 4, 3, 2, 7, 6, 5, 4, 3, 2]);
  if (k2 === 10) return null;
  return `${k1}${k2}`;
}

function fodselsnummer(rng: Rng, dob: BirthDate, male: boolean): string {
  for (;;) {
    // Individual numbers 000–499 are 1900–1999 births, 500–999 are 2000–2039.
    const individual = dob.year >= 2000 ? rng.int(500, 999) : rng.int(0, 499);
    if ((individual % 2 === 1) !== male) continue;
    const first9 = pad(dob.day, 2) + pad(dob.month, 2) + pad(dob.year % 100, 2) + pad(individual, 3);
    const checks = fodselsnummerChecks(first9);
    if (checks) return first9 + checks;
  }
}

const CITIES = [
  { city: 'Oslo', pc: [150, 1295] },
  { city: 'Bergen', pc: [5003, 5099] },
  { city: 'Trondheim', pc: [7010, 7099] },
  { city: 'Stavanger', pc: [4005, 4099] },
  { city: 'Tromsø', pc: [9008, 9019] },
];
const STREETS = ['Karl Johans gate', 'Storgata', 'Kirkegata', 'Strandgata', 'Parkveien', 'Skolegata', 'Bogstadveien', 'Thorvald Meyers gate'];
const BANKS = [
  { name: 'DNB', bic: 'DNBANOKK', reg: '1201' },
  { name: 'Nordea Norge', bic: 'NDEANOKK', reg: '6013' },
  { name: 'Handelsbanken Norge', bic: 'HANDNOKK', reg: '9041' },
  { name: 'SpareBank 1 SR-Bank', bic: 'SPSONO22', reg: '3201' },
];

export const no: CountryModule = {
  code: 'NO',
  name: 'Norway',
  flag: '🇳🇴',
  currency: 'NOK',
  group: 'Europe (non-euro)',
  banks: BANKS.map(bankName),
  generate(rng, options) {
    const gender = pickGender(rng, options);
    const given = rng.pick(NAMES.NO[gender]);
    const family = rng.pick(NAMES.NO.family);
    const dob = birthDate(rng, options);
    const place = rng.pick(CITIES);
    const postcode = pad(rng.int(place.pc[0], place.pc[1]), 4);
    const street = rng.pick(STREETS);
    const number = `${rng.int(1, 120)}${rng.bool(0.2) ? rng.pick(['A', 'B', 'C']) : ''}`;
    // Bolignummer: H + floor (2 digits) + flat (2 digits).
    const unit = rng.bool(0.5) ? `H${pad(rng.int(1, 6), 2)}${pad(rng.int(1, 4), 2)}` : undefined;

    const bank = pickBank(rng, BANKS, options);
    let account: string;
    for (;;) {
      const first10 = bank.reg + rng.digits(6);
      const check = noAccountCheck(first10);
      if (check !== 10) {
        account = first10 + check;
        break;
      }
    }
    const iban = makeIban('NO', account);
    const phone = `+47 ${rng.pick(['4', '9'])}${rng.digits(2)} ${rng.digits(2)} ${rng.digits(3)}`;

    return {
      gender,
      name: { full: `${given} ${family}`, given, family, accountHolder: `${given} ${family}`.toUpperCase() },
      dateOfBirth: dob.iso,
      age: dob.age,
      nationality: 'Norwegian',
      address: {
        lines: [`${street} ${number}${unit ? `, ${unit}` : ''}`, `${postcode} ${place.city.toUpperCase()}`],
        structured: postalAddress({ StrtNm: street, BldgNb: number, Room: unit, PstCd: postcode, TwnNm: place.city, Ctry: 'NO' }),
      },
      phone,
      email: email(rng, given, family),
      identity: [{ label: 'Fødselsnummer', value: fodselsnummer(rng, dob, gender === 'male'), check: 'Two mod-11 check digits' }],
      bank: {
        bankName: bank.name,
        bic: bank.bic,
        currency: 'NOK',
        domestic: [{ label: 'Kontonummer', value: `${account.slice(0, 4)}.${account.slice(4, 6)}.${account.slice(6)}`, check: 'Norwegian account mod 11' }],
        international: [
          { label: 'IBAN', value: formatIban(iban), check: 'ISO 13616 mod 97' },
          { label: 'BIC / SWIFT', value: bank.bic },
        ],
        extras: [{ label: 'Vipps (mobile)', value: phone }],
      },
    };
  },
};
