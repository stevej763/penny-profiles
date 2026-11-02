import type { CountryModule } from '../core/types';
import type { Rng } from '../core/rng';
import { birthDate, email, pickGender } from '../core/person';
import { formatIban, makeIban } from '../core/iban';
import { luhnCheckDigit } from '../core/checks';
import { postalAddress } from '../core/iso20022';
import { AE_FAMILY, AR_GIVEN, NAMES } from './names';

// Most UAE residents are expatriates, so nationality (and naming) varies.
const NATIONALITIES = [
  { nationality: 'Emirati', weight: 25, pool: null },
  { nationality: 'Indian', weight: 30, pool: 'IN' },
  { nationality: 'Pakistani', weight: 15, pool: 'PK' },
  { nationality: 'Filipino', weight: 15, pool: 'PH' },
  { nationality: 'British', weight: 15, pool: 'GB' },
] as const;

function pickNationality(rng: Rng) {
  let n = rng.int(1, NATIONALITIES.reduce((s, x) => s + x.weight, 0));
  for (const x of NATIONALITIES) if ((n -= x.weight) <= 0) return x;
  return NATIONALITIES[0];
}

const CITIES = [
  { city: 'Dubai', emirate: 'Dubai', areas: ['Dubai Marina', 'Jumeirah Lake Towers', 'Downtown Dubai', 'Al Barsha', 'Deira', 'Business Bay'] },
  { city: 'Abu Dhabi', emirate: 'Abu Dhabi', areas: ['Al Reem Island', 'Khalifa City', 'Al Khalidiyah', 'Al Bateen'] },
  { city: 'Sharjah', emirate: 'Sharjah', areas: ['Al Majaz', 'Al Nahda', 'Al Taawun'] },
  { city: 'Ajman', emirate: 'Ajman', areas: ['Al Nuaimiya', 'Al Rashidiya'] },
];
const BUILDINGS = ['Marina Heights Tower', 'Al Noor Residence', 'Palm View Building', 'Golden Sands 3', 'Silver Tower', 'Al Wasl Building', 'Crescent Tower'];
const BANKS = [
  { name: 'Emirates NBD', bic: 'EBILAEAD', code: '026' },
  { name: 'First Abu Dhabi Bank', bic: 'NBADAEAA', code: '035' },
  { name: 'Abu Dhabi Commercial Bank', bic: 'ADCBAEAA', code: '030' },
  { name: 'Dubai Islamic Bank', bic: 'DUIBAEAD', code: '024' },
  { name: 'Mashreq', bic: 'BOMLAEAD', code: '033' },
];

export const ae: CountryModule = {
  code: 'AE',
  name: 'United Arab Emirates',
  flag: '🇦🇪',
  currency: 'AED',
  group: 'Middle East & Africa',
  generate(rng, options) {
    const gender = pickGender(rng, options);
    const origin = pickNationality(rng);
    let given: string, family: string, full: string, native: string | undefined;
    if (origin.pool === null) {
      const [givenAr, givenEn] = rng.pick(AR_GIVEN[gender]);
      const [fatherAr, fatherEn] = rng.pick(AR_GIVEN.male);
      const [familyAr, familyEn] = rng.pick(AE_FAMILY);
      given = givenEn;
      family = familyEn;
      full = `${givenEn} ${fatherEn} ${familyEn}`;
      native = `${givenAr} ${fatherAr} ${familyAr}`;
    } else {
      const pool = NAMES[origin.pool];
      given = rng.pick(pool[gender]);
      family = rng.pick(pool.family);
      full = `${given} ${family}`;
    }
    const dob = birthDate(rng, options);
    const place = rng.pick(CITIES);
    const area = rng.pick(place.areas);
    const building = rng.pick(BUILDINGS);
    const apartment = `${rng.int(1, 45)}${rng.digits(2)}`;
    const poBox = String(rng.int(1000, 99999));

    const idBody = '784' + dob.year + rng.digits(7);
    const emiratesId = idBody + luhnCheckDigit(idBody);

    const bank = rng.pick(BANKS);
    const account = rng.digits(16);
    const iban = makeIban('AE', bank.code + account);

    return {
      gender,
      name: native
        ? { full, given, family, native, accountHolder: native, accountHolderLatin: full.toUpperCase() }
        : { full, given, family, accountHolder: full.toUpperCase() },
      dateOfBirth: dob.iso,
      age: dob.age,
      nationality: origin.nationality,
      // The UAE has no postcodes; mail goes to PO boxes.
      address: {
        lines: [`Apartment ${apartment}, ${building}`, `${area}, ${place.city}`, `PO Box ${poBox}`],
        structured: postalAddress({
          BldgNm: building,
          Room: `Apartment ${apartment}`,
          PstBx: poBox,
          TwnNm: place.city,
          TwnLctnNm: area,
          CtrySubDvsn: place.emirate,
          Ctry: 'AE',
        }),
      },
      phone: `+971 5${rng.pick(['0', '2', '4', '5', '6', '8'])} ${rng.digits(3)} ${rng.digits(4)}`,
      email: email(rng, given, family.replace(/^Al-/, '')),
      identity: [
        {
          label: 'Emirates ID',
          value: `${emiratesId.slice(0, 3)}-${emiratesId.slice(3, 7)}-${emiratesId.slice(7, 14)}-${emiratesId.slice(14)}`,
          check: 'Emirates ID Luhn',
        },
      ],
      bank: {
        bankName: bank.name,
        bic: bank.bic,
        currency: 'AED',
        domestic: [
          { label: 'IBAN (used for domestic transfers)', value: formatIban(iban), check: 'ISO 13616 mod 97' },
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
