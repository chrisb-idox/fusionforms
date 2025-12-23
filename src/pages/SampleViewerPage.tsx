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
import { Link, useNavigate } from 'react-router-dom';
import { parseSampleHtmlToSchema } from '../utils/sampleParser';

interface SampleEntry {
  name: string;
  file: string;
  description?: string;
}

const manifestUrl = `${import.meta.env.BASE_URL}samples/manifest.json`;

export const SampleViewerPage = () => {
  const [samples, setSamples] = useState<SampleEntry[]>([]);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const navigate = useNavigate();

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

  const handleImportToBuilder = async () => {
    if (!selectedSample) return;
    setImporting(true);
    setError(null);
    try {
      const sampleUrl = `${import.meta.env.BASE_URL}samples/${selectedSample.file}`;
      const response = await fetch(sampleUrl);
      if (!response.ok) {
        throw new Error(`Failed to load sample (${response.status})`);
      }
      const html = await response.text();
      const schema = parseSampleHtmlToSchema(html, selectedSample.name);
      navigate('/', { state: { importedSchema: schema } });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to load sample into the builder',
      );
    } finally {
      setImporting(false);
    }
  };

  return (
    <AppShell
      padding="md"
      header={{ height: 72 }}
      style={{ background: 'var(--page-bg)' }}
      styles={{
        main: {
          background: 'transparent',
          paddingTop: 'calc(72px + 16px)',
          paddingBottom: 32,
        },
      }}
    >
      <AppShell.Header
        style={{
          background: 'var(--surface)',
          borderBottom: '1px solid var(--border)',
          position: 'sticky',
          top: 0,
          zIndex: 5,
        }}
      >
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
              <Group align="flex-end" gap="md" wrap="wrap">
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
                <Button
                  variant="light"
                  onClick={handleImportToBuilder}
                  disabled={!selectedSample}
                  loading={importing}
                >
                  Load in builder
                </Button>
                {selectedSample?.description && (
                  <Text size="sm" c="dimmed">
                    {selectedSample.description}
                  </Text>
                )}
              </Group>
            )}

            {selectedSample && (
              <Paper withBorder radius="md" shadow="sm" p="sm" style={{ overflowX: 'auto' }}>
                <Box
                  component="iframe"
                  src={`${import.meta.env.BASE_URL}samples/${selectedSample.file}`}
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
