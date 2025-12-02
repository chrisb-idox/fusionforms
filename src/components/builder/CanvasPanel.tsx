import React from 'react';
import { ActionIcon, Card, Group, Paper, Stack, Table, Text, ThemeIcon } from '@mantine/core';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useFormBuilder } from '../../context/FormBuilderContext';
import type { ColumnSchema, FieldSchema, RowSchema, SectionSchema } from '../../types/formSchema';

const DragHandle = (props: React.HTMLAttributes<HTMLDivElement>) => {
  return (
    <div
      {...props}
      style={{
        cursor: 'grab',
        padding: '2px 6px',
        borderRadius: 6,
        background: '#f1f5f9',
        fontSize: 12,
        userSelect: 'none',
        ...props.style,
      }}
    >
      ⋮⋮
    </div>
  );
};

interface FieldItemProps {
  field: FieldSchema;
  columnId: string;
}

const FieldItem = ({ field, columnId }: FieldItemProps) => {
  const { selection, selectElement, removeField } = useFormBuilder();
  const bindingToken = field.bindingProperty ? `\${${field.bindingProperty}}` : null;
  const sortable = useSortable({
    id: field.id,
    data: { type: 'field', columnId },
  });

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    sortable;

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    border: selection?.id === field.id ? '1px solid #228be6' : '1px solid #e2e8f0',
    boxShadow: isDragging ? '0 4px 12px rgba(0,0,0,0.12)' : 'none',
    opacity: isDragging ? 0.7 : 1,
  };

  return (
    <Card
      ref={setNodeRef}
      padding="sm"
      radius="md"
      withBorder
      style={style}
      onClick={(event) => {
        event.stopPropagation();
        selectElement({ type: 'field', id: field.id });
      }}
    >
      <Group justify="space-between" align="center">
        <Group gap="xs">
          <DragHandle {...attributes} {...listeners} />
          <Group gap="xs">
            <Text size="sm" fw={600}>
              {field.label || field.name}
            </Text>
            {bindingToken && (
              <Text size="xs" c="dimmed" fs="italic">
                {bindingToken}
              </Text>
            )}
          </Group>
        </Group>
        <ActionIcon
          variant="subtle"
          color="red"
          aria-label="Remove field"
          onClick={(event) => {
            event.stopPropagation();
            removeField(field.id);
          }}
        >
          ✕
        </ActionIcon>
      </Group>
    </Card>
  );
};

interface RowEditorProps {
  row: RowSchema;
  sectionId: string;
}

const RowEditor = ({ row, sectionId }: RowEditorProps) => {
  const { selection, selectElement, removeRow } = useFormBuilder();
  const sortable = useSortable({
    id: row.id,
    data: { type: 'row', sectionId },
  });

  const { setNodeRef, attributes, listeners, transform, transition, isDragging } =
    sortable;

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    border: selection?.id === row.id ? '1px solid #228be6' : '1px solid #e2e8f0',
    backgroundColor: '#fff',
    boxShadow: isDragging ? '0 4px 12px rgba(0,0,0,0.12)' : 'none',
  };

  return (
    <Card
      ref={setNodeRef}
      padding="sm"
      radius="md"
      withBorder
      style={style}
      onClick={(event) => {
        event.stopPropagation();
        selectElement({ type: 'row', id: row.id });
      }}
    >
      <Group justify="space-between" mb="xs">
        <Group gap="xs">
          <DragHandle {...attributes} {...listeners} />
          <Text size="sm" fw={600}>
            Row
          </Text>
        </Group>
        <ActionIcon
          variant="subtle"
          color="red"
          aria-label="Remove row"
          onClick={(event) => {
            event.stopPropagation();
            removeRow(row.id);
          }}
        >
          ✕
        </ActionIcon>
      </Group>
      <Group align="flex-start" gap="sm">
        {row.columns.map((column) => (
          <ColumnEditor key={column.id} column={column} />
        ))}
      </Group>
    </Card>
  );
};

interface ColumnEditorProps {
  column: ColumnSchema;
}

