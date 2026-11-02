import type { CountryModule } from '../core/types';
import { birthDate, email, pickGender, pickBank, bankName } from '../core/person';
import { formatIban, makeIban } from '../core/iban';
import { luhnCheckDigit, pad, toDigits } from '../core/checks';
import { postalAddress } from '../core/iso20022';
import { GR_FAMILY, GR_GIVEN, surnameFor } from './names';

/** AFM (tax number): sum of digit × 2^(8−i) over the first 8 digits, mod 11, mod 10. */
export function afmCheck(first8: string): number {
  return (toDigits(first8).reduce((s, d, i) => s + d * 2 ** (8 - i), 0) % 11) % 10;
}

const CITIES = [
  { gr: 'Αθήνα', en: 'Athina', region: 'Attiki', pc: [10431, 11745] },
  { gr: 'Θεσσαλονίκη', en: 'Thessaloniki', region: 'Kentriki Makedonia', pc: [54621, 54655] },
  { gr: 'Πάτρα', en: 'Patra', region: 'Dytiki Ellada', pc: [26221, 26504] },
  { gr: 'Ηράκλειο', en: 'Irakleio', region: 'Kriti', pc: [71201, 71409] },
  { gr: 'Λάρισα', en: 'Larisa', region: 'Thessalia', pc: [41221, 41500] },
];
const STREETS = [
  ['Ερμού', 'Ermou'], ['Σταδίου', 'Stadiou'], ['Πανεπιστημίου', 'Panepistimiou'], ['Λεωφόρος Βασιλίσσης Σοφίας', 'Leoforos Vasilissis Sofias'],
  ['Τσιμισκή', 'Tsimiski'], ['Εγνατία', 'Egnatia'], ['Αγίου Νικολάου', 'Agiou Nikolaou'], ['Κοραή', 'Korai'],
];
const BANKS = [
  { name: 'National Bank of Greece', gr: 'Εθνική Τράπεζα', bic: 'ETHNGRAA', code: '011' },
  { name: 'Piraeus Bank', gr: 'Τράπεζα Πειραιώς', bic: 'PIRBGRAA', code: '017' },
  { name: 'Alpha Bank', gr: 'Alpha Bank', bic: 'CRBAGRAA', code: '014' },
  { name: 'Eurobank', gr: 'Eurobank', bic: 'ERBKGRAA', code: '026' },
];

export const gr: CountryModule = {
  code: 'GR',
  name: 'Greece',
  flag: '🇬🇷',
  currency: 'EUR',
  group: 'Eurozone',
  banks: BANKS.map(bankName),
  generate(rng, options) {
    const gender = pickGender(rng, options);
    const [givenGr, given] = rng.pick(GR_GIVEN[gender]);
    const [famGr, famEn] = rng.pick(GR_FAMILY);
    const familyGr = surnameFor(famGr, gender);
    const family = surnameFor(famEn, gender);
    const dob = birthDate(rng, options);
    const city = rng.pick(CITIES);
    const pc = String(rng.int(city.pc[0], city.pc[1]));
    const postcode = `${pc.slice(0, 3)} ${pc.slice(3)}`;
    const [streetGr, streetEn] = rng.pick(STREETS);
    const number = rng.int(1, 200);

    const afmBody = rng.digits(8, true);
    const afm = afmBody + afmCheck(afmBody);
    let genderDigit: number;
    do genderDigit = rng.int(0, 9);
    while ((genderDigit % 2 === 1) !== (gender === 'male'));
    const amkaBody = `${pad(dob.day, 2)}${pad(dob.month, 2)}${pad(dob.year % 100, 2)}${rng.digits(3)}${genderDigit}`;
    const amka = amkaBody + luhnCheckDigit(amkaBody);

    const bank = pickBank(rng, BANKS, options);
    const branch = rng.digits(4);
    const account = rng.digits(11);
    const iban = makeIban('GR', bank.code + branch + account.padStart(16, '0'));

    return {
      gender,
      name: {
        full: `${given} ${family}`,
        given,
        family,
        native: `${givenGr} ${familyGr}`,
        accountHolder: `${givenGr} ${familyGr}`,
        accountHolderLatin: `${given} ${family}`.toUpperCase(),
      },
      dateOfBirth: dob.iso,
      age: dob.age,
      nationality: 'Greek',
      address: {
        lines: [`${streetEn} ${number}`, `${postcode} ${city.en}`],
        native: [`${streetGr} ${number}`, `${postcode} ${city.gr}`],
        structured: postalAddress({ StrtNm: streetEn, BldgNb: number, PstCd: postcode, TwnNm: city.en, CtrySubDvsn: city.region, Ctry: 'GR' }),
      },
      phone: `+30 69${rng.int(0, 9)} ${rng.digits(3)} ${rng.digits(4)}`,
      email: email(rng, given, family),
      identity: [
        { label: 'AFM (ΑΦΜ, tax number)', value: afm, check: 'AFM check digit (mod 11)' },
        { label: 'AMKA (ΑΜΚΑ, social security)', value: amka, check: 'AMKA Luhn' },
      ],
      bank: {
        bankName: bank.name,
        bankNameNative: bank.gr === bank.name ? undefined : bank.gr,
        bic: bank.bic,
        currency: 'EUR',
        domestic: [
          { label: 'Bank code', value: bank.code },
          { label: 'Branch', value: branch },
          { label: 'Account number (Αριθμός λογαριασμού)', value: account },
        ],
        international: [
          { label: 'IBAN', value: formatIban(iban), check: 'ISO 13616 mod 97' },
          { label: 'BIC / SWIFT', value: bank.bic },
        ],
      },
    };
  },
};
