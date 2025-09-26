
import React from 'react';

interface CalculatorInputProps {
    id: string;
    label: string;
    value: string | number;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    placeholder: string;
    icon: React.ReactNode;
    unit?: string;
}

const CalculatorInput: React.FC<CalculatorInputProps> = ({ id, label, value, onChange, placeholder, icon, unit = '백만원' }) => {
    return (
        <div>
            <label htmlFor={id} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{label}</label>
            <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    {icon}
                </div>
                <input
                    type="number"
                    id={id}
                    name={id}
                    value={value}
                    onChange={onChange}
                    placeholder={placeholder}
                    className="w-full pl-10 pr-20 py-3 bg-slate-100 dark:bg-gray-700 border border-slate-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-blue dark:focus:ring-brand-blue-dark focus:border-brand-blue dark:focus:border-brand-blue-dark transition-colors duration-200 text-gray-900 dark:text-white text-right"
                    min="0"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-gray-400">
                    {unit}
                </div>
            </div>
        </div>
    );
};

export default CalculatorInput;
