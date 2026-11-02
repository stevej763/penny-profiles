import type { CountryModule } from '../core/types';
import { ascii, birthDate, email, pickGender, type BirthDate } from '../core/person';
import { formatIban, makeIban } from '../core/iban';
import { postalAddress } from '../core/iso20022';
import { luhnCheckDigit, pad, weightedSum } from '../core/checks';

// ---------------------------------------------------------------------------- United States

export function abaValid(routing: string): boolean {
  return /^\d{9}$/.test(routing) && weightedSum(routing, [3, 7, 1, 3, 7, 1, 3, 7, 1]) % 10 === 0;
}

const US_CITIES = [
  { city: 'New York', state: 'NY', zip: [10001, 10040], area: '212' },
  { city: 'Los Angeles', state: 'CA', zip: [90001, 90068], area: '213' },
  { city: 'Chicago', state: 'IL', zip: [60601, 60661], area: '312' },
  { city: 'Houston', state: 'TX', zip: [77002, 77099], area: '713' },
  { city: 'Phoenix', state: 'AZ', zip: [85003, 85054], area: '602' },
  { city: 'Seattle', state: 'WA', zip: [98101, 98199], area: '206' },
  { city: 'Boston', state: 'MA', zip: [2108, 2137], area: '617' },
  { city: 'Miami', state: 'FL', zip: [33125, 33199], area: '305' },
  { city: 'Denver', state: 'CO', zip: [80202, 80239], area: '303' },
  { city: 'Atlanta', state: 'GA', zip: [30303, 30350], area: '404' },
];
const US_BANKS = [
  { name: 'JPMorgan Chase Bank, N.A.', bic: 'CHASUS33', routing: '021000021' },
  { name: 'Bank of America, N.A.', bic: 'BOFAUS3N', routing: '026009593' },
  { name: 'Wells Fargo Bank, N.A.', bic: 'WFBIUS6S', routing: '121000248' },
  { name: 'Citibank, N.A.', bic: 'CITIUS33', routing: '021000089' },
];

export const us: CountryModule = {
  code: 'US',
  name: 'United States',
  flag: '🇺🇸',
  currency: 'USD',
  group: 'Americas',
  generate(rng, options) {
    const gender = pickGender(rng, options);
    const names =
      gender === 'male'
        ? ['James', 'Michael', 'Robert', 'John', 'David', 'William', 'Christopher', 'Daniel', 'Matthew', 'Anthony', 'Jose', 'Tyler']
        : ['Mary', 'Jennifer', 'Linda', 'Elizabeth', 'Jessica', 'Sarah', 'Ashley', 'Emily', 'Madison', 'Olivia', 'Maria', 'Taylor'];
    const given = rng.pick(names);
    const middle = rng.pick(names.filter((n) => n !== given));
    const family = rng.pick(['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Wilson', 'Anderson', 'Thomas', 'Moore', 'Jackson', 'Lee']);
    const dob = birthDate(rng, options);
    const place = rng.pick(US_CITIES);
    const zip = pad(rng.int(place.zip[0], place.zip[1]), 5);
    const houseNumber = rng.int(100, 9999);
    const streetName = rng.pick(['Main St', 'Oak St', 'Maple Ave', 'Cedar Ln', 'Elm St', 'Washington Ave', 'Lake St', 'Park Ave', 'Pine St', 'Highland Dr']);
    const apt = rng.bool(0.35) ? `Apt ${rng.int(1, 30)}${rng.pick(['A', 'B', 'C', ''])}` : undefined;

    let area: number;
    do area = rng.int(1, 899);
    while (area === 666);
    const ssn = `${pad(area, 3)}-${pad(rng.int(1, 99), 2)}-${pad(rng.int(1, 9999), 4)}`;

    const bank = rng.pick(US_BANKS);
    const account = rng.digits(rng.int(10, 12), true);
    const accountType = rng.pick(['Checking', 'Checking', 'Savings']);

    return {
      gender,
      name: {
        full: `${given} ${middle[0]}. ${family}`,
        given,
        family,
        accountHolder: `${given} ${middle[0]} ${family}`.toUpperCase(),
        parts: [{ label: 'Middle name', value: middle }],
      },
      dateOfBirth: dob.iso,
      age: dob.age,
      nationality: 'American',
      address: {
        lines: [`${houseNumber} ${streetName}${apt ? ` ${apt}` : ''}`, `${place.city}, ${place.state} ${zip}`],
        structured: postalAddress({ StrtNm: streetName, BldgNb: houseNumber, Room: apt, PstCd: zip, TwnNm: place.city, CtrySubDvsn: place.state, Ctry: 'US' }),
      },
      // 555-0100 to 555-0199 is reserved for fictional use in every area code.
      phone: `+1 (${place.area}) 555-01${pad(rng.int(0, 99), 2)}`,
      email: email(rng, given, family),
      identity: [{ label: 'SSN', value: ssn, check: 'SSA structure (no 000/666/9xx area)' }],
      bank: {
        bankName: bank.name,
        bic: bank.bic,
        currency: 'USD',
        domestic: [
          { label: 'Routing number (ABA)', value: bank.routing, check: 'ABA 3-7-1 checksum' },
          { label: 'Account number', value: account },
          { label: 'Account type', value: accountType },
        ],
        international: [
          { label: 'SWIFT / BIC', value: bank.bic },
          { label: 'Account number', value: account },
          { label: 'Fedwire routing', value: bank.routing },
          { label: 'IBAN', value: 'Not used in the United States' },
        ],
      },
    };
  },
};

