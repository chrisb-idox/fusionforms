import { Button, Group, Select, Stack, Text, TextInput } from '@mantine/core';
import { Link } from 'react-router-dom';
import { useFormBuilder } from '../../context/FormBuilderContext';
import { actionCodes } from '../../data/actionCodes';

interface BuilderHeaderProps {
  onPreview: () => void;
}

export const BuilderHeader = ({ onPreview }: BuilderHeaderProps) => {
  const { schema, updateForm } = useFormBuilder();

  const handleSave = () => {
    try {
      const action = schema.actionCode ? `_${schema.actionCode}` : '';
      const filename = `${(schema.name || 'form').replace(/\\s+/g, '_')}${action}.json`;
      localStorage.setItem('form-builder-schema', JSON.stringify(schema));
      alert(`Saved schema as ${filename} in localStorage`);
    } catch (error) {
      console.error('Failed to save schema', error);
    }
  };

  return (
    <Group
      justify="space-between"
      align="center"
      px="md"
      py="sm"
      style={{
        backdropFilter: 'blur(6px)',
      }}
    >
      <Stack gap={4} style={{ flex: 1 }}>
        <TextInput
          label="Form name"
          placeholder="Untitled form"
          value={schema.name}
          onChange={(event) => updateForm({ name: event.currentTarget.value })}
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
        />
        <Text size="sm" c="dimmed">
          Build your sections and fields, then preview before saving.
        </Text>
      </Stack>
      <Group gap="sm">
        <Button component={Link} to="/samples" variant="default">
          Samples
        </Button>
        <Button variant="default" onClick={handleSave}>
          Save
        </Button>
        <Button onClick={onPreview}>Preview</Button>
      </Group>
    </Group>
  );
};
