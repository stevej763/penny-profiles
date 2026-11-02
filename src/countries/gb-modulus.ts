/**
 * UK sort code / account number modulus checking (Pay.UK / Vocalink "Validating account
 * numbers" spec). We only carry the weight-table rows for the sort code ranges we
 * generate from, and only rows that use the standard MOD10, MOD11 and DBLAL methods, so
 * a generated account passes every check that applies to its sort code. Rows are taken
 * from valacdos v900; tests cross-check against the uk-modulus-checking package.
 */

export type ModulusMethod = 'MOD10' | 'MOD11' | 'DBLAL';

export interface ModulusRule {
  method: ModulusMethod;
  weights: readonly number[];
}

export interface SortCodeRange {
  from: string;
  to: string;
  /** Every rule must pass. Two rules for a range mean the account must satisfy both. */
  rules: readonly ModulusRule[];
}

const W_MOD11_STD = [0, 0, 0, 0, 0, 0, 8, 7, 6, 5, 4, 3, 2, 1];
const W_MOD11_7 = [0, 0, 0, 0, 0, 0, 0, 7, 6, 5, 4, 3, 2, 1];
const W_DBLAL_ALT = [2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1];

const r = (method: ModulusMethod, weights: readonly number[]): ModulusRule => ({ method, weights });

export function modulusPasses(sortCode: string, account: string, rule: ModulusRule): boolean {
  const digits = (sortCode + account).split('').map(Number);
  if (rule.method === 'DBLAL') {
    const total = digits.reduce((sum, d, i) => {
      const product = d * rule.weights[i];
      return sum + Math.floor(product / 10) + (product % 10);
    }, 0);
    return total % 10 === 0;
  }
  const total = digits.reduce((sum, d, i) => sum + d * rule.weights[i], 0);
  return total % (rule.method === 'MOD10' ? 10 : 11) === 0;
}

export function passesAll(sortCode: string, account: string, rules: readonly ModulusRule[]): boolean {
  return rules.every((rule) => modulusPasses(sortCode, account, rule));
}

export interface UkBank {
  name: string;
  bic: string;
  /** First four characters of the BIC; used as the IBAN bank code. */
  ibanBankCode: string;
  ranges: readonly SortCodeRange[];
}

export const UK_BANKS: readonly UkBank[] = [
  {
    name: 'Barclays Bank UK',
    bic: 'BARCGB22',
    ibanBankCode: 'BARC',
    ranges: [
      { from: '200000', to: '200002', rules: [r('MOD11', W_MOD11_7), r('DBLAL', W_DBLAL_ALT)] },
      { from: '200051', to: '200077', rules: [r('MOD11', W_MOD11_7), r('DBLAL', W_DBLAL_ALT)] },
      { from: '200079', to: '200097', rules: [r('MOD11', W_MOD11_7), r('DBLAL', W_DBLAL_ALT)] },
      { from: '200099', to: '200156', rules: [r('MOD11', W_MOD11_7), r('DBLAL', W_DBLAL_ALT)] },
    ],
  },
  {
    name: 'HSBC UK Bank',
    bic: 'HBUKGB4B',
    ibanBankCode: 'HBUK',
    ranges: [{ from: '400516', to: '401054', rules: [r('MOD11', W_MOD11_7), r('DBLAL', W_DBLAL_ALT)] }],
  },
  {
    name: 'Lloyds Bank',
    bic: 'LOYDGB2L',
    ibanBankCode: 'LOYD',
    ranges: [
      { from: '300050', to: '300051', rules: [r('MOD11', [0, 0, 0, 0, 0, 0, 128, 64, 32, 16, 8, 4, 2, 1])] },
      { from: '301022', to: '301022', rules: [r('MOD11', [0, 0, 0, 0, 0, 0, 128, 64, 32, 16, 8, 4, 2, 1])] },
      { from: '301027', to: '301027', rules: [r('MOD11', [0, 0, 0, 0, 0, 0, 128, 64, 32, 16, 8, 4, 2, 1])] },
    ],
  },
  {
    name: 'NatWest',
    bic: 'NWBKGB2L',
    ibanBankCode: 'NWBK',
    ranges: [
      { from: '600000', to: '600108', rules: [r('MOD11', W_MOD11_STD)] },
      { from: '600110', to: '600124', rules: [r('MOD11', W_MOD11_STD)] },
      { from: '600127', to: '600142', rules: [r('MOD11', W_MOD11_STD)] },
      { from: '600180', to: '600304', rules: [r('MOD11', W_MOD11_STD)] },
    ],
  },
  {
    name: 'Royal Bank of Scotland',
    bic: 'RBOSGB2L',
    ibanBankCode: 'RBOS',
    ranges: [{ from: '830000', to: '835700', rules: [r('MOD11', [0, 0, 4, 3, 2, 7, 2, 7, 6, 5, 4, 3, 2, 1])] }],
  },
  {
    name: 'Santander UK',
    bic: 'ABBYGB2L',
    ibanBankCode: 'ABBY',
    ranges: [
      { from: '090120', to: '090125', rules: [r('MOD10', [0, 0, 3, 7, 1, 3, 7, 1, 3, 7, 1, 3, 7, 1])] },
      { from: '090126', to: '090129', rules: [r('MOD10', [0, 0, 3, 7, 1, 3, 7, 1, 3, 7, 1, 3, 7, 1])] },
    ],
  },
  {
    name: 'Starling Bank',
    bic: 'SRLGGB2L',
    ibanBankCode: 'SRLG',
    ranges: [{ from: '608371', to: '608371', rules: [r('MOD11', [0, 0, 0, 0, 0, 0, 2, 8, 4, 3, 7, 5, 6, 1])] }],
  },
  {
    name: 'Monzo Bank',
    bic: 'MONZGB2L',
    ibanBankCode: 'MONZ',
    ranges: [{ from: '040004', to: '040004', rules: [r('DBLAL', W_MOD11_STD)] }],
  },
];

export function rulesForSortCode(sortCode: string): readonly ModulusRule[] | undefined {
  for (const bank of UK_BANKS) {
    for (const range of bank.ranges) {
      if (sortCode >= range.from && sortCode <= range.to) return range.rules;
    }
  }
  return undefined;
}

export function methodLabel(rules: readonly ModulusRule[]): string {
  return rules.map((rule) => rule.method).join(' + ');
}
