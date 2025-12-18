import {
  ActionIcon,
  Card,
  Divider,
  Group,
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
import { getPropertiesLibrary } from '../../utils/propertiesLibrary';

export const PropertiesPanel = () => {
  const { schema, selection, updateForm, updateSection, updateField, updateStaticBlock } =
    useFormBuilder();

  const propertiesLibrary = useMemo(() => getPropertiesLibrary(), []);
  
  // Get properties for the form's class
  const formClassProperties = useMemo(() => {
    if (!schema.formClass) return [];
    return propertiesLibrary.find((cls) => cls.name === schema.formClass)?.properties || [];
  }, [schema.formClass, propertiesLibrary]);

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
  const editorRef = useRef<HTMLDivElement | null>(null);

  // Property selector modal state
  const [propertyModalOpen, setPropertyModalOpen] = useState(false);
  const [tempProperty, setTempProperty] = useState<string | null>(null);

  useEffect(() => {
    const next = selectedStatic?.html || '<p>New text</p>';
    setStaticHtml(next);
    if (editorRef.current) {
      editorRef.current.innerHTML = next;
    }
  }, [selectedStatic?.id, selectedStatic?.html]);

  const commitStatic = (value: string) => {
    setStaticHtml(value);
    if (selectedStatic) {
      updateStaticBlock(selectedStatic.id, value);
    }
  };

  const handleEditorInput = () => {
    if (editorRef.current) {
      const newHtml = editorRef.current.innerHTML;
      commitStatic(newHtml);
    }
  };

  const handleLink = () => {
    const url = window.prompt('Enter URL');
    if (!url) return;
    document.execCommand('createLink', false, url);
    handleEditorInput();
  };

  const handleClearFormatting = () => {
    document.execCommand('removeFormat', false);
    document.execCommand('formatBlock', false, '<p>');
    handleEditorInput();
  };

  const handleJustify = (alignment: 'left' | 'center' | 'right') => {
    const command = alignment === 'left' ? 'justifyLeft' : alignment === 'center' ? 'justifyCenter' : 'justifyRight';
    document.execCommand(command, false);
    handleEditorInput();
  };

  const handleOpenPropertyModal = () => {
    setTempProperty(selectedField?.bindingProperty || null);
    setPropertyModalOpen(true);
  };

  const handleApplyPropertyBinding = () => {
    if (!selectedField) return;
    const updates: Partial<FieldSchema> = {
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
    setPropertyModalOpen(false);
  };

  const handleClearPropertyBinding = () => {
    if (!selectedField) return;
    updateField(selectedField.id, {
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
                    Property Binding
                  </Text>
                  {selectedField.bindingProperty ? (
                    <Card withBorder padding="xs" radius="sm">
                      <Stack gap={4}>
                        <Group gap="xs">
                          <Badge size="sm" variant="light" color="blue">
                            {schema.formClass || 'No class'}
                          </Badge>
                          <Text size="sm" fw={500}>
                            {
                              formClassProperties.find((p) => p.name === selectedField.bindingProperty)
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
                  <Button size="xs" variant="light" onClick={handleOpenPropertyModal}>
                    Edit
                  </Button>
                  {selectedField.bindingProperty && (
                    <Button
                      size="xs"
                      variant="light"
                      color="red"
                      onClick={handleClearPropertyBinding}
                    >
                      Clear
                    </Button>
                  )}
                </Group>
              </Group>
            </Stack>
          </>
        )}

        {selection?.type === 'static' && selectedStatic && (
          <>
            <Divider label="Static text" labelPosition="left" />
            <Stack gap="xs">
              <Group gap="xs">
                <Tooltip label="Heading 1">
                  <ActionIcon variant="light" onMouseDown={(e) => {
                    e.preventDefault();
                    document.execCommand('formatBlock', false, '<h1>');
                    handleEditorInput();
                  }}>
                    <Text size="xs">H1</Text>
                  </ActionIcon>
                </Tooltip>
                <Tooltip label="Heading 2">
                  <ActionIcon variant="light" onMouseDown={(e) => {
                    e.preventDefault();
                    document.execCommand('formatBlock', false, '<h2>');
                    handleEditorInput();
                  }}>
                    <Text size="xs">H2</Text>
                  </ActionIcon>
                </Tooltip>
                <Tooltip label="Bold">
                  <ActionIcon variant="light" onMouseDown={(e) => {
                    e.preventDefault();
                    document.execCommand('bold', false);
                    handleEditorInput();
                  }}>
                    <Text size="xs" fw={700}>
                      B
                    </Text>
                  </ActionIcon>
                </Tooltip>
                <Tooltip label="Italic">
                  <ActionIcon variant="light" onMouseDown={(e) => {
                    e.preventDefault();
                    document.execCommand('italic', false);
                    handleEditorInput();
                  }}>
                    <Text size="xs" fs="italic">
                      I
                    </Text>
                  </ActionIcon>
                </Tooltip>
                <Tooltip label="Underline">
                  <ActionIcon variant="light" onMouseDown={(e) => {
                    e.preventDefault();
                    document.execCommand('underline', false);
                    handleEditorInput();
                  }}>
                    <Text size="xs" td="underline">
                      U
                    </Text>
                  </ActionIcon>
                </Tooltip>
                <Tooltip label="Bullet list">
                  <ActionIcon variant="light" onMouseDown={(e) => {
                    e.preventDefault();
                    document.execCommand('insertUnorderedList', false);
                    handleEditorInput();
                  }}>
                    <Text size="xs">•</Text>
                  </ActionIcon>
                </Tooltip>
                <Tooltip label="Numbered list">
                  <ActionIcon variant="light" onMouseDown={(e) => {
                    e.preventDefault();
                    document.execCommand('insertOrderedList', false);
                    handleEditorInput();
                  }}>
                    <Text size="xs">1.</Text>
                  </ActionIcon>
                </Tooltip>
                <Tooltip label="Link">
                  <ActionIcon variant="light" onMouseDown={(e) => {
                    e.preventDefault();
                    handleLink();
                  }}>
                    <Text size="xs">🔗</Text>
                  </ActionIcon>
                </Tooltip>
                <Tooltip label="Clear formatting">
                  <ActionIcon variant="light" onMouseDown={(e) => {
                    e.preventDefault();
                    handleClearFormatting();
                  }}>
                    <Text size="xs">Clear</Text>
                  </ActionIcon>
                </Tooltip>
              </Group>
              <Group gap="xs">
                <Tooltip label="Align left">
                  <ActionIcon variant="light" onMouseDown={(e) => {
                    e.preventDefault();
                    handleJustify('left');
                  }}>
                    <Text size="xs">⬅</Text>
                  </ActionIcon>
                </Tooltip>
                <Tooltip label="Align center">
                  <ActionIcon variant="light" onMouseDown={(e) => {
                    e.preventDefault();
                    handleJustify('center');
                  }}>
                    <Text size="xs">↔</Text>
                  </ActionIcon>
                </Tooltip>
                <Tooltip label="Align right">
                  <ActionIcon variant="light" onMouseDown={(e) => {
                    e.preventDefault();
                    handleJustify('right');
                  }}>
                    <Text size="xs">➡</Text>
                  </ActionIcon>
                </Tooltip>
              </Group>
              <Card withBorder padding="md" radius="md">
                <Text size="xs" fw={500} mb={8}>
                  Rich Text Editor
                </Text>
                <div
                  ref={editorRef}
                  contentEditable
                  suppressContentEditableWarning
                  dir="ltr"
                  onInput={handleEditorInput}
                  onBlur={handleEditorInput}
                  style={{
                    minHeight: 120,
                    padding: '8px 12px',
                    border: '1px solid #dee2e6',
                    borderRadius: 4,
                    outline: 'none',
                    lineHeight: 1.6,
                    fontSize: 14,
                    backgroundColor: '#fff',
                    direction: 'ltr',
                    textAlign: 'left',
                    unicodeBidi: 'embed',
                  }}
                  dangerouslySetInnerHTML={{ __html: staticHtml }}
                />
                <Text size="xs" c="dimmed" mt={8}>
                  Type directly or use formatting buttons above. Changes save automatically.
                </Text>
              </Card>
              <Text size="xs" c="dimmed">
                Static blocks render as HTML in exports, similar to imported sample text.
              </Text>
            </Stack>
          </>
        )}
      </Stack>
      
      {/* Property Selector Modal */}
      <Modal
        opened={propertyModalOpen}
        onClose={() => setPropertyModalOpen(false)}
        title="Select Property Binding"
        size="lg"
      >
        <Stack gap="md">
          <Card withBorder padding="xs" radius="sm">
            <Group gap="xs">
              <Text size="sm" fw={500}>Form Class:</Text>
              <Badge size="sm" variant="light" color="blue">
                {schema.formClass || 'No class selected'}
              </Badge>
            </Group>
          </Card>

          {schema.formClass && formClassProperties.length > 0 && (
            <Card withBorder padding="sm" radius="md">
              <Stack gap="xs">
                <Group justify="space-between">
                  <Text size="sm" fw={500}>
                    Available Properties
                  </Text>
                  <Badge size="sm" variant="light">
                    {formClassProperties.length} properties
                  </Badge>
                </Group>
                <ScrollArea h={300} type="auto">
                  <Stack gap={4}>
                    {formClassProperties.map((prop) => (
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

          {!schema.formClass && (
            <Text size="sm" c="dimmed">
              Please select a form class in the form editor before binding properties.
            </Text>
          )}

          <Group justify="flex-end" gap="xs">
            <Button variant="default" onClick={() => setPropertyModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleApplyPropertyBinding} disabled={!tempProperty}>
              Apply
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Card>
  );
};
