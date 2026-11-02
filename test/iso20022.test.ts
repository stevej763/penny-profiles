import { describe, expect, it } from 'vitest';
import { CBPR_TEXT, POSTAL_ADDRESS_FIELDS, postalAddress, postalAddressXml, toCbprText } from '../src/core/iso20022';
import { COUNTRIES, generatePersona } from '../src/countries';

describe('CBPR+ transliteration', () => {
  it('strips diacritics and expands ligatures', () => {
    expect(toCbprText('Müllerstraße')).toBe('Mullerstrasse');
    expect(toCbprText("Rue de l'Église")).toBe("Rue de l'Eglise");
    expect(toCbprText('São Paulo')).toBe('Sao Paulo');
    expect(toCbprText('3º B')).toBe('3 B');
  });

  it('folds letters that Unicode decomposition misses', () => {
    expect(toCbprText('Łukasz Wójcik')).toBe('Lukasz Wojcik');
    expect(toCbprText('Işık Öztürk')).toBe('Isik Ozturk');
    expect(toCbprText('İstanbul')).toBe('Istanbul');
    expect(toCbprText('Đurđević')).toBe('Durdevic');
    expect(toCbprText('Þórður')).toBe('Thordur');
  });

  it('drops characters outside the set', () => {
    expect(toCbprText('ул. Ленина 12')).toBe('. 12');
    expect(CBPR_TEXT.test(toCbprText('東京都 Tokyo'))).toBe(true);
  });
});

describe('postalAddress', () => {
  it('orders elements as in the XSD and omits empty ones', () => {
    const a = postalAddress({ Ctry: 'GB', TwnNm: 'London', PstCd: 'E1 6AN', StrtNm: 'High Street', BldgNb: 12, Room: undefined });
    expect(Object.keys(a)).toEqual(['StrtNm', 'BldgNb', 'PstCd', 'TwnNm', 'Ctry']);
  });

  it('rejects values longer than the schema allows', () => {
    expect(() => postalAddress({ Ctry: 'GB', TwnNm: 'x'.repeat(36) })).toThrow(/TwnNm/);
  });

  it('serialises escaped XML', () => {
    const xml = postalAddressXml(postalAddress({ Ctry: 'IE', TwnNm: 'Dublin', StrtNm: "O'Connell Street" }));
    expect(xml).toBe("<PstlAdr>\n  <StrtNm>O&apos;Connell Street</StrtNm>\n  <TwnNm>Dublin</TwnNm>\n  <Ctry>IE</Ctry>\n</PstlAdr>");
  });
});

// null: the country has no postcodes (UAE), so a PO box is required instead.
const POSTCODE: Record<string, RegExp | null> = {
  AE: null,
  GB: /^[A-Z]{1,2}\d[A-Z\d]? \d[A-Z]{2}$/,
  DE: /^\d{5}$/, FR: /^\d{5}$/, ES: /^\d{5}$/, IT: /^\d{5}$/, FI: /^\d{5}$/, MX: /^\d{5}$/, US: /^\d{5}$/,
  NL: /^\d{4} [A-Z]{2}$/,
  IE: /^[AC-FHKNPRTV-Y]\d{2} [0-9AC-FHKNPRTV-Y]{4}$/,
  BE: /^\d{4}$/, AT: /^\d{4}$/, AU: /^\d{4}$/, NZ: /^\d{4}$/,
  PT: /^\d{4}-\d{3}$/, BR: /^\d{5}-\d{3}$/, JP: /^\d{3}-\d{4}$/,
  CN: /^\d{6}$/, IN: /^\d{6}$/, RU: /^\d{6}$/, IR: /^\d{5}-\d{5}$/,
  CA: /^[ABCEGHJ-NPRSTVXY]\d[ABCEGHJ-NPRSTV-Z] \d[ABCEGHJ-NPRSTV-Z]\d$/,
  SA: /^\d{5}$/, PK: /^\d{5}$/, PH: /^\d{4}$/, NG: /^\d{6}$/, VE: /^\d{4}$/,
  GR: /^\d{3} \d{2}$/, UA: /^\d{5}$/, BY: /^\d{6}$/, IL: /^\d{7}$/, KR: /^\d{5}$/,
  HR: /^\d{5}$/, EE: /^\d{5}$/, TR: /^\d{5}$/, LU: /^L-\d{4}$/, SK: /^\d{3} \d{2}$/,
  CH: /^\d{4}$/, NO: /^\d{4}$/, PL: /^\d{2}-\d{3}$/, SE: /^\d{3} \d{2}$/,
};

describe.each(COUNTRIES.map((c) => c.code))('%s structured address', (code) => {
  const personas = Array.from({ length: 250 }, (_, i) => generatePersona(code, {}, 5000 + i));
  const order = POSTAL_ADDRESS_FIELDS.map((f) => f.tag);

  it('is fully structured, schema-valid and in the CBPR+ character set', () => {
    for (const { address } of personas) {
      const s = address.structured;
      expect(s.Ctry).toBe(code);
      expect(s.TwnNm).toBeTruthy();
      expect(s.StrtNm ?? s.BldgNb ?? s.BldgNm).toBeTruthy();
      const keys = Object.keys(s);
      expect(keys).toEqual(order.filter((t) => keys.includes(t)));
      for (const { tag, max } of POSTAL_ADDRESS_FIELDS) {
        const v = s[tag];
        if (v === undefined) continue;
        expect(v.length, `${tag}=${v}`).toBeLessThanOrEqual(max);
        expect(v, tag).toMatch(CBPR_TEXT);
      }
    }
  });

  it('has a correctly formatted post code (or a PO box where there are no postcodes)', () => {
    const format = POSTCODE[code];
    expect(format).toBeDefined();
    for (const { address } of personas) {
      if (format === null) {
        expect(address.structured.PstCd).toBeUndefined();
        expect(address.structured.PstBx).toMatch(/^\d+$/);
      } else expect(address.structured.PstCd).toMatch(format);
    }
  });

  it('matches the human-readable address', () => {
    for (const { address } of personas) {
      const text = toCbprText(address.lines.join(' ')).toLowerCase();
      for (const tag of ['StrtNm', 'BldgNb', 'BldgNm', 'PstCd', 'PstBx', 'TwnNm', 'TwnLctnNm', 'DstrctNm', 'Room'] as const) {
        const v = address.structured[tag];
        if (v) expect(text, `${tag}=${v}`).toContain(v.toLowerCase());
      }
    }
  });
});
