import { Card, Divider, Select, Stack, Text, TextInput, Textarea } from '@mantine/core';
import { useMemo } from 'react';
import { useFormBuilder } from '../../context/FormBuilderContext';
import type { ColumnSchema, FieldSchema, SectionSchema } from '../../types/formSchema';
import { edmsProperties } from '../../data/edmsProperties';

export const PropertiesPanel = () => {
  const { schema, selection, updateForm, updateSection, updateField } = useFormBuilder();

  const selectedSection = useMemo<SectionSchema | undefined>(() => {
    if (selection?.type !== 'section') return undefined;
    return schema.sections.find((section) => section.id === selection.id);
  }, [schema.sections, selection]);

  const selectedField = useMemo<FieldSchema | undefined>(() => {
    if (!selection || selection.type !== 'field') return undefined;
    const fieldId = selection.id;
    function findFieldInColumns(columns: ColumnSchema[]): FieldSchema | undefined {
      for (const column of columns) {
        const direct = column.fields.find((field) => field.id === fieldId);
        if (direct) return direct;
        for (const nested of column.nestedTables || []) {
          const nestedMatch = findFieldInRows(nested.rows);
          if (nestedMatch) return nestedMatch;
        }
      }
      return undefined;
    }

    function findFieldInRows(rows: SectionSchema['rows']): FieldSchema | undefined {
      for (const row of rows) {
        const match = findFieldInColumns(row.columns);
        if (match) return match;
      }
      return undefined;
    }

    for (const section of schema.sections) {
      const match = findFieldInRows(section.rows);
      if (match) return match;
    }

    return undefined;
  }, [schema.sections, selection]);

  return (
    <Card padding="md" radius="md" withBorder>
      <Stack gap="md">
        <Text fw={700}>Properties</Text>
        {!selection && (
          <Text size="sm" c="dimmed">
            Select a section, row, or field to edit its properties.
          </Text>
        )}

        {selection?.type === 'form' && (
          <>
            <TextInput
              label="Form name"
              value={schema.name}
              onChange={(event) => updateForm({ name: event.currentTarget.value })}
            />
            <Textarea
              label="Description"
              value={schema.description || ''}
              onChange={(event) =>
                updateForm({
                  description: event.currentTarget.value,
                })
              }
              autosize
              minRows={3}
            />
          </>
        )}

        {selection?.type === 'section' && selectedSection && (
          <>
            <Divider label="Section" labelPosition="left" />
            <TextInput
              label="Title"
              value={selectedSection.title}
              onChange={(event) =>
                updateSection(selectedSection.id, { title: event.currentTarget.value })
              }
            />
          </>
        )}

        {selection?.type === 'field' && selectedField && (
          <>
            <Divider label="Field" labelPosition="left" />
            <TextInput
              label="Label"
              value={selectedField.label}
              onChange={(event) =>
                updateField(selectedField.id, { label: event.currentTarget.value })
              }
            />
            <TextInput
              label="Name"
              value={selectedField.name}
              onChange={(event) =>
                updateField(selectedField.id, { name: event.currentTarget.value })
              }
            />
            <TextInput
              label="Placeholder"
              value={selectedField.placeholder || ''}
              onChange={(event) =>
                updateField(selectedField.id, {
                  placeholder: event.currentTarget.value,
                })
              }
            />
            <Textarea
              label="Help text"
              value={selectedField.helpText || ''}
              onChange={(event) =>
                updateField(selectedField.id, { helpText: event.currentTarget.value })
              }
              autosize
              minRows={2}
            />
            <Select
              label="Bind to EDMS property"
              placeholder="Choose a property"
              searchable
              clearable
              data={edmsProperties.map((prop) => ({ value: prop, label: prop }))}
              value={selectedField.bindingProperty || null}
              onChange={(value) => {
                const updates: Partial<FieldSchema> = {
                  bindingProperty: value || undefined,
                };
                if (value) {
                  if (selectedField.name.startsWith('field_')) {
                    updates.name = value;
                  }
                  updates.defaultValue = `\${${value}}`;
                }
                updateField(selectedField.id, updates);
              }}
              description="Select a system property to link this field."
            />
          </>
        )}
      </Stack>
    </Card>
  );
};
