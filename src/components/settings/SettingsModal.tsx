import { Modal, Stack, Group, Text, NavLink, Box, Container, Code, Divider, Alert, Tabs } from '@mantine/core';
import { IconInfoCircle, IconPlug, IconAlertCircle, IconCode } from '@tabler/icons-react';
import { useState } from 'react';
import packageJson from '../../../package.json';
import { ActionCodesSettings } from './ActionCodesSettings';

const getCopyrightYear = () => new Date().getFullYear();

interface SettingsModalProps {
  opened: boolean;
  onClose: () => void;
}

type SettingsPage = 'about' | 'integration' | 'actionCodes';

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
      
      case 'actionCodes':
        return <ActionCodesSettings />;
      
      case 'integration':
        return (
          <Stack gap="xl">
            <div>
              <Text size="xl" fw={600} mb="xs">
                External Integration
              </Text>
              <Text size="sm" c="dimmed">
                Launch FusionForms from other applications with pre-loaded forms
              </Text>
            </div>

            <Alert icon={<IconAlertCircle size={16} />} color="blue" title="Integration API">
              FusionForms can be launched from external applications (e.g., GraphCycle) with forms 
              automatically loaded. Use URL parameters or localStorage to pass form data.
            </Alert>

            <Tabs defaultValue="url" variant="outline">
              <Tabs.List>
                <Tabs.Tab value="url">URL Parameter</Tabs.Tab>
                <Tabs.Tab value="path">File Path</Tabs.Tab>
                <Tabs.Tab value="storage">localStorage</Tabs.Tab>
                <Tabs.Tab value="base64">Base64 Data</Tabs.Tab>
              </Tabs.List>

              <Tabs.Panel value="url" pt="md">
                <Stack gap="md">
                  <div>
                    <Text size="sm" fw={600} mb="xs">Load from Remote URL</Text>
                    <Text size="sm" c="dimmed" mb="sm">
                      Load a form from a remote server or API endpoint. Best for accessing forms hosted elsewhere.
                    </Text>
                    <Code block style={{ fontSize: '12px' }}>
                      {window.location.origin + import.meta.env.BASE_URL}?formUrl=&lt;encoded-url&gt;
                    </Code>
                  </div>
                  <div>
                    <Text size="sm" fw={600} mb="xs">Example</Text>
                    <Code block style={{ fontSize: '11px', whiteSpace: 'pre-wrap' }}>
{`const formUrl = 'http://server.local/api/forms/design.html';
const url = '${window.location.origin}${import.meta.env.BASE_URL}?formUrl=' + 
  encodeURIComponent(formUrl);
window.open(url, '_blank');`}
                    </Code>
                  </div>
                  <div>
                    <Text size="xs" c="dimmed">
                      <strong>Pros:</strong> Works with remote files, no size limits
                      <br />
                      <strong>Supported:</strong> .json (schemas), .html/.xml (legacy forms)
                    </Text>
                  </div>
                </Stack>
              </Tabs.Panel>

              <Tabs.Panel value="path" pt="md">
                <Stack gap="md">
                  <div>
                    <Text size="sm" fw={600} mb="xs">Load from File Path</Text>
                    <Text size="sm" c="dimmed" mb="sm">
                      Load a form from a local path relative to FusionForms. Good for development and testing.
                    </Text>
                    <Code block style={{ fontSize: '12px' }}>
                      {window.location.origin + import.meta.env.BASE_URL}?form=&lt;path&gt;
                    </Code>
                  </div>
                  <div>
                    <Text size="sm" fw={600} mb="xs">Example</Text>
                    <Code block style={{ fontSize: '11px', whiteSpace: 'pre-wrap' }}>
{`// Load from public/samples folder
window.open('${window.location.origin}${import.meta.env.BASE_URL}?form=samples/design.html');

// Load from absolute path
window.open('${window.location.origin}${import.meta.env.BASE_URL}?form=/forms/myform.json');`}
                    </Code>
                  </div>
                  <div>
                    <Text size="xs" c="dimmed">
                      <strong>Pros:</strong> Simple syntax, works with local files
                      <br />
                      <strong>Use case:</strong> Testing, loading sample forms
                    </Text>
                  </div>
                </Stack>
              </Tabs.Panel>

              <Tabs.Panel value="storage" pt="md">
                <Stack gap="md">
                  <div>
                    <Text size="sm" fw={600} mb="xs">Load via localStorage Bridge</Text>
                    <Text size="sm" c="dimmed" mb="sm">
                      Pass form data via localStorage. Recommended for large forms when same-origin. No URL length limits.
                    </Text>
                    <Code block style={{ fontSize: '12px' }}>
                      {window.location.origin + import.meta.env.BASE_URL}?import=local
                    </Code>
                  </div>
                  <div>
                    <Text size="sm" fw={600} mb="xs">Example</Text>
                    <Code block style={{ fontSize: '11px', whiteSpace: 'pre-wrap' }}>
{`// In external application (e.g., GraphCycle)
const formSchema = {
  id: 'form123',
  name: 'My Form',
  formClass: 'FusionDocument',
  actionCode: 'CRE',
  version: 1,
  sections: [/* ... */]
};

// Write to localStorage
localStorage.setItem('fusionforms_import', JSON.stringify(formSchema));

// Launch FusionForms
window.open('${window.location.origin}${import.meta.env.BASE_URL}?import=local');

// Clean up after 10 seconds
setTimeout(() => localStorage.removeItem('fusionforms_import'), 10000);`}
                    </Code>
                  </div>
                  <div>
                    <Text size="xs" c="dimmed">
                      <strong>Pros:</strong> No size limits, reliable, fast
                      <br />
                      <strong>Cons:</strong> Requires same origin (domain and protocol)
                    </Text>
                  </div>
                </Stack>
              </Tabs.Panel>

              <Tabs.Panel value="base64" pt="md">
                <Stack gap="md">
                  <div>
                    <Text size="sm" fw={600} mb="xs">Load from Base64 Encoded Data</Text>
                    <Text size="sm" c="dimmed" mb="sm">
                      Embed form data directly in the URL. Self-contained but limited by URL length (~2000 chars).
                    </Text>
                    <Code block style={{ fontSize: '12px' }}>
                      {window.location.origin + import.meta.env.BASE_URL}?formData=&lt;base64-data&gt;
                    </Code>
                  </div>
                  <div>
                    <Text size="sm" fw={600} mb="xs">Example</Text>
                    <Code block style={{ fontSize: '11px', whiteSpace: 'pre-wrap' }}>
{`const formSchema = {
  id: 'simple',
  name: 'Simple Form',
  formClass: 'FusionDocument',
  version: 1,
  sections: []
};

const base64 = btoa(JSON.stringify(formSchema));
const url = '${window.location.origin}${import.meta.env.BASE_URL}?formData=' + 
  encodeURIComponent(base64);
window.open(url, '_blank');`}
                    </Code>
                  </div>
                  <div>
                    <Text size="xs" c="dimmed">
                      <strong>Pros:</strong> Self-contained, no dependencies, works offline
                      <br />
                      <strong>Cons:</strong> URL length limit, best for small forms only
                    </Text>
                  </div>
                </Stack>
              </Tabs.Panel>
            </Tabs>

            <Divider />

            <div>
              <Text size="md" fw={600} mb="sm">
                Testing Integration
              </Text>
              <Text size="sm" c="dimmed" mb="sm">
                Test all integration methods with the interactive test page:
              </Text>
              <Code block style={{ fontSize: '12px' }}>
                {window.location.origin + import.meta.env.BASE_URL}integration-test.html
              </Code>
            </div>

            <div>
              <Text size="md" fw={600} mb="sm">
                Error Handling
              </Text>
              <Text size="sm" c="dimmed">
                If a form fails to load:
              </Text>
              <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
                <li><Text size="sm" c="dimmed">A warning notification appears with error details</Text></li>
                <li><Text size="sm" c="dimmed">FusionForms loads the default empty form</Text></li>
                <li><Text size="sm" c="dimmed">You can continue working normally</Text></li>
                <li><Text size="sm" c="dimmed">Error details are logged to browser console</Text></li>
              </ul>
            </div>

            <div>
              <Text size="md" fw={600} mb="sm">
                Supported Form Formats
              </Text>
              <Group gap="md">
                <div>
                  <Text size="sm" fw={500}>JSON Schema</Text>
                  <Text size="xs" c="dimmed">FusionForms native format</Text>
                </div>
                <div>
                  <Text size="sm" fw={500}>HTML Forms</Text>
                  <Text size="xs" c="dimmed">Legacy forms (.html, .xml)</Text>
                </div>
              </Group>
            </div>

            <Alert color="gray" title="Documentation">
              For complete API documentation and integration examples, see{' '}
              <Code>INTEGRATION_API.md</Code> in the project repository.
            </Alert>
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
            <NavLink
              label="Action Codes"
              leftSection={<IconCode size={20} />}
              active={activePage === 'actionCodes'}
              onClick={() => setActivePage('actionCodes')}
            />
            <NavLink
              label="Integration"
              leftSection={<IconPlug size={20} />}
              active={activePage === 'integration'}
              onClick={() => setActivePage('integration')}
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
