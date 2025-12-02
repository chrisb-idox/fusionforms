import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  AppShell,
  Box,
  Button,
  Container,
  Group,
  Loader,
  Paper,
  Select,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import { Link } from 'react-router-dom';

interface SampleEntry {
  name: string;
  file: string;
  description?: string;
}

const manifestUrl = '/samples/manifest.json';

export const SampleViewerPage = () => {
  const [samples, setSamples] = useState<SampleEntry[]>([]);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(manifestUrl);
        if (!response.ok) throw new Error(`Failed to load manifest (${response.status})`);
        const data: SampleEntry[] = await response.json();
        if (!cancelled) {
          setSamples(data);
          setSelectedFile((current) => current ?? data[0]?.file ?? null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Unknown error loading manifest');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const selectedSample = useMemo(
    () => samples.find((item) => item.file === selectedFile) || null,
    [samples, selectedFile],
  );

  return (
    <AppShell
      padding="md"
      header={{ height: 72 }}
      styles={{
        main: {
          background: 'transparent',
        },
      }}
    >
      <AppShell.Header>
        <Group justify="space-between" align="center" px="md" py="sm">
          <Group gap="sm">
            <Text fw={700}>📄</Text>
            <Text fw={600}>Sample HTML viewer</Text>
          </Group>
          <Button component={Link} to="/" variant="default">
            Back to builder
          </Button>
        </Group>
      </AppShell.Header>
      <AppShell.Main>
        <Container size="lg" px="md">
          <Stack gap="md">
            <Title order={3}>Samples</Title>
            <Text size="sm" c="dimmed">
              Browse static HTML samples served from <code>public/samples</code>.
            </Text>

            {loading && (
              <Group>
                <Loader size="sm" />
                <Text size="sm">Loading samples…</Text>
              </Group>
            )}

            {error && (
              <Alert
                color="red"
                title="Could not load samples"
                variant="light"
              >
                {error}
              </Alert>
            )}

            {samples.length > 0 && (
              <Group align="flex-end" gap="md">
                <Select
                  label="Select sample"
                  placeholder="Choose a sample"
                  data={samples.map((sample) => ({
                    label: sample.name,
                    value: sample.file,
                  }))}
                  value={selectedFile}
                  onChange={setSelectedFile}
                  style={{ maxWidth: 320 }}
                />
                {selectedSample?.description && (
                  <Text size="sm" c="dimmed">
                    {selectedSample.description}
                  </Text>
                )}
              </Group>
            )}

            {selectedSample && (
              <Paper withBorder radius="md" shadow="sm" p="sm">
                <Box
                  component="iframe"
                  src={`/samples/${selectedSample.file}`}
                  title={selectedSample.name}
                  sandbox="allow-same-origin allow-scripts allow-forms allow-modals allow-popups allow-downloads"
                  style={{ width: '100%', height: '70vh', border: 'none', borderRadius: 8 }}
                />
              </Paper>
            )}

            {!loading && !error && samples.length === 0 && (
              <Text size="sm" c="dimmed">
                No samples found. Add HTML files to <code>public/samples</code> and list them in{' '}
                <code>public/samples/manifest.json</code>.
              </Text>
            )}
          </Stack>
        </Container>
      </AppShell.Main>
    </AppShell>
  );
};
