
export interface YearData {
  revenue: string;
  cogs: string;
  sga: string;
  nonOpIncome: string;
  nonOpExpense: string;
  additionalExpenses: string;
}

export interface YearsData {
  [year: number]: YearData;
}

export type EntityType = 'individual' | 'corporate' | null;

export type TaxCreditType = 'none' | 'startup' | 'special' | null;

export interface TaxBracket {
    limit: number;
    rate: number;
    deduction: number;
}

export interface CalculationResult {
    numRevenue?: number;
    numCogs?: number;
    grossProfit?: number;
    numSga?: number;
    operatingIncome?: number;
    numNonOpIncome?: number;
    numNonOpExpense?: number;
    numAdditionalExpenses?: number;
    currentNetIncomeBeforeAdjustment?: number;
    currentNetIncomeAfterAdjustment?: number;
    annualizedRevenue?: number;
    annualizedCogs?: number;
    annualizedGrossProfit?: number;
    annualizedSga?: number;
    annualizedOperatingIncome?: number;
    annualizedNonOpIncome?: number;
    annualizedNonOpExpense?: number;
    annualizedNetIncomeBeforeAdjustment?: number;
    annualizedNetIncomeAfterAdjustment?: number;
    baseTaxAfter?: number;
    taxCreditAmountAfter?: number;
    taxAfterCredit?: number;
    finalTaxBefore?: number;
    finalTaxAfter?: number;
    taxSavings?: number;
    safeProfit?: number;
    profitMargin?: number;
}
