import type { CountryModule } from '../core/types';
import type { Rng } from '../core/rng';
import { birthDate, email, pickGender, type BirthDate, pickBank, bankName } from '../core/person';
import { postalAddress } from '../core/iso20022';
import { CN_GIVEN, CN_SURNAMES, JP_FAMILY, JP_GIVEN, NAMES } from './names';
import { luhnCheckDigit, pad, solveCheckDigit, verhoeffValid, weightedSum } from '../core/checks';

const yyyymmdd = (dob: BirthDate) => `${dob.year}${pad(dob.month, 2)}${pad(dob.day, 2)}`;

// ---------------------------------------------------------------------------- Australia

export function tfnValid(tfn: string): boolean {
  return tfn.length === 9 && weightedSum(tfn, [1, 4, 3, 7, 5, 8, 6, 9, 10]) % 11 === 0;
}

const AU_CITIES = [
  { city: 'Sydney', state: 'NSW', postcode: [2000, 2234], bsbState: '2' },
  { city: 'Melbourne', state: 'VIC', postcode: [3000, 3207], bsbState: '3' },
  { city: 'Brisbane', state: 'QLD', postcode: [4000, 4179], bsbState: '4' },
  { city: 'Adelaide', state: 'SA', postcode: [5000, 5199], bsbState: '5' },
  { city: 'Perth', state: 'WA', postcode: [6000, 6199], bsbState: '6' },
  { city: 'Hobart', state: 'TAS', postcode: [7000, 7019], bsbState: '7' },
  { city: 'Canberra', state: 'ACT', postcode: [2600, 2617], bsbState: '2' },
] as const;

const AU_BANKS = [
  { name: 'Commonwealth Bank of Australia', bic: 'CTBAAU2S', bsbPrefix: '06', accountLength: 8 },
  { name: 'Westpac Banking Corporation', bic: 'WPACAU2S', bsbPrefix: '03', accountLength: 6 },
  { name: 'ANZ', bic: 'ANZBAU3M', bsbPrefix: '01', accountLength: 9 },
  { name: 'National Australia Bank', bic: 'NATAAU33', bsbPrefix: '08', accountLength: 9 },
];

export const au: CountryModule = {
  code: 'AU',
  name: 'Australia',
  flag: '🇦🇺',
  currency: 'AUD',
  group: 'Asia-Pacific',
  banks: AU_BANKS.map(bankName),
  generate(rng, options) {
    const gender = pickGender(rng, options);
    const given = rng.pick(NAMES.AU[gender]);
    const family = rng.pick(NAMES.AU.family);
    const dob = birthDate(rng, options);
    const place = rng.pick(AU_CITIES);
    const postcode = String(rng.int(place.postcode[0], place.postcode[1]));
    const street = rng.pick(['George Street', 'King Street', 'Elizabeth Street', 'Collins Street', 'Queen Street', 'Church Street', 'Victoria Road', 'Beach Road', 'Park Avenue']);
    const unit = rng.bool(0.3) ? rng.int(1, 30) : undefined;
    const streetNumber = rng.int(1, 250);

    let tfn: string;
    do tfn = rng.digits(8, true) + rng.digits(1);
    while (!tfnValid(tfn));

    const bank = pickBank(rng, AU_BANKS, options);
    const bsb = bank.bsbPrefix + place.bsbState + rng.digits(3);
    const account = rng.digits(bank.accountLength, true);
    const mail = email(rng, given, family);

    return {
      gender,
      name: { full: `${given} ${family}`, given, family, accountHolder: `${given} ${family}`.toUpperCase() },
      dateOfBirth: dob.iso,
      age: dob.age,
      nationality: 'Australian',
      address: {
        lines: [`${unit ? `Unit ${unit}, ` : ''}${streetNumber} ${street}`, `${place.city.toUpperCase()} ${place.state} ${postcode}`],
        structured: postalAddress({
          StrtNm: street,
          BldgNb: streetNumber,
          Room: unit && `Unit ${unit}`,
          PstCd: postcode,
          TwnNm: place.city,
          CtrySubDvsn: place.state,
          Ctry: 'AU',
        }),
      },
      phone: `+61 4${rng.digits(2)} ${rng.digits(3)} ${rng.digits(3)}`,
      email: mail,
      identity: [{ label: 'Tax File Number', value: `${tfn.slice(0, 3)} ${tfn.slice(3, 6)} ${tfn.slice(6)}`, check: 'TFN weighted mod 11' }],
      bank: {
        bankName: bank.name,
        bic: bank.bic,
        currency: 'AUD',
        domestic: [
          { label: 'BSB', value: `${bsb.slice(0, 3)}-${bsb.slice(3)}`, check: 'Bank prefix + state digit' },
          { label: 'Account number', value: account },
        ],
        international: [
          { label: 'SWIFT / BIC', value: bank.bic },
          { label: 'Account (BSB + number)', value: bsb + account },
          { label: 'IBAN', value: 'Not used in Australia' },
        ],
        extras: [{ label: 'PayID (email)', value: mail }],
      },
    };
  },
};

