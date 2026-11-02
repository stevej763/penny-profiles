import type { CountryModule } from '../core/types';
import { birthDate, email, pickGender, type BirthDate, pickBank, bankName } from '../core/person';
import { formatIban, makeIban } from '../core/iban';
import { pad, weightedSum } from '../core/checks';
import { postalAddress } from '../core/iso20022';
import { UA_FAMILY, UA_GIVEN, UA_PATRONYMIC, surnameFor } from './names';

/** RNOKPP (individual tax number) check digit: weights −1,5,7,9,4,6,10,5,7, mod 11, mod 10. */
export function rnokppCheck(first9: string): number {
  return ((weightedSum(first9, [-1, 5, 7, 9, 4, 6, 10, 5, 7]) % 11) + 11) % 11 % 10;
}

/** Days from 31 December 1899 to the date of birth (1 January 1900 = 1). */
const daysSince1899 = (dob: BirthDate) => Math.round((Date.UTC(dob.year, dob.month - 1, dob.day) - Date.UTC(1899, 11, 31)) / 86_400_000);

const CITIES = [
  { ua: 'Київ', en: 'Kyiv', pc: [1001, 4999] },
  { ua: 'Львів', en: 'Lviv', pc: [79000, 79070] },
  { ua: 'Одеса', en: 'Odesa', pc: [65000, 65125] },
  { ua: 'Харків', en: 'Kharkiv', pc: [61000, 61204] },
  { ua: 'Дніпро', en: 'Dnipro', pc: [49000, 49130] },
];
const STREETS = [
  ['вул. Хрещатик', 'vul. Khreshchatyk'], ['вул. Шевченка', 'vul. Shevchenka'], ['просп. Свободи', 'prosp. Svobody'],
  ['вул. Франка', 'vul. Franka'], ['вул. Сумська', 'vul. Sumska'], ['вул. Дерибасівська', 'vul. Derybasivska'],
];
const BANKS = [
  { name: 'PrivatBank', ua: 'ПриватБанк', bic: 'PBANUA2X', mfo: '305299' },
  { name: 'Oschadbank', ua: 'Ощадбанк', bic: 'COSBUAUK', mfo: '300465' },
  { name: 'Raiffeisen Bank', ua: 'Райффайзен Банк', bic: 'AVALUAUK', mfo: '380805' },
  { name: 'Universal Bank (monobank)', ua: 'Універсал Банк', bic: 'UNJSUAUK', mfo: '322001' },
  { name: 'PUMB', ua: 'ПУМБ', bic: 'FUIBUA2X', mfo: '334851' },
];

export const ua: CountryModule = {
  code: 'UA',
  name: 'Ukraine',
  flag: '🇺🇦',
  currency: 'UAH',
  group: 'Europe (non-euro)',
  banks: BANKS.map(bankName),
  generate(rng, options) {
    const gender = pickGender(rng, options);
    const g = gender === 'male' ? 0 : 1;
    const [givenUa, given] = rng.pick(UA_GIVEN[gender]);
    const [famUa, famEn] = rng.pick(UA_FAMILY);
    const familyUa = surnameFor(famUa, gender);
    const family = surnameFor(famEn, gender);
    const patronymicRow = rng.pick(UA_PATRONYMIC);
    const patronymicUa = patronymicRow[g];
    const patronymic = patronymicRow[g + 2];
    const dob = birthDate(rng, options);

    const city = rng.pick(CITIES);
    const postcode = pad(rng.int(city.pc[0], city.pc[1]), 5);
    const [streetUa, streetEn] = rng.pick(STREETS);
    const house = rng.int(1, 150);
    const flat = rng.int(1, 250);

    let sexDigit: number;
    do sexDigit = rng.int(0, 9);
    while ((sexDigit % 2 === 1) !== (gender === 'male'));
    const taxBody = pad(daysSince1899(dob), 5) + rng.digits(3) + sexDigit;
    const taxId = taxBody + rnokppCheck(taxBody);

    const bank = pickBank(rng, BANKS, options);
    const account = rng.digits(14, true);
    const iban = makeIban('UA', bank.mfo + account.padStart(19, '0'));

    return {
      gender,
      name: {
        full: `${given} ${patronymic} ${family}`,
        given,
        family,
        native: `${familyUa} ${givenUa} ${patronymicUa}`,
        accountHolder: `${familyUa} ${givenUa} ${patronymicUa}`,
        accountHolderLatin: `${family} ${given}`.toUpperCase(),
        parts: [{ label: 'Patronymic (по батькові)', value: `${patronymicUa} / ${patronymic}`, latin: patronymic }],
      },
      dateOfBirth: dob.iso,
      age: dob.age,
      nationality: 'Ukrainian',
      address: {
        lines: [`${streetEn}, bud. ${house}, kv. ${flat}`, `${city.en}, ${postcode}`],
        native: [`${streetUa}, буд. ${house}, кв. ${flat}`, `м. ${city.ua}, ${postcode}`],
        structured: postalAddress({ StrtNm: streetEn, BldgNb: house, Room: `kv. ${flat}`, PstCd: postcode, TwnNm: city.en, Ctry: 'UA' }),
      },
      phone: `+380 ${rng.pick(['50', '63', '66', '67', '73', '93', '97', '99'])} ${rng.digits(3)} ${rng.digits(2)} ${rng.digits(2)}`,
      email: email(rng, given, family),
      identity: [{ label: 'RNOKPP (РНОКПП, tax number)', value: taxId, check: 'RNOKPP check digit (encodes date of birth)' }],
      bank: {
        bankName: bank.name,
        bankNameNative: bank.ua,
        bic: bank.bic,
        currency: 'UAH',
        domestic: [
          { label: 'IBAN (used for domestic transfers)', value: formatIban(iban), check: 'ISO 13616 mod 97' },
          { label: 'MFO (МФО, bank code)', value: bank.mfo },
          { label: 'Account number', value: account },
        ],
        international: [
          { label: 'IBAN', value: formatIban(iban), check: 'ISO 13616 mod 97' },
          { label: 'BIC / SWIFT', value: bank.bic },
        ],
      },
      notes: ['Russian-occupied areas of Ukraine (Crimea and the so-called DNR/LNR) are under comprehensive UK/EU/US sanctions; screening may flag addresses there.'],
    };
  },
};
