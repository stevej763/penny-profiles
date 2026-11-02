import type { BankAccount, CountryModule, Field, Gender } from '../core/types';
import type { Rng } from '../core/rng';
import { birthDate, email, pickGender, ascii, type BirthDate, type Gendered } from '../core/person';
import { formatIban, makeIban } from '../core/iban';
import { postalAddress, type PostalAddressParts } from '../core/iso20022';
import { luhnCheckDigit, luhnValid, mod97, pad, solveCheckDigit, toDigits, weightedSum } from '../core/checks';

interface City {
  name: string;
  postcode: (rng: Rng) => string;
  region?: string;
  /** Extra per-city data a country needs (e.g. French département, Italian Belfiore code). */
  meta?: Record<string, string>;
}

interface PersonContext {
  rng: Rng;
  gender: Gender;
  given: string;
  family: string;
  dob: BirthDate;
  city: City;
}

interface Bank {
  name: string;
  bic: string;
  /** `bic` overrides the bank-level BIC when it depends on the branch. */
  generate: (rng: Rng, city: City) => { bban: string; domestic: Field[]; bic?: string };
}

interface EuroCountryConfig {
  code: string;
  name: string;
  flag: string;
  nationality: string;
  given: Gendered<string[]>;
  family: string[];
  /** Some countries (ES, PT) use two surnames. */
  doubleSurname?: boolean;
  cities: City[];
  streets: string[];
  /** Local-format lines plus the ISO 20022 parts; town and country are filled in by the builder. */
  address: (rng: Rng, street: string, city: City) => { lines: string[]; parts: PostalAddressParts };
  phone: (rng: Rng) => string;
  identity: (ctx: PersonContext) => Field[];
  banks: Bank[];
}

const range = (from: number, to: number, width: number) => (rng: Rng) => pad(rng.int(from, to), width);

function euroCountry(config: EuroCountryConfig): CountryModule {
  return {
    code: config.code,
    name: config.name,
    flag: config.flag,
    currency: 'EUR',
    group: 'Eurozone',
    generate(rng, options) {
      const gender = pickGender(rng, options);
      const given = rng.pick(config.given[gender]);
      let family = rng.pick(config.family);
      if (config.doubleSurname) family += ' ' + rng.pick(config.family.filter((f) => f !== family));
      const dob = birthDate(rng, options);
      const city = rng.pick(config.cities);
      const { lines, parts } = config.address(rng, rng.pick(config.streets), city);

      const bank = rng.pick(config.banks);
      const { bban, domestic, bic: branchBic } = bank.generate(rng, city);
      const bic = branchBic ?? bank.bic;
      const iban = makeIban(config.code, bban);
      const account: BankAccount = {
        bankName: bank.name,
        bic,
        currency: 'EUR',
        domestic,
        international: [
          { label: 'IBAN', value: formatIban(iban), check: 'ISO 13616 mod 97' },
          { label: 'BIC / SWIFT', value: bic },
        ],
      };
      const full = `${given} ${family}`;

      return {
        gender,
        name: { full, given, family, accountHolder: ascii(full).toUpperCase() },
        dateOfBirth: dob.iso,
        age: dob.age,
        nationality: config.nationality,
        address: {
          lines,
          structured: postalAddress({ CtrySubDvsn: city.region, ...parts, TwnNm: city.name, Ctry: config.code }),
        },
        phone: config.phone(rng),
        email: email(rng, given, family.split(' ')[0]),
        identity: config.identity({ rng, gender, given, family, dob, city }),
        bank: account,
      };
    },
  };
}

const yy = (dob: BirthDate) => pad(dob.year % 100, 2);
const mm = (dob: BirthDate) => pad(dob.month, 2);
const dd = (dob: BirthDate) => pad(dob.day, 2);

// ---------------------------------------------------------------------------- Germany

/** Bundesbank check-digit method 63 (Deutsche Bank): mod 10, weights 2,1,2,1,2,1 over digits 2–7. */
export function deMethod63Valid(account: string): boolean {
  if (account.length !== 10 || account[0] !== '0') return false;
  const base = toDigits(account.slice(1, 7));
  const sum = base
    .reverse()
    .map((d, i) => d * (i % 2 === 0 ? 2 : 1))
    .reduce((s, p) => s + Math.floor(p / 10) + (p % 10), 0);
  return (10 - (sum % 10)) % 10 === Number(account[7]);
}

/** German Steuer-ID: 11 digits, one digit repeated in the first ten, ISO 7064 MOD 11,10 check digit. */
export function steuerIdCheckDigit(first10: string): number {
  let product = 10;
  for (const d of toDigits(first10)) {
    let sum = (d + product) % 10;
    if (sum === 0) sum = 10;
    product = (sum * 2) % 11;
  }
  const check = 11 - product;
  return check === 10 ? 0 : check;
}

function steuerId(rng: Rng): string {
  let body: string;
  do {
    const digits = rng.shuffle([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]).slice(0, 9);
    digits.push(rng.pick(digits));
    body = rng.shuffle(digits).join('');
  } while (body[0] === '0');
  const id = body + steuerIdCheckDigit(body);
  return `${id.slice(0, 2)} ${id.slice(2, 5)} ${id.slice(5, 8)} ${id.slice(8)}`;
}