// ---------------------------------------------------------------------------- New Zealand

const NZ_WEIGHTS_A = [0, 0, 6, 3, 7, 9, 0, 0, 10, 5, 8, 4, 2, 1, 0, 0, 0, 0];

/** NZ bank account check (Payments NZ algorithm A) over the 18-digit form BB-bbbb-AAAAAAAA-SSSS. */
export function nzAccountValid(bank: string, branch: string, base: string, suffix: string): boolean {
  const eighteen = pad(bank, 2) + pad(branch, 4) + pad(base, 8) + pad(suffix, 4);
  return Number(base) < 990000 && weightedSum(eighteen, NZ_WEIGHTS_A) % 11 === 0;
}

export function irdValid(ird: string): boolean {
  const n = Number(ird);
  if (n < 10_000_000 || n > 150_000_000) return false;
  const nine = pad(ird, 9);
  const base = nine.slice(0, 8);
  const check = Number(nine[8]);
  for (const weights of [
    [3, 2, 7, 6, 5, 4, 3, 2],
    [7, 4, 3, 2, 5, 2, 7, 6],
  ]) {
    const r = weightedSum(base, weights) % 11;
    const c = r === 0 ? 0 : 11 - r;
    if (c !== 10) return c === check;
  }
  return false;
}

const NZ_BANKS = [
  { name: 'ANZ Bank New Zealand', bic: 'ANZBNZ22', code: '01', branches: [1, 999] },
  { name: 'Bank of New Zealand', bic: 'BKNZNZ22', code: '02', branches: [1, 1299] },
  { name: 'Westpac New Zealand', bic: 'WPACNZ2W', code: '03', branches: [1, 1299] },
  { name: 'ASB Bank', bic: 'ASBBNZ2A', code: '12', branches: [3000, 3299] },
];

const NZ_CITIES = [
  { city: 'Auckland', postcode: [1010, 1072], suburbs: ['Ponsonby', 'Parnell', 'Mt Eden', 'Grey Lynn'], streets: ['Queen Street', 'Ponsonby Road', 'Great North Road', 'Karangahape Road'] },
  { city: 'Wellington', postcode: [6011, 6037], suburbs: ['Te Aro', 'Kelburn', 'Thorndon', 'Newtown'], streets: ['Lambton Quay', 'Cuba Street', 'Willis Street', 'Tinakori Road'] },
  { city: 'Christchurch', postcode: [8011, 8083], suburbs: ['Riccarton', 'Merivale', 'Sydenham'], streets: ['Colombo Street', 'Papanui Road', 'Riccarton Road'] },
  { city: 'Hamilton', postcode: [3200, 3216], suburbs: ['Hamilton East', 'Frankton', 'Hillcrest'], streets: ['Victoria Street', 'Grey Street', 'Ulster Street'] },
  { city: 'Dunedin', postcode: [9010, 9016], suburbs: ['Roslyn', 'Mornington', 'North East Valley'], streets: ['George Street', 'Princes Street', 'Highgate'] },
];

