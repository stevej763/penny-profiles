import type { Field, Persona } from './types';

/** Letters that Unicode decomposition (NFD) can't reduce to a base letter plus accent. */
const FOLD: Record<string, string> = {
  ß: 'ss', ẞ: 'SS', æ: 'ae', Æ: 'AE', œ: 'oe', Œ: 'OE', ø: 'o', Ø: 'O', ł: 'l', Ł: 'L', đ: 'd', Đ: 'D',
  ð: 'd', Ð: 'D', þ: 'th', Þ: 'Th', ı: 'i', ħ: 'h', Ħ: 'H',
};

/**
 * Reduce accented and special Latin letters to plain A–Z: "Łukasz" → "Lukasz", "Işık" → "Isik",
 * "Đurđević" → "Durdevic". Characters from other scripts pass through untouched.
 */
export function foldToLatin(value: string): string {
  return value
    .replace(/[ßẞæÆœŒøØłŁđĐðÐþÞıħĦ]/g, (c) => FOLD[c])
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .normalize('NFC');
}

/** Any character outside the Latin script (punctuation, digits and emoji count as "Common"). */
export const NON_LATIN = /[^\p{Script=Latin}\p{Script=Common}\p{Script=Inherited}]/u;

/** Drop parenthesised native-script glosses from labels: "Branch (支店)" → "Branch". */
const stripGloss = (label: string) => label.replace(/\s*\(([^)]*)\)/g, (m, inner: string) => (NON_LATIN.test(inner) ? '' : m));

function latinFields(fields: Field[] | undefined): Field[] | undefined {
  if (!fields) return undefined;
  return fields
    .filter((f) => f.latin !== null)
    .map(({ latin, ...f }) => ({ ...f, label: stripGloss(f.label), value: latin ?? f.value }));
}

/**
 * Return a copy of the persona with every non-Latin detail replaced by its Latin form.
 * Native-only fields (native name, native address, native bank name) are removed, because
 * their Latin equivalents are already part of the persona.
 */
export function latinise(p: Persona): Persona {
  const { native: _name, accountHolderLatin, ...name } = p.name;
  const { native: _address, ...address } = p.address;
  const { bankNameNative: _bank, ...bank } = p.bank;
  return {
    ...p,
    name: { ...name, accountHolder: accountHolderLatin ?? name.accountHolder, parts: latinFields(name.parts) },
    address,
    identity: latinFields(p.identity)!,
    bank: {
      ...bank,
      domestic: latinFields(bank.domestic)!,
      international: latinFields(bank.international)!,
      extras: latinFields(bank.extras),
    },
  };
}