const de = euroCountry({
  code: 'DE',
  name: 'Germany',
  flag: '🇩🇪',
  nationality: 'German',
  given: {
    male: ['Lukas', 'Leon', 'Finn', 'Jonas', 'Paul', 'Felix', 'Maximilian', 'Elias', 'Tim', 'Jan', 'Stefan', 'Thomas'],
    female: ['Anna', 'Emma', 'Mia', 'Hannah', 'Lena', 'Sophie', 'Laura', 'Lea', 'Julia', 'Sarah', 'Katharina', 'Sabine'],
  },
  family: ['Müller', 'Schmidt', 'Schneider', 'Fischer', 'Weber', 'Meyer', 'Wagner', 'Becker', 'Schulz', 'Hoffmann', 'Koch', 'Richter', 'Wolf', 'Schröder'],
  cities: [
    { name: 'Berlin', postcode: range(10115, 14199, 5), meta: { blz: '10070000', bic: 'DEUTDEBBXXX' } },
    { name: 'Hamburg', postcode: range(20095, 22769, 5), meta: { blz: '20070000', bic: 'DEUTDEHHXXX' } },
    { name: 'Frankfurt am Main', postcode: range(60306, 60599, 5), meta: { blz: '50070010', bic: 'DEUTDEFFXXX' } },
    { name: 'München', postcode: range(80331, 81929, 5), meta: { blz: '70070010', bic: 'DEUTDEMMXXX' } },
  ],
  streets: ['Hauptstraße', 'Schulstraße', 'Bahnhofstraße', 'Gartenstraße', 'Lindenstraße', 'Bergstraße', 'Kirchstraße', 'Goethestraße', 'Schillerstraße', 'Friedrichstraße'],
  address: (rng, street, city) => {
    const nb = rng.int(1, 150);
    const pc = city.postcode(rng);
    return { lines: [`${street} ${nb}`, `${pc} ${city.name}`], parts: { StrtNm: street, BldgNb: nb, PstCd: pc } };
  },
  phone: (rng) => `+49 ${rng.pick(['151', '160', '170', '176'])} ${rng.digits(8)}`,
  identity: ({ rng }) => [{ label: 'Steuer-ID', value: steuerId(rng), check: 'ISO 7064 MOD 11,10' }],
  banks: [
    {
      name: 'Deutsche Bank',
      bic: 'DEUTDEFFXXX',
      generate(rng, city) {
        // 10 digits: leading 0, six-digit base number, check digit, two-digit sub-account.
        const base = '0' + rng.digits(6, true);
        const account = base + solveCheckDigit((d) => deMethod63Valid(base + d + '00')) + '00';
        return {
          bban: city.meta!.blz + account,
          bic: city.meta!.bic,
          domestic: [
            { label: 'BLZ', value: city.meta!.blz.replace(/(\d{3})(\d{3})(\d{2})/, '$1 $2 $3') },
            { label: 'Kontonummer', value: account, check: 'Bundesbank method 63' },
          ],
        };
      },
    },
  ],
});

// ---------------------------------------------------------------------------- France

export function ribKey(bank: string, branch: string, account: string): string {
  const k = 97 - ((89 * Number(bank) + 15 * Number(branch) + 3 * Number(account)) % 97);
  return pad(k, 2);
}

export function nirKey(first13: string): string {
  return pad(97 - mod97(first13), 2);
}

const fr = euroCountry({
  code: 'FR',
  name: 'France',
  flag: '🇫🇷',
  nationality: 'French',
  given: {
    male: ['Lucas', 'Hugo', 'Louis', 'Gabriel', 'Arthur', 'Jules', 'Thomas', 'Nicolas', 'Julien', 'Antoine'],
    female: ['Emma', 'Louise', 'Jade', 'Alice', 'Chloé', 'Léa', 'Manon', 'Camille', 'Sarah', 'Juliette'],
  },
  family: ['Martin', 'Bernard', 'Dubois', 'Thomas', 'Robert', 'Richard', 'Petit', 'Durand', 'Leroy', 'Moreau', 'Simon', 'Laurent', 'Lefèvre', 'Michel'],
  cities: [
    { name: 'Paris', postcode: (rng) => `750${pad(rng.int(1, 20), 2)}`, meta: { dept: '75' } },
    { name: 'Lyon', postcode: (rng) => `6900${rng.int(1, 9)}`, meta: { dept: '69' } },
    { name: 'Marseille', postcode: (rng) => `130${pad(rng.int(1, 16), 2)}`, meta: { dept: '13' } },
    { name: 'Toulouse', postcode: () => '31000', meta: { dept: '31' } },
    { name: 'Bordeaux', postcode: () => '33000', meta: { dept: '33' } },
    { name: 'Lille', postcode: () => '59000', meta: { dept: '59' } },
  ],
  streets: ['rue de la République', 'rue Victor Hugo', 'avenue Jean Jaurès', 'rue Pasteur', 'boulevard Voltaire', 'rue du Moulin', 'rue de la Paix', 'avenue Foch', 'rue Nationale'],
  address: (rng, street, city) => {
    const nb = rng.int(1, 120);
    const pc = city.postcode(rng);
    return { lines: [`${nb} ${street}`, `${pc} ${city.name}`], parts: { StrtNm: street, BldgNb: nb, PstCd: pc } };
  },
  phone: (rng) => `+33 ${rng.pick(['6', '7'])} ${rng.digits(2)} ${rng.digits(2)} ${rng.digits(2)} ${rng.digits(2)}`,
  identity: ({ rng, gender, dob, city }) => {
    const body = `${gender === 'male' ? 1 : 2}${yy(dob)}${mm(dob)}${city.meta!.dept}${rng.digits(3)}${pad(rng.int(1, 999), 3)}`;
    const nir = body + nirKey(body);
    return [
      {
        label: 'Numéro de sécurité sociale (NIR)',
        value: `${nir[0]} ${nir.slice(1, 3)} ${nir.slice(3, 5)} ${nir.slice(5, 7)} ${nir.slice(7, 10)} ${nir.slice(10, 13)} ${nir.slice(13)}`,
        check: 'INSEE key (97 − n mod 97)',
      },
    ];
  },
  banks: [
    { name: 'BNP Paribas', bic: 'BNPAFRPPXXX', code: '30004' },
    { name: 'Société Générale', bic: 'SOGEFRPPXXX', code: '30003' },
    { name: 'LCL', bic: 'CRLYFRPPXXX', code: '30002' },
    { name: 'La Banque Postale', bic: 'PSSTFRPPXXX', code: '20041' },
  ].map(({ name, bic, code }) => ({
    name,
    bic,
    generate(rng) {
      const branch = rng.digits(5);
      const account = rng.digits(11);
      const key = ribKey(code, branch, account);
      return {
        bban: code + branch + account + key,
        domestic: [
          { label: 'Code banque', value: code },
          { label: 'Code guichet', value: branch },
          { label: 'Numéro de compte', value: account },
          { label: 'Clé RIB', value: key, check: 'RIB key (mod 97)' },
        ],
      };
    },
  })),
});

