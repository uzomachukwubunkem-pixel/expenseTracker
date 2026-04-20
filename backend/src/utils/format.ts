export const formatNaira = (value: number): string =>
  new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    maximumFractionDigits: 2,
  }).format(value)

export const formatDateISO = (date: Date): string => date.toISOString().slice(0, 10)