import type { CountryModule } from '../core/types';
import { birthDate, email, pickGender, pickBank, bankName } from '../core/person';
import { postalAddress } from '../core/iso20022';
import { NAMES } from './names';

const CITIES = [
  { city: 'Quezon City', province: 'Metro Manila', zip: [1100, 1128], barangays: ['Bagumbayan', 'Commonwealth', 'Kamuning', 'Loyola Heights'] },
  { city: 'Makati', province: 'Metro Manila', zip: [1200, 1235], barangays: ['Bel-Air', 'Poblacion', 'San Lorenzo', 'Legazpi Village'] },
  { city: 'Manila', province: 'Metro Manila', zip: [1000, 1018], barangays: ['Ermita', 'Malate', 'Sampaloc', 'Binondo'] },
  { city: 'Pasig', province: 'Metro Manila', zip: [1600, 1612], barangays: ['Kapitolyo', 'San Antonio', 'Ugong'] },
  { city: 'Cebu City', province: 'Cebu', zip: [6000, 6000], barangays: ['Lahug', 'Mabolo', 'Guadalupe'] },
  { city: 'Davao City', province: 'Davao del Sur', zip: [8000, 8000], barangays: ['Poblacion', 'Buhangin', 'Talomo'] },
];
const STREETS = ['Rizal Street', 'Mabini Street', 'Bonifacio Avenue', 'Aguinaldo Street', 'Quezon Avenue', 'Ayala Avenue', 'Osmeña Boulevard', 'Del Pilar Street'];
// No IBAN and no public account check digit; lengths follow each bank's format.
const BANKS = [
  { name: 'BDO Unibank', bic: 'BNORPHMM', length: 12 },
  { name: 'Bank of the Philippine Islands', bic: 'BOPIPHMM', length: 10 },
  { name: 'Metrobank', bic: 'MBTCPHMM', length: 13 },
  { name: 'Land Bank of the Philippines', bic: 'TLBPPHMM', length: 10 },
  { name: 'Security Bank', bic: 'SETCPHMM', length: 13 },
];

export const ph: CountryModule = {
  code: 'PH',
  name: 'Philippines',
  flag: '🇵🇭',
  currency: 'PHP',
  group: 'Asia-Pacific',
  banks: BANKS.map(bankName),
  generate(rng, options) {
    const gender = pickGender(rng, options);
    const given = rng.pick(NAMES.PH[gender]);
    const family = rng.pick(NAMES.PH.family);
    // The middle name is the mother's maiden surname.
    const middle = rng.pick(NAMES.PH.family.filter((f) => f !== family));
    const dob = birthDate(rng, options);
    const place = rng.pick(CITIES);
    const barangay = `Barangay ${rng.pick(place.barangays)}`;
    const street = rng.pick(STREETS);
    const number = rng.int(1, 999);
    const unit = rng.bool(0.4) ? `Unit ${rng.int(1, 30)}${rng.pick(['A', 'B', 'C'])}` : undefined;
    const zip = String(rng.int(place.zip[0], place.zip[1]));

    const bank = pickBank(rng, BANKS, options);
    const account = rng.digits(bank.length, true);
    const mobile = `+63 9${rng.digits(2)} ${rng.digits(3)} ${rng.digits(4)}`;
    const tin = `${rng.digits(3, true)}-${rng.digits(3)}-${rng.digits(3)}-000`;

    return {
      gender,
      name: {
        full: `${given} ${middle} ${family}`,
        given,
        family,
        accountHolder: `${given} ${middle[0]}. ${family}`.toUpperCase(),
        parts: [{ label: "Middle name (mother's maiden surname)", value: middle }],
      },
      dateOfBirth: dob.iso,
      age: dob.age,
      nationality: 'Filipino',
      address: {
        lines: [`${unit ? `${unit}, ` : ''}${number} ${street}, ${barangay}`, `${place.city}, ${place.province} ${zip}`],
        structured: postalAddress({
          StrtNm: street,
          BldgNb: number,
          Room: unit,
          PstCd: zip,
          TwnNm: place.city,
          TwnLctnNm: barangay,
          CtrySubDvsn: place.province,
          Ctry: 'PH',
        }),
      },
      phone: mobile,
      email: email(rng, given, family),
      identity: [{ label: 'TIN', value: tin }],
      bank: {
        bankName: bank.name,
        bic: bank.bic,
        currency: 'PHP',
        domestic: [{ label: 'Account number', value: account }],
        international: [
          { label: 'SWIFT / BIC', value: bank.bic },
          { label: 'Account number', value: account },
          { label: 'IBAN', value: 'Not used in the Philippines' },
        ],
        extras: [{ label: 'GCash / InstaPay (mobile)', value: mobile }],
      },
    };
  },
};
