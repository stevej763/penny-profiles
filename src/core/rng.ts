/** Small, fast, seedable PRNG (mulberry32) so every persona can be reproduced from its seed. */
export class Rng {
  private state: number;

  constructor(seed: number) {
    this.state = seed >>> 0;
  }

  next(): number {
    let t = (this.state = (this.state + 0x6d2b79f5) >>> 0);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /** Integer in [min, max] inclusive. */
  int(min: number, max: number): number {
    return min + Math.floor(this.next() * (max - min + 1));
  }

  pick<T>(items: readonly T[]): T {
    return items[Math.floor(this.next() * items.length)];
  }

  bool(probability = 0.5): boolean {
    return this.next() < probability;
  }

  digits(count: number, firstNonZero = false): string {
    let out = '';
    for (let i = 0; i < count; i++) {
      out += i === 0 && firstNonZero ? this.int(1, 9) : this.int(0, 9);
    }
    return out;
  }

  chars(count: number, alphabet: string): string {
    let out = '';
    for (let i = 0; i < count; i++) out += alphabet[this.int(0, alphabet.length - 1)];
    return out;
  }

  shuffle<T>(items: readonly T[]): T[] {
    const out = [...items];
    for (let i = out.length - 1; i > 0; i--) {
      const j = this.int(0, i);
      [out[i], out[j]] = [out[j], out[i]];
    }
    return out;
  }

  letters(count: number): string {
    return this.chars(count, 'ABCDEFGHIJKLMNOPQRSTUVWXYZ');
  }
}

export function randomSeed(): number {
  return crypto.getRandomValues(new Uint32Array(1))[0];
}
