import type { CountryModule } from '../core/types';
import { birthDate, email, pickGender, pickBank, bankName } from '../core/person';
import { formatIban, makeIban } from '../core/iban';
import { luhnCheckDigit } from '../core/checks';
import { postalAddress } from '../core/iso20022';
import { AR_GIVEN, SA_FAMILY } from './names';

const toArabicDigits = (s: string) => s.replace(/\d/g, (d) => '٠١٢٣٤٥٦٧٨٩'[Number(d)]);

/** Date of birth in the Umm al-Qura (Hijri) calendar, as used on Saudi documents. */
export function hijriDate(iso: string): string {
  return new Intl.DateTimeFormat('en-u-ca-islamic-umalqura', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(
    new Date(`${iso}T00:00:00Z`),
  );
}

const CITIES = [
  { ar: 'الرياض', en: 'Riyadh', region: 'Riyadh Region', pc: [11000, 14999], districts: [['العليا', 'Al Olaya'], ['الملز', 'Al Malaz'], ['النخيل', 'Al Nakheel'], ['حطين', 'Hittin']] },
  { ar: 'جدة', en: 'Jeddah', region: 'Makkah Region', pc: [21000, 23999], districts: [['الروضة', 'Al Rawdah'], ['الحمراء', 'Al Hamra'], ['الشاطئ', 'Al Shati']] },
  { ar: 'الدمام', en: 'Dammam', region: 'Eastern Province', pc: [31000, 32999], districts: [['الفيصلية', 'Al Faisaliyah'], ['الشاطئ', 'Al Shati']] },
  { ar: 'مكة المكرمة', en: 'Makkah', region: 'Makkah Region', pc: [24000, 24999], districts: [['العزيزية', 'Al Aziziyah']] },
  { ar: 'المدينة المنورة', en: 'Madinah', region: 'Madinah Region', pc: [42000, 42999], districts: [['قباء', 'Quba']] },
];
const STREETS = [
  ['طريق الملك فهد', 'King Fahd Road'], ['شارع الأمير سلطان', 'Prince Sultan Street'], ['طريق الملك عبدالعزيز', 'King Abdulaziz Road'],
  ['شارع التحلية', 'Tahlia Street'], ['شارع الستين', 'Al Sittin Street'],
];
const BANKS = [
  { name: 'Al Rajhi Bank', ar: 'مصرف الراجحي', bic: 'RJHISARI', code: '80' },
  { name: 'Saudi National Bank', ar: 'البنك الأهلي السعودي', bic: 'NCBKSAJE', code: '10' },
  { name: 'Riyad Bank', ar: 'بنك الرياض', bic: 'RIBLSARI', code: '20' },
  { name: 'Saudi Awwal Bank', ar: 'البنك السعودي الأول', bic: 'SABBSARI', code: '45' },
  { name: 'Alinma Bank', ar: 'مصرف الإنماء', bic: 'INMASARI', code: '05' },
];

export const sa: CountryModule = {
  code: 'SA',
  name: 'Saudi Arabia',
  flag: '🇸🇦',
  currency: 'SAR',
  group: 'Middle East & Africa',
  banks: BANKS.map(bankName),
  generate(rng, options) {
    const gender = pickGender(rng, options);
    const [givenAr, given] = rng.pick(AR_GIVEN[gender]);
    const [fatherAr, father] = rng.pick(AR_GIVEN.male);
    const [familyAr, family] = rng.pick(SA_FAMILY);
    const [linkAr, link] = gender === 'male' ? ['بن', 'bin'] : ['بنت', 'bint'];
    const dob = birthDate(rng, options);

    const city = rng.pick(CITIES);
    const [districtAr, districtEn] = rng.pick(city.districts);
    const [streetAr, streetEn] = rng.pick(STREETS);
    const building = String(rng.int(1000, 9999));
    const additional = String(rng.int(1000, 9999));
    const postcode = String(rng.int(city.pc[0], city.pc[1]));

    // Citizens' IDs start with 1 (residents' Iqama with 2). The official check-digit formula is
    // released only on request (per SAMA), so the commonly reported Luhn digit isn't marked as checked.
    const idBody = '1' + rng.digits(8);
    const nationalId = idBody + luhnCheckDigit(idBody);

    const bank = pickBank(rng, BANKS, options);
    const account = rng.digits(18);
    const iban = makeIban('SA', bank.code + account);
    const full = `${given} ${link} ${father} ${family}`;

    return {
      gender,
      name: {
        full,
        given,
        family,
        native: `${givenAr} ${linkAr} ${fatherAr} ${familyAr}`,
        accountHolder: `${givenAr} ${linkAr} ${fatherAr} ${familyAr}`,
        accountHolderLatin: full.toUpperCase(),
        parts: [{ label: "Father's name", value: `${fatherAr} / ${father}`, latin: father }],
      },
      dateOfBirth: dob.iso,
      age: dob.age,
      nationality: 'Saudi',
      // Saudi National Address: building number, street, district, city, postcode and a 4-digit additional number.
      address: {
        lines: [`${building} ${streetEn}, ${districtEn} District`, `${city.en} ${postcode} - ${additional}`],
        native: [`${toArabicDigits(building)} ${streetAr}، حي ${districtAr}`, `${city.ar} ${toArabicDigits(postcode)} - ${toArabicDigits(additional)}`],
        structured: postalAddress({
          StrtNm: streetEn,
          BldgNb: building,
          PstCd: postcode,
          TwnNm: city.en,
          TwnLctnNm: districtEn,
          CtrySubDvsn: city.region,
          Ctry: 'SA',
        }),
      },
      phone: `+966 5${rng.int(0, 9)} ${rng.digits(3)} ${rng.digits(4)}`,
      email: email(rng, given, family.replace(/^Al-/, '')),
      identity: [
        { label: 'National ID (رقم الهوية)', value: nationalId },
        { label: 'Date of birth (Hijri)', value: hijriDate(dob.iso) },
      ],
      bank: {
        bankName: bank.name,
        bankNameNative: bank.ar,
        bic: bank.bic,
        currency: 'SAR',
        domestic: [
          { label: 'IBAN (used for domestic transfers)', value: formatIban(iban), check: 'ISO 13616 mod 97' },
          { label: 'Account number', value: account },
        ],
        international: [
          { label: 'IBAN', value: formatIban(iban), check: 'ISO 13616 mod 97' },
          { label: 'BIC / SWIFT', value: bank.bic },
        ],
      },
    };
  },
};
