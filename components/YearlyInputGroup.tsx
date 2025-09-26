
import React from 'react';
import CalculatorInput from './CalculatorInput';
import CalculatedDisplayInput from './CalculatedDisplayInput';
import type { YearData, CalculationResult } from '../types';

interface YearlyInputGroupProps {
    year: number;
    yearData: YearData;
    calculations: CalculationResult | undefined;
    onDataChange: (field: keyof YearData, value: string) => void;
}

const YearlyInputGroup: React.FC<YearlyInputGroupProps> = ({ year, yearData, calculations, onDataChange }) => {
    const handleChange = (field: keyof YearData) => (e: React.ChangeEvent<HTMLInputElement>) => {
        onDataChange(field, e.target.value);
    };

    return (
        <div className="flex flex-col gap-4 p-4 bg-slate-50 dark:bg-gray-800/50 rounded-lg border border-slate-200 dark:border-gray-700">
            <h3 className="text-lg font-bold text-center text-gray-800 dark:text-gray-200 mb-2">{year}년 손익계산서</h3>
            <CalculatorInput
                id={`revenue-${year}`}
                label="매출액"
                value={yearData.revenue}
                onChange={handleChange('revenue')}
                placeholder="예: 100"
                unit="백만원"
                icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>}
            />
            <CalculatorInput
                id={`cogs-${year}`}
                label="매출원가"
                value={yearData.cogs}
                onChange={handleChange('cogs')}
                placeholder="예: 40"
                unit="백만원"
                icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7l8 4" /></svg>}
            />
            <CalculatedDisplayInput
                label="매출총이익"
                value={calculations?.grossProfit}
            />
            <CalculatorInput
                id={`sga-${year}`}
                label="판매비와 관리비"
                value={yearData.sga}
                onChange={handleChange('sga')}
                placeholder="예: 20"
                unit="백만원"
                icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>}
            />
            <CalculatedDisplayInput
                label="영업이익"
                value={calculations?.operatingIncome}
            />
            <CalculatorInput
                id={`nonOpIncome-${year}`}
                label="영업외수익"
                value={yearData.nonOpIncome}
                onChange={handleChange('nonOpIncome')}
                placeholder="예: 1"
                unit="백만원"
                icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
            />
            <CalculatorInput
                id={`nonOpExpense-${year}`}
                label="영업외비용"
                value={yearData.nonOpExpense}
                onChange={handleChange('nonOpExpense')}
                placeholder="예: 0.5"
                unit="백만원"
                icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 12H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
            />
            <CalculatedDisplayInput
                label="법인세비용차감전순이익 (조정 전)"
                value={calculations?.currentNetIncomeBeforeAdjustment}
            />
            <CalculatorInput
                id={`additionalExpenses-${year}`}
                label="추가 비용 (절세 항목)"
                value={yearData.additionalExpenses}
                onChange={handleChange('additionalExpenses')}
                placeholder="예: 1"
                unit="백만원"
                icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 13h6m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>}
            />
            <CalculatedDisplayInput
                label="법인세비용차감전순이익 (조정 후)"
                value={calculations?.currentNetIncomeAfterAdjustment}
                isHighlighted={true}
            />
        </div>
    );
};

export default YearlyInputGroup;
