import {
  ActionIcon,
  Card,
  Divider,
  Group,
  Select,
  Stack,
  Text,
  TextInput,
  Textarea,
  Tooltip,
} from '@mantine/core';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useFormBuilder } from '../../context/FormBuilderContext';
import type { ColumnSchema, FieldSchema, SectionSchema, StaticBlockSchema } from '../../types/formSchema';
import { edmsProperties } from '../../data/edmsProperties';

export const PropertiesPanel = () => {
  const { schema, selection, updateForm, updateSection, updateField, updateStaticBlock } =
    useFormBuilder();

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

  const selectedStatic = useMemo<StaticBlockSchema | undefined>(() => {
    if (!selection || selection.type !== 'static') return undefined;
    const staticId = selection.id;
    function findStaticInColumns(columns: ColumnSchema[]): StaticBlockSchema | undefined {
      for (const column of columns) {
        const direct = (column.staticBlocks || []).find((block) => block.id === staticId);
        if (direct) return direct;
        for (const nested of column.nestedTables || []) {
          const nestedMatch = findStaticInRows(nested.rows);
          if (nestedMatch) return nestedMatch;
        }
      }
      return undefined;
    }

    function findStaticInRows(rows: SectionSchema['rows']): StaticBlockSchema | undefined {
      for (const row of rows) {
        const match = findStaticInColumns(row.columns);
        if (match) return match;
      }
      return undefined;
    }

    for (const section of schema.sections) {
      const match = findStaticInRows(section.rows);
      if (match) return match;
    }

    return undefined;
  }, [schema.sections, selection]);

  const [staticHtml, setStaticHtml] = useState<string>('<p>New text</p>');
  const textAreaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    const next = selectedStatic?.html || '<p>New text</p>';
    setStaticHtml(next);
  }, [selectedStatic?.id, selectedStatic?.html]);

  const commitStatic = (value: string) => {
    setStaticHtml(value);
    if (selectedStatic) {
      updateStaticBlock(selectedStatic.id, value);
    }
  };

  const wrapSelection = (before: string, after: string) => {
    const node = textAreaRef.current;
    if (!node) return;
    const { selectionStart, selectionEnd, value } = node;
    const selected = value.slice(selectionStart, selectionEnd) || 'Text';
    const nextValue =
      value.slice(0, selectionStart) + before + selected + after + value.slice(selectionEnd);
    commitStatic(nextValue);
    setTimeout(() => {
      const offset = before.length;
      node.focus();
      node.setSelectionRange(selectionStart + offset, selectionStart + offset + selected.length);
    }, 0);
  };

  const handleLink = () => {
    const node = textAreaRef.current;
    if (!node) return;
    const url = window.prompt('Enter URL');
    if (!url) return;
    wrapSelection(`<a href="${url}">`, '</a>');
  };

  const handleClearFormatting = () => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(staticHtml, 'text/html');
    const textContent = doc.body.textContent || '';
    commitStatic(textContent);
  };

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

        {selection?.type === 'static' && selectedStatic && (
          <>
            <Divider label="Static text" labelPosition="left" />
            <Stack gap="xs">
              <Group gap="xs">
                <Tooltip label="Heading 1">
                  <ActionIcon variant="light" onClick={() => wrapSelection('<h1>', '</h1>')}>
                    <Text size="xs">H1</Text>
                  </ActionIcon>
                </Tooltip>
                <Tooltip label="Heading 2">
                  <ActionIcon variant="light" onClick={() => wrapSelection('<h2>', '</h2>')}>
                    <Text size="xs">H2</Text>
                  </ActionIcon>
                </Tooltip>
                <Tooltip label="Bold">
                  <ActionIcon variant="light" onClick={() => wrapSelection('<strong>', '</strong>')}>
                    <Text size="xs" fw={700}>
                      B
                    </Text>
                  </ActionIcon>
                </Tooltip>
                <Tooltip label="Italic">
                  <ActionIcon variant="light" onClick={() => wrapSelection('<em>', '</em>')}>
                    <Text size="xs" fs="italic">
                      I
                    </Text>
                  </ActionIcon>
                </Tooltip>
                <Tooltip label="Underline">
                  <ActionIcon variant="light" onClick={() => wrapSelection('<u>', '</u>')}>
                    <Text size="xs" td="underline">
                      U
                    </Text>
                  </ActionIcon>
                </Tooltip>
                <Tooltip label="Bullet list">
                  <ActionIcon variant="light" onClick={() => wrapSelection('<ul><li>', '</li></ul>')}>
                    <Text size="xs">•</Text>
                  </ActionIcon>
                </Tooltip>
                <Tooltip label="Numbered list">
                  <ActionIcon variant="light" onClick={() => wrapSelection('<ol><li>', '</li></ol>')}>
                    <Text size="xs">1.</Text>
                  </ActionIcon>
                </Tooltip>
                <Tooltip label="Link">
                  <ActionIcon variant="light" onClick={handleLink}>
                    <Text size="xs">🔗</Text>
                  </ActionIcon>
                </Tooltip>
                <Tooltip label="Clear formatting">
                  <ActionIcon variant="light" onClick={handleClearFormatting}>
                    <Text size="xs">Clear</Text>
                  </ActionIcon>
                </Tooltip>
              </Group>
              <Textarea
                ref={textAreaRef}
                label="HTML"
                autosize
                minRows={6}
                value={staticHtml}
                onChange={(event) => commitStatic(event.currentTarget.value)}
                styles={{ input: { fontFamily: 'monospace' } }}
              />
              <Text size="xs" c="dimmed">
                Static blocks render as HTML in exports, similar to imported sample text.
              </Text>
            </Stack>
          </>
        )}
      </Stack>
    </Card>
  );
};
