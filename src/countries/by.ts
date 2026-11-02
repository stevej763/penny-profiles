import type { CountryModule } from '../core/types';
import { birthDate, email, pickGender, pickBank, bankName } from '../core/person';
import { formatIban, makeIban } from '../core/iban';
import { pad } from '../core/checks';
import { postalAddress } from '../core/iso20022';
import { BY_FAMILY, BY_GIVEN, BY_PATRONYMIC, surnameFor } from './names';

const CITIES = [
  { by: 'Мінск', en: 'Minsk', region: 'H', pc: [220000, 220141] },
  { by: 'Гомель', en: 'Homiel', region: 'E', pc: [246000, 246050] },
  { by: 'Магілёў', en: 'Mahiliou', region: 'K', pc: [212000, 212030] },
  { by: 'Віцебск', en: 'Vitsiebsk', region: 'B', pc: [210000, 210038] },
  { by: 'Гродна', en: 'Hrodna', region: 'C', pc: [230000, 230029] },
  { by: 'Брэст', en: 'Brest', region: 'A', pc: [224000, 224030] },
];
const STREETS = [
  ['вул. Леніна', 'vul. Lienina'], ['праспект Незалежнасці', 'praspiekt Niezalieznasci'], ['вул. Кастрычніцкая', 'vul. Kastrychnitskaya'],
  ['вул. Савецкая', 'vul. Savietskaya'], ['вул. Перамогі', 'vul. Peramohi'], ['вул. Гагарына', 'vul. Haharyna'],
];
const BANKS = [
  { name: 'Belarusbank', by: 'Беларусбанк', bic: 'AKBBBY2X', code: 'AKBB' },
  { name: 'Belagroprombank', by: 'Белаграпрамбанк', bic: 'BAPBBY2X', code: 'BAPB' },
  { name: 'Priorbank', by: 'Прыорбанк', bic: 'PJCBBY2X', code: 'PJCB' },
  { name: 'Belinvestbank', by: 'Белінвестбанк', bic: 'BLBBBY2X', code: 'BLBB' },
];

export const by: CountryModule = {
  code: 'BY',
  name: 'Belarus',
  flag: '🇧🇾',
  currency: 'BYN',
  group: 'Europe (non-euro)',
  banks: BANKS.map(bankName),
  generate(rng, options) {
    const gender = pickGender(rng, options);
    const g = gender === 'male' ? 0 : 1;
    const [givenBy, given] = rng.pick(BY_GIVEN[gender]);
    const [famBy, famEn] = rng.pick(BY_FAMILY);
    const familyBy = surnameFor(famBy, gender);
    const family = surnameFor(famEn, gender);
    const patronymicRow = rng.pick(BY_PATRONYMIC);
    const dob = birthDate(rng, options);

    const city = rng.pick(CITIES);
    const postcode = String(rng.int(city.pc[0], city.pc[1]));
    const [streetBy, streetEn] = rng.pick(STREETS);
    const house = rng.int(1, 150);
    const flat = rng.int(1, 250);

    // Personal number: sex/century digit, DDMMYY, region letter, 3 digits, citizenship "PB", check digit.
    // The check-digit algorithm isn't publicly documented, so the digit is random and not marked as checked.
    const sexCentury = (dob.year >= 2000 ? 5 : 3) + g;
    const personal = `${sexCentury}${pad(dob.day, 2)}${pad(dob.month, 2)}${pad(dob.year % 100, 2)}${city.region}${rng.digits(3)}PB${rng.digits(1)}`;

    const bank = pickBank(rng, BANKS, options);
    // BBAN: bank code (4 letters) + balance account 3014 (individuals' current accounts) + 16-digit account.
    const account = rng.digits(16);
    const iban = makeIban('BY', bank.code + '3014' + account);

    return {
      gender,
      name: {
        full: `${given} ${patronymicRow[g + 2]} ${family}`,
        given,
        family,
        native: `${familyBy} ${givenBy} ${patronymicRow[g]}`,
        accountHolder: `${familyBy} ${givenBy} ${patronymicRow[g]}`,
        accountHolderLatin: `${family} ${given}`.toUpperCase(),
        parts: [{ label: 'Patronymic (імя па бацьку)', value: `${patronymicRow[g]} / ${patronymicRow[g + 2]}`, latin: patronymicRow[g + 2] }],
      },
      dateOfBirth: dob.iso,
      age: dob.age,
      nationality: 'Belarusian',
      address: {
        lines: [`${streetEn}, d. ${house}, kv. ${flat}`, `${city.en}, ${postcode}`],
        native: [`${streetBy}, д. ${house}, кв. ${flat}`, `г. ${city.by}, ${postcode}`],
        structured: postalAddress({ StrtNm: streetEn, BldgNb: house, Room: `kv. ${flat}`, PstCd: postcode, TwnNm: city.en, Ctry: 'BY' }),
      },
      phone: `+375 ${rng.pick(['25', '29', '33', '44'])} ${rng.digits(3)}-${rng.digits(2)}-${rng.digits(2)}`,
      email: email(rng, given, family),
      identity: [{ label: 'Personal number (асабісты нумар)', value: personal }],
      bank: {
        bankName: bank.name,
        bankNameNative: bank.by,
        bic: bank.bic,
        currency: 'BYN',
        domestic: [
          { label: 'IBAN (used for domestic transfers)', value: formatIban(iban), check: 'ISO 13616 mod 97' },
          { label: 'Balance account', value: '3014' },
        ],
        international: [
          { label: 'IBAN', value: formatIban(iban), check: 'ISO 13616 mod 97' },
          { label: 'BIC / SWIFT', value: bank.bic },
        ],
      },
      notes: ['Belarusian banks are widely sanctioned by the UK, EU and US, and several are cut off from SWIFT; expect screening hits.'],
    };
  },
};