export const nz: CountryModule = {
  code: 'NZ',
  name: 'New Zealand',
  flag: '🇳🇿',
  currency: 'NZD',
  group: 'Asia-Pacific',
  banks: NZ_BANKS.map(bankName),
  generate(rng, options) {
    const gender = pickGender(rng, options);
    const given = rng.pick(NAMES.NZ[gender]);
    const family = rng.pick(NAMES.NZ.family);
    const dob = birthDate(rng, options);
    const place = rng.pick(NZ_CITIES);
    const postcode = String(rng.int(place.postcode[0], place.postcode[1]));
    const streetNumber = rng.int(1, 300);
    const street = rng.pick(place.streets);
    const suburb = rng.pick(place.suburbs);

    let ird: string;
    do ird = String(rng.int(10_000_000, 149_999_999));
    while (!irdValid(ird));
    const ird9 = pad(ird, 9);

    const bank = pickBank(rng, NZ_BANKS, options);
    const branch = pad(rng.int(bank.branches[0], bank.branches[1]), 4);
    const suffix = pad(rng.pick([0, 0, 0, 1, 2, 25]), 2);
    let base: string;
    do base = pad(rng.int(10000, 989999), 7);
    while (!nzAccountValid(bank.code, branch, base, suffix));
    const display = `${bank.code}-${branch}-${base}-${suffix}`;

    return {
      gender,
      name: { full: `${given} ${family}`, given, family, accountHolder: `${given} ${family}`.toUpperCase() },
      dateOfBirth: dob.iso,
      age: dob.age,
      nationality: 'New Zealander',
      address: {
        lines: [`${streetNumber} ${street}`, suburb, `${place.city} ${postcode}`],
        structured: postalAddress({ StrtNm: street, BldgNb: streetNumber, TwnLctnNm: suburb, PstCd: postcode, TwnNm: place.city, Ctry: 'NZ' }),
      },
      phone: `+64 ${rng.pick(['21', '22', '27'])} ${rng.digits(3)} ${rng.digits(4)}`,
      email: email(rng, given, family),
      identity: [{ label: 'IRD number', value: `${ird9.slice(0, 3)}-${ird9.slice(3, 6)}-${ird9.slice(6)}`, check: 'IRD check digit (mod 11)' }],
      bank: {
        bankName: bank.name,
        bic: bank.bic,
        currency: 'NZD',
        domestic: [
          { label: 'Account number', value: display, check: 'Payments NZ algorithm A (mod 11)' },
          { label: 'Bank / branch', value: `${bank.code} / ${branch}` },
        ],
        international: [
          { label: 'SWIFT / BIC', value: bank.bic },
          { label: 'Account number', value: display.replace(/-/g, '') },
          { label: 'IBAN', value: 'Not used in New Zealand' },
        ],
      },
    };
  },
};

// ---------------------------------------------------------------------------- China

const CN_ID_WEIGHTS = [7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2];

/** 18-digit Resident Identity Card check character (ISO 7064 MOD 11-2). */
export function cnIdCheck(first17: string): string {
  return '10X98765432'[weightedSum(first17, CN_ID_WEIGHTS) % 11];
}

const CN_CITIES = [
  { zh: '北京市', province: '', en: 'Beijing', provinceEn: '', districtZh: '东城区', districtEn: 'Dongcheng District', postcode: '100010', idPrefix: '110101', cnaps: '1000', streets: [['王府井大街', 'Wangfujing Street'], ['东单北大街', 'Dongdan North Street'], ['朝阳门内大街', 'Chaoyangmennei Street']] },
  { zh: '上海市', province: '', en: 'Shanghai', provinceEn: '', districtZh: '黄浦区', districtEn: 'Huangpu District', postcode: '200001', idPrefix: '310101', cnaps: '2900', streets: [['南京东路', 'East Nanjing Road'], ['淮海中路', 'Middle Huaihai Road'], ['西藏中路', 'Middle Xizang Road']] },
  { zh: '广州市', province: '广东省', en: 'Guangzhou', provinceEn: 'Guangdong', districtZh: '天河区', districtEn: 'Tianhe District', postcode: '510630', idPrefix: '440106', cnaps: '5810', streets: [['天河路', 'Tianhe Road'], ['体育西路', 'Tiyu West Road'], ['黄埔大道', 'Huangpu Avenue']] },
  { zh: '深圳市', province: '广东省', en: 'Shenzhen', provinceEn: 'Guangdong', districtZh: '福田区', districtEn: 'Futian District', postcode: '518000', idPrefix: '440304', cnaps: '5840', streets: [['深南大道', 'Shennan Avenue'], ['福华路', 'Fuhua Road'], ['华强北路', 'Huaqiang North Road']] },
  { zh: '成都市', province: '四川省', en: 'Chengdu', provinceEn: 'Sichuan', districtZh: '武侯区', districtEn: 'Wuhou District', postcode: '610041', idPrefix: '510107', cnaps: '6510', streets: [['人民南路', 'South Renmin Road'], ['武侯祠大街', 'Wuhouci Street']] },
  { zh: '杭州市', province: '浙江省', en: 'Hangzhou', provinceEn: 'Zhejiang', districtZh: '西湖区', districtEn: 'Xihu District', postcode: '310013', idPrefix: '330106', cnaps: '3310', streets: [['文三路', 'Wensan Road'], ['西湖大道', 'Xihu Avenue']] },
];
const CN_BANKS = [
  { zh: '中国工商银行', en: 'Industrial and Commercial Bank of China', bic: 'ICBKCNBJ', bin: '622202', cnaps: '102' },
  { zh: '中国建设银行', en: 'China Construction Bank', bic: 'PCBCCNBJ', bin: '621700', cnaps: '105' },
  { zh: '中国农业银行', en: 'Agricultural Bank of China', bic: 'ABOCCNBJ', bin: '622848', cnaps: '103' },
  { zh: '中国银行', en: 'Bank of China', bic: 'BKCHCNBJ', bin: '621661', cnaps: '104' },
  { zh: '交通银行', en: 'Bank of Communications', bic: 'COMMCNSH', bin: '622260', cnaps: '301' },
];

