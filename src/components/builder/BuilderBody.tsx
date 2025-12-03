import { Box, Group, Stack, Title } from '@mantine/core';
import type { DragEndEvent } from '@dnd-kit/core';
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { useFormBuilder } from '../../context/FormBuilderContext';
import type { ColumnSchema, SectionSchema } from '../../types/formSchema';

const findColumnById = (
  sections: SectionSchema[],
  columnId: string,
): ColumnSchema | undefined => {
  function searchColumns(columns: ColumnSchema[]): ColumnSchema | undefined {
    for (const column of columns) {
      if (column.id === columnId) return column;
      for (const nested of column.nestedTables || []) {
        const nestedMatch = searchRows(nested.rows);
        if (nestedMatch) return nestedMatch;
      }
    }
    return undefined;
  }

  function searchRows(rows: SectionSchema['rows']): ColumnSchema | undefined {
    for (const row of rows) {
      const match = searchColumns(row.columns);
      if (match) return match;
    }
    return undefined;
  }

  for (const section of sections) {
    const match = searchRows(section.rows);
    if (match) return match;
  }

  return undefined;
};
import { CanvasPanel } from './CanvasPanel';
import { PalettePanel } from './PalettePanel';
import { PropertiesPanel } from './PropertiesPanel';

export const BuilderBody = () => {
  const { schema, reorderRows, reorderFields, addField, addStaticBlock } = useFormBuilder();
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeType = active.data.current?.type;
    const overType = over.data.current?.type;

    if (activeType === 'row' && overType === 'row') {
      const sectionId = active.data.current?.sectionId;
      const overSectionId = over.data.current?.sectionId;
      if (sectionId && sectionId === overSectionId) {
        const section = schema.sections.find((s) => s.id === sectionId);
        if (!section) return;
        const oldIndex = section.rows.findIndex((row) => row.id === active.id);
        const newIndex = section.rows.findIndex((row) => row.id === over.id);
        if (oldIndex !== -1 && newIndex !== -1) {
          reorderRows(sectionId, oldIndex, newIndex);
        }
      }
    }

    if (activeType === 'field' && overType === 'field') {
      const columnId = active.data.current?.columnId;
      const overColumnId = over.data.current?.columnId;
      if (columnId && columnId === overColumnId) {
        const column = findColumnById(schema.sections, columnId);
        if (!column) return;
        const oldIndex = column.fields.findIndex((field) => field.id === active.id);
        const newIndex = column.fields.findIndex((field) => field.id === over.id);
        if (oldIndex !== -1 && newIndex !== -1) {
          reorderFields(columnId, oldIndex, newIndex);
        }
      }
    }

    if (activeType === 'palette-field') {
      const targetColumnId =
        (overType === 'column' && over.data.current?.columnId) ||
        (overType === 'field' && over.data.current?.columnId);

      if (targetColumnId) {
        addField(targetColumnId, active.data.current?.fieldType);
      }
    }

    if (activeType === 'palette-static') {
      const targetColumnId =
        (overType === 'column' && over.data.current?.columnId) ||
        (overType === 'field' && over.data.current?.columnId);

      if (targetColumnId) {
        addStaticBlock(targetColumnId);
      }
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <Stack gap="md">
        <Title order={3} fw={600}>
          Form canvas
        </Title>
        <Group
          align="flex-start"
          gap="md"
          wrap="nowrap"
          justify="space-between"
          w="100%"
        >
          <Box
            style={{
              position: 'sticky',
              top: 96,
              alignSelf: 'flex-start',
              flex: '0 0 260px',
            }}
          >
            <PalettePanel />
          </Box>
          <Box style={{ flex: '1 1 auto', minWidth: 0 }}>
            <CanvasPanel />
          </Box>
          <Box
            style={{
              position: 'sticky',
              top: 96,
              alignSelf: 'flex-start',
              flex: '0 0 320px',
              marginLeft: 'auto',
            }}
          >
            <PropertiesPanel />
          </Box>
        </Group>
      </Stack>
    </DndContext>
  );
};
