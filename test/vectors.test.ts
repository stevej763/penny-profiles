// Published / widely-cited examples, so the algorithms are checked against something other than themselves.
import { describe, expect, it } from 'vitest';
import { luhnValid, verhoeffValid } from '../src/core/checks';
import { isValidIbanChecksum } from '../src/core/iban';
import { deMethod63Valid, elfproef, esControlDigit, italianCheckChar, nibCheck, ribKey, steuerIdCheckDigit } from '../src/countries/eurozone';
import { cnIdCheck, irdValid, myNumberCheck, nzAccountValid, tfnValid } from '../src/countries/asia-pacific';
import { innPersonalValid, iranNationalCodeValid, ruAccountValid, ruCorrespondentValid, snilsCheck } from '../src/countries/russia-iran';
import { abaValid, clabeCheck, cpfValid, rfcCheck } from '../src/countries/americas';
import { mod97 } from '../src/core/checks';
import { ean13Check } from '../src/countries/ch';
import { peselCheck, plSortCodeCheck } from '../src/countries/pl';
import { fodselsnummerChecks, noAccountCheck } from '../src/countries/no';
import { seType1Valid } from '../src/countries/se';
import { iso7064Mod1110 } from '../src/core/checks';
import { isikukoodCheck } from '../src/countries/ee';
import { skAccountValid } from '../src/countries/sk';
import { tcKimlikChecks } from '../src/countries/tr';
import { afmCheck } from '../src/countries/gr';
import { rnokppCheck } from '../src/countries/ua';
import { rrnCheck } from '../src/countries/kr';
import { nubanCheck } from '../src/countries/ng';
import { rifCheck } from '../src/countries/ve';
import { hijriDate } from '../src/countries/sa';

describe('shared algorithms', () => {
  it('Luhn', () => expect(luhnValid('79927398713')).toBe(true));
  it('Verhoeff', () => expect(verhoeffValid('2363')).toBe(true));
  it('IBAN mod 97', () => expect(isValidIbanChecksum('GB82 WEST 1234 5698 7654 32')).toBe(true));
});

describe('eurozone national checks', () => {
  it('FR RIB key', () => expect(ribKey('30006', '00001', '12345678901')).toBe('89'));
  it('ES CCC control digits', () => expect(esControlDigit('00' + '2100' + '0418') + esControlDigit('0200051332')).toBe('45'));
  it('IT CIN', () => expect(italianCheckChar('0542811101000000123456')).toBe('X'));
  it('IT codice fiscale check', () => expect(italianCheckChar('RSSMRA85T10A562')).toBe('S'));
  it('BE account check', () => expect(5390075470 % 97).toBe(34));
  it('PT NIB check', () => expect(nibCheck('0002012312345678901')).toBe('54'));
  it('FI account Luhn', () => expect(luhnValid('12345600000785')).toBe(true));
  it('DE method 63', () => expect(deMethod63Valid('0123456600')).toBe(true));
  it('DE Steuer-ID', () => expect(steuerIdCheckDigit('8609574271')).toBe(9));
  it('NL BSN elfproef', () => expect(elfproef('111222333', true)).toBe(true));
  it('BE national register', () => expect(97 - (930518223 % 97)).toBe(61));
});

