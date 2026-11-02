import { describe, expect, it } from 'vitest';
import { COUNTRIES, generatePersona } from '../src/countries';
import { NON_LATIN, latinise } from '../src/core/latin';

// A country "uses native script" if any generated persona contains non-Latin text.
const NATIVE_SCRIPT = new Set(
  COUNTRIES.filter((c) => Array.from({ length: 20 }, (_, i) => generatePersona(c.code, {}, i)).some((p) => NON_LATIN.test(JSON.stringify(p)))).map((c) => c.code),
);

describe.each(COUNTRIES.map((c) => c.code))('%s latinise', (code) => {
  const personas = Array.from({ length: 250 }, (_, i) => generatePersona(code, {}, 9000 + i));

  it('leaves no non-Latin characters anywhere in the persona', () => {
    for (const p of personas) {
      const json = JSON.stringify(latinise(p));
      expect(json.match(NON_LATIN)?.[0], json).toBeUndefined();
    }
  });

  it(NATIVE_SCRIPT.has(code) ? 'has native-script details' : 'changes nothing for Latin-script countries', () => {
    if (!NATIVE_SCRIPT.has(code)) for (const p of personas) expect(latinise(p)).toEqual(p);
  });
});

describe('latinise details', () => {
  it('uses curated romanisations, not generic transliteration', () => {
    const original = generatePersona('JP', {}, 777);
    const p = latinise(original);
    expect(original.name.accountHolder).toMatch(/^[\p{Script=Katakana}ー ]+$/u);
    expect(p.name.accountHolder).toBe(`${original.name.family} ${original.name.given}`.toUpperCase());
    expect(p.name.native).toBeUndefined();
    expect(p.address.native).toBeUndefined();
    expect(p.bank.bankNameNative).toBeUndefined();
    expect(p.name.parts?.map((f) => f.label)).toEqual(['Name order']);
    expect(p.bank.domestic.find((f) => f.label === 'Account type')?.value).toBe('Futsu (Ordinary)');
  });

  it('strips native glosses from labels but keeps Latin ones', () => {
    const p = latinise(generatePersona('IR', {}, 1));
    const labels = [...p.identity, ...p.bank.domestic].map((f) => f.label);
    expect(labels).toContain('National code');
    expect(labels).toContain('Sheba');
    expect(latinise(generatePersona('IN', {}, 1)).bank.international.map((f) => f.label)).toContain('IFSC (often requested)');
  });
});

it('detects every native-script country', () => {
  expect([...NATIVE_SCRIPT].sort()).toEqual(['AE', 'BY', 'CN', 'GR', 'IL', 'IR', 'JP', 'KR', 'RU', 'SA', 'UA']);
});
