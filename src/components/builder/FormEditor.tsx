import { Button, Group, Modal, ScrollArea, Select, Stack, Table, Text, TextInput } from '@mantine/core';
import { useEffect, useState } from 'react';
import { getPropertiesLibrary } from '../../utils/propertiesLibrary';

interface FormEditorProps {
  opened: boolean;
  onClose: () => void;
  formName: string;
  formClass: string | undefined;
  onSave: (name: string, formClass: string) => void;
}

export const FormEditor = ({ opened, onClose, formName, formClass, onSave }: FormEditorProps) => {
  const propertiesLibrary = getPropertiesLibrary();
  const defaultClass = formClass || propertiesLibrary[0]?.name || '';
  
  const [name, setName] = useState(formName);
  const [selectedClass, setSelectedClass] = useState(defaultClass);

  // Reset form when modal opens with new values
  useEffect(() => {
    if (opened) {
      setName(formName);
      setSelectedClass(formClass || propertiesLibrary[0]?.name || '');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opened]);

  const handleSave = () => {
    if (name.trim() && selectedClass) {
      onSave(name.trim(), selectedClass);
      onClose();
    }
  };

  const handleCancel = () => {
    setName(formName);
    setSelectedClass(formClass || propertiesLibrary[0]?.name || '');
    onClose();
  };

  const selectedClassProperties = propertiesLibrary.find((cls) => cls.name === selectedClass);

  return (
    <Modal
      opened={opened}
      onClose={handleCancel}
      title={
        <Group justify="space-between" style={{ width: '100%', paddingRight: '1rem' }}>
          <Text size="lg" fw={600}>
            Edit Form
          </Text>
          <Group gap="sm">
            <Button variant="default" onClick={handleCancel}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={!name.trim() || !selectedClass}>
              OK
            </Button>
          </Group>
        </Group>
      }
      size="xl"
      fullScreen
      withCloseButton={false}
    >
      <Stack gap="lg">
        <TextInput
          label="Form Name"
          placeholder="Enter form name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          size="md"
        />

        <Select
          label="Class"
          placeholder="Select a class"
          value={selectedClass}
          onChange={(value) => setSelectedClass(value || '')}
          data={propertiesLibrary.map((cls) => ({ value: cls.name, label: cls.name }))}
          required
          size="md"
          description="Select the EDMS class for this form. All fields will use properties from this class."
        />

        {selectedClassProperties && (
          <div>
            <Text size="md" fw={600} mb="sm">
              Available Properties ({selectedClassProperties.properties.length})
            </Text>
            <ScrollArea h={400} type="auto">
              <Table striped highlightOnHover withTableBorder>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Property Name</Table.Th>
                    <Table.Th>Label</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {selectedClassProperties.properties.map((prop) => (
                    <Table.Tr key={prop.name}>
                      <Table.Td>
                        <Text size="sm" ff="monospace">
                          {prop.name}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm">{prop.label}</Text>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </ScrollArea>
          </div>
        )}
      </Stack>
    </Modal>
  );
};
