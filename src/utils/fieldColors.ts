import type { FieldType } from '../types/formSchema';

export const fieldColors: Record<FieldType, string> = {
  text: '#3b82f6', // Blue
  textarea: '#8b5cf6', // Purple
  number: '#10b981', // Green
  date: '#f59e0b', // Amber
  select: '#ec4899', // Pink
  checkbox: '#14b8a6', // Teal
  radio: '#f97316', // Orange
};

export const getFieldColor = (type: FieldType): string => {
  return fieldColors[type] || '#6b7280'; // Gray fallback
};

export const staticBlockColor = '#64748b'; // Slate gray for static blocks