// ---------------------------------------------------------------------------- Spain

const ES_WEIGHTS = [1, 2, 4, 8, 5, 10, 9, 7, 3, 6];
export function esControlDigit(ten: string): string {
  const d = 11 - (weightedSum(ten, ES_WEIGHTS) % 11);
  return String(d === 11 ? 0 : d === 10 ? 1 : d);
}

const DNI_LETTERS = 'TRWAGMYFPDXBNJZSQVHLCKE';

const es = euroCountry({
  code: 'ES',
  name: 'Spain',
  flag: '🇪🇸',
  nationality: 'Spanish',
  doubleSurname: true,
  given: {
    male: ['Hugo', 'Martín', 'Lucas', 'Mateo', 'Daniel', 'Alejandro', 'Pablo', 'Javier', 'David', 'Carlos'],
    female: ['Lucía', 'Sofía', 'Martina', 'María', 'Paula', 'Julia', 'Valeria', 'Carmen', 'Laura', 'Elena'],
  },
  family: ['García', 'Rodríguez', 'González', 'Fernández', 'López', 'Martínez', 'Sánchez', 'Pérez', 'Gómez', 'Martín', 'Jiménez', 'Ruiz'],
  cities: [
    { name: 'Madrid', postcode: range(28001, 28055, 5) },
    { name: 'Barcelona', postcode: range(8001, 8042, 5) },
    { name: 'Valencia', postcode: range(46001, 46026, 5) },
    { name: 'Sevilla', postcode: range(41001, 41020, 5) },
    { name: 'Bilbao', postcode: range(48001, 48015, 5) },
  ],
  streets: ['Calle Mayor', 'Calle Real', 'Avenida de la Constitución', 'Calle de Alcalá', 'Gran Vía', 'Calle del Sol', 'Calle Nueva', 'Paseo de Gracia'],
  address: (rng, street, city) => {
    const nb = rng.int(1, 150);
    const floor = rng.int(1, 9);
    const door = rng.pick(['A', 'B', 'C', 'D', 'Izq.', 'Dcha.']);
    const pc = city.postcode(rng);
    return {
      lines: [`${street}, ${nb}, ${floor}º ${door}`, `${pc} ${city.name}`],
      parts: { StrtNm: street, BldgNb: nb, Flr: floor, Room: door, PstCd: pc },
    };
  },
  phone: (rng) => `+34 6${rng.digits(2)} ${rng.digits(3)} ${rng.digits(3)}`,
  identity: ({ rng }) => {
    const n = rng.digits(8);
    return [{ label: 'DNI', value: n + DNI_LETTERS[Number(n) % 23], check: 'DNI letter (mod 23)' }];
  },
  banks: [
    { name: 'Banco Santander', bic: 'BSCHESMMXXX', code: '0049' },
    { name: 'BBVA', bic: 'BBVAESMMXXX', code: '0182' },
    { name: 'CaixaBank', bic: 'CAIXESBBXXX', code: '2100' },
    { name: 'Banco Sabadell', bic: 'BSABESBBXXX', code: '0081' },
  ].map(({ name, bic, code }) => ({
    name,
    bic,
    generate(rng) {
      const branch = rng.digits(4);
      const account = rng.digits(10);
      const dc = esControlDigit('00' + code + branch) + esControlDigit(account);
      return {
        bban: code + branch + dc + account,
        domestic: [
          { label: 'CCC', value: `${code} ${branch} ${dc} ${account}`, check: 'CCC control digits (mod 11)' },
          { label: 'Entidad / Oficina', value: `${code} / ${branch}` },
        ],
      };
    },
  })),
});

