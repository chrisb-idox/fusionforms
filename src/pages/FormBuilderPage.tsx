import { useState } from 'react';
import { AppShell, Container, Modal } from '@mantine/core';
import { BuilderBody } from '../components/builder/BuilderBody';
import { BuilderHeader } from '../components/builder/BuilderHeader';
import { FormRenderer } from '../components/renderer/FormRenderer';
import { FormBuilderProvider, useFormBuilder } from '../context/FormBuilderContext';
import type { FormSchema } from '../types/formSchema';
import { createId } from '../types/formSchema';
import { createEmptySection } from '../context/formBuilderHelpers';
import { useLocation } from 'react-router-dom';

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
    version: 1,
    sections: [section],
  };
};

const BuilderContent = () => {
  const { schema } = useFormBuilder();
  const [previewOpen, setPreviewOpen] = useState(false);
  const handleClosePreview = () => setPreviewOpen(false);

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
          <BuilderHeader onPreview={() => setPreviewOpen(true)} />
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
  const [initialSchema] = useState<FormSchema>(() => importedSchema ?? createInitialSchema());

  return (
    <FormBuilderProvider initialSchema={initialSchema}>
      <BuilderContent />
    </FormBuilderProvider>
  );
};