// ---------------------------------------------------------------------------- Mexico

export function clabeCheck(first17: string): string {
  const weights = [3, 7, 1];
  const sum = first17.split('').reduce((s, d, i) => s + ((Number(d) * weights[i % 3]) % 10), 0);
  return String((10 - (sum % 10)) % 10);
}

const CURP_CHARS = '0123456789ABCDEFGHIJKLMNÑOPQRSTUVWXYZ';
export function curpCheck(first17: string): string {
  const sum = first17.split('').reduce((s, c, i) => s + CURP_CHARS.indexOf(c) * (18 - i), 0);
  return String((10 - (sum % 10)) % 10);
}

const RFC_CHARS = '0123456789ABCDEFGHIJKLMN&OPQRSTUVWXYZ Ñ';
export function rfcCheck(first12: string): string {
  const sum = first12.split('').reduce((s, c, i) => s + RFC_CHARS.indexOf(c) * (13 - i), 0);
  const d = 11 - (sum % 11);
  return d === 11 ? '0' : d === 10 ? 'A' : String(d);
}

// Four-letter combinations RENAPO/SAT replace (second letter becomes X).
const CURP_BLOCKLIST = new Set(
  'BACA BAKA BUEI BUEY CACA CACO CAGA CAGO CAKA CAKO COGE COGI COJA COJE COJI COJO COLA CULO FALO FETO GETA GUEI GUEY JETA JOTO KACA KACO KAGA KAGO KAKA KAKO KOGE KOGI KOJA KOJE KOJI KOJO KOLA KULO LILO LOCA LOCO LOKA LOKO MAME MAMO MEAR MEAS MEON MIAR MION MOCO MOKO MULA MULO NACA NACO PEDA PEDO PENE PIPI PITO POPO PUTA PUTO QULO RATA ROBA ROBE ROBO RUIN SENO TETA VACA VAGA VAGO VAKA VUEI VUEY WUEI WUEY'.split(' '),
);

const cleanName = (s: string) => ascii(s.replace(/[Ññ]/g, 'X')).toUpperCase().replace(/[^A-Z]/g, '');
const firstInternal = (s: string, re: RegExp) => s.slice(1).match(re)?.[0] ?? 'X';

export function curpStem(given: string, paternal: string, maternal: string, dob: BirthDate): string {
  const p = cleanName(paternal);
  const m = cleanName(maternal);
  const g = cleanName(given);
  let four = p[0] + firstInternal(p, /[AEIOU]/) + (m[0] ?? 'X') + g[0];
  if (CURP_BLOCKLIST.has(four)) four = four[0] + 'X' + four.slice(2);
  return four + pad(dob.year % 100, 2) + pad(dob.month, 2) + pad(dob.day, 2);
}