// ---------------------------------------------------------------------------- Italy

const CF_ODD = [1, 0, 5, 7, 9, 13, 15, 17, 19, 21, 2, 4, 18, 20, 11, 3, 6, 8, 12, 14, 16, 10, 22, 25, 24, 23];
const alnumIndex = (c: string) => (c >= '0' && c <= '9' ? Number(c) : c.charCodeAt(0) - 65);

/** Check character shared by Italian CIN and codice fiscale: odd/even position tables, mod 26. */
export function italianCheckChar(value: string): string {
  let sum = 0;
  value.split('').forEach((c, i) => {
    sum += i % 2 === 0 ? CF_ODD[alnumIndex(c)] : alnumIndex(c);
  });
  return String.fromCharCode(65 + (sum % 26));
}

function cfPart(name: string, isGiven: boolean): string {
  const letters = ascii(name).toUpperCase().replace(/[^A-Z]/g, '');
  const consonants = letters.replace(/[AEIOU]/g, '');
  const vowels = letters.replace(/[^AEIOU]/g, '');
  if (isGiven && consonants.length >= 4) return consonants[0] + consonants[2] + consonants[3];
  return (consonants + vowels + 'XXX').slice(0, 3);
}

export function codiceFiscale(given: string, family: string, gender: Gender, dob: BirthDate, belfiore: string): string {
  const day = dob.day + (gender === 'female' ? 40 : 0);
  const body = cfPart(family, false) + cfPart(given, true) + yy(dob) + 'ABCDEHLMPRST'[dob.month - 1] + pad(day, 2) + belfiore;
  return body + italianCheckChar(body);
}

const it = euroCountry({
  code: 'IT',
  name: 'Italy',
  flag: '🇮🇹',
  nationality: 'Italian',
  given: {
    male: ['Leonardo', 'Francesco', 'Alessandro', 'Lorenzo', 'Mattia', 'Andrea', 'Gabriele', 'Marco', 'Luca', 'Giuseppe'],
    female: ['Sofia', 'Giulia', 'Aurora', 'Alice', 'Ginevra', 'Emma', 'Giorgia', 'Francesca', 'Chiara', 'Martina'],
  },
  family: ['Rossi', 'Russo', 'Ferrari', 'Esposito', 'Bianchi', 'Romano', 'Colombo', 'Ricci', 'Marino', 'Greco', 'Bruno', 'Gallo'],
  cities: [
    { name: 'Roma', postcode: range(118, 199, 5), meta: { prov: 'RM', belfiore: 'H501' } },
    { name: 'Milano', postcode: range(20121, 20162, 5), meta: { prov: 'MI', belfiore: 'F205' } },
    { name: 'Napoli', postcode: range(80121, 80147, 5), meta: { prov: 'NA', belfiore: 'F839' } },
    { name: 'Torino', postcode: range(10121, 10156, 5), meta: { prov: 'TO', belfiore: 'L219' } },
    { name: 'Firenze', postcode: range(50121, 50145, 5), meta: { prov: 'FI', belfiore: 'D612' } },
    { name: 'Bologna', postcode: range(40121, 40141, 5), meta: { prov: 'BO', belfiore: 'A944' } },
  ],
  streets: ['Via Roma', 'Via Garibaldi', 'Via Mazzini', 'Corso Italia', 'Via Dante', 'Via Verdi', 'Viale della Repubblica', 'Via Cavour'],
  address: (rng, street, city) => {
    const nb = rng.int(1, 200);
    const pc = city.postcode(rng);
    return {
      lines: [`${street} ${nb}`, `${pc} ${city.name} ${city.meta!.prov}`],
      parts: { StrtNm: street, BldgNb: nb, PstCd: pc, CtrySubDvsn: city.meta!.prov },
    };
  },
  phone: (rng) => `+39 3${rng.digits(2)} ${rng.digits(3)} ${rng.digits(4)}`,
  identity: ({ gender, given, family, dob, city }) => [
    { label: 'Codice fiscale', value: codiceFiscale(given, family, gender, dob, city.meta!.belfiore), check: 'Codice fiscale check character' },
  ],
  banks: [
    { name: 'Intesa Sanpaolo', bic: 'BCITITMMXXX', abi: '03069' },
    { name: 'UniCredit', bic: 'UNCRITMMXXX', abi: '02008' },
    { name: 'Banca Monte dei Paschi di Siena', bic: 'PASCITMMXXX', abi: '01030' },
  ].map(({ name, bic, abi }) => ({
    name,
    bic,
    generate(rng) {
      const cab = rng.digits(5);
      const account = rng.digits(12);
      const cin = italianCheckChar(abi + cab + account);
      return {
        bban: cin + abi + cab + account,
        domestic: [
          { label: 'ABI', value: abi },
          { label: 'CAB', value: cab },
          { label: 'Numero di conto', value: account },
          { label: 'CIN', value: cin, check: 'CIN (odd/even mod 26)' },
        ],
      };
    },
  })),
});

// ---------------------------------------------------------------------------- Netherlands

