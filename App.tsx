import React, { useState, useMemo, useEffect } from 'react';
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

const calculateAllMetrics = (data: YearData, settlementMonth: number, entityType: EntityType, includeLocalTax: boolean, taxCreditRate: number, industry: string): CalculationResult => {
    if (!entityType)
        return {}; 
    
    // 이제 원 단위로 직접 입력
    const numRevenue = Number(data.revenue) || 0;
    const numCogs = Number(data.cogs) || 0;
    const numSga = Number(data.sga) || 0;
    const numNonOpIncome = Number(data.nonOpIncome) || 0;
    const numNonOpExpense = Number(data.nonOpExpense) || 0;
    const numAdditionalExpenses = Number(data.additionalExpenses) || 0;
    
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
    const [currentPage, setCurrentPage] = useState<1 | 2 | 3>(1);
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
    const [taxCreditType, setTaxCreditType] = useState<TaxCreditType>(null);
    const [taxCreditRate, setTaxCreditRate] = useState(0);
    const [aiAnalysis, setAiAnalysis] = useState<string>('');
    const [isLoadingAnalysis, setIsLoadingAnalysis] = useState(false);

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
        // 인쇄 전에 모든 페이지 표시
        const printContent = document.createElement('div');
        printContent.innerHTML = `
            <style>
                @page { margin: 20mm; }
                .page-break { page-break-after: always; }
                .no-print { display: none !important; }
            </style>
        `;
        
        // 현재 페이지 상태 저장
        const originalPage = currentPage;
        
        // 모든 페이지를 순서대로 렌더링
        setTimeout(() => {
            window.print();
            // 인쇄 후 원래 페이지로 복원
            setCurrentPage(originalPage);
        }, 100);
    };

    const handleViewResult = async () => {
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
        setCurrentPage(1);
        
        // AI 분석 요청
        if (hasInputs) {
            await getAIAnalysis();
        }
    };

    const getAIAnalysis = async () => {
        setIsLoadingAnalysis(true);
        try {
            const calcs2025 = allCalculations[2025] || {};
            const calcs2024 = allCalculations[2024] || {};
            const calcs2023 = allCalculations[2023] || {};

            const prompt = `
                다음은 ${companyName || '회사'}의 3개년 재무 데이터입니다:
                
                2023년: 연환산 매출 ${formatCurrency(calcs2023.annualizedRevenue)}, 연환산 순이익 ${formatCurrency(calcs2023.annualizedNetIncomeAfterAdjustment)}
                2024년: 연환산 매출 ${formatCurrency(calcs2024.annualizedRevenue)}, 연환산 순이익 ${formatCurrency(calcs2024.annualizedNetIncomeAfterAdjustment)}
                2025년: 연환산 매출 ${formatCurrency(calcs2025.annualizedRevenue)}, 연환산 순이익 ${formatCurrency(calcs2025.annualizedNetIncomeAfterAdjustment)}
                
                업종: ${industry}
                사업자 유형: ${entityType === 'individual' ? '개인사업자' : '법인사업자'}
                예상 최종세액 (2025년): ${formatCurrency(calcs2025.finalTaxAfter)}
                절세효과: ${formatCurrency(calcs2025.taxSavings)}
                
                위 데이터를 기반으로 다음을 분석해주세요:
                1. 3개년 매출 및 순이익 트렌드 분석
                2. 업종 평균 대비 수익성 평가
                3. 절세 전략 및 추가 제안사항
                4. 주요 리스크 및 개선점
                
                분석은 전문적이면서도 이해하기 쉽게 작성해주시고, 구체적인 수치를 활용해주세요.
                HTML 형식으로 작성하되, <h4>, <p>, <ul>, <li>, <strong> 태그만 사용해주세요.
            `;

            const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=AIzaSyC387HwCBLB8i5oaWKbsvttneOH_Uv0lWM', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: prompt
                        }]
                    }],
                    generationConfig: {
                        temperature: 0.7,
                        maxOutputTokens: 1000,
                    }
                })
            });

            if (!response.ok) {
                console.error('API 응답 오류:', response.status, response.statusText);
                const errorText = await response.text();
                console.error('오류 상세:', errorText);
                throw new Error(`API 요청 실패: ${response.status}`);
            }

            const data = await response.json();
            console.log('API 응답:', data);
            
            if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts) {
                setAiAnalysis(data.candidates[0].content.parts[0].text);
            } else {
                console.error('예상치 못한 응답 구조:', data);
                setAiAnalysis('<p>AI 분석 결과를 처리할 수 없습니다.</p>');
            }
        } catch (error) {
            console.error('AI 분석 오류 상세:', error);
            setAiAnalysis(`<p>AI 분석을 불러올 수 없습니다. 오류: ${error instanceof Error ? error.message : '알 수 없는 오류'}</p>`);
        } finally {
            setIsLoadingAnalysis(false);
        }
    };

    const hasInputs = Object.values(yearsData).some(data => Object.values(data).some(value => value !== ''));

    const getMonthLabel = (month: number) => {
        if (month === 6) return '반기';
        return `${month}월`;
    };

    const renderPage1 = () => {
        const calcs2025 = allCalculations[2025] || {};
        let taxSavingsAfterRatio = 0;
        if (calcs2025.finalTaxBefore && calcs2025.finalTaxBefore > 0) {
            taxSavingsAfterRatio = Math.min(1, Math.max(0, (calcs2025.finalTaxAfter || 0) / calcs2025.finalTaxBefore));
        }

        return (
            <div className="page-content page-break">
                <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white border-b-2 border-brand-blue pb-3">
                    2025년 상세 분석 결과
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="overflow-x-auto md:col-span-2">
                        <table className="w-full text-sm text-gray-900 dark:text-white">
                            <thead className="text-xs text-gray-700 uppercase bg-gradient-to-r from-brand-blue/10 to-brand-blue/5 dark:from-brand-blue/30 dark:to-brand-blue/20">
                                <tr>
                                    <th scope="col" className="px-4 py-3 font-semibold">항목 (2025년)</th>
                                    <th scope="col" className="px-4 py-3 text-right font-semibold">{getMonthLabel(settlementMonth || 12)} 손익</th>
                                    <th scope="col" className="px-4 py-3 text-right font-semibold">12개월 환산</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                <tr className="hover:bg-slate-100 dark:hover:bg-gray-700/50 transition-colors">
                                    <td className="px-4 py-2 text-gray-600 dark:text-gray-400">매출액</td>
                                    <td className="px-4 py-2 text-right">{formatCurrency(calcs2025.numRevenue)}</td>
                                    <td className="px-4 py-2 text-right">{formatCurrency(calcs2025.annualizedRevenue)}</td>
                                </tr>
                                <tr className="hover:bg-slate-100 dark:hover:bg-gray-700/50 transition-colors">
                                    <td className="px-4 py-2 text-gray-600 dark:text-gray-400">매출원가</td>
                                    <td className="px-4 py-2 text-right">{formatCurrency(calcs2025.numCogs)}</td>
                                    <td className="px-4 py-2 text-right">{formatCurrency(calcs2025.annualizedCogs)}</td>
                                </tr>
                                <tr className="font-semibold bg-gradient-to-r from-emerald-50 to-transparent dark:from-emerald-900/20">
                                    <td className="px-4 py-2">매출총이익</td>
                                    <td className="px-4 py-2 text-right">{formatCurrency(calcs2025.grossProfit)}</td>
                                    <td className="px-4 py-2 text-right">{formatCurrency(calcs2025.annualizedGrossProfit)}</td>
                                </tr>
                                <tr className="hover:bg-slate-100 dark:hover:bg-gray-700/50 transition-colors">
                                    <td className="px-4 py-2 text-gray-600 dark:text-gray-400">판매비와 관리비</td>
                                    <td className="px-4 py-2 text-right">{formatCurrency(calcs2025.numSga)}</td>
                                    <td className="px-4 py-2 text-right">{formatCurrency(calcs2025.annualizedSga)}</td>
                                </tr>
                                <tr className="font-semibold bg-gradient-to-r from-sky-50 to-transparent dark:from-sky-900/20">
                                    <td className="px-4 py-2">영업이익</td>
                                    <td className="px-4 py-2 text-right">{formatCurrency(calcs2025.operatingIncome)}</td>
                                    <td className="px-4 py-2 text-right">{formatCurrency(calcs2025.annualizedOperatingIncome)}</td>
                                </tr>
                                <tr className="hover:bg-slate-100 dark:hover:bg-gray-700/50 transition-colors">
                                    <td className="px-4 py-2 text-gray-600 dark:text-gray-400">영업외수익</td>
                                    <td className="px-4 py-2 text-right">{formatCurrency(calcs2025.numNonOpIncome)}</td>
                                    <td className="px-4 py-2 text-right">{formatCurrency(calcs2025.annualizedNonOpIncome)}</td>
                                </tr>
                                <tr className="hover:bg-slate-100 dark:hover:bg-gray-700/50 transition-colors">
                                    <td className="px-4 py-2 text-gray-600 dark:text-gray-400">영업외비용</td>
                                    <td className="px-4 py-2 text-right">{formatCurrency(calcs2025.numNonOpExpense)}</td>
                                    <td className="px-4 py-2 text-right">{formatCurrency(calcs2025.annualizedNonOpExpense)}</td>
                                </tr>
                                <tr className="bg-gradient-to-r from-amber-50 to-transparent dark:from-amber-900/20 font-bold">
                                    <td className="px-4 py-2">법인세비용차감전순이익 (조정 전)</td>
                                    <td className="px-4 py-2 text-right">{formatCurrency(calcs2025.currentNetIncomeBeforeAdjustment)}</td>
                                    <td className="px-4 py-2 text-right">{formatCurrency(calcs2025.annualizedNetIncomeBeforeAdjustment)}</td>
                                </tr>
                                <tr className="hover:bg-slate-100 dark:hover:bg-gray-700/50 transition-colors">
                                    <td className="px-4 py-2 text-gray-600 dark:text-gray-400">추가 비용 (절세 항목)</td>
                                    <td className="px-4 py-2 text-right text-red-600 dark:text-red-400">-{formatCurrency(calcs2025.numAdditionalExpenses)}</td>
                                    <td className="px-4 py-2 text-right text-red-600 dark:text-red-400">-{formatCurrency(calcs2025.numAdditionalExpenses)}</td>
                                </tr>
                                <tr className="bg-gradient-to-r from-brand-blue/20 to-brand-blue/10 dark:from-brand-blue/40 dark:to-brand-blue/20 font-bold text-base">
                                    <td className="px-4 py-3 text-brand-blue dark:text-sky-200">법인세비용차감전순이익 (조정 후)</td>
                                    <td className="px-4 py-3 text-right text-brand-blue dark:text-sky-200">{formatCurrency(calcs2025.currentNetIncomeAfterAdjustment)}</td>
                                    <td className="px-4 py-3 text-right text-brand-blue dark:text-sky-200">{formatCurrency(calcs2025.annualizedNetIncomeAfterAdjustment)}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    
                    <div className="md:col-span-2">
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">2025년 예상 최종세액</h3>
                        <div className="bg-gradient-to-br from-brand-blue via-brand-blue-dark to-brand-blue text-white p-8 rounded-2xl shadow-2xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -mr-32 -mt-32"></div>
                            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white opacity-5 rounded-full -ml-24 -mb-24"></div>
                            <div className="relative">
                                <p className="text-blue-100 text-sm uppercase tracking-wider">{includeLocalTax ? "지방세 포함" : "지방세 미포함"}</p>
                                <p className="text-5xl font-bold mt-2 mb-4">{formatCurrency(calcs2025.finalTaxAfter)}</p>
                                <div className="flex items-center gap-6 text-sm text-blue-100">
                                    <div>
                                        <span className="opacity-75">기본세액</span>
                                        <span className="ml-2 font-semibold">{formatCurrency(calcs2025.baseTaxAfter)}</span>
                                    </div>
                                    {taxCreditRate > 0 && (
                                        <div>
                                            <span className="opacity-75">세액공제</span>
                                            <span className="ml-2 font-semibold">-{formatCurrency(calcs2025.taxCreditAmountAfter)}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {calcs2025.taxSavings && calcs2025.taxSavings > 0 && (
                        <div className="md:col-span-2">
                            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">절세 효과 분석</h3>
                            <div className="p-6 bg-gradient-to-r from-emerald-50 to-sky-50 dark:from-emerald-900/20 dark:to-sky-900/20 rounded-xl border border-emerald-200 dark:border-emerald-800">
                                <div className="flex justify-between items-center mb-4">
                                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">조정 전 세액</span>
                                    <span className="text-lg font-bold text-gray-800 dark:text-gray-200">{formatCurrency(calcs2025.finalTaxBefore)}</span>
                                </div>
                                <div className="relative h-8 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                    <div className="absolute inset-0 bg-gradient-to-r from-brand-blue to-sky-500 transition-all duration-1000" 
                                         style={{ width: `${taxSavingsAfterRatio * 100}%` }}></div>
                                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-emerald-500 transition-all duration-1000" 
                                         style={{ left: `${taxSavingsAfterRatio * 100}%` }}></div>
                                </div>
                                <div className="flex justify-between items-center mt-4">
                                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">절감액</span>
                                    <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">-{formatCurrency(calcs2025.taxSavings)}</span>
                                </div>
                            </div>
                        </div>
                    )}
                    
                    <div className="md:col-span-2">
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">업종 평균 대비 분석 ({industry})</h3>
                        <div className="p-6 bg-gradient-to-br from-slate-100 to-slate-50 dark:from-gray-800/60 dark:to-gray-800/40 rounded-xl">
                            <div className="grid grid-cols-2 gap-6">
                                <div className="text-center p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                                    <p className="text-xs text-gray-500 uppercase tracking-wider">귀사 순이익률</p>
                                    <p className="text-3xl font-bold text-brand-blue dark:text-sky-400 mt-2">
                                        {calcs2025.annualizedRevenue ? ((calcs2025.annualizedNetIncomeAfterAdjustment || 0) / calcs2025.annualizedRevenue * 100).toFixed(2) : '0.00'}%
                                    </p>
                                </div>
                                <div className="text-center p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                                    <p className="text-xs text-gray-500 uppercase tracking-wider">업종 평균</p>
                                    <p className="text-3xl font-bold text-gray-700 dark:text-gray-300 mt-2">
                                        {((calcs2025.profitMargin || 0) * 100).toFixed(2)}%
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const renderPage2 = () => {
        const metrics = [
            { key: 'annualizedRevenue' as const, label: '연환산매출', color: 'rgb(14, 165, 233)' },
            { key: 'annualizedOperatingIncome' as const, label: '영업이익', color: 'rgb(34, 197, 94)' },
            { key: 'annualizedNetIncomeAfterAdjustment' as const, label: '당기순이익', color: 'rgb(27, 63, 122)' },
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

        // 성장률 계산
        const revenueGrowth2024 = allCalculations[2023].annualizedRevenue 
            ? ((allCalculations[2024].annualizedRevenue || 0) - (allCalculations[2023].annualizedRevenue || 0)) / (allCalculations[2023].annualizedRevenue || 1) * 100
            : 0;
        const revenueGrowth2025 = allCalculations[2024].annualizedRevenue 
            ? ((allCalculations[2025].annualizedRevenue || 0) - (allCalculations[2024].annualizedRevenue || 0)) / (allCalculations[2024].annualizedRevenue || 1) * 100
            : 0;

        return (
            <div className="page-content page-break">
                <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white border-b-2 border-brand-blue pb-3">
                    3개년 경영성과 분석
                </h2>

                <div className="grid grid-cols-1 gap-6">
                    <div className="bg-gradient-to-br from-white to-slate-50 dark:from-gray-800 dark:to-gray-900 p-6 rounded-xl shadow-lg">
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">연도별 핵심지표 비교</h3>
                        
                        <div className="overflow-x-auto mb-6">
                            <table className="w-full text-sm">
                                <thead className="text-xs uppercase bg-gradient-to-r from-brand-blue/10 to-brand-blue/5">
                                    <tr>
                                        <th className="px-4 py-3 text-left">지표</th>
                                        {YEARS.map(year => <th key={year} className="px-4 py-3 text-right">{year}년</th>)}
                                        <th className="px-4 py-3 text-right">3년 평균</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {metrics.map(metric => {
                                        const avg = YEARS.reduce((sum, year) => sum + (allCalculations[year][metric.key] || 0), 0) / YEARS.length;
                                        return (
                                            <tr key={metric.key} className="hover:bg-slate-50 dark:hover:bg-gray-800/50">
                                                <td className="px-4 py-3 font-medium">{metric.label}</td>
                                                {YEARS.map(year => (
                                                    <td key={year} className="px-4 py-3 text-right">{formatCurrency(allCalculations[year][metric.key])}</td>
                                                ))}
                                                <td className="px-4 py-3 text-right font-semibold">{formatCurrency(avg)}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        <div className="bg-slate-100 dark:bg-gray-800 p-6 rounded-lg">
                            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">시각화 차트</h4>
                            <div className="relative h-64">
                                <svg className="w-full h-full" viewBox="0 0 600 250">
                                    {/* Grid lines */}
                                    {[0, 25, 50, 75, 100].map(percent => (
                                        <line
                                            key={percent}
                                            x1="50"
                                            y1={200 - percent * 2}
                                            x2="550"
                                            y2={200 - percent * 2}
                                            stroke="#e5e7eb"
                                            strokeDasharray="2,2"
                                        />
                                    ))}
                                    
                                    {/* Bars */}
                                    {chartData.map((data, yearIndex) => (
                                        <g key={data.year} transform={`translate(${100 + yearIndex * 150}, 0)`}>
                                            {data.values.map((value, metricIndex) => {
                                                const height = (value / maxAmount) * 180;
                                                const width = 30;
                                                const x = metricIndex * 35;
                                                const y = 200 - height;
                                                
                                                return (
                                                    <g key={metricIndex}>
                                                        <rect
                                                            x={x}
                                                            y={y}
                                                            width={width}
                                                            height={height}
                                                            fill={metrics[metricIndex].color}
                                                            opacity="0.8"
                                                            rx="4"
                                                        />
                                                        <text
                                                            x={x + width / 2}
                                                            y={y - 5}
                                                            textAnchor="middle"
                                                            className="text-xs fill-gray-600 dark:fill-gray-400"
                                                        >
                                                            {(value / 1000000).toFixed(0)}
                                                        </text>
                                                    </g>
                                                );
                                            })}
                                            <text
                                                x={52}
                                                y={220}
                                                textAnchor="middle"
                                                className="text-sm font-semibold fill-gray-700 dark:fill-gray-300"
                                            >
                                                {data.year}
                                            </text>
                                        </g>
                                    ))}
                                    
                                    {/* Legend */}
                                    {metrics.map((metric, index) => (
                                        <g key={metric.key} transform={`translate(${80 + index * 120}, 235)`}>
                                            <rect width="12" height="12" fill={metric.color} opacity="0.8" rx="2" />
                                            <text x="16" y="9" className="text-xs fill-gray-600 dark:fill-gray-400">
                                                {metric.label}
                                            </text>
                                        </g>
                                    ))}
                                </svg>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20 p-6 rounded-xl">
                            <h4 className="text-lg font-semibold text-emerald-800 dark:text-emerald-300 mb-3">매출 성장률</h4>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-600 dark:text-gray-400">2023 → 2024</span>
                                    <span className={`text-lg font-bold ${revenueGrowth2024 >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                        {revenueGrowth2024 >= 0 ? '+' : ''}{revenueGrowth2024.toFixed(1)}%
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-600 dark:text-gray-400">2024 → 2025</span>
                                    <span className={`text-lg font-bold ${revenueGrowth2025 >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                        {revenueGrowth2025 >= 0 ? '+' : ''}{revenueGrowth2025.toFixed(1)}%
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-gradient-to-br from-sky-50 to-sky-100 dark:from-sky-900/20 dark:to-sky-800/20 p-6 rounded-xl">
                            <h4 className="text-lg font-semibold text-sky-800 dark:text-sky-300 mb-3">수익성 지표</h4>
                            <div className="space-y-3">
                                {YEARS.map(year => {
                                    const margin = allCalculations[year].annualizedRevenue 
                                        ? ((allCalculations[year].annualizedNetIncomeAfterAdjustment || 0) / allCalculations[year].annualizedRevenue * 100)
                                        : 0;
                                    return (
                                        <div key={year} className="flex justify-between items-center">
                                            <span className="text-sm text-gray-600 dark:text-gray-400">{year}년 순이익률</span>
                                            <span className="text-lg font-bold text-sky-600 dark:text-sky-400">
                                                {margin.toFixed(1)}%
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const renderPage3 = () => {
        return (
            <div className="page-content">
                <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white border-b-2 border-brand-blue pb-3">
                    AI 기반 종합 분석 리포트
                </h2>

                <div className="grid grid-cols-1 gap-6">
                    {isLoadingAnalysis ? (
                        <div className="flex flex-col items-center justify-center py-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-blue"></div>
                            <p className="mt-4 text-gray-600 dark:text-gray-400">AI가 데이터를 분석 중입니다...</p>
                        </div>
                    ) : aiAnalysis ? (
                        <div className="bg-gradient-to-br from-white to-slate-50 dark:from-gray-800 dark:to-gray-900 p-8 rounded-xl shadow-lg">
                            <div className="prose prose-lg max-w-none dark:prose-invert ai-analysis-content" 
                                 dangerouslySetInnerHTML={{ __html: aiAnalysis }} />
                        </div>
                    ) : (
                        <div className="bg-yellow-50 dark:bg-yellow-900/20 p-6 rounded-xl border border-yellow-200 dark:border-yellow-800">
                            <p className="text-yellow-800 dark:text-yellow-300">
                                AI 분석을 시작하려면 '결과 확인' 버튼을 다시 클릭해주세요.
                            </p>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                        <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 p-6 rounded-xl">
                            <div className="flex items-center mb-3">
                                <svg className="h-6 w-6 text-purple-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <h4 className="text-lg font-semibold text-purple-800 dark:text-purple-300">핵심 성과</h4>
                            </div>
                            <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                                <li>• 3년 평균 매출 성장률 확인</li>
                                <li>• 수익성 개선 여부 점검</li>
                                <li>• 절세 효과 극대화</li>
                            </ul>
                        </div>

                        <div className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20 p-6 rounded-xl">
                            <div className="flex items-center mb-3">
                                <svg className="h-6 w-6 text-amber-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                                <h4 className="text-lg font-semibold text-amber-800 dark:text-amber-300">주의 사항</h4>
                            </div>
                            <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                                <li>• 업종 평균 대비 편차 확인</li>
                                <li>• 비용 구조 최적화 필요</li>
                                <li>• 세무 리스크 사전 점검</li>
                            </ul>
                        </div>

                        <div className="bg-gradient-to-br from-rose-50 to-rose-100 dark:from-rose-900/20 dark:to-rose-800/20 p-6 rounded-xl">
                            <div className="flex items-center mb-3">
                                <svg className="h-6 w-6 text-rose-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                </svg>
                                <h4 className="text-lg font-semibold text-rose-800 dark:text-rose-300">추천 전략</h4>
                            </div>
                            <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                                <li>• 세액공제 항목 확대 검토</li>
                                <li>• 비용 인정 항목 추가 발굴</li>
                                <li>• 전문 세무사 상담 권고</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const renderResultContent = () => {
        if (!entityType || !settlementMonth || !taxCreditType) {
            return (
                <div className="flex flex-col items-center justify-center h-96 text-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-gray-500 dark:text-gray-400 font-semibold">필수 항목을 모두 입력해주세요.</p>
                </div>
            );
        }

        if (!hasInputs) {
            return (
                <div className="flex flex-col items-center justify-center h-96 text-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p className="text-gray-500 dark:text-gray-400">손익계산서 항목을 입력하고 결과를 확인해주세요.</p>
                </div>
            );
        }

        return (
            <>
                <nav className="no-print flex space-x-1 rounded-lg p-1 bg-gradient-to-r from-slate-200 to-slate-100 dark:from-gray-700 dark:to-gray-800 mb-6">
                    {[1, 2, 3].map((page) => (
                        <button
                            key={page}
                            onClick={() => setCurrentPage(page as 1 | 2 | 3)}
                            className={`flex-1 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
                                currentPage === page 
                                ? 'bg-white dark:bg-gray-900 shadow-lg text-brand-blue dark:text-sky-300 transform scale-105' 
                                : 'text-gray-600 dark:text-gray-400 hover:bg-white/50 dark:hover:bg-gray-900/50'
                            }`}
                        >
                            {page === 1 && '📊 2025년 상세결과'}
                            {page === 2 && '📈 3개년 비교분석'}
                            {page === 3 && '🤖 AI 종합분석'}
                        </button>
                    ))}
                </nav>

                <div className="result-pages">
                    <div style={{ display: currentPage === 1 ? 'block' : 'none' }}>
                        {renderPage1()}
                    </div>
                    <div style={{ display: currentPage === 2 ? 'block' : 'none' }}>
                        {renderPage2()}
                    </div>
                    <div style={{ display: currentPage === 3 ? 'block' : 'none' }}>
                        {renderPage3()}
                    </div>
                </div>

                {/* 인쇄용 전체 페이지 (화면에는 보이지 않음) */}
                <div className="print-only" style={{ display: 'none' }}>
                    <style dangerouslySetInnerHTML={{__html: `
                        @media print {
                            .print-only { display: block !important; }
                            .result-pages { display: none !important; }
                            .no-print { display: none !important; }
                        }
                    `}} />
                    {renderPage1()}
                    {renderPage2()}
                    {renderPage3()}
                </div>
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
                    <fieldset className="grid grid-cols-7 gap-2">
                        {SETTLEMENT_MONTHS.map(month => (
                            <div key={month}>
                                <input type="radio" id={`month-${month}`} name="settlementMonth" value={month} checked={settlementMonth === month} onChange={(e) => setSettlementMonth(Number(e.target.value))} className="sr-only peer" />
                                <label htmlFor={`month-${month}`} className="block w-full text-center py-3 px-2 rounded-lg border-2 cursor-pointer transition-all duration-200 ease-in-out border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 peer-checked:border-brand-blue peer-checked:bg-brand-blue/10 dark:peer-checked:bg-brand-blue/30 peer-checked:text-brand-blue dark:peer-checked:text-sky-300 peer-checked:font-bold text-sm">
                                    {getMonthLabel(month)}
                                </label>
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
        <div className="min-h-screen flex items-start justify-center p-4 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-gray-900 dark:to-gray-800 font-sans">
            <main className="w-full max-w-7xl mx-auto bg-white dark:bg-gray-800 rounded-2xl shadow-2xl transition-colors duration-300 my-8">
                <div className="p-8 printable-content">
                    <header className="mb-10 relative">
                        <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 text-center sm:text-left">
                            <img src="./logo.jpg" alt="편한세무회계 로고" className="h-20 w-auto flex-shrink-0 rounded-lg shadow-md" onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                                const svgIcon = document.createElement('div');
                                svgIcon.innerHTML = `
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-20 w-20 text-brand-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                                        <path stroke-linecap="round" stroke-linejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                    </svg>
                                `;
                                target.parentNode?.insertBefore(svgIcon.firstElementChild!, target);
                            }} />
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