const MX_CITIES = [
  { city: 'Ciudad de México', state: 'CDMX', stateName: 'Ciudad de México', curp: 'DF', lada: '55', plaza: '180', colonias: [['Juárez', '06600'], ['Roma Norte', '06700'], ['Condesa', '06140'], ['Polanco', '11560'], ['Del Valle', '03100']] },
  { city: 'Guadalajara', state: 'Jal.', stateName: 'Jalisco', curp: 'JC', lada: '33', plaza: '320', colonias: [['Americana', '44160'], ['Providencia', '44630'], ['Centro', '44100']] },
  { city: 'Monterrey', state: 'N.L.', stateName: 'Nuevo León', curp: 'NL', lada: '81', plaza: '580', colonias: [['Centro', '64000'], ['Obispado', '64060'], ['Mitras Centro', '64460']] },
  { city: 'Puebla', state: 'Pue.', stateName: 'Puebla', curp: 'PL', lada: '222', plaza: '650', colonias: [['Centro', '72000'], ['La Paz', '72160']] },
  { city: 'Mérida', state: 'Yuc.', stateName: 'Yucatán', curp: 'YN', lada: '999', plaza: '905', colonias: [['Centro', '97000'], ['García Ginerés', '97070']] },
];
const MX_BANKS = [
  { name: 'BBVA México', bic: 'BCMRMXMM', code: '012' },
  { name: 'Banamex', bic: 'BNMXMXMM', code: '002' },
  { name: 'Santander México', bic: 'BMSXMXMM', code: '014' },
  { name: 'Banorte', bic: 'MENOMXMT', code: '072' },
  { name: 'HSBC México', bic: 'BIMEMXMM', code: '021' },
];

export const mx: CountryModule = {
  code: 'MX',
  name: 'Mexico',
  flag: '🇲🇽',
  currency: 'MXN',
  group: 'Americas',
  generate(rng, options) {
    const gender = pickGender(rng, options);
    const given = rng.pick(
      gender === 'male'
        ? ['Juan', 'Luis', 'Carlos', 'Miguel', 'Jorge', 'Alejandro', 'Fernando', 'Ricardo', 'Diego', 'Santiago']
        : ['Guadalupe', 'Ana', 'Sofía', 'Fernanda', 'Daniela', 'Valeria', 'Gabriela', 'Alejandra', 'Ximena', 'Regina'],
    );
    const surnames = ['Hernández', 'García', 'Martínez', 'López', 'González', 'Rodríguez', 'Pérez', 'Sánchez', 'Ramírez', 'Flores', 'Torres', 'Morales'];
    const paternal = rng.pick(surnames);
    const maternal = rng.pick(surnames.filter((s) => s !== paternal));
    const dob = birthDate(rng, options);
    const place = rng.pick(MX_CITIES);
    const [colonia, cp] = rng.pick(place.colonias);
    const streetNumber = rng.int(1, 999);
    const interior = rng.bool(0.4) ? `Int. ${rng.int(1, 20)}` : undefined;
    const street = rng.pick(['Av. Paseo de la Reforma', 'Calle Morelos', 'Av. Juárez', 'Calle Hidalgo', 'Av. Insurgentes Sur', 'Calle Madero', 'Calle 5 de Mayo', 'Av. Revolución']);

    const stem = curpStem(given, paternal, maternal, dob);
    const consonants = [paternal, maternal, given].map((n) => firstInternal(cleanName(n), /[B-DF-HJ-NP-TV-Z]/)).join('');
    const curp17 = stem + (gender === 'male' ? 'H' : 'M') + place.curp + consonants + (dob.year < 2000 ? rng.digits(1) : rng.letters(1));
    const rfc12 = stem + rng.chars(2, '123456789ABCDEFGHIJKLMNPQRSTUVWXYZ');

    const bank = rng.pick(MX_BANKS);
    const account = rng.digits(11);
    const clabe17 = bank.code + place.plaza + account;
    const clabe = clabe17 + clabeCheck(clabe17);
    const family = `${paternal} ${maternal}`;

    return {
      gender,
      name: {
        full: `${given} ${family}`,
        given,
        family,
        accountHolder: ascii(`${given} ${family}`).toUpperCase(),
        parts: [
          { label: 'Apellido paterno', value: paternal },
          { label: 'Apellido materno', value: maternal },
        ],
      },
      dateOfBirth: dob.iso,
      age: dob.age,
      nationality: 'Mexican',
      address: {
        lines: [`${street} ${streetNumber}${interior ? `, ${interior}` : ''}`, `Col. ${colonia}`, `${cp} ${place.city}, ${place.state}`],
        structured: postalAddress({
          StrtNm: street,
          BldgNb: streetNumber,
          Room: interior,
          PstCd: cp,
          TwnNm: place.city,
          TwnLctnNm: colonia,
          CtrySubDvsn: place.stateName,
          Ctry: 'MX',
        }),
      },
      phone: `+52 ${place.lada} ${rng.digits(10 - place.lada.length)}`,
      email: email(rng, given, paternal),
      identity: [
        { label: 'CURP', value: curp17 + curpCheck(curp17), check: 'RENAPO check digit' },
        { label: 'RFC', value: rfc12 + rfcCheck(rfc12), check: 'SAT check digit (mod 11)' },
      ],
      bank: {
        bankName: bank.name,
        bic: bank.bic,
        currency: 'MXN',
        domestic: [
          { label: 'CLABE', value: clabe, check: 'CLABE 3-7-1 check digit' },
          { label: 'Número de cuenta', value: account },
        ],
        international: [
          { label: 'SWIFT / BIC', value: bank.bic },
          { label: 'CLABE (required for incoming MXN)', value: clabe },
          { label: 'IBAN', value: 'Not used in Mexico' },
        ],
      },
    };
  },
};

