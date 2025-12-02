import type {
  FieldSchema,
  FieldType,
  RowSchema,
  SectionSchema,
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

export const createEmptyRow = (): RowSchema => ({
  id: createId(),
  columns: [
    {
      id: createId(),
      span: 4 as 4,
      fields: [],
      nestedTables: [] as TableSchema[],
    },
  ],
});

export const createEmptySection = (title?: string): SectionSchema => ({
  id: createId(),
  title: title || 'Untitled section',
  rows: [createEmptyRow()],
});

export const createTableSection = (title?: string): SectionSchema => ({
  id: createId(),
  title: title || 'Table section',
  layout: 'table',
  tableAttributes: { border: '1', cellpadding: '6', cellspacing: '0' },
  rows: [
    {
      id: createId(),
      columns: [
        {
          id: createId(),
          span: 4 as 4,
          fields: [createDefaultField('text')],
          colSpan: 1 as 1,
          rowSpan: 1 as 1,
          nestedTables: [],
        },
        {
          id: createId(),
          span: 4 as 4,
          fields: [createDefaultField('text')],
          colSpan: 1 as 1,
          rowSpan: 1 as 1,
          nestedTables: [],
        },
      ],
    },
  ],
});

export const createNestedTable = (): TableSchema => ({
  id: createId(),
  tableAttributes: { border: '1', cellpadding: '4', cellspacing: '0' },
  rows: [
    {
      id: createId(),
      columns: [
        {
          id: createId(),
          span: 4 as 4,
          fields: [createDefaultField('text')],
          colSpan: 1 as 1,
          rowSpan: 1 as 1,
          nestedTables: [],
        },
      ],
    },
  ],
});
