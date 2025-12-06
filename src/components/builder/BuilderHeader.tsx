import { Button, Group, Select, Stack, Text, TextInput, Image } from '@mantine/core';
import { Link } from 'react-router-dom';
import { useFormBuilder } from '../../context/FormBuilderContext';
import { actionCodes } from '../../data/actionCodes';
import { schemaToHtml } from '../../utils/schemaExporter';
import logo from '../../assets/logo.png';

interface BuilderHeaderProps {
  onPreview: () => void;
}

export const BuilderHeader = ({ onPreview }: BuilderHeaderProps) => {
  const { schema, updateForm } = useFormBuilder();

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
      const action = schema.actionCode ? `_${schema.actionCode}` : '';
      const filename = `${(schema.name || 'form').replace(/\s+/g, '_')}${action}.html`;
      const blob = new Blob([html], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export HTML', error);
      alert('Could not export HTML');
    }
  };

  return (
    <Group justify="space-between" align="flex-start" px="md" py="sm" style={{ backdropFilter: 'blur(6px)' }}>
      <Stack gap="xs">
        <Group gap="md" align="flex-end" wrap="wrap">
          <TextInput
            label="Form name"
            placeholder="Untitled form"
            value={schema.name}
            onChange={(event) => updateForm({ name: event.currentTarget.value })}
            w={260}
          />
          <Select
            label="Action code"
            placeholder="Select action"
            data={actionCodes.map((item) => ({
              value: item.value,
              label: `${item.label} — ${item.description}`,
            }))}
            value={schema.actionCode || null}
            onChange={(value) => updateForm({ actionCode: (value as typeof schema.actionCode) || undefined })}
            searchable
            nothingFoundMessage="No actions"
            w={320}
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
      <Image src={logo} w={64} h={64} radius="md" />
    </Group>
  );
};
