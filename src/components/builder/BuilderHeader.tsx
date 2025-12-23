import { Button, Group, Select, Stack, Text, Badge, ActionIcon, Menu } from '@mantine/core';
import { IconSettings, IconDownload, IconFileExport, IconChevronDown } from '@tabler/icons-react';
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useFormBuilder } from '../../context/FormBuilderContext';
import { getActionCodesSync, type ActionCodeItem } from '../../utils/actionCodesLibrary';
import { schemaToHtml } from '../../utils/schemaExporter';
import { parseSampleHtmlToSchema } from '../../utils/sampleParser';
import logo from '../../assets/logo.png';
import { FormEditor } from './FormEditor';
import { getPropertiesLibrary } from '../../utils/propertiesLibrary';
import { SettingsModal } from '../settings/SettingsModal';

interface BuilderHeaderProps {
  onPreview: () => void;
  onReset: () => void;
}

export const BuilderHeader = ({ onPreview, onReset }: BuilderHeaderProps) => {
  const { schema, updateForm } = useFormBuilder();
  const [formEditorOpen, setFormEditorOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [formsLibraryOpen, setFormsLibraryOpen] = useState(false);
  const [actionCodes, setActionCodes] = useState<ActionCodeItem[]>([]);
  const propertiesLibrary = getPropertiesLibrary();

  useEffect(() => {
    // Load action codes on mount and when settings might have changed
    const loadCodes = () => {
      const codes = getActionCodesSync();
      setActionCodes(codes);
    };
    
    loadCodes();
    
    // Listen for storage events to update when codes change in settings
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'fusionforms_action_codes') {
        loadCodes();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    // Also listen for custom event for same-window updates
    const handleCodesUpdate = () => loadCodes();
    window.addEventListener('fusionforms_codes_updated', handleCodesUpdate);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('fusionforms_codes_updated', handleCodesUpdate);
    };
  }, []);

  const handleReset = () => {
    if (confirm('Are you sure you want to reset the form? All changes will be lost.')) {
      onReset();
    }
  };

  const handleLoad = async () => {
    try {
      // Use showOpenFilePicker if available (modern browsers)
      if ('showOpenFilePicker' in window) {
        const opts = {
          types: [{
            description: 'Form Files',
            accept: {
              'application/json': ['.json'],
              'text/html': ['.html', '.xml'],
            },
          }],
          multiple: false,
        };
        
        const [fileHandle] = await (window as unknown as { showOpenFilePicker: (opts: unknown) => Promise<FileSystemFileHandle[]> }).showOpenFilePicker(opts);
        const file = await fileHandle.getFile();
        const text = await file.text();
        
        try {
          let loadedSchema;
          
          // Detect file type and parse accordingly
          if (file.name.endsWith('.json')) {
            // Parse JSON schema from Save button
            loadedSchema = JSON.parse(text);
          } else {
            // Parse HTML/XML legacy form
            loadedSchema = parseSampleHtmlToSchema(text, file.name);
          }
          
          // Update the entire form with loaded schema
          updateForm({
            name: loadedSchema.name,
            description: loadedSchema.description,
            formClass: loadedSchema.formClass,
            actionCode: loadedSchema.actionCode,
            sections: loadedSchema.sections,
            version: loadedSchema.version,
          });
          
          alert(`Successfully loaded ${file.name}`);
        } catch (error) {
          console.error('Failed to parse file', error);
          alert('Failed to parse file. Please ensure it is a valid JSON or HTML form file.');
        }
      } else {
        // Fallback for older browsers - create file input
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json,.html,.xml';
        
        input.onchange = async (e) => {
          const file = (e.target as HTMLInputElement).files?.[0];
          if (!file) return;
          
          const text = await file.text();
          try {
            let loadedSchema;
            
            // Detect file type and parse accordingly
            if (file.name.endsWith('.json')) {
              // Parse JSON schema from Save button
              loadedSchema = JSON.parse(text);
            } else {
              // Parse HTML/XML legacy form
              loadedSchema = parseSampleHtmlToSchema(text, file.name);
            }
            
            // Update the entire form with loaded schema
            updateForm({
              name: loadedSchema.name,
              description: loadedSchema.description,
              formClass: loadedSchema.formClass,
              actionCode: loadedSchema.actionCode,
              sections: loadedSchema.sections,
              version: loadedSchema.version,
            });
            
            alert(`Successfully loaded ${file.name}`);
          } catch (error) {
            console.error('Failed to parse file', error);
            alert('Failed to parse file. Please ensure it is a valid JSON or HTML form file.');
          }
        };
        
        input.click();
      }
    } catch (error) {
      if (error instanceof Error && error.name !== 'AbortError') {
        console.error('Failed to load file', error);
        alert('Could not load file');
      }
    }
  };

  const handleSaveFormDetails = (name: string, formClass: string) => {
    // Clear field bindings that don't exist in the new class
    const newClassProperties = propertiesLibrary.find((cls) => cls.name === formClass);
    const validPropertyNames = new Set(newClassProperties?.properties.map((p) => p.name) || []);
    
    // Deep clone and clean bindings
    const cleanedSections = schema.sections.map((section) => ({
      ...section,
      rows: section.rows.map((row) => ({
        ...row,
        columns: row.columns.map((column) => ({
          ...column,
          fields: column.fields.map((field) => {
            if (field.bindingProperty && !validPropertyNames.has(field.bindingProperty)) {
              // Remove invalid binding
              // eslint-disable-next-line @typescript-eslint/no-unused-vars
              const { bindingProperty, defaultValue, ...rest } = field;
              return rest;
            }
            return field;
          }),
        })),
      })),
    }));

    updateForm({ 
      name,
      formClass,
      sections: cleanedSections
    });
  };

  const handleSave = async () => {
    try {
      const filename = `${(schema.name || 'form').replace(/\s+/g, '_')}.json`;
      const jsonContent = JSON.stringify(schema, null, 2);
      
      // Use showSaveFilePicker if available (modern browsers)
      if ('showSaveFilePicker' in window) {
        try {
          const opts = {
            suggestedName: filename,
            types: [{
              description: 'JSON Schema',
              accept: { 'application/json': ['.json'] },
            }],
          };
          const handle = await (window as unknown as { showSaveFilePicker: (opts: unknown) => Promise<FileSystemFileHandle> }).showSaveFilePicker(opts);
          const writable = await handle.createWritable();
          await writable.write(jsonContent);
          await writable.close();
          
          // Also backup to localStorage for auto-recovery
          localStorage.setItem('form-builder-schema', JSON.stringify(schema));
        } catch (err) {
          if (err instanceof Error && err.name !== 'AbortError') {
            console.error('Save failed', err);
            alert('Could not save file');
          }
        }
      } else {
        // Fallback to traditional download
        const confirmDownload = confirm(
          `Save as "${filename}"?\n\nThe file will be downloaded to your Downloads folder.`
        );
        if (confirmDownload) {
          const blob = new Blob([jsonContent], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = filename;
          link.click();
          URL.revokeObjectURL(url);
          
          // Also backup to localStorage for auto-recovery
          localStorage.setItem('form-builder-schema', JSON.stringify(schema));
        }
      }
    } catch (error) {
      console.error('Failed to save schema', error);
      alert('Could not save file');
    }
  };

  const handleExportDownload = () => {
    try {
      const html = schemaToHtml(schema);
      const className = schema.formClass || 'UnknownClass';
      const actionCode = schema.actionCode;
      const filename = actionCode ? `${className}_${actionCode}.html` : `${className}.html`;
      
      // Check if we can detect file exists (browser limitation workaround)
      // Use showSaveFilePicker if available (modern browsers)
      if ('showSaveFilePicker' in window) {
        (async () => {
          try {
            const opts = {
              suggestedName: filename,
              types: [{
                description: 'HTML Files',
                accept: { 'text/html': ['.html'] },
              }],
            };
            const handle = await (window as unknown as { showSaveFilePicker: (opts: unknown) => Promise<FileSystemFileHandle> }).showSaveFilePicker(opts);
            const writable = await handle.createWritable();
            await writable.write(html);
            await writable.close();
          } catch (err) {
            if (err instanceof Error && err.name !== 'AbortError') {
              console.error('Save failed', err);
              alert('Could not save file');
            }
          }
        })();
      } else {
        // Fallback to traditional download with confirmation
        const confirmDownload = confirm(
          `Export as "${filename}"?\n\nNote: If a file with this name already exists in your Downloads folder, it will be overwritten or renamed by your browser.`
        );
        if (confirmDownload) {
          const blob = new Blob([html], { type: 'text/html' });
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = filename;
          link.click();
          URL.revokeObjectURL(url);
        }
      }
    } catch (error) {
      console.error('Failed to export HTML', error);
      alert('Could not export HTML');
    }
  };

  const handleExportToApp = () => {
    try {
      const html = schemaToHtml(schema);
      const className = schema.formClass || 'UnknownClass';
      const actionCode = schema.actionCode;
      const filename = actionCode ? `${className}_${actionCode}.html` : `${className}.html`;
      
      // Save to localStorage Forms Library
      const libraryKey = 'fusionforms_library';
      const library = JSON.parse(localStorage.getItem(libraryKey) || '{}');
      
      library[filename] = {
        html,
        filename,
        className,
        actionCode,
        savedAt: new Date().toISOString(),
        formName: schema.name,
      };
      
      localStorage.setItem(libraryKey, JSON.stringify(library));
      
      alert(`Form saved to Forms Library as "${filename}"\n\nGraphCycle can now access this form using:\n?form=forms/${filename}`);
    } catch (error) {
      console.error('Failed to save to Forms Library', error);
      alert('Could not save to Forms Library');
    }
  };

  return (
    <>
      <Group justify="space-between" align="flex-start" px="md" py="sm" style={{ backdropFilter: 'blur(6px)' }}>
        <Stack gap="xs">
          <Group gap="md" align="center" wrap="wrap">
            <div>
              <Text size="xs" c="dimmed" mb={2}>
                Form name
              </Text>
              <Group gap="xs" align="center">
                <Text size="lg" fw={600}>
                  {schema.name}
                </Text>
                {schema.formClass && (
                  <Badge size="md" variant="light" color="blue">
                    {schema.formClass}
                  </Badge>
                )}
                <Button size="xs" variant="light" onClick={() => setFormEditorOpen(true)}>
                  Edit
                </Button>
              </Group>
            </div>
            <Select
              label="Action code"
              placeholder="Select action"
              data={[
                { value: '', label: 'None - No suffix on filename' },
                ...actionCodes.map((item) => ({
                  value: item.value,
                  label: `${item.value} - ${item.label}`,
                })),
              ]}
              value={schema.actionCode || ''}
              onChange={(value) => updateForm({ actionCode: (value || undefined) as typeof schema.actionCode })}
              searchable
              nothingFoundMessage="No actions"
              w={320}
            />
          </Group>
          <Group gap="sm" wrap="wrap">
            <Button variant="default" onClick={handleReset} color="red">
              Reset
            </Button>
            <Button variant="default" onClick={handleLoad}>
              Load
            </Button>
            <Button component={Link} to="/samples" variant="default">
              Samples
            </Button>
            <Button variant="default" onClick={handleSave}>
              Save
            </Button>
            <Menu position="bottom-start" shadow="md">
              <Menu.Target>
                <Button variant="default" rightSection={<IconChevronDown size={16} />}>
                  Export HTML
                </Button>
              </Menu.Target>
              <Menu.Dropdown>
                <Menu.Item
                  leftSection={<IconDownload size={16} />}
                  onClick={handleExportDownload}
                >
                  Download
                </Menu.Item>
                <Menu.Item
                  leftSection={<IconFileExport size={16} />}
                  onClick={handleExportToApp}
                >
                  Forms Library
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
            <Button onClick={onPreview}>Preview</Button>
          </Group>
          <Text size="sm" c="dimmed">
            Build your sections and fields, then preview before saving.
          </Text>
        </Stack>
        <Group gap="sm" align="center">
          <ActionIcon
            variant="subtle"
            size="lg"
            onClick={() => setSettingsOpen(true)}
            aria-label="Settings"
          >
            <IconSettings size={24} />
          </ActionIcon>
          <img src={logo} style={{ width: 128, height: 128, borderRadius: 8 }} alt="Logo" />
        </Group>
      </Group>

      <FormEditor
        opened={formEditorOpen}
        onClose={() => setFormEditorOpen(false)}
        formName={schema.name}
        formClass={schema.formClass}
        onSave={handleSaveFormDetails}
      />

      <SettingsModal opened={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </>
  );
};