/** Dutch "elfproef": weights 9..2 and −1 (BSN) or 9..1 (legacy account numbers), sum divisible by 11. */
export function elfproef(value: string, bsn = false): boolean {
  const weights = value.split('').map((_, i) => value.length - i);
  if (bsn) weights[weights.length - 1] = -1;
  const sum = weightedSum(value, weights);
  return sum % 11 === 0 && sum !== 0;
}

const nl = euroCountry({
  code: 'NL',
  name: 'Netherlands',
  flag: '🇳🇱',
  nationality: 'Dutch',
  given: {
    male: ['Daan', 'Sem', 'Lucas', 'Levi', 'Finn', 'Bram', 'Thijs', 'Jesse', 'Ruben', 'Lars'],
    female: ['Emma', 'Julia', 'Mila', 'Tess', 'Sophie', 'Zoë', 'Sara', 'Anna', 'Eva', 'Lotte'],
  },
  family: ['de Jong', 'Jansen', 'de Vries', 'van den Berg', 'van Dijk', 'Bakker', 'Janssen', 'Visser', 'Smit', 'Meijer', 'de Boer', 'Mulder'],
  cities: [
    { name: 'Amsterdam', postcode: range(1011, 1109, 4) },
    { name: 'Rotterdam', postcode: range(3011, 3089, 4) },
    { name: 'Den Haag', postcode: range(2511, 2597, 4) },
    { name: 'Utrecht', postcode: range(3511, 3585, 4) },
    { name: 'Eindhoven', postcode: range(5611, 5658, 4) },
  ],
  streets: ['Kerkstraat', 'Dorpsstraat', 'Molenweg', 'Stationsweg', 'Prinsengracht', 'Keizersgracht', 'Hoofdstraat', 'Julianalaan', 'Beatrixstraat'],
  address: (rng, street, city) => {
    let letters: string;
    do letters = rng.chars(2, 'ABCEGHJKLMNPRSTVWXZ');
    while (['SA', 'SD', 'SS'].includes(letters));
    const nb = rng.int(1, 300);
    const pc = `${city.postcode(rng)} ${letters}`;
    return { lines: [`${street} ${nb}`, `${pc} ${city.name}`], parts: { StrtNm: street, BldgNb: nb, PstCd: pc } };
  },
  phone: (rng) => `+31 6 ${rng.digits(8)}`,
  identity: ({ rng }) => {
    let bsn: string;
    do bsn = rng.digits(9, true);
    while (!elfproef(bsn, true));
    return [{ label: 'BSN', value: bsn, check: 'BSN elfproef' }];
  },
  banks: [
    { name: 'ING Bank', bic: 'INGBNL2A', code: 'INGB', kind: 'postbank' },
    { name: 'Rabobank', bic: 'RABONL2U', code: 'RABO', kind: 'elf' },
    { name: 'ABN AMRO', bic: 'ABNANL2A', code: 'ABNA', kind: 'elf' },
    { name: 'bunq', bic: 'BUNQNL2A', code: 'BUNQ', kind: 'plain' },
  ].map(({ name, bic, code, kind }) => ({
    name,
    bic,
    generate(rng) {
      let account: string;
      if (kind === 'postbank') account = '000' + rng.digits(7, true);
      else if (kind === 'plain') account = '20' + rng.digits(8);
      else {
        let nine: string;
        do nine = rng.digits(9, true);
        while (!elfproef(nine));
        account = '0' + nine;
      }
      return {
        bban: code + account,
        domestic: [{ label: 'Rekeningnummer', value: account, check: kind === 'elf' ? 'Legacy elfproef' : undefined }],
      };
    },
  })),
});

// ---------------------------------------------------------------------------- Ireland

const PPSN_LETTERS = 'WABCDEFGHIJKLMNOPQRSTUV';
const EIRCODE_CHARS = '0123456789ACDEFHKNPRTVWXY';

