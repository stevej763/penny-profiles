import type { CountryModule } from '../core/types';
import { birthDate, email, pickGender, pickBank, bankName } from '../core/person';
import { pad, weightedSum } from '../core/checks';
import { postalAddress } from '../core/iso20022';
import { KR_FAMILY, KR_GIVEN } from './names';

/** Resident registration number check digit (numbers issued before October 2020). */
export function rrnCheck(first12: string): number {
  return (11 - (weightedSum(first12, [2, 3, 4, 5, 6, 7, 8, 9, 2, 3, 4, 5]) % 11)) % 10;
}

const CITIES = [
  { ko: '서울특별시', en: 'Seoul', pc: [1000, 8899], districts: [['강남구', 'Gangnam-gu'], ['마포구', 'Mapo-gu'], ['종로구', 'Jongno-gu'], ['송파구', 'Songpa-gu']] },
  { ko: '부산광역시', en: 'Busan', pc: [46000, 49599], districts: [['해운대구', 'Haeundae-gu'], ['부산진구', 'Busanjin-gu']] },
  { ko: '인천광역시', en: 'Incheon', pc: [21000, 23199], districts: [['연수구', 'Yeonsu-gu'], ['남동구', 'Namdong-gu']] },
  { ko: '대구광역시', en: 'Daegu', pc: [41000, 43099], districts: [['수성구', 'Suseong-gu'], ['중구', 'Jung-gu']] },
  { ko: '대전광역시', en: 'Daejeon', pc: [34000, 35399], districts: [['유성구', 'Yuseong-gu'], ['서구', 'Seo-gu']] },
];
const ROADS = [['테헤란로', 'Teheran-ro'], ['세종대로', 'Sejong-daero'], ['올림픽로', 'Olympic-ro'], ['중앙대로', 'Jungang-daero'], ['대학로', 'Daehak-ro'], ['월드컵로', 'World Cup-ro']];
// Account formats differ by bank and have no public check digit.
const BANKS = [
  { name: 'KB Kookmin Bank', ko: 'KB국민은행', bic: 'CZNBKRSE', code: '004', groups: [6, 2, 6] },
  { name: 'Shinhan Bank', ko: '신한은행', bic: 'SHBKKRSE', code: '088', groups: [3, 3, 6] },
  { name: 'Woori Bank', ko: '우리은행', bic: 'HVBKKRSE', code: '020', groups: [4, 3, 6] },
  { name: 'Hana Bank', ko: '하나은행', bic: 'KOEXKRSE', code: '081', groups: [3, 6, 5] },
  { name: 'NongHyup Bank', ko: 'NH농협은행', bic: 'NACFKRSE', code: '011', groups: [3, 4, 4, 2] },
];

export const kr: CountryModule = {
  code: 'KR',
  name: 'South Korea',
  flag: '🇰🇷',
  currency: 'KRW',
  group: 'Asia-Pacific',
  banks: BANKS.map(bankName),
  generate(rng, options) {
    const gender = pickGender(rng, options);
    const [familyKo, family] = rng.pick(KR_FAMILY);
    const [givenKo, given] = rng.pick(KR_GIVEN[gender]);
    const dob = birthDate(rng, options);
    const city = rng.pick(CITIES);
    const [districtKo, districtEn] = rng.pick(city.districts);
    const [roadKo, roadEn] = rng.pick(ROADS);
    const number = rng.int(1, 600);
    const unit = `${rng.int(1, 25)}0${rng.int(1, 9)}`;
    const postcode = pad(rng.int(city.pc[0], city.pc[1]), 5);

    // 7th digit: 1/2 = male/female born 1900–1999, 3/4 = born 2000–2099.
    const sexDigit = (dob.year >= 2000 ? 3 : 1) + (gender === 'male' ? 0 : 1);
    // Then a 2-digit place-of-birth code (00–96), 2-digit community centre and serial digit.
    const rrnBody = `${pad(dob.year % 100, 2)}${pad(dob.month, 2)}${pad(dob.day, 2)}${sexDigit}${pad(rng.int(0, 96), 2)}${rng.digits(3)}`;
    const rrn = rrnBody + rrnCheck(rrnBody);

    const bank = pickBank(rng, BANKS, options);
    const account = bank.groups.map((n) => rng.digits(n)).join('-');

    return {
      gender,
      name: {
        full: `${family} ${given}`,
        given,
        family,
        native: familyKo + givenKo,
        accountHolder: familyKo + givenKo,
        accountHolderLatin: `${family} ${given}`.toUpperCase(),
        parts: [{ label: 'Name order', value: 'Family name first' }],
      },
      dateOfBirth: dob.iso,
      age: dob.age,
      nationality: 'South Korean',
      address: {
        lines: [`${unit}-ho, ${number} ${roadEn}`, `${districtEn}, ${city.en} ${postcode}`],
        native: [`${city.ko} ${districtKo} ${roadKo} ${number}, ${unit}호`, postcode],
        structured: postalAddress({ StrtNm: roadEn, BldgNb: number, Room: `${unit}-ho`, PstCd: postcode, TwnNm: city.en, DstrctNm: districtEn, Ctry: 'KR' }),
      },
      phone: `+82 10-${rng.digits(4)}-${rng.digits(4)}`,
      email: email(rng, given.replace('-', ''), family),
      identity: [
        {
          label: 'Resident registration number (주민등록번호)',
          value: `${rrn.slice(0, 6)}-${rrn.slice(6)}`,
          check: 'RRN check digit (pre-2020 issuance)',
        },
      ],
      bank: {
        bankName: bank.name,
        bankNameNative: bank.ko,
        bic: bank.bic,
        currency: 'KRW',
        domestic: [
          { label: 'Bank code (은행코드)', value: bank.code },
          { label: 'Account number (계좌번호)', value: account },
        ],
        international: [
          { label: 'SWIFT / BIC', value: bank.bic },
          { label: 'Account number', value: account.replace(/-/g, '') },
          { label: 'IBAN', value: 'Not used in South Korea' },
        ],
      },
    };
  },
};
