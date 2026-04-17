import DOMPurify from 'dompurify'

export const sanitizeHtml = (value: string): string => DOMPurify.sanitize(value)