// ---------------------------------------------------------------------------- Brazil

export function cpfValid(cpf: string): boolean {
  const digits = cpf.replace(/\D/g, '');
  if (digits.length !== 11 || /^(\d)\1{10}$/.test(digits)) return false;
  const dv = (len: number) => {
    const r = (weightedSum(digits.slice(0, len), Array.from({ length: len }, (_, i) => len + 1 - i)) * 10) % 11;
    return r === 10 ? 0 : r;
  };
  return dv(9) === Number(digits[9]) && dv(10) === Number(digits[10]);
}

function mod11Dv(value: string, weights: number[]): number {
  return 11 - (weightedSum(value, weights) % 11);
}

/**
 * Branch/account check digits per each bank's published rule. Returns null when the rule
 * yields a letter (X/P); we redraw in that case so the BBAN stays numeric.
 */
const BR_BANKS = [
  {
    name: 'Itaú Unibanco',
    bic: 'ITAUBRSP',
    compe: '341',
    ispb: '60701190',
    make: (agencia: string, rng: () => string) => {
      const conta = rng().slice(0, 5);
      return { conta, contaDv: luhnCheckDigit(agencia + conta), agenciaDv: null as string | null, rule: 'Itaú mod 10 (agência + conta)' };
    },
  },
  {
    name: 'Bradesco',
    bic: 'BBDEBRSP',
    compe: '237',
    ispb: '60746948',
    make: (agencia: string, rng: () => string) => {
      const conta = rng().slice(0, 7);
      const r = weightedSum(conta, [2, 7, 6, 5, 4, 3, 2]) % 11;
      const a = mod11Dv(agencia, [5, 4, 3, 2]);
      if (r === 1 || a === 10) return null;
      return { conta, contaDv: String(r === 0 ? 0 : 11 - r), agenciaDv: String(a === 11 ? 0 : a), rule: 'Bradesco mod 11' };
    },
  },
  {
    name: 'Banco do Brasil',
    bic: 'BRASBRRJ',
    compe: '001',
    ispb: '00000000',
    make: (agencia: string, rng: () => string) => {
      const conta = rng().slice(0, 8);
      const c = mod11Dv(conta, [9, 8, 7, 6, 5, 4, 3, 2]);
      const a = mod11Dv(agencia, [5, 4, 3, 2]);
      if (c === 10 || a === 10) return null;
      return { conta, contaDv: String(c === 11 ? 0 : c), agenciaDv: String(a === 11 ? 0 : a), rule: 'Banco do Brasil mod 11' };
    },
  },
];

const BR_CITIES = [
  { city: 'São Paulo', uf: 'SP', cep: [1000, 5999], ddd: '11', bairros: ['Bela Vista', 'Pinheiros', 'Moema', 'Vila Mariana'] },
  { city: 'Rio de Janeiro', uf: 'RJ', cep: [20000, 23799], ddd: '21', bairros: ['Copacabana', 'Ipanema', 'Botafogo', 'Tijuca'] },
  { city: 'Belo Horizonte', uf: 'MG', cep: [30000, 31999], ddd: '31', bairros: ['Savassi', 'Lourdes', 'Funcionários'] },
  { city: 'Brasília', uf: 'DF', cep: [70000, 72799], ddd: '61', bairros: ['Asa Sul', 'Asa Norte', 'Lago Sul'] },
  { city: 'Salvador', uf: 'BA', cep: [40000, 42599], ddd: '71', bairros: ['Barra', 'Pituba', 'Rio Vermelho'] },
  { city: 'Porto Alegre', uf: 'RS', cep: [90000, 91999], ddd: '51', bairros: ['Moinhos de Vento', 'Cidade Baixa', 'Menino Deus'] },
  { city: 'Curitiba', uf: 'PR', cep: [80000, 82999], ddd: '41', bairros: ['Batel', 'Centro', 'Água Verde'] },
];

