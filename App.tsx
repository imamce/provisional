
import React, { useState, useMemo } from 'react';
import { INDIVIDUAL_TAX_BRACKETS, CORPORATE_TAX_BRACKETS, SETTLEMENT_MONTHS, BASIC_DEDUCTION, INDUSTRY_PROFIT_MARGINS } from './constants';
import YearlyInputGroup from './components/YearlyInputGroup';
import { formatCurrency } from './utils/formatter';
import type { YearData, YearsData, EntityType, TaxCreditType, CalculationResult } from './types';


const STARTUP_CREDIT_RATES: Record<string, number> = { '50%': 0.5, '100%': 1.0 };
const SPECIAL_CREDIT_RATES: Record<string, number> = { '5%': 0.05, '10%': 0.1, '15%': 0.15, '20%': 0.2, '30%': 0.3 };
const YEARS = [2023, 2024, 2025];

const initialYearData: YearData = {
    revenue: '', cogs: '', sga: '', nonOpIncome: '', nonOpExpense: '', additionalExpenses: ''
};

const logoDataUri = "data:image/png;base64,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/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/u/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4fzL/T/p/uH+4/QeG1LhMAAAAASUVORK5CYII=";

const calculateAllMetrics = (data: YearData, settlementMonth: number, entityType: EntityType, includeLocalTax: boolean, taxCreditRate: number, industry: string): CalculationResult => {
    if (!entityType)
        return {}; 
    const MILLION = 1000000;
    const numRevenue = (Number(data.revenue) || 0) * MILLION;
    const numCogs = (Number(data.cogs) || 0) * MILLION;
    const numSga = (Number(data.sga) || 0) * MILLION;
    const numNonOpIncome = (Number(data.nonOpIncome) || 0) * MILLION;
    const numNonOpExpense = (Number(data.nonOpExpense) || 0) * MILLION;
    const numAdditionalExpenses = (Number(data.additionalExpenses) || 0) * MILLION;
    
    const annualizationFactor = settlementMonth > 0 ? 12 / settlementMonth : 0;

    const grossProfit = numRevenue - numCogs;
    const operatingIncome = grossProfit - numSga;
    const currentNetIncomeBeforeAdjustment = operatingIncome + numNonOpIncome - numNonOpExpense;
    const currentNetIncomeAfterAdjustment = currentNetIncomeBeforeAdjustment - numAdditionalExpenses;
    
    const annualizedRevenue = numRevenue * annualizationFactor;
    const annualizedCogs = numCogs * annualizationFactor;
    const annualizedSga = numSga * annualizationFactor;
    const annualizedNonOpIncome = numNonOpIncome * annualizationFactor;
    const annualizedNonOpExpense = numNonOpExpense * annualizationFactor;
    const annualizedGrossProfit = grossProfit * annualizationFactor;
    const annualizedOperatingIncome = operatingIncome * annualizationFactor;
    const annualizedNetIncomeBeforeAdjustment = annualizedOperatingIncome + annualizedNonOpIncome - annualizedNonOpExpense;
    const annualizedNetIncomeAfterAdjustment = annualizedNetIncomeBeforeAdjustment - numAdditionalExpenses;
    
    const deduction = entityType === 'individual' ? BASIC_DEDUCTION : 0;
    
    const calculateTax = (income: number) => {
        if (income <= 0)
            return 0;
        const brackets = entityType === 'individual' ? INDIVIDUAL_TAX_BRACKETS : CORPORATE_TAX_BRACKETS;
        let applicableBracket = brackets[brackets.length - 1];
        for (const bracket of brackets) {
            if (income <= bracket.limit) {
                applicableBracket = bracket;
                break;
            }
        }
        return income * applicableBracket.rate - applicableBracket.deduction;
    };

    const taxableIncomeBefore = Math.max(0, annualizedNetIncomeBeforeAdjustment - deduction);
    const baseTaxBefore = calculateTax(taxableIncomeBefore);
    
    const taxableIncomeAfter = Math.max(0, annualizedNetIncomeAfterAdjustment - deduction);
    const baseTaxAfter = calculateTax(taxableIncomeAfter);

    const taxCreditAmountAfter = baseTaxAfter * taxCreditRate;
    const taxAfterCredit = baseTaxAfter - taxCreditAmountAfter;

    const finalTaxBefore = (baseTaxBefore * (1 - taxCreditRate)) * (includeLocalTax ? 1.1 : 1);
    const finalTaxAfter = taxAfterCredit * (includeLocalTax ? 1.1 : 1);
    
    const taxSavings = finalTaxBefore - finalTaxAfter;

    const profitMarginDetails = INDUSTRY_PROFIT_MARGINS[industry];
    const profitMargin = profitMarginDetails ? profitMarginDetails[entityType] : 0;
    const safeProfit = annualizedRevenue * profitMargin;

    return {
        numRevenue, numCogs, grossProfit, numSga, operatingIncome, numNonOpIncome, numNonOpExpense,
        numAdditionalExpenses, currentNetIncomeBeforeAdjustment, currentNetIncomeAfterAdjustment,
        annualizedRevenue, annualizedCogs, annualizedGrossProfit, annualizedSga, annualizedOperatingIncome,
        annualizedNonOpIncome, annualizedNonOpExpense, annualizedNetIncomeBeforeAdjustment,
        annualizedNetIncomeAfterAdjustment, baseTaxAfter, taxCreditAmountAfter, taxAfterCredit,
        finalTaxBefore, finalTaxAfter, taxSavings, safeProfit, profitMargin,
    };
};


