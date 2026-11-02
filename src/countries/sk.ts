import type { Rng } from '../core/rng';
import { euroCountry, yy, dd } from './eurozone';
import { pad, weightedSum } from '../core/checks';
import { NAMES } from './names';
import type { BirthDate } from '../core/person';

const ACCOUNT_WEIGHTS = [6, 3, 7, 9, 10, 5, 8, 4, 2, 1];
export const skAccountValid = (account10: string) => weightedSum(account10, ACCOUNT_WEIGHTS) % 11 === 0;

/** Rodné číslo: YYMMDD (women's month +50) / serial. Since 1954 it is 10 digits and divisible by 11. */
export function rodneCislo(rng: Rng, dob: BirthDate, female: boolean): string {
  const head = `${yy(dob)}${pad(dob.month + (female ? 50 : 0), 2)}${dd(dob)}`;
  if (dob.year < 1954) return `${head}/${rng.digits(3)}`;
  for (;;) {
    const serial = rng.digits(3);
    const check = (11 - ((Number(head + serial) * 10) % 11)) % 11;
    if (check < 10) return `${head}/${serial}${check}`;
  }
}

const sk_pc = (from: number, to: number) => (rng: Rng) => {
  const n = pad(rng.int(from, to), 5);
  return `${n.slice(0, 3)} ${n.slice(3)}`;
};

export const sk = euroCountry({
  code: 'SK',
  name: 'Slovakia',
  flag: '🇸🇰',
  nationality: 'Slovak',
  given: NAMES.SK,
  family: NAMES.SK.family,
  cities: [
    { name: 'Bratislava', postcode: sk_pc(81101, 85110), region: 'Bratislavský kraj' },
    { name: 'Košice', postcode: sk_pc(4001, 4023), region: 'Košický kraj' },
    { name: 'Prešov', postcode: sk_pc(8001, 8006), region: 'Prešovský kraj' },
    { name: 'Žilina', postcode: sk_pc(1001, 1015), region: 'Žilinský kraj' },
    { name: 'Nitra', postcode: sk_pc(94901, 94911), region: 'Nitriansky kraj' },
    { name: 'Banská Bystrica', postcode: sk_pc(97401, 97411), region: 'Banskobystrický kraj' },
  ],
  streets: ['Hlavná', 'Obchodná', 'Štúrova', 'Hviezdoslavova', 'Námestie SNP', 'Mlynská', 'Kollárova', 'Dlhá'],
  address: (rng, street, city) => {
    const nb = rng.int(1, 120);
    const pc = city.postcode(rng);
    return { lines: [`${street} ${nb}`, `${pc} ${city.name}`], parts: { StrtNm: street, BldgNb: nb, PstCd: pc } };
  },
  phone: (rng) => `+421 9${rng.pick(['0', '1', '4', '5'])}${rng.digits(1)} ${rng.digits(3)} ${rng.digits(3)}`,
  identity: ({ rng, gender, dob }) => [
    { label: 'Rodné číslo', value: rodneCislo(rng, dob, gender === 'female'), check: dob.year >= 1954 ? 'Divisible by 11' : undefined },
  ],
  banks: [
    { name: 'Slovenská sporiteľňa', bic: 'GIBASKBX', code: '0900' },
    { name: 'VÚB banka', bic: 'SUBASKBX', code: '0200' },
    { name: 'Tatra banka', bic: 'TATRSKBX', code: '1100' },
    { name: 'ČSOB', bic: 'CEKOSKBX', code: '7500' },
    { name: 'Prima banka', bic: 'KOMASK2X', code: '5600' },
  ].map(({ name, bic, code }) => ({
    name,
    bic,
    generate(rng) {
      let account: string;
      do account = rng.digits(10, true);
      while (!skAccountValid(account));
      return {
        bban: code + '000000' + account,
        domestic: [{ label: 'Číslo účtu', value: `${account}/${code}`, check: 'Slovak account mod 11' }],
      };
    },
  })),
});
