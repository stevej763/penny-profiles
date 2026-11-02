import type { CountryModule } from '../core/types';
import { birthDate, email, pickGender } from '../core/person';
import { formatIban, makeIban } from '../core/iban';
import { postalAddress } from '../core/iso20022';
import { IR_FAMILY, IR_GIVEN, RU_FAMILY, RU_GIVEN, RU_PATRONYMIC } from './names';
import { luhnCheckDigit, solveCheckDigit, weightedSum } from '../core/checks';

// ---------------------------------------------------------------------------- Russia

const RU_713 = Array.from({ length: 23 }, (_, i) => [7, 1, 3][i % 3]);

/** Bank of Russia account key: 3 BIK digits + 20-digit account, weights 7-1-3, sum ≡ 0 (mod 10). */
export function ruAccountValid(bik: string, account: string): boolean {
  return weightedSum(bik.slice(-3) + account, RU_713) % 10 === 0;
}

/** Correspondent accounts are keyed with "0" + BIK digits 5–6 instead of the last three. */
export function ruCorrespondentValid(bik: string, corr: string): boolean {
  return weightedSum('0' + bik.slice(4, 6) + corr, RU_713) % 10 === 0;
}

export function innPersonalValid(inn: string): boolean {
  const c = (weights: number[]) => (weightedSum(inn, weights) % 11) % 10;
  return c([7, 2, 4, 10, 3, 5, 9, 4, 6, 8]) === Number(inn[10]) && c([3, 7, 2, 4, 10, 3, 5, 9, 4, 6, 8]) === Number(inn[11]);
}

export function snilsCheck(nine: string): string {
  const sum = weightedSum(nine, [9, 8, 7, 6, 5, 4, 3, 2, 1]);
  const r = sum < 100 ? sum : sum % 101;
  return String(r === 100 ? 0 : r).padStart(2, '0');
}

const RU_CITIES = [
  { ru: 'Москва', en: 'Moscow', postcodes: ['101000', '105064', '109012', '115054', '119019', '123100'] },
  { ru: 'Санкт-Петербург', en: 'Saint Petersburg', postcodes: ['190000', '191025', '194044', '197101'] },
  { ru: 'Новосибирск', en: 'Novosibirsk', postcodes: ['630099', '630004', '630091'] },
  { ru: 'Екатеринбург', en: 'Yekaterinburg', postcodes: ['620014', '620075'] },
  { ru: 'Казань', en: 'Kazan', postcodes: ['420111', '420015'] },
];
const RU_STREETS = [['ул. Ленина', 'ul. Lenina'], ['ул. Пушкина', 'ul. Pushkina'], ['ул. Гагарина', 'ul. Gagarina'], ['пр. Мира', 'pr. Mira'], ['ул. Советская', 'ul. Sovetskaya'], ['ул. Садовая', 'ul. Sadovaya']];
const RU_BANKS = [
  { ru: 'ПАО Сбербанк', en: 'Sberbank', bik: '044525225', corr: '30101810400000000225', bic: 'SABRRUMM' },
  { ru: 'Банк ВТБ (ПАО)', en: 'VTB Bank', bik: '044525187', corr: '30101810700000000187', bic: 'VTBRRUMM' },
  { ru: 'АО «Альфа-Банк»', en: 'Alfa-Bank', bik: '044525593', corr: '30101810200000000593', bic: 'ALFARUMM' },
  { ru: 'АО «ТБанк»', en: 'T-Bank', bik: '044525974', corr: '30101810145250000974', bic: 'TICSRUMM' },
];

