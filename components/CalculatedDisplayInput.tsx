
import React from 'react';
import { formatCurrency } from '../utils/formatter';

interface CalculatedDisplayInputProps {
    label: string;
    value: number | undefined;
    isHighlighted?: boolean;
}

const CalculatedDisplayInput: React.FC<CalculatedDisplayInputProps> = ({ label, value, isHighlighted = false }) => {
    const labelClasses = "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2";
    const baseValueClasses = "w-full pl-3 pr-10 py-3 border rounded-lg text-right font-semibold";
    const regularValueClasses = "bg-slate-200 dark:bg-gray-800/50 border-slate-300 dark:border-gray-600 text-gray-900 dark:text-white cursor-not-allowed";
    const highlightedValueClasses = "bg-sky-100 dark:bg-sky-900/50 border-sky-300 dark:border-sky-700 text-sky-800 dark:text-sky-200 ring-1 ring-sky-500";

    return (
        <div>
            <label className={labelClasses}>{label}</label>
            <div className="relative">
                <div className={`${baseValueClasses} ${isHighlighted ? highlightedValueClasses : regularValueClasses}`}>
                    {formatCurrency(value)}
                </div>
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-gray-400">
                    원
                </div>
            </div>
        </div>
    );
};

export default CalculatedDisplayInput;