export const br: CountryModule = {
  code: 'BR',
  name: 'Brazil',
  flag: '🇧🇷',
  currency: 'BRL',
  group: 'Americas',
  generate(rng, options) {
    const gender = pickGender(rng, options);
    const given = rng.pick(
      gender === 'male'
        ? ['Lucas', 'Gabriel', 'Pedro', 'Rafael', 'Matheus', 'João', 'Gustavo', 'Felipe', 'Bruno', 'Thiago']
        : ['Ana', 'Maria', 'Juliana', 'Beatriz', 'Larissa', 'Camila', 'Fernanda', 'Mariana', 'Letícia', 'Isabela'],
    );
    const surnames = ['Silva', 'Santos', 'Oliveira', 'Souza', 'Pereira', 'Costa', 'Rodrigues', 'Almeida', 'Ferreira', 'Lima', 'Carvalho', 'Gomes'];
    const mother = rng.pick(surnames);
    const father = rng.pick(surnames.filter((s) => s !== mother));
    const family = `${mother} ${father}`;
    const dob = birthDate(rng, options);
    const place = rng.pick(BR_CITIES);
    const cep = `${pad(rng.int(place.cep[0], place.cep[1]), 5)}-${rng.digits(3)}`;
    const street = rng.pick(['Rua das Flores', 'Avenida Brasil', 'Rua XV de Novembro', 'Rua São Paulo', 'Avenida Atlântica', 'Rua da Consolação', 'Avenida Paulista', 'Rua Augusta']);
    const streetNumber = rng.int(10, 3000);
    const apartment = rng.bool(0.5) ? `Apto ${rng.int(11, 154)}` : undefined;
    const bairro = rng.pick(place.bairros);

    let cpf: string;
    do cpf = rng.digits(11);
    while (!cpfValid(cpf));
    const cpfFormatted = cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');

    const bank = rng.pick(BR_BANKS);
    let agencia: string;
    let acct: NonNullable<ReturnType<(typeof BR_BANKS)[number]['make']>>;
    for (;;) {
      agencia = rng.digits(4, true);
      const made = bank.make(agencia, () => rng.digits(8, true));
      if (made) {
        acct = made;
        break;
      }
    }
    const iban = makeIban('BR', bank.ispb + pad(agencia, 5) + pad(acct.conta + acct.contaDv, 10) + 'C1');
    const mail = email(rng, given, father);

    return {
      gender,
      name: {
        full: `${given} ${family}`,
        given,
        family,
        accountHolder: ascii(`${given} ${family}`).toUpperCase(),
        parts: [
          { label: "Mother's surname", value: mother },
          { label: "Father's surname", value: father },
        ],
      },
      dateOfBirth: dob.iso,
      age: dob.age,
      nationality: 'Brazilian',
      address: {
        lines: [`${street}, ${streetNumber}${apartment ? `, ${apartment}` : ''}`, bairro, `${place.city} - ${place.uf}`, cep],
        structured: postalAddress({
          StrtNm: street,
          BldgNb: streetNumber,
          Room: apartment,
          PstCd: cep,
          TwnNm: place.city,
          TwnLctnNm: bairro,
          CtrySubDvsn: place.uf,
          Ctry: 'BR',
        }),
      },
      phone: `+55 ${place.ddd} 9${rng.digits(4)}-${rng.digits(4)}`,
      email: mail,
      identity: [{ label: 'CPF', value: cpfFormatted, check: 'CPF check digits (mod 11)' }],
      bank: {
        bankName: bank.name,
        bic: bank.bic,
        currency: 'BRL',
        domestic: [
          { label: 'Banco (COMPE)', value: bank.compe },
          { label: 'Agência', value: acct.agenciaDv ? `${agencia}-${acct.agenciaDv}` : agencia },
          { label: 'Conta corrente', value: `${acct.conta}-${acct.contaDv}`, check: acct.rule },
        ],
        international: [
          { label: 'IBAN', value: formatIban(iban), check: 'ISO 13616 mod 97' },
          { label: 'SWIFT / BIC', value: bank.bic },
          { label: 'ISPB', value: bank.ispb },
        ],
        extras: [{ label: 'Chave Pix', value: rng.bool() ? cpfFormatted : mail }],
      },
    };
  },
};

export const AMERICAS: CountryModule[] = [us, mx, br];
