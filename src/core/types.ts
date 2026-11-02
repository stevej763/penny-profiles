import type { Rng } from './rng';
import type { PostalAddress } from './iso20022';

export type Gender = 'male' | 'female';

/** A labelled value. `check` names the validation rule the value is guaranteed to satisfy. */
export interface Field {
  label: string;
  value: string;
  check?: string;
  /**
   * Latin-script form of a value that uses another script, used by the Latin-only view.
   * `null` means the field only makes sense in the native script and is dropped there.
   */
  latin?: string | null;
}

export interface Address {
  /** Address lines in the local postal format, Latin script. */
  lines: string[];
  /** Same address in native script, where the country uses one. */
  native?: string[];
  /** ISO 20022 PostalAddress24, fully structured, CBPR+ character set. */
  structured: PostalAddress;
}

export interface BankAccount {
  bankName: string;
  bankNameNative?: string;
  bic: string;
  currency: string;
  /** Identifiers used for payments inside the country. */
  domestic: Field[];
  /** Identifiers used for cross-border payments (IBAN, SWIFT routing, etc.). */
  international: Field[];
  /** Cards, payment aliases and other secondary identifiers. */
  extras?: Field[];
}

export interface Persona {
  seed: number;
  generatedAt: string;
  country: { code: string; name: string; flag: string; currency: string };
  gender: Gender;
  name: {
    full: string;
    given: string;
    family: string;
    native?: string;
    /** Name as it would appear on the bank account, e.g. katakana in Japan. */
    accountHolder: string;
    /** Latin-script account holder name, where `accountHolder` uses another script. */
    accountHolderLatin?: string;
    parts?: Field[];
  };
  dateOfBirth: string;
  age: number;
  nationality: string;
  address: Address;
  phone: string;
  email: string;
  identity: Field[];
  bank: BankAccount;
  notes?: string[];
}

export interface GenerateOptions {
  gender?: Gender | 'any';
  minAge?: number;
  maxAge?: number;
}

/** What a country module produces; seed, timestamp and country metadata are added by the registry. */
export type PersonaBody = Omit<Persona, 'seed' | 'generatedAt' | 'country'>;

export interface CountryModule {
  code: string;
  name: string;
  flag: string;
  currency: string;
  group: string;
  generate(rng: Rng, options: Required<GenerateOptions>): PersonaBody;
}