export const ru: CountryModule = {
  code: 'RU',
  name: 'Russia',
  flag: '🇷🇺',
  currency: 'RUB',
  group: 'Europe (non-euro)',
  generate(rng, options) {
    const gender = pickGender(rng, options);
    const g = gender === 'male' ? 0 : 1;
    const [givenRu, given] = rng.pick(RU_GIVEN[gender]);
    const familyRow = rng.pick(RU_FAMILY);
    const patronymicRow = rng.pick(RU_PATRONYMIC);
    const familyRu = familyRow[g];
    const family = familyRow[g + 2];
    const patronymicRu = patronymicRow[g];
    const patronymic = patronymicRow[g + 2];
    const dob = birthDate(rng, options);

    const city = rng.pick(RU_CITIES);
    const postcode = rng.pick(city.postcodes);
    const [streetRu, streetEn] = rng.pick(RU_STREETS);
    const house = rng.int(1, 120);
    const flat = rng.int(1, 300);

    let inn: string;
    do inn = rng.digits(2, true) + rng.digits(10);
    while (!innPersonalValid(inn));
    let snils: string;
    do snils = rng.digits(9);
    while (Number(snils) <= 1001998);
    snils += snilsCheck(snils);

    const bank = rng.pick(RU_BANKS);
    // 40817 = individual resident current account, 810 = RUB, then key digit, branch, account.
    const head = '40817810';
    const tail = rng.digits(4) + rng.digits(7);
    const account = head + solveCheckDigit((k) => ruAccountValid(bank.bik, head + k + tail)) + tail;
    const iban = makeIban('RU', bank.bik + account);

    return {
      gender,
      name: {
        full: `${given} ${patronymic} ${family}`,
        given,
        family,
        native: `${familyRu} ${givenRu} ${patronymicRu}`,
        accountHolder: `${familyRu} ${givenRu} ${patronymicRu}`,
        accountHolderLatin: `${family} ${given} ${patronymic}`.toUpperCase(),
        parts: [{ label: 'Patronymic (отчество)', value: `${patronymicRu} / ${patronymic}`, latin: patronymic }],
      },
      dateOfBirth: dob.iso,
      age: dob.age,
      nationality: 'Russian',
      address: {
        lines: [`${streetEn}, d. ${house}, kv. ${flat}`, `${city.en}, ${postcode}`],
        native: [`${streetRu}, д. ${house}, кв. ${flat}`, `г. ${city.ru}, ${postcode}`],
        structured: postalAddress({ StrtNm: streetEn, BldgNb: house, Room: `kv. ${flat}`, PstCd: postcode, TwnNm: city.en, Ctry: 'RU' }),
      },
      phone: `+7 9${rng.digits(2)} ${rng.digits(3)}-${rng.digits(2)}-${rng.digits(2)}`,
      email: email(rng, given, family),
      identity: [
        { label: 'INN (ИНН)', value: inn, check: 'INN check digits (mod 11)' },
        { label: 'SNILS (СНИЛС)', value: `${snils.slice(0, 3)}-${snils.slice(3, 6)}-${snils.slice(6, 9)} ${snils.slice(9)}`, check: 'SNILS checksum' },
        { label: 'Internal passport', value: `${rng.digits(2, true)} ${rng.digits(2)} ${rng.digits(6)}` },
      ],
      bank: {
        bankName: bank.en,
        bankNameNative: bank.ru,
        bic: bank.bic,
        currency: 'RUB',
        domestic: [
          { label: 'Account (расчётный счёт)', value: account, check: 'Bank of Russia key (BIK + 7-1-3)' },
          { label: 'BIK (БИК)', value: bank.bik },
          { label: 'Correspondent account (корр. счёт)', value: bank.corr, check: 'Bank of Russia key (BIK + 7-1-3)' },
        ],
        international: [
          { label: 'SWIFT / BIC', value: bank.bic },
          { label: 'Account number', value: account },
          { label: 'IBAN (registry format)', value: formatIban(iban), check: 'ISO 13616 mod 97' },
        ],
      },
      notes: [
        'Major Russian banks are under UK/EU/US sanctions and several are cut off from SWIFT; expect screening hits.',
        'Russia is in the IBAN registry, but IBANs are rarely used in practice. SWIFT/BIK + account is the norm.',
      ],
    };
  },
};

// ---------------------------------------------------------------------------- Iran

/** Iranian national code (کد ملی): 10 digits, mod 11 check. */
export function iranNationalCodeValid(code: string): boolean {
  if (!/^\d{10}$/.test(code) || /^(\d)\1{9}$/.test(code)) return false;
  const r = weightedSum(code.slice(0, 9), [10, 9, 8, 7, 6, 5, 4, 3, 2]) % 11;
  const check = Number(code[9]);
  return r < 2 ? check === r : check === 11 - r;
}

const toPersianDigits = (s: string) => s.replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[Number(d)]);

