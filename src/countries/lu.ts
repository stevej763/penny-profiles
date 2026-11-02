import { euroCountry } from './eurozone';
import { luhnCheckDigit, pad, solveCheckDigit, verhoeffValid } from '../core/checks';
import { NAMES } from './names';

const lux = (from: number, to: number) => (rng: { int(a: number, b: number): number }) => `L-${pad(rng.int(from, to), 4)}`;

export const lu = euroCountry({
  code: 'LU',
  name: 'Luxembourg',
  flag: '🇱🇺',
  nationality: 'Luxembourgish',
  given: NAMES.LU,
  family: NAMES.LU.family,
  cities: [
    { name: 'Luxembourg', postcode: lux(1009, 2999) },
    { name: 'Esch-sur-Alzette', postcode: lux(4001, 4398) },
    { name: 'Differdange', postcode: lux(4501, 4599) },
    { name: 'Dudelange', postcode: lux(3401, 3490) },
    { name: 'Ettelbruck', postcode: lux(9001, 9099) },
  ],
  streets: ['Grand-Rue', 'avenue de la Liberté', 'rue de la Gare', 'boulevard Royal', "rue de l'Alzette", 'rue du Fossé', "route d'Arlon", 'rue Principale'],
  address: (rng, street, city) => {
    const nb = rng.int(1, 200);
    const pc = city.postcode(rng);
    return { lines: [`${nb}, ${street}`, `${pc} ${city.name}`], parts: { StrtNm: street, BldgNb: nb, PstCd: pc } };
  },
  phone: (rng) => `+352 ${rng.pick(['621', '661', '691'])} ${rng.digits(3)} ${rng.digits(3)}`,
  identity: ({ rng, dob }) => {
    // Matricule: YYYYMMDD + 3 digits + two check digits. Their algorithm isn't officially published,
    // so the value is generated in the commonly described Luhn + Verhoeff form but not marked as checked.
    const body = `${dob.year}${pad(dob.month, 2)}${pad(dob.day, 2)}${rng.digits(3)}`;
    const verhoeff = solveCheckDigit((d) => verhoeffValid(body + d));
    const value = body + luhnCheckDigit(body) + verhoeff;
    return [{ label: 'Matricule (national ID)', value: `${value.slice(0, 4)} ${value.slice(4, 8)} ${value.slice(8)}` }];
  },
  banks: [
    { name: 'Spuerkeess (BCEE)', bic: 'BCEELULL', code: '001' },
    { name: 'BIL', bic: 'BILLLULL', code: '002' },
    { name: 'BGL BNP Paribas', bic: 'BGLLLULL', code: '003' },
    { name: 'ING Luxembourg', bic: 'CELLLULL', code: '014' },
    { name: 'POST Luxembourg', bic: 'CCPLLULL', code: '111' },
  ].map(({ name, bic, code }) => ({
    name,
    bic,
    generate(rng) {
      const account = rng.digits(13);
      return { bban: code + account, domestic: [{ label: 'Account number', value: account }] };
    },
  })),
});