describe('other national checks', () => {
  it('CN resident ID', () => expect(cnIdCheck('11010519491231002')).toBe('X'));
  it('NZ account algorithm A', () => expect(nzAccountValid('01', '0902', '0068389', '00')).toBe(true));
  it('NZ IRD', () => ['49091850', '35901981', '49098576', '136410132'].forEach((n) => expect(irdValid(n)).toBe(true)));
  it('AU TFN', () => expect(tfnValid('123456782')).toBe(true));
  it('JP My Number', () => expect(myNumberCheck('12345678901')).toBe(8));
  it('RU INN', () => expect(innPersonalValid('500100732259')).toBe(true));
  it('RU SNILS', () => expect(snilsCheck('112233445')).toBe('95'));
  it('RU correspondent accounts', () => {
    expect(ruCorrespondentValid('044525225', '30101810400000000225')).toBe(true);
    expect(ruCorrespondentValid('044525187', '30101810700000000187')).toBe(true);
    expect(ruCorrespondentValid('044525593', '30101810200000000593')).toBe(true);
    expect(ruCorrespondentValid('044525974', '30101810145250000974')).toBe(true);
  });
  it('RU account key detects a changed digit', () => {
    const valid = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']
      .map((k) => `40817810${k}38000000001`)
      .filter((a) => ruAccountValid('044525225', a));
    expect(valid).toHaveLength(1);
    expect(ruAccountValid('044525225', valid[0].slice(0, -1) + '2')).toBe(false);
  });
  it('IR national code', () => expect(iranNationalCodeValid('0499370899')).toBe(true));
  it('US ABA routing', () => ['021000021', '026009593', '121000248', '021000089'].forEach((r) => expect(abaValid(r)).toBe(true)));
  it('MX CLABE', () => expect(clabeCheck('00201007777777777')).toBe('1'));
  it('MX RFC', () => expect(rfcCheck('GODE561231GR')).toBe('8'));
  it('BR CPF', () => expect(cpfValid('529.982.247-25')).toBe(true));
  it('mod97 on long input', () => expect(mod97('3214282912345698765432161182')).toBe(1));
});

describe('batch 1 national checks', () => {
  it('CA SIN (Luhn)', () => expect(luhnValid('046454286')).toBe(true));
  it('CH AHV (EAN-13)', () => expect(ean13Check('756123456789')).toBe(7));
  it('PL PESEL', () => expect(peselCheck('4405140135')).toBe(9));
  it('PL sort code', () => expect(plSortCodeCheck('1090101')).toBe(4));
  it('NO fødselsnummer', () => expect(fodselsnummerChecks('151086950')).toBe('88'));
  it('NO account', () => expect(noAccountCheck('8601111794')).toBe(7));
  it('SE personnummer (Luhn)', () => expect(luhnValid('8803200016')).toBe(true));
  it('SE type 1 account (Bankgirot example SE45 5000 0000 0583 9825 7466)', () => {
    expect(seType1Valid('5839', '8257466')).toBe(true);
    expect(isValidIbanChecksum('SE4550000000058398257466')).toBe(true);
  });
});

describe('batch 2 national checks', () => {
  it('HR OIB (ISO 7064 MOD 11,10)', () => expect(iso7064Mod1110('3339200596')).toBe(1));
  it('HR bank code VBDI carries its own check digit', () => {
    for (const vbdi of ['2360000', '2340009', '2402006', '2407000', '2484008']) expect(iso7064Mod1110(vbdi.slice(0, 6))).toBe(Number(vbdi[6]));
  });
  it('EE isikukood', () => expect(isikukoodCheck('3680528010')).toBe(9));
  it('SK account (mod 11, from example IBAN SK31 1200 0000 1987 4263 7541)', () => expect(skAccountValid('8742637541')).toBe(true));
  it('TR T.C. Kimlik', () => expect(tcKimlikChecks('172917160')).toBe('60'));
});

describe('batch 3 national checks (examples from python-stdnum documentation)', () => {
  it('GR AFM', () => expect(afmCheck('09425921')).toBe(6));
  it('GR AMKA (Luhn)', () => expect(luhnValid('01013099997')).toBe(true));
  it('UA RNOKPP', () => expect(rnokppCheck('175901377')).toBe(6));
  it('KR resident registration number', () => expect(rrnCheck('971013901990')).toBe(2));
  it('IL Teudat Zehut (Luhn)', () => expect(luhnValid('039337423')).toBe(true));
});

describe('batch 4 national checks', () => {
  it('NG NUBAN (CBN worked examples)', () => {
    expect(nubanCheck('011', '000001457')).toBe(9);
    expect(nubanCheck('011', '000000022')).toBe(0);
  });
  it('VE RIF (python-stdnum example)', () => expect(rifCheck('11470283')).toBe('4'));
  it('SA Hijri date of birth', () => expect(hijriDate('1985-06-01')).toMatch(/Ramadan 12, 1405 AH/));
});
