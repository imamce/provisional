
import type { TaxBracket } from './types';

export const INDIVIDUAL_TAX_BRACKETS: TaxBracket[] = [
    { limit: 14000000, rate: 0.06, deduction: 0 },
    { limit: 50000000, rate: 0.15, deduction: 1260000 },
    { limit: 88000000, rate: 0.24, deduction: 5760000 },
    { limit: 150000000, rate: 0.35, deduction: 15440000 },
    { limit: 300000000, rate: 0.38, deduction: 19940000 },
    { limit: 500000000, rate: 0.40, deduction: 25940000 },
    { limit: 1000000000, rate: 0.42, deduction: 35940000 },
    { limit: Infinity, rate: 0.45, deduction: 65940000 },
];
export const CORPORATE_TAX_BRACKETS: TaxBracket[] = [
    { limit: 200000000, rate: 0.09, deduction: 0 },
    { limit: 20000000000, rate: 0.19, deduction: 20000000 },
    { limit: 300000000000, rate: 0.21, deduction: 420000000 },
    { limit: Infinity, rate: 0.24, deduction: 9420000000 },
];
export const SETTLEMENT_MONTHS: number[] = [8, 9, 10, 11, 12];
export const BASIC_DEDUCTION: number = 1500000;

interface ProfitMargin {
    individual: number;
    corporate: number;
}

export const INDUSTRY_PROFIT_MARGINS: Record<string, ProfitMargin> = {
    '도소매업': { individual: 0.117, corporate: 0.045 },
    '제조업': { individual: 0.0431, corporate: 0.023 },
    '음식숙박업': { individual: 0.0889, corporate: 0.03 },
    '서비스업': { individual: 0.0851, corporate: 0.016 },
    '건설업': { individual: 0.1219, corporate: 0.043 },
    '부동산업': { individual: 0.1058, corporate: 0.02 },
};