export const cn: CountryModule = {
  code: 'CN',
  name: 'China',
  flag: '🇨🇳',
  currency: 'CNY',
  group: 'Asia-Pacific',
  banks: CN_BANKS.map(bankName),
  generate(rng, options) {
    const gender = pickGender(rng, options);
    const [familyZh, family] = rng.pick(CN_SURNAMES);
    const [givenZh, given] = rng.pick(CN_GIVEN[gender]);
    const dob = birthDate(rng, options);
    const place = rng.pick(CN_CITIES);
    const [streetZh, streetEn] = rng.pick(place.streets);
    const no = rng.int(1, 300);
    const unit = rng.int(1, 6);
    const room = `${rng.int(1, 30)}0${rng.int(1, 4)}`;

    let seq: string;
    do seq = rng.digits(3);
    while ((Number(seq[2]) % 2 === 1) !== (gender === 'male'));
    const idBody = place.idPrefix + yyyymmdd(dob) + seq;

    const bank = pickBank(rng, CN_BANKS, options);
    const cardBody = bank.bin + rng.digits(12);
    const card = cardBody + luhnCheckDigit(cardBody);
    const cnaps = bank.cnaps + place.cnaps + rng.digits(5);
    const branchZh = `${bank.zh}${place.zh.replace('市', '')}${place.districtZh.replace('区', '')}支行`;
    const pinyinName = `${family.toUpperCase()} ${given}`;

    return {
      gender,
      name: {
        full: `${family} ${given}`,
        given,
        family,
        native: familyZh + givenZh,
        accountHolder: familyZh + givenZh,
        accountHolderLatin: pinyinName,
        parts: [{ label: 'Name order', value: 'Family name first' }],
      },
      dateOfBirth: dob.iso,
      age: dob.age,
      nationality: 'Chinese',
      address: {
        lines: [`Room ${room}, Unit ${unit}, No. ${no} ${streetEn}`, `${place.districtEn}, ${[place.en, place.provinceEn].filter(Boolean).join(', ')} ${place.postcode}`],
        native: [`${place.province}${place.zh}${place.districtZh}${streetZh}${no}号${unit}单元${room}室`, `邮编 ${place.postcode}`],
        structured: postalAddress({
          StrtNm: streetEn,
          BldgNb: no,
          Room: `Room ${room}, Unit ${unit}`,
          PstCd: place.postcode,
          TwnNm: place.en,
          DstrctNm: place.districtEn,
          CtrySubDvsn: place.provinceEn,
          Ctry: 'CN',
        }),
      },
      phone: `+86 ${rng.pick(['135', '138', '139', '159', '177', '186', '188'])} ${rng.digits(4)} ${rng.digits(4)}`,
      email: email(rng, given, family),
      identity: [{ label: 'Resident Identity Card (居民身份证)', value: idBody + cnIdCheck(idBody), check: 'GB 11643 / ISO 7064 MOD 11-2' }],
      bank: {
        bankName: bank.en,
        bankNameNative: bank.zh,
        bic: bank.bic,
        currency: 'CNY',
        domestic: [
          { label: 'Account / card number (账号)', value: card.replace(/(\d{4})(?=\d)/g, '$1 '), check: 'UnionPay BIN + Luhn' },
          { label: 'Branch (开户行)', value: branchZh, latin: `${bank.en}, ${place.en} ${place.districtEn.replace(' District', '')} Sub-branch` },
          { label: 'CNAPS code (联行号)', value: cnaps },
        ],
        international: [
          { label: 'SWIFT / BIC', value: bank.bic },
          { label: 'Beneficiary account', value: card },
          { label: 'Beneficiary name (pinyin)', value: pinyinName },
          { label: 'IBAN', value: 'Not used in China' },
        ],
      },
      notes: ['Cross-border CNY receipts usually require the beneficiary name in pinyin exactly as registered.'],
    };
  },
};

