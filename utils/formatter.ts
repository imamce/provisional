
export const formatCurrency = (value: number | null | undefined): string => {
    if (value === null || value === undefined || isNaN(value)) {
        return '0원';
    }
    return `${Math.round(value).toLocaleString('ko-KR')}원`;
};
