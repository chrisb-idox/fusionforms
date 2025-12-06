export type FieldType =
  | 'text'
  | 'textarea'
  | 'number'
  | 'date'
  | 'select'
  | 'checkbox'
  | 'radio';

export type ValidationType = 'required' | 'min' | 'max' | 'pattern';

export interface ValidationRule {
  type: ValidationType;
  value?: number | string;
  message?: string;
}

export interface FieldOption {
  label: string;
  value: string;
}

export interface StaticBlockSchema {
  id: string;
  html: string;
  label?: string;
}

export interface FieldSchema {
  id: string;
  type: FieldType;
  name: string;
  label: string;
  bindingProperty?: string;
  originalId?: string;
  originalName?: string;
  htmlAttributes?: Record<string, string>;
  placeholder?: string;
  helpText?: string;
  defaultValue?: string | number | boolean;
  options?: FieldOption[];
  validations?: ValidationRule[];
}

export interface ColumnSchema {
  id: string;
  span: 1 | 2 | 3 | 4;
  fields: FieldSchema[];
  staticBlocks?: StaticBlockSchema[];
  colSpan?: number;
  rowSpan?: number;
  htmlAttributes?: Record<string, string>;
  nestedTables?: TableSchema[];
  staticHtml?: string;
}

export interface RowSchema {
  id: string;
  columns: ColumnSchema[];
  htmlAttributes?: Record<string, string>;
}

export interface SectionSchema {
  id: string;
  title: string;
  rows: RowSchema[];
  layout?: 'table' | 'stack';
  tableAttributes?: Record<string, string>;
}

export interface FormSchema {
  id: string;
  name: string;
  description?: string;
  actionCode?: ActionCode;
  version: number;
  sections: SectionSchema[];
  originalHtml?: string;
  originalHeadHtml?: string;
  originalBodyHtml?: string;
  remainingBodyHtml?: string;
}

export type ActionCode = 'CRE' | 'AMD' | 'CO' | 'CI' | 'DF' | 'SAS' | 'QRY' | 'REC' | 'CPY';

export type Selection =
  | { type: 'form'; id: string }
  | { type: 'section'; id: string }
  | { type: 'row'; id: string }
  | { type: 'field'; id: string }
  | { type: 'static'; id: string };

export interface TableSchema {
  id: string;
  rows: RowSchema[];
  tableAttributes?: Record<string, string>;
}

export const createId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `id-${Math.random().toString(36).slice(2, 9)}`;