// ---------------------------------------------------------------------------- Japan

/** My Number (個人番号) check digit. */
export function myNumberCheck(first11: string): number {
  let sum = 0;
  for (let n = 1; n <= 11; n++) {
    const p = Number(first11[11 - n]);
    const q = n <= 6 ? n + 1 : n - 5;
    sum += p * q;
  }
  const r = sum % 11;
  return r <= 1 ? 0 : 11 - r;
}

const JP_AREAS = [
  { pref: '東京都', city: '千代田区', town: '丸の内', townEn: 'Marunouchi', wardEn: 'Chiyoda-ku', cityEn: 'Tokyo', prefEn: 'Tokyo', postcode: '100-0005' },
  { pref: '東京都', city: '渋谷区', town: '渋谷', townEn: 'Shibuya', wardEn: 'Shibuya-ku', cityEn: 'Tokyo', prefEn: 'Tokyo', postcode: '150-0002' },
  { pref: '大阪府', city: '大阪市北区', town: '梅田', townEn: 'Umeda', wardEn: 'Kita-ku', cityEn: 'Osaka', prefEn: 'Osaka', postcode: '530-0001' },
  { pref: '愛知県', city: '名古屋市中区', town: '栄', townEn: 'Sakae', wardEn: 'Naka-ku', cityEn: 'Nagoya', prefEn: 'Aichi', postcode: '460-0008' },
  { pref: '福岡県', city: '福岡市中央区', town: '天神', townEn: 'Tenjin', wardEn: 'Chuo-ku', cityEn: 'Fukuoka', prefEn: 'Fukuoka', postcode: '810-0001' },
];
const JP_BANKS = [
  { zh: 'みずほ銀行', en: 'Mizuho Bank', code: '0001', bic: 'MHCBJPJT' },
  { zh: '三菱UFJ銀行', en: 'MUFG Bank', code: '0005', bic: 'BOTKJPJT' },
  { zh: '三井住友銀行', en: 'Sumitomo Mitsui Banking Corporation', code: '0009', bic: 'SMBCJPJT' },
];
const JP_BRANCHES: [string, string][] = [['新宿支店', 'Shinjuku'], ['渋谷支店', 'Shibuya'], ['丸の内支店', 'Marunouchi'], ['梅田支店', 'Umeda'], ['名古屋支店', 'Nagoya'], ['福岡支店', 'Fukuoka']];

