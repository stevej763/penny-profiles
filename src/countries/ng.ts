import type { CountryModule } from '../core/types';
import { birthDate, email, pickGender, pickBank, bankName } from '../core/person';
import { weightedSum } from '../core/checks';
import { postalAddress } from '../core/iso20022';
import { NAMES } from './names';

/** NUBAN check digit (CBN): 3-digit bank code + 9-digit serial, weights 3,7,3 repeating, 10 − (sum mod 10). */
export function nubanCheck(bankCode: string, serial: string): number {
  return (10 - (weightedSum(bankCode + serial, [3, 7, 3, 3, 7, 3, 3, 7, 3, 3, 7, 3]) % 10)) % 10;
}

const CITIES = [
  { city: 'Lagos', state: 'Lagos State', pc: [100001, 102101], areas: ['Ikeja', 'Lekki', 'Surulere', 'Victoria Island', 'Yaba'] },
  { city: 'Abuja', state: 'Federal Capital Territory', pc: [900001, 900108], areas: ['Wuse II', 'Garki', 'Maitama', 'Asokoro'] },
  { city: 'Kano', state: 'Kano State', pc: [700001, 700010], areas: ['Nassarawa', 'Sabon Gari'] },
  { city: 'Port Harcourt', state: 'Rivers State', pc: [500001, 500102], areas: ['GRA Phase 2', 'Rumuola'] },
  { city: 'Ibadan', state: 'Oyo State', pc: [200001, 200285], areas: ['Bodija', 'Ring Road'] },
];
const STREETS = ['Adeola Odeku Street', 'Allen Avenue', 'Awolowo Road', 'Herbert Macaulay Way', 'Ahmadu Bello Way', 'Aminu Kano Crescent', 'Ikwerre Road', 'Bode Thomas Street'];
const BANKS = [
  { name: 'Access Bank', bic: 'ABNGNGLA', code: '044' },
  { name: 'Guaranty Trust Bank', bic: 'GTBINGLA', code: '058' },
  { name: 'Zenith Bank', bic: 'ZEIBNGLA', code: '057' },
  { name: 'First Bank of Nigeria', bic: 'FBNINGLA', code: '011' },
  { name: 'United Bank for Africa', bic: 'UNAFNGLA', code: '033' },
];

export const ng: CountryModule = {
  code: 'NG',
  name: 'Nigeria',
  flag: '🇳🇬',
  currency: 'NGN',
  group: 'Middle East & Africa',
  banks: BANKS.map(bankName),
  generate(rng, options) {
    const gender = pickGender(rng, options);
    const given = rng.pick(NAMES.NG[gender]);
    const family = rng.pick(NAMES.NG.family);
    const dob = birthDate(rng, options);
    const place = rng.pick(CITIES);
    const area = rng.pick(place.areas);
    const street = rng.pick(STREETS);
    const number = rng.int(1, 250);
    const postcode = String(rng.int(place.pc[0], place.pc[1]));

    const bank = pickBank(rng, BANKS, options);
    const serial = rng.digits(9);
    const nuban = serial + nubanCheck(bank.code, serial);

    return {
      gender,
      name: { full: `${given} ${family}`, given, family, accountHolder: `${family} ${given}`.toUpperCase() },
      dateOfBirth: dob.iso,
      age: dob.age,
      nationality: 'Nigerian',
      address: {
        lines: [`${number} ${street}, ${area}`, `${place.city} ${postcode}, ${place.state}`],
        structured: postalAddress({ StrtNm: street, BldgNb: number, PstCd: postcode, TwnNm: place.city, TwnLctnNm: area, CtrySubDvsn: place.state, Ctry: 'NG' }),
      },
      phone: `+234 ${rng.pick(['803', '806', '813', '816', '703', '706', '903'])} ${rng.digits(3)} ${rng.digits(4)}`,
      email: email(rng, given, family),
      identity: [
        // BVN and NIN have no published check digit.
        { label: 'BVN', value: '22' + rng.digits(9) },
        { label: 'NIN', value: rng.digits(11, true) },
      ],
      bank: {
        bankName: bank.name,
        bic: bank.bic,
        currency: 'NGN',
        domestic: [
          { label: 'Account number (NUBAN)', value: nuban, check: 'CBN NUBAN check digit' },
          { label: 'Bank code', value: bank.code },
        ],
        international: [
          { label: 'SWIFT / BIC', value: bank.bic },
          { label: 'Account number', value: nuban },
          { label: 'IBAN', value: 'Not used in Nigeria' },
        ],
      },
    };
  },
};
