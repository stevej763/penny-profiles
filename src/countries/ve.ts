import type { CountryModule } from '../core/types';
import { birthDate, email, pickGender } from '../core/person';
import { pad, weightedSum } from '../core/checks';
import { postalAddress } from '../core/iso20022';
import { NAMES } from './names';

/** RIF check digit for a natural person born in Venezuela (type V = 4), weights 3,2,7,6,5,4,3,2. */
export function rifCheck(eightDigits: string): string {
  return '00987654321'[(4 + weightedSum(eightDigits, [3, 2, 7, 6, 5, 4, 3, 2])) % 11];
}

const CITIES = [
  { city: 'Caracas', state: 'Distrito Capital', pc: [1010, 1090], areas: ['Chacao', 'Altamira', 'Las Mercedes', 'La Candelaria', 'El Paraíso'] },
  { city: 'Maracaibo', state: 'Zulia', pc: [4001, 4005], areas: ['Bella Vista', 'Tierra Negra'] },
  { city: 'Valencia', state: 'Carabobo', pc: [2001, 2006], areas: ['El Viñedo', 'La Viña'] },
  { city: 'Barquisimeto', state: 'Lara', pc: [3001, 3004], areas: ['Nueva Segovia', 'El Este'] },
  { city: 'Maracay', state: 'Aragua', pc: [2101, 2103], areas: ['Calicanto', 'El Limón'] },
];
const STREETS = ['Av. Francisco de Miranda', 'Av. Libertador', 'Calle Real', 'Av. Bolívar', 'Calle Los Mangos', 'Av. Urdaneta'];
const BUILDINGS = ['Edif. Torre Lido', 'Edif. Los Pinos', 'Res. El Parque', 'Edif. Caracas', 'Res. Altamira Suites'];
const BANKS = [
  { name: 'Banco de Venezuela', bic: 'BVENVECA', code: '0102' },
  { name: 'Banesco', bic: 'BANSVECA', code: '0134' },
  { name: 'Mercantil Banco', bic: 'BAMRVECA', code: '0105' },
  { name: 'BBVA Provincial', bic: 'PROVVECA', code: '0108' },
];

export const ve: CountryModule = {
  code: 'VE',
  name: 'Venezuela',
  flag: '🇻🇪',
  currency: 'VES',
  group: 'Americas',
  generate(rng, options) {
    const gender = pickGender(rng, options);
    const given = rng.pick(NAMES.VE[gender]);
    const first = rng.pick(NAMES.VE.family);
    const second = rng.pick(NAMES.VE.family.filter((f) => f !== first));
    const family = `${first} ${second}`;
    const dob = birthDate(rng, options);
    const place = rng.pick(CITIES);
    const area = rng.pick(place.areas);
    const street = rng.pick(STREETS);
    const building = rng.pick(BUILDINGS);
    const floor = rng.int(1, 18);
    const apt = `${floor}${rng.pick(['A', 'B', 'C', 'D'])}`;
    const postcode = String(rng.int(place.pc[0], place.pc[1]));

    const cedula = String(rng.int(3_000_000, 32_000_000));
    const rif = `V-${pad(cedula, 8)}-${rifCheck(pad(cedula, 8))}`;

    // 20 digits: bank (4) + branch (4) + control (2) + account (10). The control-digit algorithm
    // isn't published, so those two digits are random and the account isn't marked as checked.
    const bank = rng.pick(BANKS);
    const account = bank.code + rng.digits(4) + rng.digits(2) + rng.digits(10);
    const mobile = `0${rng.pick(['412', '414', '416', '424', '426'])}-${rng.digits(7)}`;

    return {
      gender,
      name: {
        full: `${given} ${family}`,
        given,
        family,
        accountHolder: `${given} ${family}`.toUpperCase(),
        parts: [
          { label: 'Primer apellido', value: first },
          { label: 'Segundo apellido', value: second },
        ],
      },
      dateOfBirth: dob.iso,
      age: dob.age,
      nationality: 'Venezuelan',
      address: {
        lines: [`${street}, ${building}, Piso ${floor}, Apto ${apt}`, `Urb. ${area}, ${place.city} ${postcode}, ${place.state}`],
        structured: postalAddress({
          StrtNm: street,
          BldgNm: building,
          Flr: floor,
          Room: `Apto ${apt}`,
          PstCd: postcode,
          TwnNm: place.city,
          TwnLctnNm: area,
          CtrySubDvsn: place.state,
          Ctry: 'VE',
        }),
      },
      phone: `+58 ${mobile.slice(1)}`,
      email: email(rng, given, first),
      identity: [
        { label: 'Cédula de identidad', value: `V-${Number(cedula).toLocaleString('es-VE')}` },
        { label: 'RIF', value: rif, check: 'RIF check digit (mod 11)' },
      ],
      bank: {
        bankName: bank.name,
        bic: bank.bic,
        currency: 'VES',
        domestic: [
          { label: 'Número de cuenta', value: account.replace(/(\d{4})(\d{4})(\d{2})(\d{10})/, '$1-$2-$3-$4') },
          { label: 'Bank code', value: bank.code },
        ],
        international: [
          { label: 'SWIFT / BIC', value: bank.bic },
          { label: 'Account number', value: account },
          { label: 'IBAN', value: 'Not used in Venezuela' },
        ],
        extras: [{ label: 'Pago Móvil', value: `${mobile} · V-${cedula} · ${bank.code}` }],
      },
      notes: ['US sanctions restrict dealings with the Government of Venezuela, including state-owned banks such as Banco de Venezuela; expect screening hits.'],
    };
  },
};