const App: React.FC = () => {
    const [viewMode, setViewMode] = useState<'input' | 'result'>('input');
    const [companyName, setCompanyName] = useState('');
    const [entityType, setEntityType] = useState<EntityType>(null);
    const [includeLocalTax, setIncludeLocalTax] = useState(false);
    const [settlementMonth, setSettlementMonth] = useState<number | null>(null);
    const [industry, setIndustry] = useState<string>(Object.keys(INDUSTRY_PROFIT_MARGINS)[0]);
    const [yearsData, setYearsData] = useState<YearsData>({
        2023: { ...initialYearData },
        2024: { ...initialYearData },
        2025: { ...initialYearData },
    });
    const [outputView, setOutputView] = useState<'single' | 'comparison'>('single');
    const [taxCreditType, setTaxCreditType] = useState<TaxCreditType>(null);
    const [taxCreditRate, setTaxCreditRate] = useState(0);

    const disclaimerText = `본 결과는 제공된 정보를 바탕으로 한 추정치이며, 실제 세액과 다를 수 있습니다.
이는 법적 또는 세무 자문을 구성하지 않으며, 어떠한 법적 책임도 지지 않습니다.
정확한 세무 신고 및 자문을 위해서는 반드시 공인된 세무사 또는 회계사와 상담하시기 바랍니다.
면책 조항: 본 계산기는 일반적인 정보 제공을 목적으로 하며, 특정 상황에 대한 세무 자문을 대체할 수 없습니다. 당사는 이 계산기 사용으로 인해 발생하는 어떠한 손실이나 손해에 대해서도 책임을 지지 않습니다.`;

    const handleTaxCreditTypeChange = (type: TaxCreditType) => {
        setTaxCreditType(type);
        setTaxCreditRate(0);
    };

    const handleYearDataChange = (year: number, field: keyof YearData, value: string) => {
        setYearsData(prev => ({
            ...prev,
            [year]: { ...prev[year], [field]: value }
        }));
    };

    const allCalculations = useMemo(() => {
        const results: { [key: number]: CalculationResult } = {};
        YEARS.forEach(year => {
            results[year] = calculateAllMetrics(yearsData[year], settlementMonth || 0, entityType, includeLocalTax, taxCreditRate, industry);
        });
        return results;
    }, [yearsData, settlementMonth, entityType, includeLocalTax, taxCreditRate, industry]);

    const handlePrint = () => {
        window.print();
    };

    const handleViewResult = () => {
        if (!entityType) {
            alert('사업자(개인/법인)을 선택해주세요.');
            return;
        }
        if (!settlementMonth) {
            alert('결산 월을 선택해주세요.');
            return;
        }
        if (!taxCreditType) {
            alert('세액공제를 선택해주세요.');
            return;
        }
        if (taxCreditType === 'startup' && taxCreditRate === 0) {
            alert('스타트업 창업 감면율을 선택해주세요.');
            return;
        }
        if (taxCreditType === 'special' && taxCreditRate === 0) {
            alert('창업중소기업 세액공제율을 선택해주세요.');
            return;
        }
        setViewMode('result');
        setOutputView('single');
    };

    const hasInputs = Object.values(yearsData).some(data => Object.values(data).some(value => value !== ''));

    const renderMultiMetricComparisonChart = () => {
        const metrics = [
            { key: 'annualizedRevenue' as const, label: '연환산매출', colorClasses: 'bg-sky-500 dark:bg-sky-600' },
            { key: 'annualizedOperatingIncome' as const, label: '영업이익', colorClasses: 'bg-emerald-500 dark:bg-emerald-600' },
            { key: 'annualizedNetIncomeAfterAdjustment' as const, label: '당기순이익', colorClasses: 'bg-brand-blue dark:bg-brand-blue-dark' },
        ];

        const chartData = YEARS.map(year => {
            const yearCalcs = allCalculations[year] || {};
            return {
                year,
                values: metrics.map(m => yearCalcs[m.key] || 0)
            };
        });

        const allValues = chartData.flatMap(d => d.values);
        const maxAmount = Math.max(...allValues.filter(v => v > 0), 1);

        return (
            <div>
                <h3 className="text-base font-semibold text-gray-800 dark:text-gray-200 mb-3">연도별 핵심지표 비교</h3>
                <div className="p-4 bg-slate-100 dark:bg-gray-800/60 rounded-lg">
                    <div className="flex justify-center space-x-4 mb-4 text-xs">
                        {metrics.map(metric => (
                            <div key={metric.key} className="flex items-center">
                                <span className={`w-3 h-3 rounded-full mr-2 ${metric.colorClasses}`}></span>
                                <span className="text-gray-600 dark:text-gray-400">{metric.label}</span>
                            </div>
                        ))}
                    </div>
                    <div className="grid grid-cols-3 gap-4 items-end h-64 border-t border-slate-300 dark:border-gray-600 pt-4">
                        {chartData.map(data => (
                            <div key={data.year} className="flex flex-col items-center h-full">
                                <div className="flex items-end justify-center h-full w-full space-x-1">
                                    {data.values.map((value, index) => (
                                        <div key={metrics[index].key} className="w-1/3 flex flex-col items-center justify-end group relative">
                                            <div
                                                className={`${metrics[index].colorClasses} rounded-t-md transition-all duration-500 w-full hover:opacity-80`}
                                                style={{ height: `${(Math.max(0, value) / maxAmount) * 100}%` }}
                                                aria-label={`${data.year}년 ${metrics[index].label}: ${formatCurrency(value)}`}
                                            ></div>
                                            <div className="absolute bottom-full mb-2 w-auto p-2 text-xs text-white bg-gray-900 rounded-md scale-0 group-hover:scale-100 transition-transform duration-200 origin-bottom whitespace-nowrap z-10">
                                                {formatCurrency(value)}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-2 text-sm font-semibold text-gray-800 dark:text-gray-200">{data.year}년</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    };


    const renderResultContent = () => {
        if (!entityType || !settlementMonth || !taxCreditType) {
            return (
                <div className="flex flex-col items-center justify-center h-full text-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-400 mb-4" fill="none" viewBox="http://www.w3.org/2000/svg" stroke="currentColor" strokeWidth="1.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-gray-500 dark:text-gray-400 font-semibold">필수 항목을 모두 입력해주세요.</p>
                    <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">'사업자', '결산 월', '세액공제'를 모두 필수로 선택해주세요.</p>
                </div>
            );
        }

        if (!hasInputs) {
            return (
                <div className="flex flex-col items-center justify-center h-full text-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p className="text-gray-500 dark:text-gray-400">
                        손익계산서 항목을 입력하고
                        <br />
                        결과를 확인해주세요.
                    </p>
                </div>
            );
        }
        
        const calcs2025 = allCalculations[2025] || {};
        let taxSavingsAfterRatio = 0;
        if (calcs2025.finalTaxBefore && calcs2025.finalTaxBefore > 0) {
            taxSavingsAfterRatio = Math.min(1, Math.max(0, (calcs2025.finalTaxAfter || 0) / calcs2025.finalTaxBefore));
        }

        return (
            <>
                <nav className="no-print flex space-x-1 rounded-lg p-1 bg-slate-200 dark:bg-gray-700 mb-4" aria-label="Tabs">
                    <button
                        onClick={() => setOutputView('single')}
                        className={`w-full py-2.5 text-sm font-medium leading-5 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 ring-offset-2 ring-offset-slate-200 dark:ring-offset-gray-700 ring-brand-blue ring-opacity-60 ${outputView === 'single' ? 'bg-white dark:bg-gray-800 shadow text-brand-blue dark:text-sky-300 font-bold' : 'text-gray-600 dark:text-gray-300 hover:bg-white/[0.5] dark:hover:bg-gray-800/[0.5]'}`}
                    >
                        25년 상세결과
                    </button>
                    <button
                        onClick={() => setOutputView('comparison')}
                        className={`w-full py-2.5 text-sm font-medium leading-5 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 ring-offset-2 ring-offset-slate-200 dark:ring-offset-gray-700 ring-brand-blue ring-opacity-60 ${outputView === 'comparison' ? 'bg-white dark:bg-gray-800 shadow text-brand-blue dark:text-sky-300 font-bold' : 'text-gray-600 dark:text-gray-300 hover:bg-white/[0.5] dark:hover:bg-gray-800/[0.5]'}`}
                    >
                        연도별 비교
                    </button>
                </nav>

                {outputView === 'single' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="overflow-x-auto md:col-span-2">
                            <table className="w-full text-sm text-gray-900 dark:text-white">
                                <thead className="text-xs text-gray-700 uppercase bg-slate-200 dark:bg-gray-700 dark:text-gray-400">
                                    <tr>
                                        <th scope="col" className="px-4 py-3 font-semibold">항목 (2025년)</th>
                                        <th scope="col" className="px-4 py-3 text-right font-semibold">{settlementMonth || '-'} 개월 손익</th>
                                        <th scope="col" className="px-4 py-3 text-right font-semibold">12개월 환산</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                    <tr className="hover:bg-slate-100 dark:hover:bg-gray-700/50">
                                        <td className="px-4 py-2 text-gray-600 dark:text-gray-400">매출액</td>
                                        <td className="px-4 py-2 text-right">{formatCurrency(calcs2025.numRevenue)}</td>
                                        <td className="px-4 py-2 text-right">{formatCurrency(calcs2025.annualizedRevenue)}</td>
                                    </tr>
                                    <tr className="hover:bg-slate-100 dark:hover:bg-gray-700/50">
                                        <td className="px-4 py-2 text-gray-600 dark:text-gray-400">매출원가</td>
                                        <td className="px-4 py-2 text-right">{formatCurrency(calcs2025.numCogs)}</td>
                                        <td className="px-4 py-2 text-right">{formatCurrency(calcs2025.annualizedCogs)}</td>
                                    </tr>
                                    <tr className="font-semibold bg-slate-50 dark:bg-gray-800/30">
                                        <td className="px-4 py-2">매출총이익</td>
                                        <td className="px-4 py-2 text-right">{formatCurrency(calcs2025.grossProfit)}</td>
                                        <td className="px-4 py-2 text-right">{formatCurrency(calcs2025.annualizedGrossProfit)}</td>
                                    </tr>
                                    <tr className="hover:bg-slate-100 dark:hover:bg-gray-700/50">
                                        <td className="px-4 py-2 text-gray-600 dark:text-gray-400">판매비와 관리비</td>
                                        <td className="px-4 py-2 text-right">{formatCurrency(calcs2025.numSga)}</td>
                                        <td className="px-4 py-2 text-right">{formatCurrency(calcs2025.annualizedSga)}</td>
                                    </tr>
                                    <tr className="font-semibold bg-slate-50 dark:bg-gray-800/30">
                                        <td className="px-4 py-2">영업이익</td>
                                        <td className="px-4 py-2 text-right">{formatCurrency(calcs2025.operatingIncome)}</td>
                                        <td className="px-4 py-2 text-right">{formatCurrency(calcs2025.annualizedOperatingIncome)}</td>
                                    </tr>
                                    <tr className="hover:bg-slate-100 dark:hover:bg-gray-700/50">
                                        <td className="px-4 py-2 text-gray-600 dark:text-gray-400">영업외수익</td>
                                        <td className="px-4 py-2 text-right">{formatCurrency(calcs2025.numNonOpIncome)}</td>
                                        <td className="px-4 py-2 text-right">{formatCurrency(calcs2025.annualizedNonOpIncome)}</td>
                                    </tr>
                                    <tr className="hover:bg-slate-100 dark:hover:bg-gray-700/50">
                                        <td className="px-4 py-2 text-gray-600 dark:text-gray-400">영업외비용</td>
                                        <td className="px-4 py-2 text-right">{formatCurrency(calcs2025.numNonOpExpense)}</td>
                                        <td className="px-4 py-2 text-right">{formatCurrency(calcs2025.annualizedNonOpExpense)}</td>
                                    </tr>
                                    <tr className="bg-slate-100 dark:bg-gray-800/60 font-bold">
                                        <td className="px-4 py-2">법인세비용차감전순이익 (조정 전)</td>
                                        <td className="px-4 py-2 text-right">{formatCurrency(calcs2025.currentNetIncomeBeforeAdjustment)}</td>
                                        <td className="px-4 py-2 text-right">{formatCurrency(calcs2025.annualizedNetIncomeBeforeAdjustment)}</td>
                                    </tr>
                                    <tr className="hover:bg-slate-100 dark:hover:bg-gray-700/50">
                                        <td className="px-4 py-2 text-gray-600 dark:text-gray-400">추가 비용 (절세 항목)</td>
                                        <td className="px-4 py-2 text-right text-red-600 dark:text-red-400">-{formatCurrency(calcs2025.numAdditionalExpenses)}</td>
                                        <td className="px-4 py-2 text-right text-red-600 dark:text-red-400">-{formatCurrency(calcs2025.numAdditionalExpenses)}</td>
                                    </tr>
                                    <tr className="bg-sky-50 dark:bg-sky-900/40 font-bold text-base text-sky-800 dark:text-sky-200">
                                        <td className="px-4 py-2">법인세비용차감전순이익 (조정 후)</td>
                                        <td className="px-4 py-2 text-right">{formatCurrency(calcs2025.currentNetIncomeAfterAdjustment)}</td>
                                        <td className="px-4 py-2 text-right">{formatCurrency(calcs2025.annualizedNetIncomeAfterAdjustment)}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                        <div className="md:col-span-2">
                          <h3 className="text-base font-semibold text-gray-800 dark:text-gray-200 mb-3">2025년 예상 최종세액</h3>
                          <div className="bg-brand-blue text-white p-6 rounded-xl shadow-lg flex items-center justify-between">
                            <div>
                                <p className="text-blue-200 text-sm">{includeLocalTax ? "지방세 포함" : "지방세 미포함"}</p>
                                <p className="text-4xl font-bold tracking-tight">{formatCurrency(calcs2025.finalTaxAfter)}</p>
                                <div className="text-sm mt-3 text-blue-200 opacity-90">
                                    <span>기본세액: {formatCurrency(calcs2025.baseTaxAfter)}</span>
                                    {taxCreditRate > 0 && (
                                        <span className="ml-4">세액공제: -{formatCurrency(calcs2025.taxCreditAmountAfter)}</span>
                                    )}
                                </div>
                            </div>
                            <div className="text-blue-200">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-20 w-20 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                </svg>
                            </div>
                          </div>
                        </div>

                        {calcs2025.taxSavings && calcs2025.taxSavings > 0 && (
                            <div className="md:col-span-2">
                                <h3 className="text-base font-semibold text-gray-800 dark:text-gray-200 mb-3">절세 항목 반영 효과</h3>
                                <div className="p-4 bg-slate-100 dark:bg-gray-800/60 rounded-lg space-y-4">
                                    <div>
                                        <div className="flex justify-between mb-1 text-xs text-gray-600 dark:text-gray-400">
                                            <span>조정 전 세액</span>
                                            <span>조정 후 세액</span>
                                        </div>
                                        <div className="flex w-full h-5 rounded-full overflow-hidden bg-emerald-200 dark:bg-emerald-900">
                                            <div className="bg-brand-blue transition-all duration-500" style={{ width: `${taxSavingsAfterRatio * 100}%` }} title={`절감 후 세액: ${formatCurrency(calcs2025.finalTaxAfter)}`}></div>
                                            <div className="bg-emerald-500 transition-all duration-500" style={{ width: `${(1 - taxSavingsAfterRatio) * 100}%` }} title={`절감액: ${formatCurrency(calcs2025.taxSavings)}`}></div>
                                        </div>
                                        <div className="flex justify-between mt-1 text-xs font-medium text-gray-800 dark:text-gray-200">
                                            <span>{formatCurrency(calcs2025.finalTaxAfter)}</span>
                                            <span className="text-emerald-600 dark:text-emerald-400">-{formatCurrency(calcs2025.taxSavings)}</span>
                                        </div>
                                    </div>
                                    <div className="text-center pt-2 border-t border-slate-200 dark:border-gray-700">
                                        <p className="text-sm text-gray-500 dark:text-gray-400">조정 전 예상 세액</p>
                                        <p className="text-lg font-semibold text-gray-700 dark:text-gray-300">{formatCurrency(calcs2025.finalTaxBefore)}</p>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div className="md:col-span-2">
                            <h3 className="text-base font-semibold text-gray-800 dark:text-gray-200 mb-3">적정 이익률 분석 ({industry})</h3>
                             <div className="p-4 bg-slate-100 dark:bg-gray-800/60 rounded-lg">
                                <div className="flex justify-between items-center mb-3">
                                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">업종 평균 순이익률</span>
                                    <span className="text-sm font-bold text-brand-blue dark:text-sky-400">{((calcs2025.profitMargin || 0) * 100).toFixed(2)}%</span>
                                </div>
                                <div className="grid grid-cols-2 gap-4 text-center">
                                    <div>
                                        <p className="text-xs text-gray-500">귀사의 연환산 순이익</p>
                                        <p className="font-semibold text-lg text-gray-800 dark:text-white">{formatCurrency(calcs2025.annualizedNetIncomeAfterAdjustment)}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500">업종 평균 적정 순이익</p>
                                        <p className="font-semibold text-lg text-brand-blue dark:text-sky-400">{formatCurrency(calcs2025.safeProfit)}</p>
                                    </div>
                                </div>
                             </div>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-6">
                        <div className="overflow-x-auto">
                           <table className="w-full text-sm text-gray-900 dark:text-white">
                                <thead className="text-xs text-gray-700 uppercase bg-slate-200 dark:bg-gray-700 dark:text-gray-400">
                                    <tr>
                                        <th scope="col" className="px-4 py-3 font-semibold text-left">항목 (연환산 손익)</th>
                                        {YEARS.map(year => <th key={year} scope="col" className="px-4 py-3 text-right font-semibold">{year}년</th>)}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                    {Object.entries({
                                        '연환산매출': 'annualizedRevenue',
                                        '영업이익': 'annualizedOperatingIncome',
                                        '당기순이익 (조정 후)': 'annualizedNetIncomeAfterAdjustment',
                                    }).map(([label, key]) => (
                                        <tr key={key} className={`hover:bg-slate-100 dark:hover:bg-gray-700/50`}>
                                            <td className="px-4 py-2 font-medium">{label}</td>
                                            {YEARS.map(year => (
                                                <td key={year} className="px-4 py-2 text-right">{formatCurrency((allCalculations[year] as any)?.[key])}</td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                           </table>
                        </div>
                        {renderMultiMetricComparisonChart()}
                    </div>
                )}
            </>
        );
    };

    const renderInputPage = () => (
        <section className="w-full max-w-5xl mx-auto flex flex-col gap-8 p-8 bg-white dark:bg-gray-800 rounded-xl shadow-lg no-print">
            <div>
                <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">회사명</label>
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-2a1 1 0 00-1-1H9a1 1 0 00-1 1v2a1 1 0 01-1 1H4a1 1 0 110-2V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z" clipRule="evenodd" />
                        </svg>
                    </div>
                    <input
                        type="text"
                        id="companyName"
                        name="companyName"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        placeholder="예: 절세컨설팅 주식회사"
                        className="w-full pl-10 pr-4 py-3 bg-slate-100 dark:bg-gray-700 border border-slate-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-blue dark:focus:ring-brand-blue-dark focus:border-brand-blue dark:focus:border-brand-blue-dark transition-colors duration-200 text-gray-900 dark:text-white"
                    />
                </div>
            </div>

            <div className="p-6 bg-slate-50 dark:bg-gray-800/50 rounded-lg border border-slate-200 dark:border-gray-700 space-y-6">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">기본 정보</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <h3 className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">사업자 <span className="text-red-500">*필수</span></h3>
                        <fieldset className="grid grid-cols-2 gap-2">
                            <div>
                                <input type="radio" id="type-individual" name="entityType" value="individual" checked={entityType === 'individual'} onChange={(e) => setEntityType(e.target.value as EntityType)} className="sr-only peer" />
                                <label htmlFor="type-individual" className="flex items-center justify-center w-full text-center py-3 px-2 rounded-lg border-2 cursor-pointer transition-all duration-200 ease-in-out border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 peer-checked:border-brand-blue peer-checked:bg-brand-blue/10 dark:peer-checked:bg-brand-blue/30 peer-checked:text-brand-blue dark:peer-checked:text-sky-300 peer-checked:font-bold">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                                    </svg>
                                    개인
                                </label>
                            </div>
                            <div>
                                <input type="radio" id="type-corporate" name="entityType" value="corporate" checked={entityType === 'corporate'} onChange={(e) => setEntityType(e.target.value as EntityType)} className="sr-only peer" />
                                <label htmlFor="type-corporate" className="flex items-center justify-center w-full text-center py-3 px-2 rounded-lg border-2 cursor-pointer transition-all duration-200 ease-in-out border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 peer-checked:border-brand-blue peer-checked:bg-brand-blue/10 dark:peer-checked:bg-brand-blue/30 peer-checked:text-brand-blue dark:peer-checked:text-sky-300 peer-checked:font-bold">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                                        <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                                    </svg>
                                    법인
                                </label>
                            </div>
                        </fieldset>
                    </div>
                    <div>
                        <label htmlFor="industry" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">업종 선택</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                                </svg>
                            </div>
                            <select
                                id="industry"
                                name="industry"
                                value={industry}
                                onChange={(e) => setIndustry(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 bg-slate-100 dark:bg-gray-700 border border-slate-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-blue dark:focus:ring-brand-blue-dark focus:border-brand-blue dark:focus:border-brand-blue-dark transition-colors duration-200 text-gray-900 dark:text-white appearance-none"
                            >
                                {Object.keys(INDUSTRY_PROFIT_MARGINS).map((ind) => (
                                    <option key={ind} value={ind}>{ind}</option>
                                ))}
                            </select>
                            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-gray-400">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                            </div>
                        </div>
                    </div>
                </div>

                <div>
                    <h3 className="text-sm font-medium text-gray-800 dark:text-gray-300 mb-2">결산 월 <span className="text-red-500">*필수</span></h3>
                    <fieldset className="grid grid-cols-5 gap-2">
                        {SETTLEMENT_MONTHS.map(month => (
                            <div key={month}>
                                <input type="radio" id={`month-${month}`} name="settlementMonth" value={month} checked={settlementMonth === month} onChange={(e) => setSettlementMonth(Number(e.target.value))} className="sr-only peer" />
                                <label htmlFor={`month-${month}`} className="block w-full text-center py-3 px-2 rounded-lg border-2 cursor-pointer transition-all duration-200 ease-in-out border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 peer-checked:border-brand-blue peer-checked:bg-brand-blue/10 dark:peer-checked:bg-brand-blue/30 peer-checked:text-brand-blue dark:peer-checked:text-sky-300 peer-checked:font-bold">{month}월</label>
                            </div>
                        ))}
                    </fieldset>
                </div>

                <div>
                    <h3 className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">세액공제 선택 <span className="text-red-500">*필수</span></h3>
                    <fieldset className="grid grid-cols-3 gap-2">
                        <div>
                            <input type="radio" id="credit-none" name="taxCreditType" value="none" checked={taxCreditType === 'none'} onChange={() => handleTaxCreditTypeChange('none')} className="sr-only peer" />
                            <label htmlFor="credit-none" className="flex items-center justify-center w-full text-center py-3 px-2 rounded-lg border-2 cursor-pointer transition-all duration-200 ease-in-out border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 peer-checked:border-brand-blue peer-checked:bg-brand-blue/10 dark:peer-checked:bg-brand-blue/30 peer-checked:text-brand-blue dark:peer-checked:text-sky-300 peer-checked:font-bold">없음</label>
                        </div>
                        <div>
                            <input type="radio" id="credit-startup" name="taxCreditType" value="startup" checked={taxCreditType === 'startup'} onChange={() => handleTaxCreditTypeChange('startup')} className="sr-only peer" />
                            <label htmlFor="credit-startup" className="flex items-center justify-center w-full text-center py-3 px-2 rounded-lg border-2 cursor-pointer transition-all duration-200 ease-in-out border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 peer-checked:border-brand-blue peer-checked:bg-brand-blue/10 dark:peer-checked:bg-brand-blue/30 peer-checked:text-brand-blue dark:peer-checked:text-sky-300 peer-checked:font-bold">창업 감면</label>
                        </div>
                        <div>
                            <input type="radio" id="credit-special" name="taxCreditType" value="special" checked={taxCreditType === 'special'} onChange={() => handleTaxCreditTypeChange('special')} className="sr-only peer" />
                            <label htmlFor="credit-special" className="flex items-center justify-center w-full text-center py-3 px-2 rounded-lg border-2 cursor-pointer transition-all duration-200 ease-in-out border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 peer-checked:border-brand-blue peer-checked:bg-brand-blue/10 dark:peer-checked:bg-brand-blue/30 peer-checked:text-brand-blue dark:peer-checked:text-sky-300 peer-checked:font-bold">창업중소기업</label>
                        </div>
                    </fieldset>
                </div>

                {taxCreditType === 'startup' && (
                    <div>
                        <h3 className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">창업 감면율 <span className="text-red-500">*필수</span></h3>
                        <fieldset className="grid grid-cols-2 gap-2">
                            {Object.entries(STARTUP_CREDIT_RATES).map(([label, rate]) => (
                                <div key={rate}>
                                    <input type="radio" id={`startup-rate-${rate}`} name="startupCreditRate" value={rate} checked={taxCreditRate === rate} onChange={(e) => setTaxCreditRate(Number(e.target.value))} className="sr-only peer" />
                                    <label htmlFor={`startup-rate-${rate}`} className="block w-full text-center py-3 px-2 rounded-lg border-2 cursor-pointer transition-all duration-200 ease-in-out border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 peer-checked:border-brand-blue peer-checked:bg-brand-blue/10 dark:peer-checked:bg-brand-blue/30 peer-checked:text-brand-blue dark:peer-checked:text-sky-300 peer-checked:font-bold">{label}</label>
                                </div>
                            ))}
                        </fieldset>
                    </div>
                )}
                
                {taxCreditType === 'special' && (
                    <div>
                        <h3 className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">창업중소기업 세액공제율 <span className="text-red-500">*필수</span></h3>
                        <fieldset className="grid grid-cols-5 gap-2">
                             {Object.entries(SPECIAL_CREDIT_RATES).map(([label, rate]) => (
                                <div key={rate}>
                                    <input type="radio" id={`special-rate-${rate}`} name="specialCreditRate" value={rate} checked={taxCreditRate === rate} onChange={(e) => setTaxCreditRate(Number(e.target.value))} className="sr-only peer" />
                                    <label htmlFor={`special-rate-${rate}`} className="block w-full text-center py-3 px-2 rounded-lg border-2 cursor-pointer transition-all duration-200 ease-in-out border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 peer-checked:border-brand-blue peer-checked:bg-brand-blue/10 dark:peer-checked:bg-brand-blue/30 peer-checked:text-brand-blue dark:peer-checked:text-sky-300 peer-checked:font-bold">{label}</label>
                                </div>
                            ))}
                        </fieldset>
                    </div>
                )}

                <div className="flex items-center justify-start pt-2">
                    <input
                        type="checkbox"
                        id="includeLocalTax"
                        name="includeLocalTax"
                        checked={includeLocalTax}
                        onChange={(e) => setIncludeLocalTax(e.target.checked)}
                        className="h-4 w-4 rounded border-gray-300 dark:border-gray-600 text-brand-blue focus:ring-brand-blue bg-slate-100 dark:bg-gray-700"
                    />
                    <label htmlFor="includeLocalTax" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">지방세(10%) 포함하여 계산</label>
                </div>
            </div>

            <div className="border-t border-slate-200 dark:border-gray-700 pt-6">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">연도별 손익 입력</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {YEARS.map(year => (
                        <YearlyInputGroup
                            key={year}
                            year={year}
                            yearData={yearsData[year]}
                            calculations={allCalculations[year]}
                            onDataChange={(field, value) => handleYearDataChange(year, field, value)}
                        />
                    ))}
                </div>
                <div className="mt-4 border-t border-slate-200 dark:border-gray-700 pt-6 flex justify-end">
                    <button
                        onClick={handleViewResult}
                        className="bg-brand-blue text-white font-bold py-3 px-8 rounded-lg hover:bg-brand-blue-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-blue transition-colors duration-200 flex items-center gap-2 text-lg"
                    >
                        결과 확인
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                    </button>
                </div>
            </div>
        </section>
    );

    return (
        <div className="min-h-screen flex items-start justify-center p-4 bg-slate-100 dark:bg-gray-900 font-sans">
            <main className="w-full max-w-7xl mx-auto bg-white dark:bg-gray-800 rounded-2xl shadow-lg transition-colors duration-300 my-8">
                <div className="p-8 printable-content">
                    <header className="mb-10 relative">
                        <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 text-center sm:text-left">
                            <img src={logoDataUri} alt="편한세무회계 로고" className="h-16 w-auto flex-shrink-0" />
                            <div>
                                <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
                                    {companyName
                                        ? `${companyName} - ${entityType === 'individual' ? '종합소득세' : entityType === 'corporate' ? '법인세' : ''} 가결산 보고서`
                                        : `종합소득세/법인세 가결산 계산기`
                                    }
                                </h1>
                                <p className="text-gray-500 dark:text-gray-400 mt-2">
                                    {companyName && entityType
                                        ? `귀사 '${companyName}'의 ${entityType === 'individual' ? '종합소득세' : '법인세'} 가결산 결과입니다.`
                                        : `세액을 시뮬레이션하고 절세 전략을 수립하여 합리적인 의사결정을 하세요.`
                                    }
                                </p>
                            </div>
                        </div>
                        {viewMode === 'result' && (
                            <div className="no-print absolute top-0 right-0 flex items-center gap-4">
                                <button
                                    onClick={() => setViewMode('input')}
                                    aria-label="입력 수정"
                                    className="bg-slate-200 dark:bg-gray-700 text-slate-800 dark:text-slate-200 font-semibold py-2 px-4 rounded-lg hover:bg-slate-300 dark:hover:bg-gray-600 transition-colors duration-200 flex items-center gap-2"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                    입력 수정
                                </button>
                                <button
                                    onClick={handlePrint}
                                    aria-label="결과 PDF로 저장"
                                    className="bg-brand-blue text-white font-semibold py-2 px-4 rounded-lg hover:bg-brand-blue-dark transition-colors duration-200 flex items-center gap-2"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm-6-4h.01M9 16h.01" />
                                    </svg>
                                    PDF/인쇄
                                </button>
                            </div>
                        )}
                    </header>
                    {viewMode === 'input' ? renderInputPage() : (
                        <section className="result-section">
                            {renderResultContent()}
                        </section>
                    )}
                    {viewMode === 'result' && hasInputs && (
                        <footer className="print-footer">
                            {disclaimerText}
                        </footer>
                    )}
                </div>
            </main>
        </div>
    );
};

export default App;
