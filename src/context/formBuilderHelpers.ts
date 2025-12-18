import type {
  FieldSchema,
  FieldType,
  RowSchema,
  SectionSchema,
  StaticBlockSchema,
  TableSchema,
} from '../types/formSchema';
import { createId } from '../types/formSchema';

export const createDefaultField = (type: FieldType = 'text'): FieldSchema => {
  const label = `${type[0].toUpperCase()}${type.slice(1)} field`;
  return {
    id: createId(),
    type,
    name: `field_${Math.random().toString(36).slice(2, 6)}`,
    label,
    bindingProperty: undefined,
    placeholder: `Enter ${label.toLowerCase()}`,
    options:
      type === 'select' || type === 'radio'
        ? [
            { label: 'Option 1', value: 'option1' },
            { label: 'Option 2', value: 'option2' },
          ]
        : undefined,
    validations: [],
  };
};

export const createStaticBlock = (html?: string, type: 'html' | 'richtext' = 'html'): StaticBlockSchema => ({
  id: createId(),
  html: html || '<p>Add your text</p>',
  label: type === 'richtext' ? 'Rich text' : 'Static HTML',
  type,
});

export const createEmptyRow = (): RowSchema => ({
  id: createId(),
  columns: [
    {
      id: createId(),
      span: 4 as const,
      fields: [],
      staticBlocks: [],
      nestedTables: [] as const as TableSchema[],
    },
  ],
});

export const createEmptySection = (title?: string): SectionSchema => ({
  id: createId(),
  title: title || 'Untitled section',
  rows: [createEmptyRow()],
});

export const createTableSection = (title?: string, columns?: number): SectionSchema => {
  const numColumns = Math.min(Math.max(columns || 2, 1), 4);
  const columnArray = Array.from({ length: numColumns }, () => ({
    id: createId(),
    span: 4 as const,
    fields: [createDefaultField('text')],
    staticBlocks: [],
    colSpan: 1 as const,
    rowSpan: 1 as const,
    nestedTables: [],
  }));

  return {
    id: createId(),
    title: title || 'Table section',
    layout: 'table' as const,
    tableAttributes: { border: '1', cellpadding: '6', cellspacing: '0' },
    rows: [
      {
        id: createId(),
        columns: columnArray,
      },
    ],
  };
};

export const createNestedTable = (): TableSchema => ({
  id: createId(),
  tableAttributes: { border: '1', cellpadding: '4', cellspacing: '0' },
  rows: [
    {
      id: createId(),
      columns: [
        {
          id: createId(),
          span: 4 as const,
          fields: [createDefaultField('text')],
          staticBlocks: [],
          colSpan: 1 as const,
          rowSpan: 1 as const,
          nestedTables: [],
        },
      ],
    },
  ],
});
