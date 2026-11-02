import type { CountryModule } from '../core/types';
import { birthDate, email, pickGender, pickBank, bankName } from '../core/person';
import { formatIban, makeIban } from '../core/iban';
import { luhnCheckDigit } from '../core/checks';
import { postalAddress } from '../core/iso20022';
import { IL_FAMILY, IL_GIVEN } from './names';

const CITIES = [
  { he: 'ירושלים', en: 'Jerusalem', pc: [9100000, 9799999] },
  { he: 'תל אביב-יפו', en: 'Tel Aviv-Yafo', pc: [6100000, 6999999] },
  { he: 'חיפה', en: 'Haifa', pc: [3100000, 3599999] },
  { he: 'באר שבע', en: "Be'er Sheva", pc: [8400000, 8499999] },
  { he: 'נתניה', en: 'Netanya', pc: [4200000, 4299999] },
];
const STREETS = [['הרצל', 'Herzl St'], ['אבן גבירול', 'Ibn Gabirol St'], ['דיזנגוף', 'Dizengoff St'], ['יפו', 'Jaffa St'], ['בן יהודה', 'Ben Yehuda St'], ['ז׳בוטינסקי', 'Jabotinsky St']];
const BANKS = [
  { name: 'Bank Hapoalim', he: 'בנק הפועלים', bic: 'POALILIT', code: '012' },
  { name: 'Bank Leumi', he: 'בנק לאומי', bic: 'LUMIILIT', code: '010' },
  { name: 'Israel Discount Bank', he: 'בנק דיסקונט', bic: 'IDBLILIT', code: '011' },
  { name: 'Mizrahi-Tefahot', he: 'בנק מזרחי טפחות', bic: 'MIZBILIT', code: '020' },
];

export const il: CountryModule = {
  code: 'IL',
  name: 'Israel',
  flag: '🇮🇱',
  currency: 'ILS',
  group: 'Middle East & Africa',
  banks: BANKS.map(bankName),
  generate(rng, options) {
    const gender = pickGender(rng, options);
    const [givenHe, given] = rng.pick(IL_GIVEN[gender]);
    const [familyHe, family] = rng.pick(IL_FAMILY);
    const dob = birthDate(rng, options);
    const city = rng.pick(CITIES);
    const postcode = String(rng.int(city.pc[0], city.pc[1]));
    const [streetHe, streetEn] = rng.pick(STREETS);
    const number = rng.int(1, 180);
    const apt = rng.int(1, 40);

    const idBody = rng.digits(8);
    const teudatZehut = idBody + luhnCheckDigit(idBody);

    const bank = pickBank(rng, BANKS, options);
    const branch = rng.digits(3);
    const account = rng.digits(rng.int(6, 9), true);
    const iban = makeIban('IL', bank.code + branch + account.padStart(13, '0'));

    return {
      gender,
      name: {
        full: `${given} ${family}`,
        given,
        family,
        native: `${givenHe} ${familyHe}`,
        accountHolder: `${givenHe} ${familyHe}`,
        accountHolderLatin: `${given} ${family}`.toUpperCase(),
      },
      dateOfBirth: dob.iso,
      age: dob.age,
      nationality: 'Israeli',
      address: {
        lines: [`${number} ${streetEn}, Apt ${apt}`, `${city.en} ${postcode}`],
        native: [`${streetHe} ${number}, דירה ${apt}`, `${city.he} ${postcode}`],
        structured: postalAddress({ StrtNm: streetEn, BldgNb: number, Room: `Apt ${apt}`, PstCd: postcode, TwnNm: city.en, Ctry: 'IL' }),
      },
      phone: `+972 5${rng.pick(['0', '2', '3', '4', '8'])}-${rng.digits(3)}-${rng.digits(4)}`,
      email: email(rng, given, family),
      identity: [{ label: 'Teudat Zehut (תעודת זהות)', value: teudatZehut, check: 'Teudat Zehut check digit (Luhn)' }],
      bank: {
        bankName: bank.name,
        bankNameNative: bank.he,
        bic: bank.bic,
        currency: 'ILS',
        domestic: [
          { label: 'Bank code (קוד בנק)', value: bank.code },
          { label: 'Branch (סניף)', value: branch },
          { label: 'Account number (מספר חשבון)', value: account },
        ],
        international: [
          { label: 'IBAN', value: formatIban(iban), check: 'ISO 13616 mod 97' },
          { label: 'BIC / SWIFT', value: bank.bic },
        ],
      },
    };
  },
};