const ie = euroCountry({
  code: 'IE',
  name: 'Ireland',
  flag: '🇮🇪',
  nationality: 'Irish',
  given: {
    male: ['Jack', 'James', 'Noah', 'Conor', 'Daniel', 'Seán', 'Cian', 'Oisín', 'Patrick', 'Darragh'],
    female: ['Emily', 'Grace', 'Fiadh', 'Sophie', 'Aoife', 'Saoirse', 'Ciara', 'Niamh', 'Róisín', 'Siobhán'],
  },
  family: ['Murphy', 'Kelly', "O'Sullivan", 'Walsh', 'Smith', "O'Brien", 'Byrne', 'Ryan', "O'Connor", "O'Neill", 'Doyle', 'McCarthy'],
  cities: [
    { name: 'Dublin', postcode: (rng) => `D${pad(rng.pick([1, 2, 4, 6, 7, 8, 12, 14, 24]), 2)}`, region: 'Co. Dublin' },
    { name: 'Cork', postcode: () => 'T12', region: 'Co. Cork' },
    { name: 'Galway', postcode: () => 'H91', region: 'Co. Galway' },
    { name: 'Limerick', postcode: () => 'V94', region: 'Co. Limerick' },
  ],
  streets: ['Main Street', 'Church Road', 'Grafton Street', "O'Connell Street", 'Mill Road', 'Patrick Street', 'Strand Road', 'Abbey Street'],
  address: (rng, street, city) => {
    const nb = rng.int(1, 120);
    const eircode = `${city.postcode(rng)} ${rng.chars(4, EIRCODE_CHARS)}`;
    return { lines: [`${nb} ${street}`, city.name, city.region!, eircode], parts: { StrtNm: street, BldgNb: nb, PstCd: eircode } };
  },
  phone: (rng) => `+353 8${rng.pick(['3', '5', '6', '7'])} ${rng.digits(3)} ${rng.digits(4)}`,
  identity: ({ rng }) => {
    const digits = rng.digits(7);
    const check = PPSN_LETTERS[weightedSum(digits, [8, 7, 6, 5, 4, 3, 2]) % 23];
    return [{ label: 'PPS number', value: digits + check, check: 'PPSN check letter (mod 23)' }];
  },
  banks: [
    { name: 'AIB', bic: 'AIBKIE2DXXX', code: 'AIBK', nsc: '93' },
    { name: 'Bank of Ireland', bic: 'BOFIIE2DXXX', code: 'BOFI', nsc: '90' },
    { name: 'PTSB', bic: 'IPBSIE2DXXX', code: 'IPBS', nsc: '99' },
  ].map(({ name, bic, code, nsc }) => ({
    name,
    bic,
    generate(rng) {
      const sortCode = nsc + rng.digits(4);
      const account = rng.digits(8);
      return {
        bban: code + sortCode + account,
        domestic: [
          { label: 'NSC (sort code)', value: `${sortCode.slice(0, 2)}-${sortCode.slice(2, 4)}-${sortCode.slice(4)}` },
          { label: 'Account number', value: account },
        ],
      };
    },
  })),
});

// ---------------------------------------------------------------------------- Belgium

const be = euroCountry({
  code: 'BE',
  name: 'Belgium',
  flag: '🇧🇪',
  nationality: 'Belgian',
  given: {
    male: ['Lucas', 'Louis', 'Noah', 'Arthur', 'Liam', 'Adam', 'Jules', 'Victor', 'Thomas', 'Mathis'],
    female: ['Olivia', 'Emma', 'Louise', 'Mila', 'Alice', 'Elena', 'Juliette', 'Lina', 'Marie', 'Sofia'],
  },
  family: ['Peeters', 'Janssens', 'Maes', 'Jacobs', 'Mertens', 'Willems', 'Claes', 'Goossens', 'Wouters', 'De Smet', 'Dubois', 'Lambert'],
  cities: [
    { name: 'Bruxelles', postcode: () => '1000', meta: { lang: 'fr' } },
    { name: 'Antwerpen', postcode: () => '2000', meta: { lang: 'nl' } },
    { name: 'Gent', postcode: () => '9000', meta: { lang: 'nl' } },
    { name: 'Liège', postcode: () => '4000', meta: { lang: 'fr' } },
    { name: 'Brugge', postcode: () => '8000', meta: { lang: 'nl' } },
    { name: 'Namur', postcode: () => '5000', meta: { lang: 'fr' } },
  ],
  streets: ['Kerkstraat', 'Stationsstraat', 'Molenstraat', 'Nieuwstraat', 'Kapelstraat'],
  address: (rng, street, city) => {
    const fr = ['Rue de la Station', "Rue de l'Église", 'Rue Haute', 'Avenue Louise', 'Chaussée de Bruxelles'];
    const name = city.meta!.lang === 'fr' ? rng.pick(fr) : street;
    const nb = rng.int(1, 200);
    const pc = city.postcode(rng);
    return { lines: [`${name} ${nb}`, `${pc} ${city.name}`], parts: { StrtNm: name, BldgNb: nb, PstCd: pc } };
  },
  phone: (rng) => `+32 4${rng.pick(['70', '75', '77', '85', '95'])} ${rng.digits(2)} ${rng.digits(2)} ${rng.digits(2)}`,
  identity: ({ rng, gender, dob }) => {
    let seq: number;
    do seq = rng.int(1, 997);
    while ((seq % 2 === 1) !== (gender === 'male'));
    const body = `${yy(dob)}${mm(dob)}${dd(dob)}${pad(seq, 3)}`;
    const check = pad(97 - (Number((dob.year >= 2000 ? '2' : '') + body) % 97), 2);
    return [
      {
        label: 'Rijksregisternummer / Numéro national',
        value: `${body.slice(0, 2)}.${body.slice(2, 4)}.${body.slice(4, 6)}-${body.slice(6)}.${check}`,
        check: 'National register check (97 − n mod 97)',
      },
    ];
  },
  banks: [
    { name: 'BNP Paribas Fortis', bic: 'GEBABEBBXXX', code: '001' },
    { name: 'KBC Bank', bic: 'KREDBEBBXXX', code: '734' },
    { name: 'Belfius', bic: 'GKCCBEBBXXX', code: '068' },
    { name: 'ING Belgium', bic: 'BBRUBEBBXXX', code: '363' },
  ].map(({ name, bic, code }) => ({
    name,
    bic,
    generate(rng) {
      const body = code + rng.digits(7);
      const check = pad(Number(body) % 97 || 97, 2);
      return {
        bban: body + check,
        domestic: [{ label: 'Rekeningnummer / Numéro de compte', value: `${body.slice(0, 3)}-${body.slice(3)}-${check}`, check: 'Belgian mod 97' }],
      };
    },
  })),
});

