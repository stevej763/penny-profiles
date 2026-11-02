import { COUNTRIES, generatePersona } from './countries';
import type { Field, GenerateOptions, Persona } from './core/types';
import { randomSeed } from './core/rng';
import { download, toCsv } from './export';
import { latinise } from './core/latin';
import { POSTAL_ADDRESS_FIELDS, postalAddressXml } from './core/iso20022';

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const form = $<HTMLFormElement>('controls');
const countrySelect = $<HTMLSelectElement>('country');
const genderSelect = $<HTMLSelectElement>('gender');
const minAgeInput = $<HTMLInputElement>('minAge');
const maxAgeInput = $<HTMLInputElement>('maxAge');
const seedInput = $<HTMLInputElement>('seed');
const personaEl = $<HTMLElement>('persona');
const historyEl = $<HTMLOListElement>('history');
const toastEl = $<HTMLDivElement>('toast');
const latinOnlyInput = $<HTMLInputElement>('latinOnly');

const HISTORY_KEY = 'penny-profiles.history';
const ADDRESS_VIEW_KEY = 'penny-profiles.addressView';
type AddressView = 'formatted' | 'iso';
let addressView: AddressView = localStorage.getItem(ADDRESS_VIEW_KEY) === 'iso' ? 'iso' : 'formatted';
const LATIN_KEY = 'penny-profiles.latinOnly';
latinOnlyInput.checked = localStorage.getItem(LATIN_KEY) === 'true';
let current: Persona | undefined;

/** The persona as it should be shown and exported, honouring the Latin-only toggle. */
const view = (p: Persona) => (latinOnlyInput.checked ? latinise(p) : p);
let history: { code: string; seed: number; name: string; flag: string }[] = JSON.parse(localStorage.getItem(HISTORY_KEY) ?? '[]');

// ---------------------------------------------------------------- country picker

for (const group of [...new Set(COUNTRIES.map((c) => c.group))]) {
  const optgroup = document.createElement('optgroup');
  optgroup.label = group;
  for (const c of COUNTRIES.filter((x) => x.group === group)) {
    optgroup.append(new Option(`${c.flag}  ${c.name} (${c.currency})`, c.code));
  }
  countrySelect.append(optgroup);
}

function options(): GenerateOptions {
  return {
    gender: genderSelect.value as GenerateOptions['gender'],
    minAge: Number(minAgeInput.value) || 18,
    maxAge: Number(maxAgeInput.value) || 80,
  };
}

// ---------------------------------------------------------------- rendering

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

function fieldRow(f: Field, mono = true): string {
  const copyable = !f.value.startsWith('Not used');
  return `
    <div class="field">
      <dt>${esc(f.label)}</dt>
      <dd>
        <span dir="auto" class="${mono && copyable ? 'mono' : 'muted'}">${esc(f.value)}</span>
        ${f.check ? `<span class="check" title="Passes: ${esc(f.check)}">✓ ${esc(f.check)}</span>` : ''}
        ${copyable ? `<button class="copy" data-copy="${esc(f.value)}" title="Copy">Copy</button>` : ''}
      </dd>
    </div>`;
}

function section(title: string, fields: Field[], mono = true): string {
  if (!fields.length) return '';
  return `<section class="card"><h3>${title}</h3><dl>${fields.map((f) => fieldRow(f, mono)).join('')}</dl></section>`;
}

function render(p: Persona): void {
  const gender = p.gender === 'male' ? 'Male' : 'Female';
  const personal: Field[] = [
    { label: 'Full name', value: p.name.full },
    ...(p.name.native ? [{ label: 'Native script', value: p.name.native }] : []),
    ...(p.name.parts ?? []),
    { label: 'Date of birth', value: `${p.dateOfBirth} (age ${p.age})` },
    { label: 'Gender', value: gender },
    { label: 'Nationality', value: p.nationality },
    { label: 'Phone', value: p.phone },
    { label: 'Email', value: p.email },
  ];
  const formatted = [...p.address.lines, p.country.name].join('\n');
  const iso = POSTAL_ADDRESS_FIELDS.filter(({ tag }) => p.address.structured[tag]);

  personaEl.innerHTML = `
    <div class="persona-head">
      <div class="flag">${p.country.flag}</div>
      <div>
        <h2>${esc(p.name.full)}</h2>
        ${p.name.native ? `<p class="native">${esc(p.name.native)}</p>` : ''}
        <p class="meta">${esc(p.country.name)} · ${p.age} · ${gender} · ${esc(p.bank.bankName)} (${p.bank.currency})</p>
      </div>
      <div class="head-actions">
        <span class="seed" title="Re-enter this seed to regenerate the same persona">seed ${p.seed}</span>
        <button class="copy" data-copy-json>Copy JSON</button>
      </div>
    </div>
    ${p.notes?.length ? `<div class="notes">${p.notes.map((n) => `<p>${esc(n)}</p>`).join('')}</div>` : ''}
    <div class="grid">
      <div class="col">
        ${section('Personal', personal, false)}
        <section class="card address" data-view="${addressView}">
          <div class="card-head">
            <h3>Address</h3>
            <div class="toggle" role="group" aria-label="Address format">
              <button data-address-view="formatted" aria-pressed="${addressView === 'formatted'}">Formatted</button>
              <button data-address-view="iso" aria-pressed="${addressView === 'iso'}" title="ISO 20022 PostalAddress24, CBPR+ character set">ISO 20022</button>
            </div>
          </div>
          <div class="view-formatted">
            <p class="address-lines" dir="auto">${esc(formatted)}</p>
            ${p.address.native ? `<p class="address-lines native-lines" dir="auto">${esc(p.address.native.join('\n'))}</p>` : ''}
            <button class="copy" data-copy="${esc(formatted)}">Copy address</button>
          </div>
          <div class="view-iso">
            <dl class="kv">${iso.map(({ tag, name }) => `<dt title="${name}">${tag}</dt><dd>${esc(p.address.structured[tag]!)}</dd>`).join('')}</dl>
            <button class="copy" data-copy-xml>Copy XML</button>
          </div>
        </section>
        ${section('Identity documents', p.identity)}
      </div>
      <div class="col">
        <section class="card bank">
          <h3>${esc(p.bank.bankName)}${p.bank.bankNameNative ? ` <span class="native">${esc(p.bank.bankNameNative)}</span>` : ''}</h3>
          <dl>${fieldRow({ label: 'Account holder', value: p.name.accountHolder }, false)}</dl>
        </section>
        ${section('Domestic payments', p.bank.domestic)}
        ${section('International payments', p.bank.international)}
        ${section('Cards & aliases', p.bank.extras ?? [])}
      </div>
    </div>`;

  personaEl.querySelector<HTMLButtonElement>('[data-copy-json]')!.dataset.copy = JSON.stringify(p, null, 2);
  personaEl.querySelector<HTMLButtonElement>('[data-copy-xml]')!.dataset.copy = postalAddressXml(p.address.structured);
}

