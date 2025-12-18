import { Modal, Stack, Group, Text, NavLink, Box, Container } from '@mantine/core';
import { IconInfoCircle } from '@tabler/icons-react';
import { useState } from 'react';
import packageJson from '../../../package.json';

const getCopyrightYear = () => new Date().getFullYear();

interface SettingsModalProps {
  opened: boolean;
  onClose: () => void;
}

type SettingsPage = 'about';

export const SettingsModal = ({ opened, onClose }: SettingsModalProps) => {
  const [activePage, setActivePage] = useState<SettingsPage>('about');

  const renderContent = () => {
    switch (activePage) {
      case 'about':
        return (
          <Stack gap="lg">
            <div>
              <Text size="xl" fw={600} mb="xs">
                About FusionForms
              </Text>
              <Text size="sm" c="dimmed">
                Form Builder Application
              </Text>
            </div>

            <div>
              <Text size="sm" c="dimmed" mb={4}>
                Version
              </Text>
              <Text size="lg" fw={500}>
                {packageJson.version}
              </Text>
            </div>

            <div>
              <Text size="sm" c="dimmed">
                Copyright Idox Group, {getCopyrightYear()}
              </Text>
            </div>
          </Stack>
        );
      default:
        return null;
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Text size="lg" fw={600}>
          Settings
        </Text>
      }
      size="xl"
      fullScreen
      padding={0}
    >
      <Group align="flex-start" gap={0} wrap="nowrap" style={{ height: 'calc(100vh - 60px)' }}>
        {/* Left Menu */}
        <Box
          style={{
            width: 250,
            borderRight: '1px solid var(--mantine-color-gray-3)',
            height: '100%',
            overflowY: 'auto',
          }}
          p="md"
        >
          <Stack gap="xs">
            <NavLink
              label="About"
              leftSection={<IconInfoCircle size={20} />}
              active={activePage === 'about'}
              onClick={() => setActivePage('about')}
            />
          </Stack>
        </Box>

        {/* Main Content */}
        <Box style={{ flex: 1, height: '100%', overflowY: 'auto' }} p="xl">
          <Container size="lg">{renderContent()}</Container>
        </Box>
      </Group>
    </Modal>
  );
};
