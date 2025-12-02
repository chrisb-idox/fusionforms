import type { FieldSchema, FieldType, RowSchema, SectionSchema } from '../types/formSchema';
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
      span: 4,
      fields: [],
    },
  ],
});

export const createEmptySection = (title?: string): SectionSchema => ({
  id: createId(),
  title: title || 'Untitled section',
  rows: [createEmptyRow()],
});
