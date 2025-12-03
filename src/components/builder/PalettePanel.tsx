import { Card, Group, SimpleGrid, Stack, Text } from '@mantine/core';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import type { FieldType } from '../../types/formSchema';
import { useFormBuilder } from '../../context/FormBuilderContext';

const fieldTypes: { label: string; type: FieldType }[] = [
  { label: 'Text', type: 'text' },
  { label: 'Textarea', type: 'textarea' },
  { label: 'Number', type: 'number' },
  { label: 'Date', type: 'date' },
  { label: 'Select', type: 'select' },
  { label: 'Checkbox', type: 'checkbox' },
  { label: 'Radio', type: 'radio' },
];

export const PalettePanel = () => {
  const { schema, selection, addField, addRow, addSection, addTableSection, addStaticBlock } = useFormBuilder();

  const targetSectionId =
    selection?.type === 'section'
      ? selection.id
      : selection?.type === 'row'
        ? schema.sections.find((section) =>
            section.rows.some((row) => row.id === selection.id),
          )?.id
        : selection?.type === 'field'
          ? schema.sections.find((section) =>
              section.rows.some((row) =>
                row.columns.some((col) => col.fields.some((f) => f.id === selection.id)),
              ),
            )?.id
          : selection?.type === 'static'
            ? schema.sections.find((section) =>
                section.rows.some((row) =>
                  row.columns.some((col) =>
                    (col.staticBlocks || []).some((block) => block.id === selection.id),
                  ),
                ),
              )?.id
            : schema.sections[0]?.id;

  const targetColumnId = (() => {
    if (selection?.type === 'field') {
      return schema.sections
        .flatMap((section) => section.rows)
        .flatMap((row) => row.columns)
        .find((column) => column.fields.some((field) => field.id === selection.id))
        ?.id;
    }

    if (selection?.type === 'static') {
      return schema.sections
        .flatMap((section) => section.rows)
        .flatMap((row) => row.columns)
        .find((column) => (column.staticBlocks || []).some((block) => block.id === selection.id))
        ?.id;
    }

    if (selection?.type === 'row') {
      return schema.sections
        .flatMap((section) => section.rows)
        .find((row) => row.id === selection.id)
        ?.columns[0]?.id;
    }

    if (selection?.type === 'section') {
      const section = schema.sections.find((item) => item.id === selection.id);
      return section?.rows[0]?.columns[0]?.id;
    }

    return schema.sections[0]?.rows[0]?.columns[0]?.id;
  })();

  const handleAddField = (type: FieldType) => {
    if (targetColumnId) {
      addField(targetColumnId, type);
    }
  };

  const handleAddStatic = () => {
    if (targetColumnId) {
      addStaticBlock(targetColumnId);
    }
  };

  const handleAddRow = () => {
    if (targetSectionId) {
      addRow(targetSectionId);
    }
  };

  return (
    <Card shadow="sm" padding="md" radius="md" withBorder>
      <Stack gap="sm">
        <Text fw={600}>Palette</Text>
        <Text size="sm" c="dimmed">
          Drag a field into the canvas or click to add it to the current column.
        </Text>
        <SimpleGrid cols={2} spacing="xs">
          {fieldTypes.map((item) => (
            <PaletteItem
              key={item.type}
              label={item.label}
              type={item.type}
              onClick={handleAddField}
              canAdd={Boolean(targetColumnId)}
            />
          ))}
        </SimpleGrid>
        <StaticPaletteItem onClick={handleAddStatic} canAdd={Boolean(targetColumnId)} />
        <Group grow>
          <Card
            padding="sm"
            withBorder
            radius="md"
            shadow="xs"
            style={{ cursor: 'pointer' }}
            onClick={() => addSection('New section')}
          >
            <Text size="sm" fw={600}>
              Add section
            </Text>
          </Card>
          <Card
            padding="sm"
            withBorder
            radius="md"
            shadow="xs"
            style={{ cursor: targetSectionId ? 'pointer' : 'not-allowed' }}
            onClick={handleAddRow}
          >
            <Text size="sm" fw={600}>
              Add row
            </Text>
          </Card>
        </Group>
        <Group grow>
          <Card
            padding="sm"
            withBorder
            radius="md"
            shadow="xs"
            style={{ cursor: 'pointer' }}
            onClick={() => addTableSection('New table')}
          >
            <Text size="sm" fw={600}>
              Add table section
            </Text>
          </Card>
        </Group>
      </Stack>
    </Card>
  );
};

interface PaletteItemProps {
  label: string;
  type: FieldType;
  onClick: (type: FieldType) => void;
  canAdd: boolean;
}

const PaletteItem = ({ label, type, onClick, canAdd }: PaletteItemProps) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `palette-${type}`,
    data: { type: 'palette-field', fieldType: type },
  });

  return (
    <Card
      ref={setNodeRef}
      padding="sm"
      withBorder
      radius="md"
      shadow="xs"
      {...attributes}
      {...listeners}
      onClick={() => canAdd && onClick(type)}
      style={{
        cursor: canAdd ? 'grab' : 'not-allowed',
        transform: transform ? CSS.Translate.toString(transform) : undefined,
        opacity: isDragging ? 0.65 : 1,
        userSelect: 'none',
      }}
    >
      <Text size="sm" fw={600}>
        {label}
      </Text>
      <Text size="xs" c="dimmed">
        Drag or click
      </Text>
    </Card>
  );
};

const StaticPaletteItem = ({
  onClick,
  canAdd,
}: {
  onClick: () => void;
  canAdd: boolean;
}) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: 'palette-static',
    data: { type: 'palette-static' },
  });

  return (
    <Card
      ref={setNodeRef}
      padding="sm"
      withBorder
      radius="md"
      shadow="xs"
      {...attributes}
      {...listeners}
      onClick={() => canAdd && onClick()}
      style={{
        cursor: canAdd ? 'grab' : 'not-allowed',
        transform: transform ? CSS.Translate.toString(transform) : undefined,
        opacity: isDragging ? 0.65 : 1,
        userSelect: 'none',
      }}
    >
      <Text size="sm" fw={600}>
        Static text
      </Text>
      <Text size="xs" c="dimmed">
        Add rich text block
      </Text>
    </Card>
  );
};