function renderHistory(): void {
  historyEl.innerHTML = history
    .map((h, i) => `<li><button data-history="${i}">${h.flag} ${esc(h.name)}<small>${h.seed}</small></button></li>`)
    .join('');
}

// ---------------------------------------------------------------- actions

function generate(code: string, seed: number): void {
  const persona = generatePersona(code, options(), seed);
  current = persona;
  render(view(persona));
  history = [{ code, seed, name: persona.name.full, flag: persona.country.flag }, ...history.filter((h) => !(h.code === code && h.seed === seed))].slice(0, 25);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  renderHistory();
  window.history.replaceState(null, '', `#${code}-${seed}`);
}

function toast(message: string): void {
  toastEl.textContent = message;
  toastEl.classList.add('show');
  setTimeout(() => toastEl.classList.remove('show'), 1400);
}

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const seed = seedInput.value.trim() ? Number(seedInput.value) >>> 0 : randomSeed();
  seedInput.value = '';
  generate(countrySelect.value, seed);
});

countrySelect.addEventListener('change', () => form.requestSubmit());

document.addEventListener('click', async (e) => {
  const target = e.target as HTMLElement;
  const copyBtn = target.closest<HTMLElement>('[data-copy]');
  if (copyBtn) {
    await navigator.clipboard.writeText(copyBtn.dataset.copy!);
    toast('Copied');
    return;
  }
  const viewBtn = target.closest<HTMLElement>('[data-address-view]');
  if (viewBtn) {
    addressView = viewBtn.dataset.addressView as AddressView;
    localStorage.setItem(ADDRESS_VIEW_KEY, addressView);
    const card = viewBtn.closest<HTMLElement>('.address')!;
    card.dataset.view = addressView;
    card.querySelectorAll<HTMLElement>('[data-address-view]').forEach((b) => b.setAttribute('aria-pressed', String(b === viewBtn)));
    return;
  }
  const historyBtn = target.closest<HTMLElement>('[data-history]');
  if (historyBtn) {
    const h = history[Number(historyBtn.dataset.history)];
    countrySelect.value = h.code;
    generate(h.code, h.seed);
  }
});

function batch(): Persona[] {
  const count = Math.min(5000, Math.max(1, Number($<HTMLInputElement>('batchCount').value) || 1));
  const all = $<HTMLSelectElement>('batchScope').value === 'all';
  return Array.from({ length: count }, (_, i) => {
    const code = all ? COUNTRIES[i % COUNTRIES.length].code : countrySelect.value;
    return view(generatePersona(code, options(), randomSeed()));
  });
}

latinOnlyInput.addEventListener('change', () => {
  localStorage.setItem(LATIN_KEY, String(latinOnlyInput.checked));
  if (current) render(view(current));
});

$('exportCsv').addEventListener('click', () => download(`personas-${Date.now()}.csv`, toCsv(batch()), 'text/csv'));
$('exportJson').addEventListener('click', () => download(`personas-${Date.now()}.json`, JSON.stringify(batch(), null, 2), 'application/json'));

// ---------------------------------------------------------------- start-up

const [hashCode, hashSeed] = location.hash.slice(1).split('-');
if (hashCode && COUNTRIES.some((c) => c.code === hashCode) && hashSeed) {
  countrySelect.value = hashCode;
  generate(hashCode, Number(hashSeed) >>> 0);
} else {
  countrySelect.value = 'GB';
  generate('GB', randomSeed());
}