export const jp: CountryModule = {
  code: 'JP',
  name: 'Japan',
  flag: '🇯🇵',
  currency: 'JPY',
  group: 'Asia-Pacific',
  banks: JP_BANKS.map(bankName),
  generate(rng, options) {
    const gender = pickGender(rng, options);
    const [familyJa, family, familyKana] = rng.pick(JP_FAMILY);
    const [givenJa, given, givenKana] = rng.pick(JP_GIVEN[gender]);
    const dob = birthDate(rng, options);
    const area = rng.pick(JP_AREAS);
    const chome = `${rng.int(1, 5)}-${rng.int(1, 20)}-${rng.int(1, 30)}`;
    const room = rng.bool(0.6) ? `${rng.int(1, 15)}0${rng.int(1, 9)}` : '';

    const myNumberBody = rng.digits(11, true);
    const myNumber = myNumberBody + myNumberCheck(myNumberBody);

    const bank = pickBank(rng, JP_BANKS, options);
    const [branchJa, branchEn] = rng.pick(JP_BRANCHES);
    const branchCode = pad(rng.int(100, 899), 3);
    const account = rng.digits(7);

    return {
      gender,
      name: {
        full: `${family} ${given}`,
        given,
        family,
        native: `${familyJa} ${givenJa}`,
        accountHolder: `${familyKana} ${givenKana}`,
        accountHolderLatin: `${family} ${given}`.toUpperCase(),
        parts: [
          { label: 'Name order', value: 'Family name first' },
          { label: 'Katakana (フリガナ)', value: `${familyKana} ${givenKana}`, latin: null },
        ],
      },
      dateOfBirth: dob.iso,
      age: dob.age,
      nationality: 'Japanese',
      address: {
        lines: [
          `${room ? `Room ${room}, ` : ''}${chome} ${area.townEn}, ${area.wardEn}`,
          `${area.cityEn}${area.prefEn !== area.cityEn ? `, ${area.prefEn}` : ''} ${area.postcode}`,
        ],
        native: [`〒${area.postcode}`, `${area.pref}${area.city}${area.town}${chome}${room ? ` ${room}号室` : ''}`],
        // Japanese addresses have no street names: chōme-banchi-gō is the building number.
        structured: postalAddress({
          BldgNb: chome,
          Room: room,
          PstCd: area.postcode,
          TwnNm: area.cityEn,
          TwnLctnNm: area.townEn,
          DstrctNm: area.wardEn,
          CtrySubDvsn: area.prefEn,
          Ctry: 'JP',
        }),
      },
      phone: `+81 ${rng.pick(['80', '90', '70'])}-${rng.digits(4)}-${rng.digits(4)}`,
      email: email(rng, given, family),
      identity: [{ label: 'My Number (個人番号)', value: `${myNumber.slice(0, 4)} ${myNumber.slice(4, 8)} ${myNumber.slice(8)}`, check: 'My Number check digit (mod 11)' }],
      bank: {
        bankName: bank.en,
        bankNameNative: bank.zh,
        bic: bank.bic,
        currency: 'JPY',
        domestic: [
          { label: 'Bank code (金融機関コード)', value: bank.code },
          { label: 'Branch (支店)', value: `${branchJa} (${branchCode})`, latin: `${branchEn} Branch (${branchCode})` },
          { label: 'Account type (預金種目)', value: '普通 (Ordinary)', latin: 'Futsu (Ordinary)' },
          { label: 'Account number (口座番号)', value: account },
          { label: 'Account holder (口座名義)', value: `${familyKana} ${givenKana}`, latin: `${family} ${given}`.toUpperCase() },
        ],
        international: [
          { label: 'SWIFT / BIC', value: bank.bic },
          { label: 'Branch', value: `${branchEn} Branch (${branchCode})` },
          { label: 'Account number', value: `${branchCode}-${account}` },
          { label: 'IBAN', value: 'Not used in Japan' },
        ],
      },
    };
  },
};

// ---------------------------------------------------------------------------- India

const IN_CITIES = [
  { city: 'Mumbai', state: 'Maharashtra', pin: [400001, 400104], micr: '400', areas: ['Bandra West', 'Andheri East', 'Colaba', 'Powai'] },
  { city: 'New Delhi', state: 'Delhi', pin: [110001, 110096], micr: '110', areas: ['Connaught Place', 'Lajpat Nagar', 'Saket', 'Dwarka'] },
  { city: 'Bengaluru', state: 'Karnataka', pin: [560001, 560100], micr: '560', areas: ['Koramangala', 'Indiranagar', 'Jayanagar', 'Whitefield'] },
  { city: 'Chennai', state: 'Tamil Nadu', pin: [600001, 600119], micr: '600', areas: ['T Nagar', 'Adyar', 'Anna Nagar', 'Mylapore'] },
  { city: 'Kolkata', state: 'West Bengal', pin: [700001, 700160], micr: '700', areas: ['Salt Lake', 'Ballygunge', 'Park Street'] },
  { city: 'Hyderabad', state: 'Telangana', pin: [500001, 500098], micr: '500', areas: ['Banjara Hills', 'Jubilee Hills', 'Gachibowli'] },
];
const IN_BANKS = [
  { name: 'State Bank of India', bic: 'SBININBB', ifsc: 'SBIN', micr: '002', length: 11, upi: 'sbi' },
  { name: 'HDFC Bank', bic: 'HDFCINBB', ifsc: 'HDFC', micr: '240', length: 14, upi: 'hdfcbank' },
  { name: 'ICICI Bank', bic: 'ICICINBB', ifsc: 'ICIC', micr: '229', length: 12, upi: 'icici' },
  { name: 'Axis Bank', bic: 'AXISINBB', ifsc: 'UTIB', micr: '211', length: 15, upi: 'axisbank' },
];

