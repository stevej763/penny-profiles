// Published / widely-cited examples, so the algorithms are checked against something other than themselves.
import { describe, expect, it } from 'vitest';
import { luhnValid, verhoeffValid } from '../src/core/checks';
import { isValidIbanChecksum } from '../src/core/iban';
import { deMethod63Valid, elfproef, esControlDigit, italianCheckChar, nibCheck, ribKey, steuerIdCheckDigit } from '../src/countries/eurozone';
import { cnIdCheck, irdValid, myNumberCheck, nzAccountValid, tfnValid } from '../src/countries/asia-pacific';
import { innPersonalValid, iranNationalCodeValid, ruAccountValid, ruCorrespondentValid, snilsCheck } from '../src/countries/russia-iran';
import { abaValid, clabeCheck, cpfValid, rfcCheck } from '../src/countries/americas';
import { mod97 } from '../src/core/checks';

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