// ---------------------------------------------------------------------------- Austria

const at = euroCountry({
  code: 'AT',
  name: 'Austria',
  flag: '🇦🇹',
  nationality: 'Austrian',
  given: {
    male: ['Lukas', 'Tobias', 'David', 'Elias', 'Jakob', 'Maximilian', 'Florian', 'Paul', 'Simon', 'Michael'],
    female: ['Anna', 'Hannah', 'Lena', 'Sarah', 'Sophia', 'Laura', 'Katharina', 'Marie', 'Julia', 'Valentina'],
  },
  family: ['Gruber', 'Huber', 'Bauer', 'Wagner', 'Müller', 'Pichler', 'Steiner', 'Moser', 'Mayer', 'Hofer', 'Leitner', 'Berger'],
  cities: [
    { name: 'Wien', postcode: (rng) => `1${pad(rng.int(1, 23), 2)}0` },
    { name: 'Graz', postcode: (rng) => `80${pad(rng.int(1, 6) * 10, 2)}` },
    { name: 'Linz', postcode: (rng) => `40${pad(rng.int(2, 4) * 10, 2)}` },
    { name: 'Salzburg', postcode: () => '5020' },
    { name: 'Innsbruck', postcode: () => '6020' },
  ],
  streets: ['Hauptstraße', 'Mariahilfer Straße', 'Kärntner Straße', 'Landstraße', 'Bahnhofstraße', 'Kirchengasse', 'Schulgasse', 'Lindengasse'],
  address: (rng, street, city) => {
    const nb = rng.int(1, 150);
    const door = rng.int(1, 20);
    const pc = city.postcode(rng);
    return { lines: [`${street} ${nb}/${door}`, `${pc} ${city.name}`], parts: { StrtNm: street, BldgNb: nb, Room: door, PstCd: pc } };
  },
  phone: (rng) => `+43 ${rng.pick(['650', '660', '664', '676', '699'])} ${rng.digits(7)}`,
  identity: ({ rng, dob }) => {
    const birth = `${dd(dob)}${mm(dob)}${yy(dob)}`;
    let seq: string;
    let check: number;
    do {
      seq = rng.digits(3, true);
      check = (weightedSum(seq, [3, 7, 9]) + weightedSum(birth, [5, 8, 4, 2, 1, 6])) % 11;
    } while (check === 10);
    return [{ label: 'Sozialversicherungsnummer', value: `${seq}${check} ${birth}`, check: 'SVNR check digit (mod 11)' }];
  },
  banks: [
    { name: 'Erste Bank', bic: 'GIBAATWWXXX', code: '20111' },
    { name: 'UniCredit Bank Austria', bic: 'BKAUATWWXXX', code: '12000' },
    { name: 'BAWAG', bic: 'BAWAATWWXXX', code: '14000' },
    { name: 'Raiffeisenlandesbank NÖ-Wien', bic: 'RLNWATWWXXX', code: '32000' },
  ].map(({ name, bic, code }) => ({
    name,
    bic,
    generate(rng) {
      const account = rng.digits(11);
      return {
        bban: code + account,
        domestic: [
          { label: 'BLZ', value: code },
          { label: 'Kontonummer', value: account },
        ],
      };
    },
  })),
});

// ---------------------------------------------------------------------------- Portugal

export function nibCheck(first19: string): string {
  return pad(98 - mod97(first19 + '00'), 2);
}

const pt = euroCountry({
  code: 'PT',
  name: 'Portugal',
  flag: '🇵🇹',
  nationality: 'Portuguese',
  doubleSurname: true,
  given: {
    male: ['João', 'Francisco', 'Afonso', 'Duarte', 'Tomás', 'Rodrigo', 'Martim', 'Pedro', 'Miguel', 'Tiago'],
    female: ['Maria', 'Leonor', 'Matilde', 'Beatriz', 'Carolina', 'Ana', 'Inês', 'Mariana', 'Sofia', 'Francisca'],
  },
  family: ['Silva', 'Santos', 'Ferreira', 'Pereira', 'Oliveira', 'Costa', 'Rodrigues', 'Martins', 'Sousa', 'Fernandes', 'Gonçalves', 'Almeida'],
  cities: [
    { name: 'Lisboa', postcode: (rng) => `${rng.int(1000, 1990)}-${rng.digits(3)}` },
    { name: 'Porto', postcode: (rng) => `${rng.int(4000, 4369)}-${rng.digits(3)}` },
    { name: 'Braga', postcode: (rng) => `${rng.int(4700, 4719)}-${rng.digits(3)}` },
    { name: 'Coimbra', postcode: (rng) => `${rng.int(3000, 3049)}-${rng.digits(3)}` },
    { name: 'Faro', postcode: (rng) => `${rng.int(8000, 8009)}-${rng.digits(3)}` },
  ],
  streets: ['Rua Augusta', 'Avenida da Liberdade', 'Rua de Santa Catarina', 'Rua do Comércio', 'Rua da Liberdade', 'Avenida da República', 'Rua Direita'],
  address: (rng, street, city) => {
    const nb = rng.int(1, 200);
    const floor = rng.int(1, 8);
    const side = rng.pick(['Esq.', 'Dto.', 'Frente']);
    const pc = city.postcode(rng);
    return {
      lines: [`${street}, ${nb}, ${floor}º ${side}`, `${pc} ${city.name}`],
      parts: { StrtNm: street, BldgNb: nb, Flr: floor, Room: side, PstCd: pc },
    };
  },
  phone: (rng) => `+351 9${rng.pick(['1', '2', '3', '6'])} ${rng.digits(3)} ${rng.digits(4)}`,
  identity: ({ rng }) => {
    const body = rng.pick(['1', '2']) + rng.digits(7);
    const r = weightedSum(body, [9, 8, 7, 6, 5, 4, 3, 2]) % 11;
    return [{ label: 'NIF', value: body + (r < 2 ? 0 : 11 - r), check: 'NIF check digit (mod 11)' }];
  },
  banks: [
    { name: 'Caixa Geral de Depósitos', bic: 'CGDIPTPLXXX', code: '0035' },
    { name: 'Millennium bcp', bic: 'BCOMPTPLXXX', code: '0033' },
    { name: 'Novo Banco', bic: 'BESCPTPLXXX', code: '0007' },
    { name: 'Santander Totta', bic: 'TOTAPTPLXXX', code: '0018' },
  ].map(({ name, bic, code }) => ({
    name,
    bic,
    generate(rng) {
      const body = code + rng.digits(4) + rng.digits(11);
      const nib = body + nibCheck(body);
      return {
        bban: nib,
        domestic: [{ label: 'NIB', value: `${nib.slice(0, 4)} ${nib.slice(4, 8)} ${nib.slice(8, 19)} ${nib.slice(19)}`, check: 'NIB check digits (mod 97)' }],
      };
    },
  })),
});

