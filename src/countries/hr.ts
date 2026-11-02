import { euroCountry, range } from './eurozone';
import { iso7064Mod1110 } from '../core/checks';
import { NAMES } from './names';

const withCheck = (digits: string) => digits + iso7064Mod1110(digits);

export const hr = euroCountry({
  code: 'HR',
  name: 'Croatia',
  flag: '🇭🇷',
  nationality: 'Croatian',
  given: NAMES.HR,
  family: NAMES.HR.family,
  cities: [
    { name: 'Zagreb', postcode: range(10000, 10090, 5), region: 'Grad Zagreb' },
    { name: 'Split', postcode: () => '21000', region: 'Splitsko-dalmatinska' },
    { name: 'Rijeka', postcode: () => '51000', region: 'Primorsko-goranska' },
    { name: 'Osijek', postcode: () => '31000', region: 'Osječko-baranjska' },
    { name: 'Zadar', postcode: () => '23000', region: 'Zadarska' },
  ],
  streets: ['Ilica', 'Vukovarska ulica', 'Ulica kralja Zvonimira', 'Savska cesta', 'Frankopanska ulica', 'Ulica Ante Starčevića', 'Korzo'],
  address: (rng, street, city) => {
    const nb = rng.int(1, 160);
    const pc = city.postcode(rng);
    return { lines: [`${street} ${nb}`, `${pc} ${city.name}`], parts: { StrtNm: street, BldgNb: nb, PstCd: pc } };
  },
  phone: (rng) => `+385 9${rng.pick(['1', '2', '5', '8', '9'])} ${rng.digits(3)} ${rng.digits(4)}`,
  identity: ({ rng }) => [{ label: 'OIB', value: withCheck(rng.digits(10, true)), check: 'ISO 7064 MOD 11,10' }],
  banks: [
    { name: 'Zagrebačka banka', bic: 'ZABAHR2X', vbdi: '2360000' },
    { name: 'Privredna banka Zagreb', bic: 'PBZGHR2X', vbdi: '2340009' },
    { name: 'Erste & Steiermärkische Bank', bic: 'ESBCHR22', vbdi: '2402006' },
    { name: 'OTP banka', bic: 'OTPVHR2X', vbdi: '2407000' },
    { name: 'Raiffeisenbank Austria', bic: 'RZBHHR2X', vbdi: '2484008' },
  ].map(({ name, bic, vbdi }) => ({
    name,
    bic,
    generate(rng) {
      const account = withCheck(rng.digits(9, true));
      return {
        bban: vbdi + account,
        domestic: [
          { label: 'VBDI (bank code)', value: vbdi, check: 'ISO 7064 MOD 11,10' },
          { label: 'Broj računa', value: account, check: 'ISO 7064 MOD 11,10' },
        ],
      };
    },
  })),
});
