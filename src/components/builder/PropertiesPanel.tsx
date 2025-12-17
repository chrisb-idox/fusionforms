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
  Badge,
  ScrollArea,
  Modal,
  Button,
} from '@mantine/core';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useFormBuilder } from '../../context/FormBuilderContext';
import type { ColumnSchema, FieldSchema, SectionSchema, StaticBlockSchema } from '../../types/formSchema';
import { edmsProperties } from '../../data/edmsProperties';
import { getPropertiesLibrary } from '../../utils/propertiesLibrary';

export const PropertiesPanel = () => {
  const { schema, selection, updateForm, updateSection, updateField, updateStaticBlock } =
    useFormBuilder();

  const propertiesLibrary = useMemo(() => getPropertiesLibrary(), []);

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

  // Class selector modal state
  const [classModalOpen, setClassModalOpen] = useState(false);
  const [tempClass, setTempClass] = useState<string | null>(null);
  const [tempProperty, setTempProperty] = useState<string | null>(null);

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

    let start = selectionStart;
    let end = selectionEnd;

    if (start === end) {
      const prevSpace = value.lastIndexOf(' ', Math.max(0, start - 1));
      const nextSpace = value.indexOf(' ', start);
      start = prevSpace === -1 ? 0 : prevSpace + 1;
      end = nextSpace === -1 ? value.length : nextSpace;
    }

    if (start === end) {
      start = 0;
      end = value.length;
    }

    const selected = value.slice(start, end);
    const nextValue = value.slice(0, start) + before + selected + after + value.slice(end);
    commitStatic(nextValue);

    setTimeout(() => {
      const offset = before.length;
      node.focus();
      node.setSelectionRange(start + offset, start + offset + selected.length);
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

  const handleOpenClassModal = () => {
    setTempClass(selectedField?.bindingClass || null);
    setTempProperty(selectedField?.bindingProperty || null);
    setClassModalOpen(true);
  };

  const handleApplyClassBinding = () => {
    if (!selectedField) return;
    const updates: Partial<FieldSchema> = {
      bindingClass: tempClass || undefined,
      bindingProperty: tempProperty || undefined,
    };
    if (tempProperty) {
      if (selectedField.name.startsWith('field_')) {
        updates.name = tempProperty;
      }
      updates.defaultValue = `\${${tempProperty}}`;
    } else {
      updates.defaultValue = undefined;
    }
    updateField(selectedField.id, updates);
    setClassModalOpen(false);
  };

  const handleClearClassBinding = () => {
    if (!selectedField) return;
    updateField(selectedField.id, {
      bindingClass: undefined,
      bindingProperty: undefined,
      defaultValue: undefined,
    });
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
            <Divider label="EDMS Binding" labelPosition="left" />
            <Stack gap="xs">
              <Group justify="space-between" align="flex-start">
                <div style={{ flex: 1 }}>
                  <Text size="sm" fw={500} mb={4}>
                    Class/Property Binding
                  </Text>
                  {selectedField.bindingClass && selectedField.bindingProperty ? (
                    <Card withBorder padding="xs" radius="sm">
                      <Stack gap={4}>
                        <Group gap="xs">
                          <Badge size="sm" variant="light" color="blue">
                            {selectedField.bindingClass}
                          </Badge>
                          <Text size="sm" fw={500}>
                            {
                              propertiesLibrary
                                .find((cls) => cls.name === selectedField.bindingClass)
                                ?.properties.find((p) => p.name === selectedField.bindingProperty)
                                ?.label || selectedField.bindingProperty
                            }
                          </Text>
                        </Group>
                        <Text size="xs" c="dimmed">
                          {selectedField.bindingProperty}
                        </Text>
                      </Stack>
                    </Card>
                  ) : (
                    <Text size="sm" c="dimmed">
                      No binding set
                    </Text>
                  )}
                </div>
                <Group gap="xs">
                  <Button size="xs" variant="light" onClick={handleOpenClassModal}>
                    Edit
                  </Button>
                  {(selectedField.bindingClass || selectedField.bindingProperty) && (
                    <Button
                      size="xs"
                      variant="light"
                      color="red"
                      onClick={handleClearClassBinding}
                    >
                      Clear
                    </Button>
                  )}
                </Group>
              </Group>
            </Stack>
            <Divider label="Legacy EDMS Binding" labelPosition="left" />
            <Select
              label="Bind to EDMS property (legacy)"
              placeholder="Choose a property"
              searchable
              clearable
              data={edmsProperties.map((prop) => ({ value: prop, label: prop }))}
              value={
                !selectedField.bindingClass && selectedField.bindingProperty
                  ? selectedField.bindingProperty
                  : null
              }
              onChange={(value) => {
                const updates: Partial<FieldSchema> = {
                  bindingProperty: value || undefined,
                  bindingClass: undefined, // Clear class when using legacy
                };
                if (value) {
                  if (selectedField.name.startsWith('field_')) {
                    updates.name = value;
                  }
                  updates.defaultValue = `\${${value}}`;
                }
                updateField(selectedField.id, updates);
              }}
              description="Direct property binding (without class)"
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
              <Card withBorder padding="sm" radius="md">
                <Text size="xs" c="dimmed" mb={4}>
                  Preview
                </Text>
                <div
                  style={{ lineHeight: 1.6 }}
                  dangerouslySetInnerHTML={{ __html: staticHtml }}
                />
              </Card>
              <Text size="xs" c="dimmed">
                Static blocks render as HTML in exports, similar to imported sample text.
              </Text>
            </Stack>
          </>
        )}
      </Stack>
      
      {/* Class Selector Modal */}
      <Modal
        opened={classModalOpen}
        onClose={() => setClassModalOpen(false)}
        title="Edit Class/Property Binding"
        size="lg"
      >
        <Stack gap="md">
          <Select
            label="Class"
            placeholder="Select a class"
            searchable
            clearable
            data={propertiesLibrary.map((cls) => ({ value: cls.name, label: cls.name }))}
            value={tempClass}
            onChange={(value) => {
              setTempClass(value);
              setTempProperty(null); // Clear property when class changes
            }}
            description="Select the EDMS class for this field"
          />
          
          {tempClass && (
            <Select
              label="Property"
              placeholder="Select a property"
              searchable
              clearable
              data={
                propertiesLibrary
                  .find((cls) => cls.name === tempClass)
                  ?.properties.map((prop) => ({
                    value: prop.name,
                    label: `${prop.label} (${prop.name})`,
                  })) || []
              }
              value={tempProperty}
              onChange={(value) => setTempProperty(value)}
              description="Select a property from the chosen class"
            />
          )}
          
          {tempClass && (
            <Card withBorder padding="sm" radius="md">
              <Stack gap="xs">
                <Group justify="space-between">
                  <Text size="sm" fw={500}>
                    Available Properties
                  </Text>
                  <Badge size="sm" variant="light">
                    {propertiesLibrary.find((cls) => cls.name === tempClass)?.properties.length}{' '}
                    properties
                  </Badge>
                </Group>
                <ScrollArea h={300} type="auto">
                  <Stack gap={4}>
                    {propertiesLibrary
                      .find((cls) => cls.name === tempClass)
                      ?.properties.map((prop) => (
                        <Card
                          key={prop.name}
                          padding="xs"
                          radius="sm"
                          withBorder
                          style={{
                            cursor: 'pointer',
                            backgroundColor:
                              tempProperty === prop.name
                                ? 'var(--mantine-color-blue-0)'
                                : undefined,
                            borderColor:
                              tempProperty === prop.name
                                ? 'var(--mantine-color-blue-5)'
                                : undefined,
                          }}
                          onClick={() => setTempProperty(prop.name)}
                        >
                          <Group justify="space-between" gap="xs" wrap="nowrap">
                            <div>
                              <Text size="xs" fw={500}>
                                {prop.label}
                              </Text>
                              <Text size="xs" c="dimmed">
                                {prop.name}
                              </Text>
                            </div>
                            {tempProperty === prop.name && (
                              <Text size="xs" c="blue" fw={500}>
                                ✓
                              </Text>
                            )}
                          </Group>
                        </Card>
                      ))}
                  </Stack>
                </ScrollArea>
                <Text size="xs" c="dimmed">
                  Click a property to select it
                </Text>
              </Stack>
            </Card>
          )}
          
          <Group justify="flex-end" gap="xs">
            <Button variant="default" onClick={() => setClassModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleApplyClassBinding} disabled={!tempClass || !tempProperty}>
              Apply
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Card>
  );
};
