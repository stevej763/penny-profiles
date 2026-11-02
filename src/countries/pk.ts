import type { CountryModule } from '../core/types';
import { birthDate, email, pickGender } from '../core/person';
import { formatIban, makeIban } from '../core/iban';
import { postalAddress } from '../core/iso20022';
import { NAMES } from './names';

// CNIC first digit is the province of registration.
const CITIES = [
  { city: 'Karachi', province: 'Sindh', cnic: '4', pc: [74000, 75950], areas: ['Clifton', 'DHA Phase 5', 'Gulshan-e-Iqbal', 'PECHS'] },
  { city: 'Lahore', province: 'Punjab', cnic: '3', pc: [54000, 54950], areas: ['Gulberg III', 'DHA Phase 6', 'Model Town', 'Johar Town'] },
  { city: 'Islamabad', province: 'Islamabad Capital Territory', cnic: '6', pc: [44000, 44090], areas: ['F-7/3', 'G-9/4', 'E-11/2', 'I-8/1'] },
  { city: 'Rawalpindi', province: 'Punjab', cnic: '3', pc: [46000, 46300], areas: ['Satellite Town', 'Bahria Town', 'Saddar'] },
  { city: 'Faisalabad', province: 'Punjab', cnic: '3', pc: [38000, 38090], areas: ['Peoples Colony', 'Madina Town'] },
  { city: 'Peshawar', province: 'Khyber Pakhtunkhwa', cnic: '1', pc: [25000, 25200], areas: ['Hayatabad', 'University Town'] },
];
const BANKS = [
  { name: 'HBL', bic: 'HABBPKKA', code: 'HABB' },
  { name: 'United Bank Limited', bic: 'UNILPKKA', code: 'UNIL' },
  { name: 'MCB Bank', bic: 'MUCBPKKA', code: 'MUCB' },
  { name: 'Meezan Bank', bic: 'MEZNPKKA', code: 'MEZN' },
  { name: 'Allied Bank', bic: 'ABPAPKKA', code: 'ABPA' },
];

export const pk: CountryModule = {
  code: 'PK',
  name: 'Pakistan',
  flag: '🇵🇰',
  currency: 'PKR',
  group: 'Asia-Pacific',
  generate(rng, options) {
    const gender = pickGender(rng, options);
    const given = rng.pick(NAMES.PK[gender]);
    const family = rng.pick(NAMES.PK.family);
    const dob = birthDate(rng, options);
    const place = rng.pick(CITIES);
    const area = rng.pick(place.areas);
    const house = rng.int(1, 400);
    const street = `Street ${rng.int(1, 60)}`;
    const postcode = String(rng.int(place.pc[0], place.pc[1]));

    // Last CNIC digit encodes sex: odd for men, even (not 0) for women.
    const sexDigit = gender === 'male' ? rng.pick([1, 3, 5, 7, 9]) : rng.pick([2, 4, 6, 8]);
    const cnic = `${place.cnic}${rng.digits(4)}-${rng.digits(7)}-${sexDigit}`;

    const bank = rng.pick(BANKS);
    const account = rng.digits(16);
    const iban = makeIban('PK', bank.code + account);
    const mobile = `+92 3${rng.digits(2)} ${rng.digits(7)}`;

    return {
      gender,
      name: { full: `${given} ${family}`, given, family, accountHolder: `${given} ${family}`.toUpperCase() },
      dateOfBirth: dob.iso,
      age: dob.age,
      nationality: 'Pakistani',
      address: {
        lines: [`House ${house}, ${street}, ${area}`, `${place.city} ${postcode}`],
        structured: postalAddress({ StrtNm: street, BldgNb: house, PstCd: postcode, TwnNm: place.city, TwnLctnNm: area, CtrySubDvsn: place.province, Ctry: 'PK' }),
      },
      phone: mobile,
      email: email(rng, given, family),
      identity: [{ label: 'CNIC', value: cnic, check: 'CNIC structure (province and sex digits)' }],
      bank: {
        bankName: bank.name,
        bic: bank.bic,
        currency: 'PKR',
        domestic: [
          { label: 'IBAN (used for domestic transfers)', value: formatIban(iban), check: 'ISO 13616 mod 97' },
          { label: 'Account number', value: account },
        ],
        international: [
          { label: 'IBAN', value: formatIban(iban), check: 'ISO 13616 mod 97' },
          { label: 'BIC / SWIFT', value: bank.bic },
        ],
        extras: [{ label: 'Raast ID (mobile)', value: mobile }],
      },
    };
  },
};
