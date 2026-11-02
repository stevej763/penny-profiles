import { describe, expect, it } from 'vitest';
import { surnameFor, GR_GIVEN, GR_FAMILY, UA_GIVEN, UA_FAMILY, BY_GIVEN, BY_FAMILY, IL_GIVEN, IL_FAMILY, KR_GIVEN, KR_FAMILY, AR_GIVEN, AE_FAMILY, SA_FAMILY } from '../src/countries/names';
import { CN_GIVEN, CN_SURNAMES, IR_FAMILY, IR_GIVEN, JP_FAMILY, JP_GIVEN, NAMES, RU_FAMILY, RU_GIVEN, RU_PATRONYMIC } from '../src/countries/names';

const dupes = (xs: string[]) => xs.filter((x, i) => xs.indexOf(x) !== i);

describe.each(Object.keys(NAMES))('%s name pool', (code) => {
  const pool = NAMES[code];
  it('is large enough to avoid repeats', () => {
    expect(pool.male.length).toBeGreaterThanOrEqual(30);
    expect(pool.female.length).toBeGreaterThanOrEqual(30);
    expect(pool.family.length).toBeGreaterThanOrEqual(40);
  });
  it('has no duplicates', () => {
    expect(dupes(pool.male)).toEqual([]);
    expect(dupes(pool.female)).toEqual([]);
    expect(dupes(pool.family)).toEqual([]);
  });
  it('uses single-word given names', () => {
    for (const n of [...pool.male, ...pool.female]) expect(n).toMatch(/^\p{L}+$/u);
  });
});

describe('native-script pools', () => {
  it('pairs native and Latin forms', () => {
    for (const [native, latin] of [...CN_SURNAMES, ...CN_GIVEN.male, ...CN_GIVEN.female]) {
      expect(native).toMatch(/^\p{Script=Han}+$/u);
      expect(latin).toMatch(/^[A-Z][a-z]+$/);
    }
    for (const [native, latin] of [...RU_GIVEN.male, ...RU_GIVEN.female]) {
      expect(native).toMatch(/^\p{Script=Cyrillic}+$/u);
      expect(latin).toMatch(/^[A-Z][a-z]+$/);
    }
    for (const [native, latin] of [...IR_GIVEN.male, ...IR_GIVEN.female, ...IR_FAMILY]) {
      expect(native).toMatch(/^\p{Script=Arabic}+$/u);
      expect(latin).toMatch(/^[A-Z][a-z]+$/);
    }
  });

  it('gives every Japanese name kanji/kana, romaji and katakana', () => {
    for (const [kanji, romaji, kana] of [...JP_FAMILY, ...JP_GIVEN.male, ...JP_GIVEN.female]) {
      expect(kanji).toMatch(/^[\p{Script=Han}\p{Script=Hiragana}々]+$/u);
      expect(romaji).toMatch(/^[A-Z][a-z]+$/);
      expect(kana).toMatch(/^[\p{Script=Katakana}ー]+$/u);
    }
  });

  it('forms Russian female surnames and patronymics correctly', () => {
    for (const [m, f, lm, lf] of RU_FAMILY) {
      expect(m).toMatch(/(ов|ев|ёв|ин)$/);
      expect(f).toBe(`${m}а`);
      expect(lf).toBe(`${lm}a`);
    }
    for (const [m, f, lm, lf] of RU_PATRONYMIC) {
      expect(m).toMatch(/ич$/);
      expect(f).toMatch(/на$/);
      expect(lm).toMatch(/ich$/);
      expect(lf).toMatch(/na$/);
    }
  });

  it('has no duplicate native names', () => {
    for (const pool of [CN_SURNAMES, CN_GIVEN.male, CN_GIVEN.female, RU_GIVEN.male, RU_GIVEN.female, IR_GIVEN.male, IR_GIVEN.female, IR_FAMILY]) {
      expect(dupes(pool.map(([n]) => n))).toEqual([]);
    }
    for (const pool of [JP_FAMILY, JP_GIVEN.male, JP_GIVEN.female]) expect(dupes(pool.map(([n]) => n))).toEqual([]);
  });
});

describe('surnameFor', () => {
  it('picks the gendered form', () => {
    expect(surnameFor('Kowalski/Kowalska', 'male')).toBe('Kowalski');
    expect(surnameFor('Kowalski/Kowalska', 'female')).toBe('Kowalska');
    expect(surnameFor('Nowak', 'female')).toBe('Nowak');
  });
});

describe('batch 3 native pools', () => {
  const check = (pool: [string, string][], script: RegExp, latin: RegExp) => {
    for (const [native, lat] of pool) {
      for (const n of native.split('/')) expect(n, native).toMatch(script);
      for (const l of lat.split('/')) expect(l, lat).toMatch(latin);
      expect(native.includes('/')).toBe(lat.includes('/'));
    }
  };
  it('Greek', () => check([...GR_GIVEN.male, ...GR_GIVEN.female, ...GR_FAMILY], /^\p{Script=Greek}+$/u, /^[A-Z][a-z]+$/));
  it('Ukrainian', () => check([...UA_GIVEN.male, ...UA_GIVEN.female, ...UA_FAMILY], /^\p{Script=Cyrillic}+$/u, /^[A-Z][a-z]+$/));
  it('Belarusian', () => check([...BY_GIVEN.male, ...BY_GIVEN.female, ...BY_FAMILY], /^\p{Script=Cyrillic}+$/u, /^[A-Z][a-z]+$/));
  it('Hebrew', () => check([...IL_GIVEN.male, ...IL_GIVEN.female, ...IL_FAMILY], /^[\p{Script=Hebrew}־]+$/u, /^[A-Z][a-z]+(-[A-Z][a-z]+)?$/));
  it('Arabic', () => check([...AR_GIVEN.male, ...AR_GIVEN.female, ...AE_FAMILY, ...SA_FAMILY], /^\p{Script=Arabic}+$/u, /^[A-Z][a-z]+(-[A-Z][a-z]+)?$/));
  it('Korean', () => check([...KR_GIVEN.male, ...KR_GIVEN.female, ...KR_FAMILY], /^\p{Script=Hangul}+$/u, /^[A-Z][a-z]+(-[a-z]+)?$/));
});