// ---------------------------------------------------------------------------- Finland

const HETU_CHARS = '0123456789ABCDEFHJKLMNPRSTUVWXY';

const fi = euroCountry({
  code: 'FI',
  name: 'Finland',
  flag: '🇫🇮',
  nationality: 'Finnish',
  given: {
    male: ['Leo', 'Elias', 'Oliver', 'Eino', 'Väinö', 'Onni', 'Mikael', 'Juho', 'Matti', 'Antti'],
    female: ['Aino', 'Eevi', 'Olivia', 'Helmi', 'Sofia', 'Aada', 'Emilia', 'Ella', 'Laura', 'Johanna'],
  },
  family: ['Korhonen', 'Virtanen', 'Mäkinen', 'Nieminen', 'Mäkelä', 'Hämäläinen', 'Laine', 'Heikkinen', 'Koskinen', 'Järvinen', 'Lehtonen', 'Lehtinen'],
  cities: [
    { name: 'Helsinki', postcode: (rng) => `00${pad(rng.int(10, 99), 2)}0` },
    { name: 'Espoo', postcode: (rng) => `02${pad(rng.int(10, 99), 2)}0` },
    { name: 'Tampere', postcode: (rng) => `33${pad(rng.int(10, 99), 2)}0` },
    { name: 'Turku', postcode: (rng) => `20${pad(rng.int(10, 99), 2)}0` },
    { name: 'Oulu', postcode: (rng) => `90${pad(rng.int(10, 99), 2)}0` },
  ],
  streets: ['Mannerheimintie', 'Hämeenkatu', 'Aleksanterinkatu', 'Kauppakatu', 'Rantatie', 'Koulukatu', 'Puistokatu', 'Kirkkokatu'],
  address: (rng, street, city) => {
    const nb = rng.int(1, 80);
    const apartment = `${rng.pick(['A', 'B', 'C'])} ${rng.int(1, 40)}`;
    const pc = city.postcode(rng);
    return { lines: [`${street} ${nb} ${apartment}`, `${pc} ${city.name}`], parts: { StrtNm: street, BldgNb: nb, Room: apartment, PstCd: pc } };
  },
  phone: (rng) => `+358 ${rng.pick(['40', '44', '45', '50'])} ${rng.digits(3)} ${rng.digits(4)}`,
  identity: ({ rng, gender, dob }) => {
    let individual: number;
    do individual = rng.int(2, 899);
    while ((individual % 2 === 1) !== (gender === 'male'));
    const birth = `${dd(dob)}${mm(dob)}${yy(dob)}`;
    const check = HETU_CHARS[Number(birth + pad(individual, 3)) % 31];
    return [{ label: 'Henkilötunnus', value: `${birth}${dob.year >= 2000 ? 'A' : '-'}${pad(individual, 3)}${check}`, check: 'HETU check character (mod 31)' }];
  },
  banks: [
    { name: 'Nordea', bic: 'NDEAFIHHXXX', prefix: '1' },
    { name: 'OP Financial Group', bic: 'OKOYFIHHXXX', prefix: '5' },
    { name: 'Danske Bank', bic: 'DABAFIHHXXX', prefix: '8' },
  ].map(({ name, bic, prefix }) => ({
    name,
    bic,
    generate(rng) {
      const body = prefix + rng.digits(12);
      const account = body + luhnCheckDigit(body);
      return {
        bban: account,
        domestic: [{ label: 'Tilinumero', value: `${account.slice(0, 6)}-${account.slice(6)}`, check: luhnValid(account) ? 'Luhn' : undefined }],
      };
    },
  })),
});

export const EUROZONE: CountryModule[] = [de, fr, es, it, nl, ie, be, at, pt, fi];
