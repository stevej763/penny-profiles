import type { CountryModule } from '../core/types';
import type { Rng } from '../core/rng';
import { birthDate, email, pickGender } from '../core/person';
import { luhnCheckDigit, pad } from '../core/checks';
import { postalAddress } from '../core/iso20022';
import { NAMES } from './names';

// Postcodes never use D, F, I, O, Q or U; the first letter is fixed by province/region.
const POSTCODE_LETTERS = 'ABCEGHJKLMNPRSTVWXYZ';

const CITIES = [
  { city: 'Toronto', prov: 'ON', fsa: ['M5V', 'M4C', 'M6G', 'M5A'], area: '416', fr: false },
  { city: 'Ottawa', prov: 'ON', fsa: ['K1P', 'K2P', 'K1N'], area: '613', fr: false },
  { city: 'Montréal', prov: 'QC', fsa: ['H2X', 'H3B', 'H1V', 'H2T'], area: '514', fr: true },
  { city: 'Québec', prov: 'QC', fsa: ['G1R', 'G1K'], area: '418', fr: true },
  { city: 'Vancouver', prov: 'BC', fsa: ['V6B', 'V5K', 'V6K'], area: '604', fr: false },
  { city: 'Calgary', prov: 'AB', fsa: ['T2P', 'T3A'], area: '403', fr: false },
  { city: 'Edmonton', prov: 'AB', fsa: ['T5J', 'T6E'], area: '780', fr: false },
  { city: 'Winnipeg', prov: 'MB', fsa: ['R3C', 'R2M'], area: '204', fr: false },
  { city: 'Halifax', prov: 'NS', fsa: ['B3H', 'B3J'], area: '902', fr: false },
];
const STREETS_EN = ['Queen Street West', 'King Street East', 'Yonge Street', 'Main Street', 'Maple Avenue', 'Elm Street', 'Victoria Avenue', 'Bay Street', 'Jasper Avenue'];
const STREETS_FR = ['rue Sainte-Catherine', 'rue Saint-Denis', 'boulevard Saint-Laurent', 'rue Sherbrooke', 'avenue du Parc', 'rue Principale'];

const BANKS = [
  { name: 'Royal Bank of Canada', bic: 'ROYCCAT2', institution: '003' },
  { name: 'TD Canada Trust', bic: 'TDOMCATTTOR', institution: '004' },
  { name: 'Scotiabank', bic: 'NOSCCATT', institution: '002' },
  { name: 'BMO Bank of Montreal', bic: 'BOFMCAM2', institution: '001' },
  { name: 'CIBC', bic: 'CIBCCATT', institution: '010' },
];
const DESJARDINS = { name: 'Desjardins', bic: 'CCDQCAMM', institution: '815' };

/** Social Insurance Number: 9 digits, Luhn. First digit 1–7 (9 is for temporary residents). */
function sin(rng: Rng): string {
  const body = rng.int(1, 7) + rng.digits(7);
  const n = body + luhnCheckDigit(body);
  return `${n.slice(0, 3)} ${n.slice(3, 6)} ${n.slice(6)}`;
}

export const ca: CountryModule = {
  code: 'CA',
  name: 'Canada',
  flag: '🇨🇦',
  currency: 'CAD',
  group: 'Americas',
  generate(rng, options) {
    const gender = pickGender(rng, options);
    const given = rng.pick(NAMES.CA[gender]);
    const family = rng.pick(NAMES.CA.family);
    const dob = birthDate(rng, options);
    const place = rng.pick(CITIES);
    const postcode = `${rng.pick(place.fsa)} ${rng.int(0, 9)}${rng.chars(1, POSTCODE_LETTERS)}${rng.int(0, 9)}`;
    const number = rng.int(10, 9999);
    const street = rng.pick(place.fr ? STREETS_FR : STREETS_EN);
    const unit = rng.bool(0.35) ? rng.int(1, 2400) : undefined;
    const line1 = place.fr
      ? `${number}, ${street}${unit ? `, app. ${unit}` : ''}`
      : `${unit ? `Unit ${unit}, ` : ''}${number} ${street}`;

    const bank = place.prov === 'QC' && rng.bool(0.4) ? DESJARDINS : rng.pick(BANKS);
    const transit = rng.digits(5);
    const account = rng.digits(7);
    const mail = email(rng, given, family);

    return {
      gender,
      name: { full: `${given} ${family}`, given, family, accountHolder: `${given} ${family}`.toUpperCase() },
      dateOfBirth: dob.iso,
      age: dob.age,
      nationality: 'Canadian',
      address: {
        lines: [line1, `${place.city} ${place.prov}  ${postcode}`],
        structured: postalAddress({
          StrtNm: street,
          BldgNb: number,
          Room: unit && (place.fr ? `app. ${unit}` : `Unit ${unit}`),
          PstCd: postcode,
          TwnNm: place.city,
          CtrySubDvsn: place.prov,
          Ctry: 'CA',
        }),
      },
      // 555-0100 to 555-0199 is reserved for fictional use across the North American plan.
      phone: `+1 (${place.area}) 555-01${pad(rng.int(0, 99), 2)}`,
      email: mail,
      identity: [{ label: 'Social Insurance Number', value: sin(rng), check: 'SIN Luhn' }],
      bank: {
        bankName: bank.name,
        bic: bank.bic,
        currency: 'CAD',
        domestic: [
          { label: 'Transit number', value: transit },
          { label: 'Institution number', value: bank.institution },
          { label: 'Account number', value: account },
          { label: 'EFT routing number', value: `0${bank.institution}${transit}` },
        ],
        international: [
          { label: 'SWIFT / BIC', value: bank.bic },
          { label: 'Account number', value: `${transit}-${bank.institution}-${account}` },
          { label: 'IBAN', value: 'Not used in Canada' },
        ],
        extras: [{ label: 'Interac e-Transfer (email)', value: mail }],
      },
    };
  },
};