const IR_CITIES = [
  { fa: 'تهران', en: 'Tehran', province: 'Tehran', postPrefix: '1' },
  { fa: 'مشهد', en: 'Mashhad', province: 'Razavi Khorasan', postPrefix: '9' },
  { fa: 'اصفهان', en: 'Isfahan', province: 'Isfahan', postPrefix: '8' },
  { fa: 'شیراز', en: 'Shiraz', province: 'Fars', postPrefix: '7' },
  { fa: 'تبریز', en: 'Tabriz', province: 'East Azerbaijan', postPrefix: '5' },
];
const IR_STREETS = [['خیابان ولیعصر', 'Valiasr St'], ['خیابان انقلاب', 'Enghelab St'], ['خیابان آزادی', 'Azadi St'], ['خیابان شریعتی', 'Shariati St'], ['بلوار کشاورز', 'Keshavarz Blvd']];
const IR_BANKS = [
  { fa: 'بانک ملی ایران', en: 'Bank Melli Iran', code: '017', bic: 'BMJIIRTH', bin: '603799' },
  { fa: 'بانک ملت', en: 'Bank Mellat', code: '012', bic: 'BKMTIRTH', bin: '610433' },
  { fa: 'بانک تجارت', en: 'Bank Tejarat', code: '018', bic: 'BTEJIRTH', bin: '627353' },
  { fa: 'بانک صادرات ایران', en: 'Bank Saderat Iran', code: '019', bic: 'BSIRIRTH', bin: '603769' },
];

export const ir: CountryModule = {
  code: 'IR',
  name: 'Iran',
  flag: '🇮🇷',
  currency: 'IRR',
  group: 'Middle East & Africa',
  generate(rng, options) {
    const gender = pickGender(rng, options);
    const [givenFa, given] = rng.pick(IR_GIVEN[gender]);
    const [familyFa, family] = rng.pick(IR_FAMILY);
    const dob = birthDate(rng, options);

    const city = rng.pick(IR_CITIES);
    // Iranian postcodes avoid 0 and 2 in the first five digits.
    const postcode = city.postPrefix + rng.chars(4, '13456789') + rng.digits(5);
    const [streetFa, streetEn] = rng.pick(IR_STREETS);
    const plaque = rng.int(1, 250);
    const unit = rng.int(1, 20);

    let nationalCode: string;
    do {
      const body = rng.digits(9);
      nationalCode = body + solveCheckDigit((d) => iranNationalCodeValid(body + d));
    } while (nationalCode.length !== 10);

    const bank = rng.pick(IR_BANKS);
    const account = rng.digits(rng.int(10, 13), true);
    const iban = makeIban('IR', bank.code + account.padStart(19, '0'));
    const cardBody = bank.bin + rng.digits(9);
    const card = cardBody + luhnCheckDigit(cardBody);

    return {
      gender,
      name: { full: `${given} ${family}`, given, family, native: `${givenFa} ${familyFa}`,
        accountHolder: `${givenFa} ${familyFa}`,
        accountHolderLatin: `${given} ${family}`.toUpperCase(),
      },
      dateOfBirth: dob.iso,
      age: dob.age,
      nationality: 'Iranian',
      address: {
        lines: [`No. ${plaque}, Unit ${unit}, ${streetEn}`, city.en, `Postal code ${postcode.slice(0, 5)}-${postcode.slice(5)}`],
        native: [`${city.fa}، ${streetFa}، پلاک ${toPersianDigits(String(plaque))}، واحد ${toPersianDigits(String(unit))}`, `کد پستی ${toPersianDigits(postcode)}`],
        structured: postalAddress({
          StrtNm: streetEn,
          BldgNb: plaque,
          Room: `Unit ${unit}`,
          PstCd: `${postcode.slice(0, 5)}-${postcode.slice(5)}`,
          TwnNm: city.en,
          CtrySubDvsn: city.province,
          Ctry: 'IR',
        }),
      },
      phone: `+98 9${rng.pick(['12', '13', '19', '35', '36'])} ${rng.digits(3)} ${rng.digits(4)}`,
      email: email(rng, given, family),
      identity: [{ label: 'National code (کد ملی)', value: `${nationalCode.slice(0, 3)}-${nationalCode.slice(3, 9)}-${nationalCode.slice(9)}`, check: 'National code check digit (mod 11)' }],
      bank: {
        bankName: bank.en,
        bankNameNative: bank.fa,
        bic: bank.bic,
        currency: 'IRR',
        domestic: [
          { label: 'Account number (شماره حساب)', value: account },
          { label: 'Card number (شماره کارت)', value: card.replace(/(\d{4})(?=\d)/g, '$1-'), check: 'Shetab BIN + Luhn' },
          { label: 'Sheba (شبا)', value: formatIban(iban), check: 'ISO 13616 mod 97' },
        ],
        international: [
          { label: 'IBAN', value: formatIban(iban), check: 'ISO 13616 mod 97' },
          { label: 'SWIFT / BIC', value: bank.bic },
        ],
      },
      notes: [
        'Iran is under comprehensive UK/EU/US sanctions and Iranian banks are cut off from SWIFT; useful for testing sanctions screening.',
        'IR IBANs (Sheba) follow ISO 13616 but Iran is not in the SWIFT IBAN registry.',
      ],
    };
  },
};
