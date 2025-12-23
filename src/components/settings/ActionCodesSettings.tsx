import { useState, useEffect } from 'react';
import {
  Stack,
  Text,
  Button,
  Group,
  TextInput,
  Textarea,
  Card,
  ActionIcon,
  Alert,
  Badge,
} from '@mantine/core';
import { IconTrash, IconPlus, IconAlertCircle, IconRefresh, IconEdit, IconCheck, IconX } from '@tabler/icons-react';
import {
  getActionCodesSync,
  saveActionCodesToLocalStorage,
  resetActionCodesToDefaults,
  validateActionCode,
  type ActionCodeItem,
} from '../../utils/actionCodesLibrary';

export const ActionCodesSettings = () => {
  const [actionCodes, setActionCodes] = useState<ActionCodeItem[]>([]);
  const [newCode, setNewCode] = useState('');
  const [newLabel, setNewLabel] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [editingCode, setEditingCode] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState('');
  const [editDescription, setEditDescription] = useState('');

  useEffect(() => {
    loadCodes();
  }, []);

  const loadCodes = () => {
    const codes = getActionCodesSync();
    setActionCodes(codes);
  };

  const handleAdd = () => {
    setError(null);
    setSuccessMessage(null);

    const code = newCode.trim().toUpperCase();
    const label = newLabel.trim() || code;

    // Validate
    const validationError = validateActionCode(code, actionCodes);
    if (validationError) {
      setError(validationError);
      return;
    }

    // Add new action code
    const newActionCode: ActionCodeItem = {
      value: code,
      label: label,
      description: newDescription.trim(),
    };

    const updated = [...actionCodes, newActionCode];
    saveActionCodesToLocalStorage(updated);
    setActionCodes(updated);

    // Notify other components
    window.dispatchEvent(new CustomEvent('fusionforms_codes_updated'));

    // Clear form
    setNewCode('');
    setNewLabel('');
    setNewDescription('');
    setSuccessMessage(`Action code "${code}" added successfully`);
  };

  const handleRemove = (value: string) => {
    if (confirm(`Are you sure you want to remove action code "${value}"?`)) {
      const updated = actionCodes.filter((ac) => ac.value !== value);
      saveActionCodesToLocalStorage(updated);
      setActionCodes(updated);
      
      // Notify other components
      window.dispatchEvent(new CustomEvent('fusionforms_codes_updated'));
      
      setSuccessMessage(`Action code "${value}" removed successfully`);
    }
  };

  const handleReset = () => {
    if (
      confirm(
        'Are you sure you want to reset to default action codes? This will remove all custom codes.'
      )
    ) {
      resetActionCodesToDefaults();
      loadCodes();
      
      // Notify other components
      window.dispatchEvent(new CustomEvent('fusionforms_codes_updated'));
      
      setSuccessMessage('Action codes reset to defaults');
    }
  };

  const handleCodeChange = (value: string) => {
    // Auto-uppercase as user types
    setNewCode(value.toUpperCase());
    setError(null);
  };

  const handleEdit = (code: ActionCodeItem) => {
    setEditingCode(code.value);
    setEditLabel(code.label);
    setEditDescription(code.description);
    setError(null);
  };

  const handleSaveEdit = (value: string) => {
    const updated = actionCodes.map((ac) =>
      ac.value === value
        ? { ...ac, label: editLabel.trim() || value, description: editDescription.trim() }
        : ac
    );
    saveActionCodesToLocalStorage(updated);
    setActionCodes(updated);
    setEditingCode(null);
    
    // Notify other components
    window.dispatchEvent(new CustomEvent('fusionforms_codes_updated'));
    
    setSuccessMessage(`Action code "${value}" updated successfully`);
  };

  const handleCancelEdit = () => {
    setEditingCode(null);
    setEditLabel('');
    setEditDescription('');
    setError(null);
  };

  return (
    <Stack gap="xl">
      <div>
        <Text size="xl" fw={600} mb="xs">
          Action Codes
        </Text>
        <Text size="sm" c="dimmed">
          Manage action codes used for form file naming suffixes
        </Text>
      </div>

      {error && (
        <Alert icon={<IconAlertCircle size={16} />} color="red" onClose={() => setError(null)} withCloseButton>
          {error}
        </Alert>
      )}

      {successMessage && (
        <Alert color="green" onClose={() => setSuccessMessage(null)} withCloseButton>
          {successMessage}
        </Alert>
      )}

      <Card withBorder padding="md">
        <Stack gap="md">
          <Text size="sm" fw={600}>
            Add New Action Code
          </Text>

          <TextInput
            label="Code"
            placeholder="CRE"
            value={newCode}
            onChange={(e) => handleCodeChange(e.currentTarget.value)}
            description="Max 10 characters, uppercase letters/numbers only, no spaces"
            maxLength={10}
            required
          />

          <TextInput
            label="Label"
            placeholder="CRE (optional, defaults to code)"
            value={newLabel}
            onChange={(e) => setNewLabel(e.currentTarget.value)}
            description="Display label (optional)"
          />

          <Textarea
            label="Description"
            placeholder="Creation"
            value={newDescription}
            onChange={(e) => setNewDescription(e.currentTarget.value)}
            description="Optional description"
            rows={2}
          />

          <Group>
            <Button
              leftSection={<IconPlus size={16} />}
              onClick={handleAdd}
              disabled={!newCode.trim()}
            >
              Add Action Code
            </Button>
          </Group>
        </Stack>
      </Card>

      <div>
        <Group justify="space-between" mb="md">
          <Text size="sm" fw={600}>
            Current Action Codes ({actionCodes.length})
          </Text>
          <Button
            variant="subtle"
            size="xs"
            leftSection={<IconRefresh size={14} />}
            onClick={handleReset}
          >
            Reset to Defaults
          </Button>
        </Group>

        <Stack gap="xs">
          {/* None option - always shown first */}
          <Card withBorder padding="sm" style={{ backgroundColor: '#f8f9fa' }}>
            <Group justify="space-between">
              <Group gap="md">
                <Badge color="gray" variant="light">
                  NONE
                </Badge>
                <div>
                  <Text size="sm" fw={500}>
                    None
                  </Text>
                  <Text size="xs" c="dimmed">
                    No suffix on filename
                  </Text>
                </div>
              </Group>
              <Text size="xs" c="dimmed" fs="italic">
                Built-in
              </Text>
            </Group>
          </Card>

          {actionCodes.map((ac) => (
            <Card key={ac.value} withBorder padding="sm">
              {editingCode === ac.value ? (
                <Stack gap="sm">
                  <Group gap="xs" align="center">
                    <Badge color="blue" variant="light">
                      {ac.value}
                    </Badge>
                    <Text size="xs" c="dimmed" fs="italic">
                      (editing)
                    </Text>
                  </Group>
                  <TextInput
                    label="Label"
                    placeholder={ac.value}
                    value={editLabel}
                    onChange={(e) => setEditLabel(e.currentTarget.value)}
                    size="sm"
                  />
                  <Textarea
                    label="Description"
                    placeholder="Description"
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.currentTarget.value)}
                    size="sm"
                    rows={2}
                  />
                  <Group gap="xs">
                    <Button
                      size="xs"
                      leftSection={<IconCheck size={14} />}
                      onClick={() => handleSaveEdit(ac.value)}
                    >
                      Save
                    </Button>
                    <Button
                      size="xs"
                      variant="subtle"
                      leftSection={<IconX size={14} />}
                      onClick={handleCancelEdit}
                    >
                      Cancel
                    </Button>
                  </Group>
                </Stack>
              ) : (
                <Group justify="space-between">
                  <Group gap="md">
                    <Badge color="blue" variant="light">
                      {ac.value}
                    </Badge>
                    <div>
                      <Text size="sm" fw={500}>
                        {ac.label}
                      </Text>
                      {ac.description && (
                        <Text size="xs" c="dimmed">
                          {ac.description}
                        </Text>
                      )}
                    </div>
                  </Group>
                  <Group gap="xs">
                    <ActionIcon
                      variant="subtle"
                      color="blue"
                      onClick={() => handleEdit(ac)}
                      aria-label={`Edit ${ac.value}`}
                    >
                      <IconEdit size={16} />
                    </ActionIcon>
                    <ActionIcon
                      variant="subtle"
                      color="red"
                      onClick={() => handleRemove(ac.value)}
                      aria-label={`Remove ${ac.value}`}
                    >
                      <IconTrash size={16} />
                    </ActionIcon>
                  </Group>
                </Group>
              )}
            </Card>
          ))}
        </Stack>
      </div>

      <Alert icon={<IconAlertCircle size={16} />} color="blue">
        <Text size="sm">
          <strong>Note:</strong> Action codes are used as filename suffixes when saving forms. Custom
          codes are stored in your browser's local storage.
        </Text>
      </Alert>
    </Stack>
  );
};
