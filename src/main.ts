import '@fontsource/atkinson-hyperlegible-next/400.css';
import '@fontsource/atkinson-hyperlegible-next/600.css';
import '@fontsource/atkinson-hyperlegible-next/700.css';
import '@fontsource/atkinson-hyperlegible-mono/400.css';
import '@fontsource/atkinson-hyperlegible-mono/500.css';
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

/** Attributes that make an element copy `value` when clicked (or activated from the keyboard). */
const copyAttrs = (value: string) => `data-copy="${esc(value)}" class="copyable" tabindex="0" role="button" title="Click to copy"`;

/** Identifiers get the mono face; words like "Checking" or a pinyin name stay in the text face. */
const looksLikeCode = (value: string) => /\d/.test(value) || /^[A-Z0-9]{6,}$/.test(value);

function fieldRow(f: Field, mono = true): string {
  const available = !f.value.startsWith('Not used');
  const value = available ? `<span ${copyAttrs(f.value)}>${esc(f.value)}</span>` : esc(f.value);
  return `
    <div class="row-item">
      <dt>${esc(f.label)}</dt>
      <dd>
        <span dir="auto" class="value${mono && available && looksLikeCode(f.value) ? ' id' : ''}${available ? '' : ' unavailable'}">${value}</span>
        ${f.check ? `<span class="verified" title="Passes this check">${esc(f.check)}</span>` : ''}
      </dd>
    </div>`;
}

function ledger(title: string, fields: Field[], mono = true): string {
  if (!fields.length) return '';
  return `<section class="ledger"><h3>${title}</h3><dl>${fields.map((f) => fieldRow(f, mono)).join('')}</dl></section>`;
}

/** E-13B "transit" symbol, the separator printed between routing and account numbers on cheques. */
const TRANSIT = '<svg class="transit" viewBox="0 0 11 16" aria-hidden="true"><rect width="3" height="16"/><rect x="6" y="2" width="5" height="5"/><rect x="6" y="9" width="5" height="5"/></svg>';

/** Domestic identifiers short and code-like enough to sit on a cheque's MICR line. */
function micrLine(p: Persona): string {
  const parts = p.bank.domestic.filter((f) => /^[0-9A-Z][0-9A-Z \-]{0,33}$/.test(f.value));
  return parts.map((f) => `<span class="micr-part">${TRANSIT}<span ${copyAttrs(f.value)} title="${esc(f.label)}: click to copy">${esc(f.value)}</span></span>`).join('');
}

const longDate = (iso: string) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });

