import type { CountryModule, GenerateOptions, Persona } from '../core/types';
import { Rng, randomSeed } from '../core/rng';
import { gb } from './gb';
import { EUROZONE } from './eurozone';
import { ASIA_PACIFIC } from './asia-pacific';
import { ru, ir } from './russia-iran';
import { AMERICAS } from './americas';
import { ca } from './ca';
import { ch } from './ch';
import { pl } from './pl';
import { no } from './no';
import { se } from './se';
import { hr } from './hr';
import { lu } from './lu';
import { ee } from './ee';
import { sk } from './sk';
import { tr } from './tr';
import { gr } from './gr';
import { ua } from './ua';
import { by } from './by';
import { il } from './il';
import { kr } from './kr';
import { ae } from './ae';
import { sa } from './sa';
import { pk } from './pk';
import { ph } from './ph';
import { ng } from './ng';
import { ve } from './ve';

export const COUNTRIES: CountryModule[] = [
  gb,
  ...EUROZONE, gr, hr, lu, ee, sk,
  ch, pl, no, se, tr, ua, by, ru,
  ae, sa, il, ir, ng,
  ...ASIA_PACIFIC, kr, pk, ph,
  ...AMERICAS.slice(0, 1), ca, ...AMERICAS.slice(1), ve,
];

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
