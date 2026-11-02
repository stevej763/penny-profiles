import type { CountryModule } from '../core/types';
import type { Rng } from '../core/rng';
import { birthDate, email, pickGender, pickBank, bankName } from '../core/person';
import { formatIban, makeIban } from '../core/iban';
import { pad } from '../core/checks';
import { postalAddress } from '../core/iso20022';
import { NAMES } from './names';
import { UK_BANKS, methodLabel, passesAll } from './gb-modulus';

const { male, female, family: FAMILY } = NAMES.GB;
const GIVEN = { male, female };
const STREETS = ['High Street', 'Station Road', 'Church Lane', 'Victoria Road', 'Park Avenue', 'Mill Lane', 'Queen Street', "King's Road", 'Grange Road', 'Manor Way', 'Elm Grove', 'Oak Close', 'Willow Crescent', 'Albert Street', 'The Green', 'Chapel Street', 'Springfield Road'];
const CITIES = [
  { city: 'London', region: 'Greater London', outward: ['SW1A', 'SE1', 'E1', 'N1', 'NW1', 'W1D', 'EC1A', 'SW11', 'E14'] },
  { city: 'Manchester', region: 'Greater Manchester', outward: ['M1', 'M4', 'M14', 'M20'] },
  { city: 'Birmingham', region: 'West Midlands', outward: ['B1', 'B15', 'B29'] },
  { city: 'Leeds', region: 'West Yorkshire', outward: ['LS1', 'LS6', 'LS11'] },
  { city: 'Sheffield', region: 'South Yorkshire', outward: ['S1', 'S10', 'S11'] },
  { city: 'Bristol', region: 'Bristol', outward: ['BS1', 'BS6', 'BS8'] },
  { city: 'Liverpool', region: 'Merseyside', outward: ['L1', 'L8', 'L17'] },
  { city: 'Newcastle upon Tyne', region: 'Tyne and Wear', outward: ['NE1', 'NE2', 'NE6'] },
  { city: 'Nottingham', region: 'Nottinghamshire', outward: ['NG1', 'NG7'] },
  { city: 'Glasgow', region: 'Scotland', outward: ['G1', 'G12', 'G41'] },
  { city: 'Edinburgh', region: 'Scotland', outward: ['EH1', 'EH3', 'EH10'] },
  { city: 'Cardiff', region: 'Wales', outward: ['CF10', 'CF11', 'CF24'] },
  { city: 'Belfast', region: 'Northern Ireland', outward: ['BT1', 'BT7', 'BT9'] },
];
const INWARD_LETTERS = 'ABDEFGHJLNPQRSTUWXYZ';

function nationalInsuranceNumber(rng: Rng): string {
  const first = 'ABCEGHJKLMNOPRSTWXYZ';
  const second = 'ABCEGHJKLMNPRSTWXYZ';
  const banned = ['BG', 'GB', 'KN', 'NK', 'NT', 'TN', 'ZZ'];
  let prefix: string;
  do prefix = rng.chars(1, first) + rng.chars(1, second);
  while (banned.includes(prefix));
  const digits = rng.digits(6);
  return `${prefix} ${digits.slice(0, 2)} ${digits.slice(2, 4)} ${digits.slice(4)} ${rng.chars(1, 'ABCD')}`;
}

export const gb: CountryModule = {
  code: 'GB',
  name: 'United Kingdom',
  flag: '🇬🇧',
  currency: 'GBP',
  group: 'United Kingdom',
  banks: UK_BANKS.map(bankName),
  generate(rng, options) {
    const gender = pickGender(rng, options);
    const given = rng.pick(GIVEN[gender]);
    const middle = rng.bool(0.4) ? rng.pick(GIVEN[gender].filter((n) => n !== given)) : undefined;
    const family = rng.pick(FAMILY);
    const dob = birthDate(rng, options);

    const place = rng.pick(CITIES);
    const postcode = `${rng.pick(place.outward)} ${rng.int(1, 9)}${rng.chars(2, INWARD_LETTERS)}`;
    const buildingNumber = String(rng.int(1, 220));
    const streetName = rng.pick(STREETS);
    const flat = rng.bool(0.25) ? `Flat ${rng.int(1, 40)}` : undefined;
    const street = `${buildingNumber} ${streetName}`;
    const lines = [flat ? `${flat}, ${street}` : street, place.city, postcode];

    const bank = pickBank(rng, UK_BANKS, options);
    const range = rng.pick(bank.ranges);
    const sortCode = pad(rng.int(Number(range.from), Number(range.to)), 6);
    let account: string;
    do account = rng.digits(8);
    while (!passesAll(sortCode, account, range.rules));
    const iban = makeIban('GB', bank.ibanBankCode + sortCode + account);
    const holder = `${gender === 'male' ? 'Mr' : rng.pick(['Ms', 'Mrs', 'Miss'])} ${given[0]} ${family}`.toUpperCase();

    return {
      gender,
      name: {
        full: [given, middle, family].filter(Boolean).join(' '),
        given,
        family,
        accountHolder: holder,
        parts: middle ? [{ label: 'Middle name', value: middle }] : undefined,
      },
      dateOfBirth: dob.iso,
      age: dob.age,
      nationality: 'British',
      address: {
        lines,
        structured: postalAddress({ StrtNm: streetName, BldgNb: buildingNumber, Room: flat, PstCd: postcode, TwnNm: place.city, CtrySubDvsn: place.region, Ctry: 'GB' }),
      },
      // Ofcom reserves 07700 900000–900999 for drama, so these numbers are never allocated.
      phone: `+44 7700 900${pad(rng.int(0, 999), 3)}`,
      email: email(rng, given, family),
      identity: [{ label: 'National Insurance number', value: nationalInsuranceNumber(rng), check: 'HMRC prefix rules' }],
      bank: {
        bankName: bank.name,
        bic: bank.bic,
        currency: 'GBP',
        domestic: [
          { label: 'Sort code', value: `${sortCode.slice(0, 2)}-${sortCode.slice(2, 4)}-${sortCode.slice(4)}` },
          { label: 'Account number', value: account, check: `UK modulus ${methodLabel(range.rules)}` },
        ],
        international: [
          { label: 'IBAN', value: formatIban(iban), check: 'ISO 13616 mod 97' },
          { label: 'BIC / SWIFT', value: bank.bic },
        ],
      },
    };
  },
};
