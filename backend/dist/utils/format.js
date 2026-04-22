export const formatNaira = (value) => new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    maximumFractionDigits: 2,
}).format(value);
export const formatDateISO = (date) => date.toISOString().slice(0, 10);
