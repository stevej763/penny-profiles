/**
 * ISO 20022 structured postal address (PostalAddress24, as used by pacs.008.001.08 under
 * SWIFT CBPR+ and by SEPA). CBPR+ is retiring fully unstructured addresses (November 2026),
 * so every persona carries a fully structured one, with no AdrLine elements.
 */

export interface PostalAddress {
  Dept?: string;
  SubDept?: string;
  StrtNm?: string;
  BldgNb?: string;
  BldgNm?: string;
  Flr?: string;
  PstBx?: string;
  Room?: string;
  PstCd?: string;
  /** Mandatory under CBPR+. */
  TwnNm: string;
  TwnLctnNm?: string;
  DstrctNm?: string;
  CtrySubDvsn?: string;
  /** ISO 3166-1 alpha-2, mandatory under CBPR+. */
  Ctry: string;
}

export type PostalAddressField = keyof PostalAddress;

/** Schema order and maximum lengths from the PostalAddress24 XSD. */
export const POSTAL_ADDRESS_FIELDS: readonly { tag: PostalAddressField; name: string; max: number }[] = [
  { tag: 'Dept', name: 'Department', max: 70 },
  { tag: 'SubDept', name: 'Sub-department', max: 70 },
  { tag: 'StrtNm', name: 'Street name', max: 70 },
  { tag: 'BldgNb', name: 'Building number', max: 16 },
  { tag: 'BldgNm', name: 'Building name', max: 35 },
  { tag: 'Flr', name: 'Floor', max: 70 },
  { tag: 'PstBx', name: 'Post box', max: 16 },
  { tag: 'Room', name: 'Room', max: 70 },
  { tag: 'PstCd', name: 'Post code', max: 16 },
  { tag: 'TwnNm', name: 'Town name', max: 35 },
  { tag: 'TwnLctnNm', name: 'Town location name', max: 35 },
  { tag: 'DstrctNm', name: 'District name', max: 35 },
  { tag: 'CtrySubDvsn', name: 'Country sub-division', max: 35 },
  { tag: 'Ctry', name: 'Country', max: 2 },
];

/** CBPR+ restricted character set (Latin letters, digits and a fixed set of punctuation). */
export const CBPR_TEXT = /^[0-9a-zA-Z/\-?:().,'+ !#$%&*=^_`{|}~";<>@[\\\]]+$/;

/** Transliterate to the CBPR+ character set: strip diacritics, expand ß/æ/ø, drop anything else. */
export function toCbprText(value: string): string {
  return value
    .replace(/ß/g, 'ss')
    .replace(/[Ææ]/g, (c) => (c === 'Æ' ? 'AE' : 'ae'))
    .replace(/[Øø]/g, (c) => (c === 'Ø' ? 'O' : 'o'))
    .replace(/[º°]/g, '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^0-9a-zA-Z/\-?:().,'+ !#$%&*=^_`{|}~";<>@[\\\]]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export type PostalAddressParts = Partial<Record<PostalAddressField, string | number | undefined>>;
type PostalAddressInput = PostalAddressParts & { TwnNm: string; Ctry: string };

/**
 * Build a structured address: transliterates every value, drops empty elements and returns
 * the keys in schema order. Throws if a value exceeds its schema length. That means a
 * generator bug, not something to silently truncate.
 */
export function postalAddress(input: PostalAddressInput): PostalAddress {
  const out: Partial<PostalAddress> = {};
  for (const { tag, max } of POSTAL_ADDRESS_FIELDS) {
    const raw = input[tag];
    if (raw === undefined || raw === '') continue;
    const value = toCbprText(String(raw));
    if (!value) continue;
    if (value.length > max) throw new Error(`ISO 20022 ${tag} exceeds ${max} chars: "${value}"`);
    out[tag] = value;
  }
  return out as PostalAddress;
}

const xmlEscape = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' })[c]!);

export function postalAddressXml(address: PostalAddress, indent = '  '): string {
  const body = POSTAL_ADDRESS_FIELDS.filter(({ tag }) => address[tag])
    .map(({ tag }) => `${indent}<${tag}>${xmlEscape(address[tag]!)}</${tag}>`)
    .join('\n');
  return `<PstlAdr>\n${body}\n</PstlAdr>`;
}
