import type { CountryModule } from '../core/types';
import type { Rng } from '../core/rng';
import { birthDate, email, pickGender, type BirthDate, pickBank, bankName } from '../core/person';
import { formatIban, makeIban } from '../core/iban';
import { luhnCheckDigit, pad, weightedSum } from '../core/checks';
import { postalAddress } from '../core/iso20022';
import { NAMES } from './names';

/**
 * Account check digits per Bankgirot "Bankernas kontonummeruppbyggnad":
 * Type 1 comment 1: clearing number minus its first digit + 7-digit account, weights 10..1, mod 11.
 * Type 2 comment 2 (Handelsbanken): 9-digit account, weights 9..1, mod 11.
 */
export function seType1Valid(clearing: string, account7: string): boolean {
  return weightedSum(clearing.slice(1) + account7, [10, 9, 8, 7, 6, 5, 4, 3, 2, 1]) % 11 === 0;
}
export function seHandelsbankenValid(account9: string): boolean {
  return weightedSum(account9, [9, 8, 7, 6, 5, 4, 3, 2, 1]) % 11 === 0;
}

function personnummer(rng: Rng, dob: BirthDate, male: boolean): string {
  let serial: string;
  do serial = rng.digits(3);
  while ((Number(serial[2]) % 2 === 1) !== male);
  const body = pad(dob.year % 100, 2) + pad(dob.month, 2) + pad(dob.day, 2) + serial;
  // "-" separator, or "+" once the holder turns 100.
  return `${body.slice(0, 6)}${dob.age >= 100 ? '+' : '-'}${body.slice(6)}${luhnCheckDigit(body)}`;
}

const CITIES = [
  { city: 'Stockholm', pc: [11120, 11869] },
  { city: 'Göteborg', pc: [41101, 41878] },
  { city: 'Malmö', pc: [21111, 21874] },
  { city: 'Uppsala', pc: [75220, 75655] },
  { city: 'Västerås', pc: [72210, 72481] },
];
const STREETS = ['Drottninggatan', 'Storgatan', 'Kungsgatan', 'Sveavägen', 'Vasagatan', 'Kyrkogatan', 'Strandvägen', 'Götgatan'];
const BANKS = [
  { name: 'SEB', bic: 'ESSESESS', ibanCode: '500', clearing: [5000, 5999] as const, type: 1 as const },
  { name: 'Swedbank', bic: 'SWEDSESS', ibanCode: '800', clearing: [7000, 7999] as const, type: 1 as const },
  { name: 'Handelsbanken', bic: 'HANDSESS', ibanCode: '600', clearing: [6000, 6999] as const, type: 2 as const },
];

export const se: CountryModule = {
  code: 'SE',
  name: 'Sweden',
  flag: '🇸🇪',
  currency: 'SEK',
  group: 'Europe (non-euro)',
  banks: BANKS.map(bankName),
  generate(rng, options) {
    const gender = pickGender(rng, options);
    const given = rng.pick(NAMES.SE[gender]);
    const family = rng.pick(NAMES.SE.family);
    const dob = birthDate(rng, options);
    const place = rng.pick(CITIES);
    const pc = String(rng.int(place.pc[0], place.pc[1]));
    const postcode = `${pc.slice(0, 3)} ${pc.slice(3)}`;
    const street = rng.pick(STREETS);
    const number = rng.int(1, 140);
    const lgh = rng.bool(0.6) ? `lgh ${rng.int(10, 16)}0${rng.int(1, 4)}` : undefined;

    const bank = pickBank(rng, BANKS, options);
    const clearing = String(rng.int(bank.clearing[0], bank.clearing[1]));
    let account: string;
    if (bank.type === 1) {
      do account = rng.digits(7);
      while (!seType1Valid(clearing, account));
    } else {
      do account = rng.digits(9);
      while (!seHandelsbankenValid(account));
    }
    // Type 1 IBANs include the clearing number; type 2 (Handelsbanken) IBANs do not.
    const iban = makeIban('SE', bank.ibanCode + (bank.type === 1 ? clearing + account : account).padStart(17, '0'));
    const mobile = `07${rng.pick(['0', '2', '3', '6', '9'])}-${rng.digits(3)} ${rng.digits(2)} ${rng.digits(2)}`;

    return {
      gender,
      name: { full: `${given} ${family}`, given, family, accountHolder: `${given} ${family}`.toUpperCase() },
      dateOfBirth: dob.iso,
      age: dob.age,
      nationality: 'Swedish',
      address: {
        lines: [`${street} ${number}${lgh ? `, ${lgh}` : ''}`, `${postcode} ${place.city.toUpperCase()}`],
        structured: postalAddress({ StrtNm: street, BldgNb: number, Room: lgh, PstCd: postcode, TwnNm: place.city, Ctry: 'SE' }),
      },
      phone: `+46 ${mobile.slice(1).replace('-', ' ')}`,
      email: email(rng, given, family),
      identity: [{ label: 'Personnummer', value: personnummer(rng, dob, gender === 'male'), check: 'Personnummer Luhn' }],
      bank: {
        bankName: bank.name,
        bic: bank.bic,
        currency: 'SEK',
        domestic: [
          { label: 'Clearingnummer', value: clearing },
          { label: 'Kontonummer', value: account, check: bank.type === 1 ? 'Bankgirot type 1 mod 11' : 'Bankgirot type 2 mod 11' },
        ],
        international: [
          { label: 'IBAN', value: formatIban(iban), check: 'ISO 13616 mod 97' },
          { label: 'BIC / SWIFT', value: bank.bic },
        ],
        extras: [{ label: 'Swish', value: mobile }],
      },
    };
  },
};
