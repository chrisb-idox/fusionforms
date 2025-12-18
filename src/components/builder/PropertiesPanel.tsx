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
  NumberInput,
} from '@mantine/core';
import { RichTextEditor } from '@mantine/tiptap';
import { useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import TiptapLink from '@tiptap/extension-link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useFormBuilder } from '../../context/FormBuilderContext';
import type { ColumnSchema, FieldSchema, SectionSchema, StaticBlockSchema, FieldOption } from '../../types/formSchema';
import { createId } from '../../types/formSchema';
import { createDefaultField } from '../../context/formBuilderHelpers';
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

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Property selector modal state
  const [propertyModalOpen, setPropertyModalOpen] = useState(false);
  const [tempProperty, setTempProperty] = useState<string | null>(null);
  
  // Expanded editor modal state
  const [expandedEditorOpen, setExpandedEditorOpen] = useState(false);

  // TipTap editor for rich text blocks (inline in properties panel) - only create for richtext type
  const editor = useEditor(
    {
      extensions: [
        StarterKit,
        Underline,
        TiptapLink,
        TextAlign.configure({ types: ['heading', 'paragraph'] }),
      ],
      content: selectedStatic?.html || '<p>Add your text</p>',
      onUpdate: ({ editor }) => {
        if (selectedStatic && selectedStatic.type === 'richtext') {
          updateStaticBlock(selectedStatic.id, editor.getHTML());
        }
      },
      editable: selectedStatic?.type === 'richtext',
    },
    [selectedStatic?.type, selectedStatic?.id]
  );

  // Separate TipTap editor for expanded modal view
  const modalEditor = useEditor(
    {
      extensions: [
        StarterKit,
        Underline,
        TiptapLink,
        TextAlign.configure({ types: ['heading', 'paragraph'] }),
      ],
      content: selectedStatic?.html || '<p>Add your text</p>',
      editable: true,
    },
    [expandedEditorOpen, selectedStatic?.id]
  );

  // Update editor content when selection changes
  useEffect(() => {
    if (editor && selectedStatic && selectedStatic.type === 'richtext') {
      const currentContent = editor.getHTML();
      const newContent = selectedStatic.html || '<p>Add your text</p>';
      if (currentContent !== newContent) {
        editor.commands.setContent(newContent);
      }
    }
  }, [editor, selectedStatic?.id, selectedStatic?.html]);

  // Update modal editor when opened
  useEffect(() => {
    if (modalEditor && selectedStatic && expandedEditorOpen) {
      modalEditor.commands.setContent(selectedStatic.html || '<p>Add your text</p>');
    }
  }, [modalEditor, expandedEditorOpen, selectedStatic?.html]);

  const handleSaveExpandedEditor = () => {
    if (selectedStatic) {
      if (selectedStatic.type === 'richtext' && modalEditor) {
        updateStaticBlock(selectedStatic.id, modalEditor.getHTML());
      }
      // For HTML type, content is saved via textarea onChange
    }
    setExpandedEditorOpen(false);
  };

  const wrapSelection = (before: string, after: string) => {
    const textarea = textareaRef.current;
    if (!textarea || !selectedStatic) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selectedText = text.substring(start, end) || 'text';

    const newText = text.substring(0, start) + before + selectedText + after + text.substring(end);
    updateStaticBlock(selectedStatic.id, newText);

    // Restore focus and selection
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + before.length, start + before.length + selectedText.length);
    }, 0);
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
    <Card padding="md" radius="md" withBorder style={{ direction: 'ltr' }}>
      <Stack gap="md" style={{ direction: 'ltr' }}>
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
            {selectedSection.layout === 'table' && (
              <NumberInput
                label="Number of columns"
                description="Number of columns in the first row (1-4)"
                value={selectedSection.rows[0]?.columns.length || 2}
                min={1}
                max={4}
                onChange={(value) => {
                  const numColumns = typeof value === 'number' ? Math.min(Math.max(value, 1), 4) : 2;
                  const currentColumns = selectedSection.rows[0]?.columns || [];
                  const currentLength = currentColumns.length;
                  
                  if (numColumns === currentLength) return;
                  
                  let newColumns: ColumnSchema[];
                  if (numColumns > currentLength) {
                    // Add new columns
                    const columnsToAdd = Array.from({ length: numColumns - currentLength }, () => ({
                      id: createId(),
                      span: 4 as const,
                      fields: [createDefaultField('text')],
                      staticBlocks: [],
                      colSpan: 1 as const,
                      rowSpan: 1 as const,
                      nestedTables: [],
                    }));
                    newColumns = [...currentColumns, ...columnsToAdd];
                  } else {
                    // Remove columns from the end
                    newColumns = currentColumns.slice(0, numColumns);
                  }
                  
                  updateSection(selectedSection.id, {
                    rows: [
                      { ...selectedSection.rows[0], columns: newColumns },
                      ...selectedSection.rows.slice(1),
                    ],
                  });
                }}
              />
            )}
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
            {selectedField.type === 'radio' && (
              <>
                <Divider label="Radio Options" labelPosition="left" />
                <NumberInput
                  label="Number of options"
                  description="Number of radio buttons (2-5)"
                  value={selectedField.options?.length || 2}
                  min={2}
                  max={5}
                  onChange={(value) => {
                    const numOptions = typeof value === 'number' ? Math.min(Math.max(value, 2), 5) : 2;
                    const currentOptions = selectedField.options || [];
                    const currentLength = currentOptions.length;
                    
                    if (numOptions === currentLength) return;
                    
                    let newOptions: FieldOption[];
                    if (numOptions > currentLength) {
                      // Add new options
                      const optionsToAdd = Array.from({ length: numOptions - currentLength }, (_, i) => ({
                        label: `Option ${currentLength + i + 1}`,
                        value: `option${currentLength + i + 1}`,
                      }));
                      newOptions = [...currentOptions, ...optionsToAdd];
                    } else {
                      // Remove options from the end
                      newOptions = currentOptions.slice(0, numOptions);
                    }
                    
                    updateField(selectedField.id, { options: newOptions });
                  }}
                />
                <Stack gap="xs">
                  {(selectedField.options || []).map((option, index) => (
                    <TextInput
                      key={index}
                      label={`Option ${index + 1} label`}
                      value={option.label}
                      onChange={(event) => {
                        const newOptions = [...(selectedField.options || [])];
                        newOptions[index] = {
                          ...newOptions[index],
                          label: event.currentTarget.value,
                          value: event.currentTarget.value.toLowerCase().replace(/\s+/g, '_'),
                        };
                        updateField(selectedField.id, { options: newOptions });
                      }}
                    />
                  ))}
                </Stack>
              </>
            )}
          </>
        )}

        {selection?.type === 'static' && selectedStatic && (
          <>
            <Divider label="Static Block" labelPosition="left" />
            <TextInput
              label="Label"
              value={selectedStatic.label || 'Imported Static Text'}
              onChange={(e) => updateStaticBlock(selectedStatic.id, { label: e.currentTarget.value })}
            />
            <Group justify="space-between" align="flex-end">
              <Divider label={(selectedStatic.type || 'html') === 'richtext' ? 'Rich text' : 'Static HTML'} labelPosition="left" style={{ flex: 1 }} />
              <Tooltip label="Expand editor">
                <ActionIcon 
                  variant="light" 
                  onClick={() => setExpandedEditorOpen(true)}
                >
                  <Text size="lg">⤢</Text>
                </ActionIcon>
              </Tooltip>
            </Group>
            {(selectedStatic.type || 'html') === 'richtext' ? (
              editor && (
                <Stack gap="xs">
                  <RichTextEditor editor={editor}>
                    <RichTextEditor.Toolbar sticky stickyOffset={60}>
                      <RichTextEditor.ControlsGroup>
                        <RichTextEditor.H1 />
                        <RichTextEditor.H2 />
                        <RichTextEditor.H3 />
                      </RichTextEditor.ControlsGroup>

                      <RichTextEditor.ControlsGroup>
                        <RichTextEditor.Bold />
                        <RichTextEditor.Italic />
                        <RichTextEditor.Underline />
                        <RichTextEditor.ClearFormatting />
                      </RichTextEditor.ControlsGroup>

                      <RichTextEditor.ControlsGroup>
                        <RichTextEditor.BulletList />
                        <RichTextEditor.OrderedList />
                      </RichTextEditor.ControlsGroup>

                      <RichTextEditor.ControlsGroup>
                        <RichTextEditor.AlignLeft />
                        <RichTextEditor.AlignCenter />
                        <RichTextEditor.AlignRight />
                      </RichTextEditor.ControlsGroup>

                      <RichTextEditor.ControlsGroup>
                        <RichTextEditor.Link />
                        <RichTextEditor.Unlink />
                      </RichTextEditor.ControlsGroup>
                    </RichTextEditor.Toolbar>

                    <RichTextEditor.Content style={{ minHeight: 200 }} />
                  </RichTextEditor>
                  <Text size="xs" c="dimmed">
                    Rich text blocks render as formatted HTML in exports.
                  </Text>
                </Stack>
              )
            ) : (
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
                <Tooltip label="Heading 3">
                  <ActionIcon variant="light" onClick={() => wrapSelection('<h3>', '</h3>')}>
                    <Text size="xs">H3</Text>
                  </ActionIcon>
                </Tooltip>
                <Tooltip label="Paragraph">
                  <ActionIcon variant="light" onClick={() => wrapSelection('<p>', '</p>')}>
                    <Text size="xs">P</Text>
                  </ActionIcon>
                </Tooltip>
              </Group>
              <Group gap="xs">
                <Tooltip label="Bold">
                  <ActionIcon variant="light" onClick={() => wrapSelection('<strong>', '</strong>')}>
                    <Text size="xs" fw={700}>B</Text>
                  </ActionIcon>
                </Tooltip>
                <Tooltip label="Italic">
                  <ActionIcon variant="light" onClick={() => wrapSelection('<em>', '</em>')}>
                    <Text size="xs" fs="italic">I</Text>
                  </ActionIcon>
                </Tooltip>
                <Tooltip label="Underline">
                  <ActionIcon variant="light" onClick={() => wrapSelection('<u>', '</u>')}>
                    <Text size="xs" td="underline">U</Text>
                  </ActionIcon>
                </Tooltip>
                <Tooltip label="Link">
                  <ActionIcon variant="light" onClick={() => {
                    const url = window.prompt('Enter URL:');
                    if (url) wrapSelection(`<a href="${url}">`, '</a>');
                  }}>
                    <Text size="xs">🔗</Text>
                  </ActionIcon>
                </Tooltip>
              </Group>
              <Group gap="xs">
                <Tooltip label="Left align">
                  <ActionIcon variant="light" onClick={() => wrapSelection('<div style="text-align:left">', '</div>')}>
                    <Text size="xs">⬅</Text>
                  </ActionIcon>
                </Tooltip>
                <Tooltip label="Center align">
                  <ActionIcon variant="light" onClick={() => wrapSelection('<div style="text-align:center">', '</div>')}>
                    <Text size="xs">↔</Text>
                  </ActionIcon>
                </Tooltip>
                <Tooltip label="Right align">
                  <ActionIcon variant="light" onClick={() => wrapSelection('<div style="text-align:right">', '</div>')}>
                    <Text size="xs">➡</Text>
                  </ActionIcon>
                </Tooltip>
              </Group>
              <Textarea
                ref={textareaRef}
                label="HTML Content"
                description="Edit HTML directly or select text and use formatting buttons above"
                value={selectedStatic.html}
                onChange={(e) => updateStaticBlock(selectedStatic.id, e.currentTarget.value)}
                minRows={8}
                maxRows={20}
                autosize
                styles={{
                  input: {
                    fontFamily: 'monospace',
                    fontSize: 13,
                  }
                }}
              />
              <Text size="xs" c="dimmed">
                  Static HTML blocks render as-is in exports. Use the preview to see how it looks.
                </Text>
              </Stack>
            )}
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

      {/* Expanded Editor Modal */}
      <Modal
        opened={expandedEditorOpen}
        onClose={() => setExpandedEditorOpen(false)}
        title={selectedStatic?.type === 'richtext' ? 'Rich Text Editor' : 'HTML Editor'}
        size="90%"
        centered
      >
        {selectedStatic && (
          <Stack gap="md">
            {selectedStatic.type === 'richtext' && modalEditor ? (
              <RichTextEditor editor={modalEditor}>
                <RichTextEditor.Toolbar sticky stickyOffset={60}>
                  <RichTextEditor.ControlsGroup>
                    <RichTextEditor.H1 />
                    <RichTextEditor.H2 />
                    <RichTextEditor.H3 />
                  </RichTextEditor.ControlsGroup>

                  <RichTextEditor.ControlsGroup>
                    <RichTextEditor.Bold />
                    <RichTextEditor.Italic />
                    <RichTextEditor.Underline />
                    <RichTextEditor.ClearFormatting />
                  </RichTextEditor.ControlsGroup>

                  <RichTextEditor.ControlsGroup>
                    <RichTextEditor.BulletList />
                    <RichTextEditor.OrderedList />
                  </RichTextEditor.ControlsGroup>

                  <RichTextEditor.ControlsGroup>
                    <RichTextEditor.AlignLeft />
                    <RichTextEditor.AlignCenter />
                    <RichTextEditor.AlignRight />
                  </RichTextEditor.ControlsGroup>

                  <RichTextEditor.ControlsGroup>
                    <RichTextEditor.Link />
                    <RichTextEditor.Unlink />
                  </RichTextEditor.ControlsGroup>
                </RichTextEditor.Toolbar>

                <RichTextEditor.Content style={{ minHeight: 400 }} />
              </RichTextEditor>
            ) : (
              <Textarea
                value={selectedStatic.html}
                onChange={(e) => updateStaticBlock(selectedStatic.id, e.currentTarget.value)}
                minRows={20}
                maxRows={40}
                autosize
                styles={{
                  input: {
                    fontFamily: 'monospace',
                    fontSize: 14,
                  }
                }}
              />
            )}
            
            <Group justify="flex-end">
              <Button onClick={handleSaveExpandedEditor}>
                Done
              </Button>
            </Group>
          </Stack>
        )}
      </Modal>
    </Card>
  );
};