const ColumnEditor = ({ column }: ColumnEditorProps) => {
  const { setNodeRef, isOver } = useDroppable({
    id: `column-${column.id}`,
    data: { type: 'column', columnId: column.id },
  });

  return (
    <Paper
      ref={setNodeRef}
      style={{ flex: column.span / 4 }}
      p="xs"
      bg={isOver ? '#edf2ff' : '#f8fafc'}
      radius="md"
      withBorder
    >
      <Stack gap="xs">
        <SortableContext items={column.fields.map((field) => field.id)} strategy={verticalListSortingStrategy}>
          {column.fields.map((field) => (
            <FieldItem key={field.id} field={field} columnId={column.id} />
          ))}
        </SortableContext>
        {column.fields.length === 0 && (
          <Text size="xs" c="dimmed" ta="center">
            Drag fields here
          </Text>
        )}
      </Stack>
    </Paper>
  );
};

interface SectionEditorProps {
  section: SectionSchema;
}

const SectionEditor = ({ section }: SectionEditorProps) => {
  const { selection, selectElement, addRow, removeSection } = useFormBuilder();

  const renderTable = (rows: RowSchema[], level = 0) => (
    <Table
      withRowBorders
      withColumnBorders
      highlightOnHover
      style={{ background: 'white', borderRadius: 8, overflow: 'hidden' }}
    >
      <Table.Tbody>
        {rows.map((row) => (
          <Table.Tr key={row.id}>
            {row.columns.map((column) => (
              <Table.Td
                key={column.id}
                colSpan={column.colSpan ?? 1}
                rowSpan={column.rowSpan ?? 1}
                style={{ verticalAlign: 'top' }}
              >
                <Stack gap="xs">
                  {column.fields.map((field) => (
                    <FieldItem key={field.id} field={field} columnId={column.id} />
                  ))}
                  {column.nestedTables?.map((nested) => (
                    <Stack key={nested.id} gap="xs" pt="xs">
                      {renderTable(nested.rows, level + 1)}
                    </Stack>
                  ))}
                </Stack>
              </Table.Td>
            ))}
          </Table.Tr>
        ))}
      </Table.Tbody>
    </Table>
  );

  return (
    <Card
      padding="md"
      radius="md"
      withBorder
      bg={selection?.id === section.id ? '#eef2ff' : 'white'}
      style={{ border: selection?.id === section.id ? '1px solid #228be6' : undefined }}
      onClick={() => selectElement({ type: 'section', id: section.id })}
    >
      <Group justify="space-between" mb="sm">
        <Group gap="sm">
          <ThemeIcon color="blue" variant="light" size="sm">
            #
          </ThemeIcon>
          <Text fw={700}>{section.title}</Text>
        </Group>
        <ActionIcon
          variant="subtle"
          color="red"
          aria-label="Remove section"
          onClick={(event) => {
            event.stopPropagation();
            removeSection(section.id);
          }}
        >
          ✕
        </ActionIcon>
      </Group>

      {section.layout === 'table' ? (
        renderTable(section.rows)
      ) : (
        <SortableContext
          items={section.rows.map((row) => row.id)}
          strategy={verticalListSortingStrategy}
        >
          <Stack gap="sm">
            {section.rows.map((row) => (
              <RowEditor key={row.id} row={row} sectionId={section.id} />
            ))}
          </Stack>
        </SortableContext>
      )}

      {section.layout !== 'table' && (
        <Card
          mt="sm"
          padding="sm"
          radius="md"
          withBorder
          style={{ cursor: 'pointer' }}
          onClick={(event) => {
            event.stopPropagation();
            addRow(section.id);
          }}
        >
          <Text size="sm" fw={600}>
            + Add row
          </Text>
        </Card>
      )}
    </Card>
  );
};

export const CanvasPanel = () => {
  const { schema, selectElement, selection } = useFormBuilder();

  return (
    <Stack gap="md">
      <Card
        withBorder
        padding="md"
        radius="md"
        bg={selection?.type === 'form' ? '#eef2ff' : 'white'}
        style={{ border: selection?.type === 'form' ? '1px solid #228be6' : undefined, cursor: 'pointer' }}
        onClick={() => selectElement({ type: 'form', id: schema.id })}
      >
        <Text fw={700}>{schema.name}</Text>
        <Text size="sm" c="dimmed">
          {schema.description || 'Click to edit form properties.'}
        </Text>
      </Card>
      {schema.sections.map((section) => (
        <SectionEditor key={section.id} section={section} />
      ))}
      {schema.sections.length === 0 && (
        <Card withBorder>
          <Text c="dimmed">No sections yet. Add one from the palette.</Text>
        </Card>
      )}
    </Stack>
  );
};
