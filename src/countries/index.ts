import type { CountryModule, GenerateOptions, Persona } from '../core/types';
import { Rng, randomSeed } from '../core/rng';
import { gb } from './gb';
import { EUROZONE } from './eurozone';
import { ASIA_PACIFIC } from './asia-pacific';
import { ru, ir } from './russia-iran';
import { AMERICAS } from './americas';

export const COUNTRIES: CountryModule[] = [gb, ...EUROZONE, ...ASIA_PACIFIC, ru, ir, ...AMERICAS];

export function getCountry(code: string): CountryModule {
  const country = COUNTRIES.find((c) => c.code === code);
  if (!country) throw new Error(`Unknown country: ${code}`);
  return country;
}

export function generatePersona(code: string, options: GenerateOptions = {}, seed = randomSeed()): Persona {
  const country = getCountry(code);
  const minAge = options.minAge ?? 18;
  const body = country.generate(new Rng(seed), {
    gender: options.gender ?? 'any',
    minAge,
    maxAge: Math.max(minAge, options.maxAge ?? 80),
  });
  return {
    seed,
    generatedAt: new Date().toISOString(),
    country: { code: country.code, name: country.name, flag: country.flag, currency: country.currency },
    ...body,
  };
}