function render(p: Persona): void {
  const gender = p.gender === 'male' ? 'Male' : 'Female';
  const personal: Field[] = [
    { label: 'Full name', value: p.name.full },
    ...(p.name.native ? [{ label: 'Native script', value: p.name.native }] : []),
    ...(p.name.parts ?? []),
    { label: 'Date of birth', value: p.dateOfBirth },
    { label: 'Gender', value: gender },
    { label: 'Nationality', value: p.nationality },
    { label: 'Phone', value: p.phone },
    { label: 'Email', value: p.email },
  ];
  const formatted = [...p.address.lines, p.country.name].join('\n');
  const iso = POSTAL_ADDRESS_FIELDS.filter(({ tag }) => p.address.structured[tag]);
  const micr = micrLine(p);

  personaEl.innerHTML = `
    <article class="slip">
      <div class="slip-top">
        <div>
          <h2>${esc(p.name.full)}</h2>
          ${p.name.native ? `<p class="slip-native" dir="auto">${esc(p.name.native)}</p>` : ''}
        </div>
        <div class="slip-actions">
          <span class="seed" title="Enter this seed to regenerate the same persona">Seed <b>${p.seed}</b></span>
          <button data-copy-json>Copy JSON</button>
        </div>
      </div>
      <dl class="slip-facts">
        <div><dt>Country</dt><dd>${esc(p.country.name)}</dd></div>
        <div><dt>Born</dt><dd>${longDate(p.dateOfBirth)}, age ${p.age}</dd></div>
        <div><dt>Banks with</dt><dd>${esc(p.bank.bankName)}</dd></div>
        <div><dt>Currency</dt><dd>${p.bank.currency}</dd></div>
      </dl>
      ${micr ? `<p class="micr" aria-label="Domestic account details">${micr}</p>` : ''}
    </article>
    ${p.notes?.length ? `<div class="notes">${p.notes.map((n) => `<p>${esc(n)}</p>`).join('')}</div>` : ''}
    <div class="ledgers">
      <div class="column">
        <h2 class="column-title">Person</h2>
        ${ledger('Personal details', personal, false)}
        <section class="ledger address" data-view="${addressView}">
          <div class="ledger-head">
            <h3>Address</h3>
            <div class="toggle" role="group" aria-label="Address format">
              <button data-address-view="formatted" aria-pressed="${addressView === 'formatted'}">As written</button>
              <button data-address-view="iso" aria-pressed="${addressView === 'iso'}" title="ISO 20022 PostalAddress24, CBPR+ character set">ISO 20022</button>
            </div>
          </div>
          <div class="view-formatted">
            <p class="address-lines" dir="auto"><span ${copyAttrs(formatted)}>${esc(formatted)}</span></p>
            ${p.address.native ? `<p class="address-lines native-lines" dir="auto"><span ${copyAttrs(p.address.native.join('\n'))}>${esc(p.address.native.join('\n'))}</span></p>` : ''}
          </div>
          <div class="view-iso">
            <dl class="kv">${iso.map(({ tag, name }) => `<dt title="${name}">${tag}</dt><dd><span ${copyAttrs(p.address.structured[tag]!)}>${esc(p.address.structured[tag]!)}</span></dd>`).join('')}</dl>
            <button data-copy-xml>Copy XML</button>
          </div>
        </section>
        ${ledger('Identity documents', p.identity)}
      </div>
      <div class="column">
        <h2 class="column-title">Bank account</h2>
        <section class="ledger">
          <h3>${esc(p.bank.bankName)}${p.bank.bankNameNative ? ` <span class="native" dir="auto">${esc(p.bank.bankNameNative)}</span>` : ''}</h3>
          <dl>${fieldRow({ label: 'Account holder', value: p.name.accountHolder }, false)}</dl>
        </section>
        ${ledger('Domestic payments', p.bank.domestic)}
        ${ledger('International payments', p.bank.international)}
        ${ledger('Cards and aliases', p.bank.extras ?? [])}
      </div>
    </div>`;

  personaEl.querySelector<HTMLButtonElement>('[data-copy-json]')!.dataset.copy = JSON.stringify(p, null, 2);
  personaEl.querySelector<HTMLButtonElement>('[data-copy-xml]')!.dataset.copy = postalAddressXml(p.address.structured);
}

function renderHistory(): void {
  historyEl.innerHTML = history
    .map((h, i) => `<li><button data-history="${i}"><span>${h.flag} ${esc(h.name)}</span><small>${h.seed}</small></button></li>`)
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

async function copy(el: HTMLElement): Promise<void> {
  await navigator.clipboard.writeText(el.dataset.copy!);
  el.classList.add('copied');
  setTimeout(() => el.classList.remove('copied'), 700);
}

document.addEventListener('click', async (e) => {
  const target = e.target as HTMLElement;
  const copyBtn = target.closest<HTMLElement>('[data-copy]');
  // Leave drag-selections alone so part of a value can still be selected and copied normally.
  const selection = window.getSelection();
  if (copyBtn && !(selection && !selection.isCollapsed && copyBtn.contains(selection.anchorNode))) {
    await copy(copyBtn);
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

document.addEventListener('keydown', (e) => {
  const el = (e.target as HTMLElement).closest<HTMLElement>('.copyable');
  if (el && (e.key === 'Enter' || e.key === ' ')) {
    e.preventDefault();
    void copy(el).then(() => toast('Copied'));
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
