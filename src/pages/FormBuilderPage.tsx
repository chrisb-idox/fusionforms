import { useState, useEffect } from 'react';
import { AppShell, Container, Modal, Loader, Center, Stack, Text, Alert } from '@mantine/core';
import { IconAlertCircle } from '@tabler/icons-react';
import { BuilderBody } from '../components/builder/BuilderBody';
import { BuilderHeader } from '../components/builder/BuilderHeader';
import { FormRenderer } from '../components/renderer/FormRenderer';
import { FormBuilderProvider, useFormBuilder } from '../context/FormBuilderContext';
import type { FormSchema } from '../types/formSchema';
import { createId } from '../types/formSchema';
import { createEmptySection } from '../context/formBuilderHelpers';
import { useLocation } from 'react-router-dom';
import { getFormSourceFromUrl, loadFormFromSource } from '../utils/formLoader';

const createInitialSchema = (): FormSchema => {
  const section = createEmptySection('Getting started');
  const [firstRow] = section.rows;
  firstRow.columns[0].fields = [
    {
      id: createId(),
      type: 'text',
      name: 'fullName',
      label: 'Full name',
      placeholder: 'Jane Doe',
      validations: [{ type: 'required', message: 'Name is required' }],
    },
    {
      id: createId(),
      type: 'text',
      name: 'email',
      label: 'Email',
      placeholder: 'name@email.com',
      validations: [{ type: 'required', message: 'Email is required' }],
    },
    {
      id: createId(),
      type: 'select',
      name: 'contactReason',
      label: 'Reason for contact',
      options: [
        { label: 'Support', value: 'support' },
        { label: 'Sales', value: 'sales' },
        { label: 'Other', value: 'other' },
      ],
      placeholder: 'Choose one',
    },
  ];

  return {
    id: createId(),
    name: 'Untitled form',
    description: 'Start describing your form purpose here.',
    formClass: 'FusionDocument', // Default to first class
    actionCode: 'CRE', // Default to first action code
    version: 1,
    sections: [section],
  };
};

const BuilderContent = () => {
  const { schema, updateForm } = useFormBuilder();
  const [previewOpen, setPreviewOpen] = useState(false);
  const handleClosePreview = () => setPreviewOpen(false);

  const handleReset = () => {
    const defaultSchema = createInitialSchema();
    updateForm({
      name: defaultSchema.name,
      description: defaultSchema.description,
      formClass: defaultSchema.formClass,
      actionCode: defaultSchema.actionCode,
      sections: defaultSchema.sections,
      version: defaultSchema.version,
    });
  };

  return (
    <>
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
          <BuilderHeader onPreview={() => setPreviewOpen(true)} onReset={handleReset} />
        </AppShell.Header>
        <AppShell.Main>
          <Container fluid px="md">
            <BuilderBody />
          </Container>
        </AppShell.Main>
      </AppShell>

      <Modal
        opened={previewOpen}
        onClose={handleClosePreview}
        title="Form preview"
        size="90%"
        radius="md"
      >
        <FormRenderer
          schema={schema}
          onSubmit={(values) => {
            console.log('Form submitted', values);
            handleClosePreview();
          }}
        />
      </Modal>
    </>
  );
};

export const FormBuilderPage = () => {
  const location = useLocation();
  const importedSchema =
    (location.state as { importedSchema?: FormSchema } | null)?.importedSchema;
  
  const [initialSchema, setInitialSchema] = useState<FormSchema | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    const loadForm = async () => {
      // Check if we have an imported schema from router state
      if (importedSchema) {
        setInitialSchema(importedSchema);
        setLoading(false);
        return;
      }

      // Check for URL parameters
      const formSource = getFormSourceFromUrl();
      
      if (formSource) {
        setLoading(true);
        setLoadError(null);
        
        const result = await loadFormFromSource(formSource);
        
        if (result.success && result.schema) {
          setInitialSchema(result.schema);
          setLoadError(null);
        } else {
          setLoadError(result.error || 'Failed to load form');
          setInitialSchema(createInitialSchema()); // Fallback to default
        }
        
        setLoading(false);
      } else {
        // No import source, use default schema
        setInitialSchema(createInitialSchema());
        setLoading(false);
      }
    };

    loadForm();
  }, [importedSchema]);

  if (loading || !initialSchema) {
    return (
      <Center style={{ height: '100vh' }}>
        <Stack align="center" gap="md">
          <Loader size="xl" />
          <Text size="lg" c="dimmed">Loading form...</Text>
        </Stack>
      </Center>
    );
  }

  return (
    <>
      {loadError && (
        <Alert 
          icon={<IconAlertCircle size={16} />} 
          title="Form Load Warning" 
          color="yellow"
          style={{ 
            position: 'fixed', 
            top: 16, 
            left: '50%', 
            transform: 'translateX(-50%)', 
            zIndex: 1000,
            maxWidth: '600px',
            width: '90%'
          }}
          withCloseButton
          onClose={() => setLoadError(null)}
        >
          {loadError}. Using default form instead.
        </Alert>
      )}
      <FormBuilderProvider initialSchema={initialSchema}>
        <BuilderContent />
      </FormBuilderProvider>
    </>
  );
};
