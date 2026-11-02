import type { Field, Persona } from './core/types';
import { POSTAL_ADDRESS_FIELDS } from './core/iso20022';

/** Flatten a persona into one CSV-friendly record. Field labels become column names. */
export function flatten(p: Persona): Record<string, string> {
  const row: Record<string, string> = {
    seed: String(p.seed),
    country: p.country.code,
    full_name: p.name.full,
    given_name: p.name.given,
    family_name: p.name.family,
    native_name: p.name.native ?? '',
    account_holder: p.name.accountHolder,
    gender: p.gender,
    date_of_birth: p.dateOfBirth,
    nationality: p.nationality,
    address: p.address.lines.join(', '),
    address_native: p.address.native?.join(', ') ?? '',
    // Every PostalAddress24 element gets a column, so rows line up across countries.
    ...Object.fromEntries(POSTAL_ADDRESS_FIELDS.map(({ tag }) => [`PstlAdr.${tag}`, p.address.structured[tag] ?? ''])),
    phone: p.phone,
    email: p.email,
    bank_name: p.bank.bankName,
    bic: p.bank.bic,
    currency: p.bank.currency,
  };
  const add = (prefix: string, fields: Field[] = []) => {
    for (const f of fields) {
      if (f.value.startsWith('Not used')) continue;
      row[`${prefix}${f.label}`] = f.value;
    }
  };
  add('id: ', p.identity);
  add('domestic: ', p.bank.domestic);
  add('intl: ', p.bank.international);
  add('extra: ', p.bank.extras);
  return row;
}

export function toCsv(personas: Persona[]): string {
  const rows = personas.map(flatten);
  const columns = [...new Set(rows.flatMap((r) => Object.keys(r)))];
  const cell = (v = '') => (/[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
  return [columns.map(cell).join(','), ...rows.map((r) => columns.map((c) => cell(r[c])).join(','))].join('\n');
}

export function download(filename: string, content: string, type: string): void {
  // Prefix CSV with a BOM so Excel opens non-Latin scripts correctly.
  const blob = new Blob([type === 'text/csv' ? '﻿' + content : content], { type: `${type};charset=utf-8` });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}
