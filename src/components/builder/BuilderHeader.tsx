import { Button, Group, Select, Stack, Text, Badge } from '@mantine/core';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useFormBuilder } from '../../context/FormBuilderContext';
import { actionCodes } from '../../data/actionCodes';
import { schemaToHtml } from '../../utils/schemaExporter';
import logo from '../../assets/logo.png';
import { FormEditor } from './FormEditor';
import { getPropertiesLibrary } from '../../utils/propertiesLibrary';

interface BuilderHeaderProps {
  onPreview: () => void;
}

export const BuilderHeader = ({ onPreview }: BuilderHeaderProps) => {
  const { schema, updateForm } = useFormBuilder();
  const [formEditorOpen, setFormEditorOpen] = useState(false);
  const propertiesLibrary = getPropertiesLibrary();

  const handleSaveFormDetails = (name: string, formClass: string) => {
    // Clear field bindings that don't exist in the new class
    const newClassProperties = propertiesLibrary.find((cls) => cls.name === formClass);
    const validPropertyNames = new Set(newClassProperties?.properties.map((p) => p.name) || []);
    
    // Deep clone and clean bindings
    const cleanedSections = schema.sections.map((section) => ({
      ...section,
      rows: section.rows.map((row) => ({
        ...row,
        columns: row.columns.map((column) => ({
          ...column,
          fields: column.fields.map((field) => {
            if (field.bindingProperty && !validPropertyNames.has(field.bindingProperty)) {
              // Remove invalid binding
              const { bindingProperty, defaultValue, ...rest } = field;
              return rest;
            }
            return field;
          }),
        })),
      })),
    }));

    updateForm({ 
      name,
      formClass,
      sections: cleanedSections
    });
  };

  const handleSave = () => {
    try {
      const action = schema.actionCode ? `_${schema.actionCode}` : '';
      const filename = `${(schema.name || 'form').replace(/\s+/g, '_')}${action}.json`;
      localStorage.setItem('form-builder-schema', JSON.stringify(schema));
      alert(`Saved schema as ${filename} in localStorage`);
    } catch (error) {
      console.error('Failed to save schema', error);
    }
  };

  const handleExportHtml = () => {
    try {
      const html = schemaToHtml(schema);
      const className = schema.formClass || 'UnknownClass';
      const actionCode = schema.actionCode || 'CRE';
      const filename = `${className}_${actionCode}.xml`;
      
      // Check if we can detect file exists (browser limitation workaround)
      // Use showSaveFilePicker if available (modern browsers)
      if ('showSaveFilePicker' in window) {
        (async () => {
          try {
            const opts = {
              suggestedName: filename,
              types: [{
                description: 'XML Files',
                accept: { 'text/xml': ['.xml'] },
              }],
            };
            const handle = await (window as any).showSaveFilePicker(opts);
            const writable = await handle.createWritable();
            await writable.write(html);
            await writable.close();
          } catch (err: any) {
            if (err.name !== 'AbortError') {
              console.error('Save failed', err);
              alert('Could not save file');
            }
          }
        })();
      } else {
        // Fallback to traditional download with confirmation
        const confirmDownload = confirm(
          `Export as "${filename}"?\n\nNote: If a file with this name already exists in your Downloads folder, it will be overwritten or renamed by your browser.`
        );
        if (confirmDownload) {
          const blob = new Blob([html], { type: 'text/xml' });
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = filename;
          link.click();
          URL.revokeObjectURL(url);
        }
      }
    } catch (error) {
      console.error('Failed to export HTML', error);
      alert('Could not export HTML');
    }
  };

  return (
    <>
      <Group justify="space-between" align="flex-start" px="md" py="sm" style={{ backdropFilter: 'blur(6px)' }}>
        <Stack gap="xs">
          <Group gap="md" align="center" wrap="wrap">
            <div>
              <Text size="xs" c="dimmed" mb={2}>
                Form name
              </Text>
              <Group gap="xs" align="center">
                <Text size="lg" fw={600}>
                  {schema.name}
                </Text>
                {schema.formClass && (
                  <Badge size="md" variant="light" color="blue">
                    {schema.formClass}
                  </Badge>
                )}
                <Button size="xs" variant="light" onClick={() => setFormEditorOpen(true)}>
                  Edit
                </Button>
              </Group>
            </div>
            <Select
              label="Action code"
              placeholder="Select action"
              data={actionCodes.map((item) => ({
                value: item.value,
                label: `${item.label} — ${item.description}`,
              }))}
              value={schema.actionCode || 'CRE'}
              onChange={(value) => updateForm({ actionCode: (value as typeof schema.actionCode) || 'CRE' })}
              searchable
              nothingFoundMessage="No actions"
              w={320}
              required
            />
          </Group>
          <Group gap="sm" wrap="wrap">
            <Button component={Link} to="/samples" variant="default">
              Samples
            </Button>
            <Button variant="default" onClick={handleSave}>
              Save
            </Button>
            <Button variant="default" onClick={handleExportHtml}>
              Export HTML
            </Button>
            <Button onClick={onPreview}>Preview</Button>
          </Group>
          <Text size="sm" c="dimmed">
            Build your sections and fields, then preview before saving.
          </Text>
        </Stack>
        <img src={logo} style={{ width: 128, height: 128, borderRadius: 8 }} alt="Logo" />
      </Group>

      <FormEditor
        opened={formEditorOpen}
        onClose={() => setFormEditorOpen(false)}
        formName={schema.name}
        formClass={schema.formClass}
        onSave={handleSaveFormDetails}
      />
    </>
  );
};