function aadhaar(rng: Rng): string {
  const body = rng.int(2, 9) + rng.digits(10);
  const n = body + solveCheckDigit((d) => verhoeffValid(body + d));
  return `${n.slice(0, 4)} ${n.slice(4, 8)} ${n.slice(8)}`;
}

export const india: CountryModule = {
  code: 'IN',
  name: 'India',
  flag: '🇮🇳',
  currency: 'INR',
  group: 'Asia-Pacific',
  banks: IN_BANKS.map(bankName),
  generate(rng, options) {
    const gender = pickGender(rng, options);
    const given = rng.pick(NAMES.IN[gender]);
    const family = rng.pick(NAMES.IN.family);
    const dob = birthDate(rng, options);
    const place = rng.pick(IN_CITIES);
    const pin = String(rng.int(place.pin[0], place.pin[1]));
    const building = rng.pick(['Sai Krupa Apartments', 'Green Park Residency', 'Shanti Niwas', 'Lakshmi Towers', 'Sunrise Heights']);
    const street = rng.pick(['MG Road', 'Station Road', 'Main Road', '1st Cross Road', 'Ring Road', 'Nehru Road', 'Gandhi Road']);
    const flat = `Flat ${rng.int(1, 20)}${rng.pick(['A', 'B', 'C'])}`;
    const locality = rng.pick(place.areas);

    const pan = `${rng.letters(3)}P${family[0]}${rng.digits(4)}${rng.letters(1)}`;
    const bank = pickBank(rng, IN_BANKS, options);
    const ifsc = `${bank.ifsc}0${rng.digits(6)}`;
    const account = rng.digits(bank.length, true);
    const micr = place.micr + bank.micr + rng.digits(3);

    return {
      gender,
      name: { full: `${given} ${family}`, given, family, accountHolder: `${given} ${family}`.toUpperCase() },
      dateOfBirth: dob.iso,
      age: dob.age,
      nationality: 'Indian',
      address: {
        lines: [`${flat}, ${building}`, `${street}, ${locality}`, `${place.city}, ${place.state} ${pin}`],
        structured: postalAddress({
          StrtNm: street,
          BldgNm: building,
          Room: flat,
          PstCd: pin,
          TwnNm: place.city,
          TwnLctnNm: locality,
          CtrySubDvsn: place.state,
          Ctry: 'IN',
        }),
      },
      phone: `+91 ${rng.int(6, 9)}${rng.digits(4)} ${rng.digits(5)}`,
      email: email(rng, given, family),
      identity: [
        { label: 'PAN', value: pan, check: 'PAN structure (4th char P = individual)' },
        { label: 'Aadhaar', value: aadhaar(rng), check: 'Verhoeff' },
      ],
      bank: {
        bankName: bank.name,
        bic: bank.bic,
        currency: 'INR',
        domestic: [
          { label: 'Account number', value: account },
          { label: 'IFSC', value: ifsc, check: 'IFSC structure (bank code + 0 + branch)' },
          { label: 'MICR', value: micr },
        ],
        international: [
          { label: 'SWIFT / BIC', value: bank.bic },
          { label: 'Account number', value: account },
          { label: 'IFSC (often requested)', value: ifsc },
          { label: 'IBAN', value: 'Not used in India' },
        ],
        extras: [{ label: 'UPI ID', value: `${given.toLowerCase()}.${family.toLowerCase().replace(/[^a-z]/g, '')}${rng.int(1, 99)}@${bank.upi}` }],
      },
    };
  },
};

export const ASIA_PACIFIC: CountryModule[] = [au, nz, cn, jp, india];
