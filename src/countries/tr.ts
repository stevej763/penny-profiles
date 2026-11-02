import type { CountryModule } from '../core/types';
import type { Rng } from '../core/rng';
import { birthDate, email, pickGender, pickBank, bankName } from '../core/person';
import { formatIban, makeIban } from '../core/iban';
import { toDigits } from '../core/checks';
import { postalAddress } from '../core/iso20022';
import { NAMES } from './names';

/** T.C. Kimlik No: 11 digits, first non-zero, two check digits. */
export function tcKimlikChecks(first9: string): string {
  const d = toDigits(first9);
  const odd = d[0] + d[2] + d[4] + d[6] + d[8];
  const even = d[1] + d[3] + d[5] + d[7];
  const c10 = (((odd * 7 - even) % 10) + 10) % 10;
  const c11 = (d.reduce((s, x) => s + x, 0) + c10) % 10;
  return `${c10}${c11}`;
}

const tcKimlik = (rng: Rng) => {
  const body = rng.digits(9, true);
  return body + tcKimlikChecks(body);
};

const CITIES = [
  { city: 'İstanbul', pc: [34000, 34990], districts: ['Kadıköy', 'Beşiktaş', 'Üsküdar', 'Şişli', 'Bakırköy'] },
  { city: 'Ankara', pc: [6000, 6990], districts: ['Çankaya', 'Keçiören', 'Yenimahalle'] },
  { city: 'İzmir', pc: [35000, 35990], districts: ['Konak', 'Karşıyaka', 'Bornova'] },
  { city: 'Bursa', pc: [16000, 16990], districts: ['Osmangazi', 'Nilüfer'] },
  { city: 'Antalya', pc: [7000, 7990], districts: ['Muratpaşa', 'Konyaaltı'] },
];
const NEIGHBOURHOODS = ['Caferağa', 'Bahçelievler', 'Cumhuriyet', 'Atatürk', 'Fatih', 'Barbaros', 'İnönü', 'Yeşilyurt'];
const STREETS = ['Moda Cad.', 'Atatürk Cad.', 'İstiklal Cad.', 'Cumhuriyet Cad.', 'Bağdat Cad.', 'Gül Sok.', 'Lale Sok.', 'Menekşe Sok.'];
const BANKS = [
  { name: 'Ziraat Bankası', bic: 'TCZBTR2A', code: '00010' },
  { name: 'Türkiye İş Bankası', bic: 'ISBKTRIS', code: '00064' },
  { name: 'Garanti BBVA', bic: 'TGBATRIS', code: '00062' },
  { name: 'Akbank', bic: 'AKBKTRIS', code: '00046' },
  { name: 'Yapı Kredi', bic: 'YAPITRIS', code: '00067' },
];

export const tr: CountryModule = {
  code: 'TR',
  name: 'Turkey',
  flag: '🇹🇷',
  currency: 'TRY',
  group: 'Europe (non-euro)',
  banks: BANKS.map(bankName),
  generate(rng, options) {
    const gender = pickGender(rng, options);
    const given = rng.pick(NAMES.TR[gender]);
    const family = rng.pick(NAMES.TR.family);
    const dob = birthDate(rng, options);
    const place = rng.pick(CITIES);
    const district = rng.pick(place.districts);
    const mahalle = `${rng.pick(NEIGHBOURHOODS)} Mah.`;
    const street = rng.pick(STREETS);
    const number = rng.int(1, 250);
    const flat = rng.int(1, 30);
    const postcode = String(rng.int(place.pc[0], place.pc[1])).padStart(5, '0');

    const bank = pickBank(rng, BANKS, options);
    const branch = rng.digits(4);
    const account = rng.digits(8);
    // BBAN: bank code (5) + reserved digit 0 + 16-digit account field.
    const iban = makeIban('TR', bank.code + '0' + (branch + account).padStart(16, '0'));

    return {
      gender,
      name: { full: `${given} ${family}`, given, family, accountHolder: `${given} ${family}`.toLocaleUpperCase('tr') },
      dateOfBirth: dob.iso,
      age: dob.age,
      nationality: 'Turkish',
      address: {
        lines: [`${mahalle} ${street} No: ${number} Daire: ${flat}`, `${postcode} ${district}/${place.city}`],
        structured: postalAddress({
          StrtNm: street,
          BldgNb: number,
          Room: `Daire: ${flat}`,
          PstCd: postcode,
          TwnNm: place.city,
          TwnLctnNm: mahalle,
          DstrctNm: district,
          Ctry: 'TR',
        }),
      },
      phone: `+90 5${rng.digits(2)} ${rng.digits(3)} ${rng.digits(2)} ${rng.digits(2)}`,
      email: email(rng, given, family),
      identity: [{ label: 'T.C. Kimlik No', value: tcKimlik(rng), check: 'T.C. Kimlik check digits' }],
      bank: {
        bankName: bank.name,
        bic: bank.bic,
        currency: 'TRY',
        domestic: [
          { label: 'IBAN (used for domestic transfers)', value: formatIban(iban), check: 'ISO 13616 mod 97' },
          { label: 'Şube kodu (branch)', value: branch },
          { label: 'Hesap no (account)', value: account },
        ],
        international: [
          { label: 'IBAN', value: formatIban(iban), check: 'ISO 13616 mod 97' },
          { label: 'BIC / SWIFT', value: bank.bic },
        ],
      },
    };
  },
};
