import type { CountryModule } from '../core/types';
import { birthDate, email, pickGender, pickBank, bankName } from '../core/person';
import { formatIban, makeIban } from '../core/iban';
import { postalAddress } from '../core/iso20022';
import { NAMES } from './names';

/** EAN-13 check digit: weights 1,3,1,3… from the left over 12 digits. Used by the AHV number. */
export function ean13Check(first12: string): number {
  const sum = first12.split('').reduce((s, d, i) => s + Number(d) * (i % 2 === 0 ? 1 : 3), 0);
  return (10 - (sum % 10)) % 10;
}

type Lang = 'de' | 'fr' | 'it';
const CITIES: { city: string; canton: string; pc: [number, number]; lang: Lang }[] = [
  { city: 'Zürich', canton: 'ZH', pc: [8001, 8057], lang: 'de' },
  { city: 'Basel', canton: 'BS', pc: [4051, 4059], lang: 'de' },
  { city: 'Bern', canton: 'BE', pc: [3011, 3027], lang: 'de' },
  { city: 'Luzern', canton: 'LU', pc: [6003, 6006], lang: 'de' },
  { city: 'Genève', canton: 'GE', pc: [1201, 1209], lang: 'fr' },
  { city: 'Lausanne', canton: 'VD', pc: [1003, 1018], lang: 'fr' },
  { city: 'Lugano', canton: 'TI', pc: [6900, 6908], lang: 'it' },
];
const STREETS: Record<Lang, string[]> = {
  de: ['Bahnhofstrasse', 'Hauptstrasse', 'Dorfstrasse', 'Seestrasse', 'Kirchgasse', 'Bernstrasse', 'Rosenweg'],
  fr: ['Rue du Rhône', 'Avenue de la Gare', 'Rue de Lausanne', 'Chemin des Vignes', 'Rue du Marché'],
  it: ['Via Nassa', 'Via Cantonale', 'Corso Pestalozzi', 'Via San Gottardo'],
};
const BANKS = [
  { name: 'UBS Switzerland', bic: 'UBSWCHZH80A', iid: '00230' },
  { name: 'PostFinance', bic: 'POFICHBEXXX', iid: '09000' },
  { name: 'Zürcher Kantonalbank', bic: 'ZKBKCHZZ80A', iid: '00700' },
  { name: 'Raiffeisen Schweiz', bic: 'RAIFCH22XXX', iid: '80808' },
  { name: 'Banque Cantonale Vaudoise', bic: 'BCVLCH2LXXX', iid: '00767' },
];

export const ch: CountryModule = {
  code: 'CH',
  name: 'Switzerland',
  flag: '🇨🇭',
  currency: 'CHF',
  group: 'Europe (non-euro)',
  banks: BANKS.map(bankName),
  generate(rng, options) {
    const gender = pickGender(rng, options);
    const given = rng.pick(NAMES.CH[gender]);
    const family = rng.pick(NAMES.CH.family);
    const dob = birthDate(rng, options);
    const place = rng.pick(CITIES);
    const street = rng.pick(STREETS[place.lang]);
    const number = rng.int(1, 180);
    const postcode = String(rng.int(place.pc[0], place.pc[1]));

    const ahvBody = '756' + rng.digits(9);
    const ahv = ahvBody + ean13Check(ahvBody);

    const bank = pickBank(rng, BANKS, options);
    const account = rng.digits(12);
    const iban = makeIban('CH', bank.iid + account);

    return {
      gender,
      name: { full: `${given} ${family}`, given, family, accountHolder: `${given} ${family}`.toUpperCase() },
      dateOfBirth: dob.iso,
      age: dob.age,
      nationality: 'Swiss',
      address: {
        lines: [`${street} ${number}`, `${postcode} ${place.city}`],
        structured: postalAddress({ StrtNm: street, BldgNb: number, PstCd: postcode, TwnNm: place.city, CtrySubDvsn: place.canton, Ctry: 'CH' }),
      },
      phone: `+41 ${rng.pick(['76', '77', '78', '79'])} ${rng.digits(3)} ${rng.digits(2)} ${rng.digits(2)}`,
      email: email(rng, given, family),
      identity: [
        {
          label: 'AHV/AVS number',
          value: `${ahv.slice(0, 3)}.${ahv.slice(3, 7)}.${ahv.slice(7, 11)}.${ahv.slice(11)}`,
          check: 'EAN-13 check digit',
        },
      ],
      bank: {
        bankName: bank.name,
        bic: bank.bic,
        currency: 'CHF',
        domestic: [
          { label: 'IID (bank clearing number)', value: bank.iid },
          { label: 'Account number', value: account },
        ],
        international: [
          { label: 'IBAN', value: formatIban(iban), check: 'ISO 13616 mod 97' },
          { label: 'BIC / SWIFT', value: bank.bic },
        ],
      },
    };
  },
};
