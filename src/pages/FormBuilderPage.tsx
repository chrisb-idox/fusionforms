import { useState, useEffect } from 'react';
import { AppShell, Container, Modal, Loader, Center, Stack, Text, Button } from '@mantine/core';
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
    actionCode: undefined, // No default - user can choose or leave as None
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
          const schema = result.schema;
          
          // Parse filename to extract action code and set form name
          if (result.filename) {
            const filenameWithoutExt = result.filename.replace(/\.html$/, '');
            const parts = filenameWithoutExt.split('_');
            
            if (parts.length >= 2) {
              const className = parts.slice(0, -1).join('_');
              const actionCode = parts[parts.length - 1];
              
              // Set the action code if it exists
              schema.actionCode = actionCode || schema.actionCode;
              
              // Set a friendly form name if not already set
              if (!schema.name || schema.name === 'Untitled form') {
                schema.name = `${className} ${actionCode || ''} Form`.trim();
              }
            }
          }
          
          setInitialSchema(schema);
          setLoadError(null);
        } else {
          // Form load failed - show error without loading default form
          setLoadError(result.error || 'Failed to load form');
          setInitialSchema(null); // Don't load any form
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

  // Show loading spinner only when actively loading
  if (loading) {
    return (
      <Center style={{ height: '100vh' }}>
        <Stack align="center" gap="md">
          <Loader size="xl" />
          <Text size="lg" c="dimmed">Loading form...</Text>
        </Stack>
      </Center>
    );
  }

  // Show error if form load failed
  if (loadError) {
    return (
      <Center style={{ height: '100vh' }}>
        <Stack align="center" gap="lg" style={{ maxWidth: '600px', padding: '2rem' }}>
          <IconAlertCircle size={64} color="red" />
          <Text size="xl" fw={600} ta="center">Form Not Found</Text>
          <div style={{ whiteSpace: 'pre-line', textAlign: 'center' }}>
            <Text size="sm" c="dimmed">
              {loadError}
            </Text>
          </div>
          <Button onClick={() => window.location.href = window.location.origin + import.meta.env.BASE_URL}>
            Go to Form Builder
          </Button>
        </Stack>
      </Center>
    );
  }

  // Only render form if we have a schema
  if (!initialSchema) {
    return (
      <Center style={{ height: '100vh' }}>
        <Stack align="center" gap="md">
          <Text size="lg" c="dimmed">No form to display</Text>
          <Button onClick={() => window.location.href = window.location.origin + import.meta.env.BASE_URL}>
            Go to Form Builder
          </Button>
        </Stack>
      </Center>
    );
  }

  return (
    <FormBuilderProvider initialSchema={initialSchema}>
      <BuilderContent />
    </FormBuilderProvider>
  );
};
