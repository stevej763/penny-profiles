import { euroCountry, range, yy, mm, dd } from './eurozone';
import { pad, weightedSum } from '../core/checks';
import { NAMES } from './names';

/** Isikukood check digit: weights 1..9,1; if the remainder is 10, retry with 3..9,1,2,3; 10 again → 0. */
export function isikukoodCheck(first10: string): number {
  const r1 = weightedSum(first10, [1, 2, 3, 4, 5, 6, 7, 8, 9, 1]) % 11;
  if (r1 < 10) return r1;
  const r2 = weightedSum(first10, [3, 4, 5, 6, 7, 8, 9, 1, 2, 3]) % 11;
  return r2 < 10 ? r2 : 0;
}

/** Account check digit: weights 7,3,1 repeating over the account digits, (10 − sum mod 10) mod 10. */
export function eeAccountCheck(digits: string): number {
  const w = [7, 1, 3, 7, 1, 3, 7, 1, 3, 7, 1, 3, 7];
  return (10 - (weightedSum(digits, w) % 10)) % 10;
}

export const ee = euroCountry({
  code: 'EE',
  name: 'Estonia',
  flag: '🇪🇪',
  nationality: 'Estonian',
  given: NAMES.EE,
  family: NAMES.EE.family,
  cities: [
    { name: 'Tallinn', postcode: range(10111, 13999, 5), region: 'Harju maakond' },
    { name: 'Tartu', postcode: range(50050, 51014, 5), region: 'Tartu maakond' },
    { name: 'Narva', postcode: range(20101, 21020, 5), region: 'Ida-Viru maakond' },
    { name: 'Pärnu', postcode: range(80010, 80046, 5), region: 'Pärnu maakond' },
    { name: 'Viljandi', postcode: range(71001, 71030, 5), region: 'Viljandi maakond' },
  ],
  streets: ['Narva mnt', 'Pärnu mnt', 'Tartu mnt', 'Viru tn', 'Rüütli tn', 'Pikk tn', 'Lai tn', 'Kalevi tn'],
  address: (rng, street, city) => {
    const nb = rng.int(1, 90);
    const flat = rng.bool(0.6) ? rng.int(1, 80) : undefined;
    const pc = city.postcode(rng);
    return {
      lines: [`${street} ${nb}${flat ? `-${flat}` : ''}`, `${pc} ${city.name}`],
      parts: { StrtNm: street, BldgNb: nb, Room: flat, PstCd: pc },
    };
  },
  phone: (rng) => `+372 5${rng.digits(3)} ${rng.digits(4)}`,
  identity: ({ rng, gender, dob }) => {
    const century = dob.year >= 2000 ? 5 : 3;
    const body = `${century + (gender === 'female' ? 1 : 0)}${yy(dob)}${mm(dob)}${dd(dob)}${pad(rng.int(1, 999), 3)}`;
    return [{ label: 'Isikukood', value: body + isikukoodCheck(body), check: 'Isikukood check digit (mod 11)' }];
  },
  banks: [
    { name: 'Swedbank', bic: 'HABAEE2X', code: '22' },
    { name: 'SEB Pank', bic: 'EEUHEE2X', code: '10' },
    { name: 'LHV Pank', bic: 'LHVBEE22', code: '77' },
    { name: 'Luminor', bic: 'RIKOEE22', code: '96' },
    { name: 'Coop Pank', bic: 'EKRDEE22', code: '42' },
  ].map(({ name, bic, code }) => ({
    name,
    bic,
    generate(rng) {
      const body = rng.digits(13);
      const account = body + eeAccountCheck(body);
      return {
        bban: code + account,
        domestic: [{ label: 'Kontonumber', value: (code + account).replace(/^0+/, ''), check: 'Estonian 7-3-1 check digit' }],
      };
    },
  })),
});
