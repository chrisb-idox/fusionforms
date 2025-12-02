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
import { CanvasPanel } from './CanvasPanel';
import { PalettePanel } from './PalettePanel';
import { PropertiesPanel } from './PropertiesPanel';

export const BuilderBody = () => {
  const { schema, reorderRows, reorderFields, addField } = useFormBuilder();
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
        const column = schema.sections
          .flatMap((section) => section.rows)
          .flatMap((row) => row.columns)
          .find((col) => col.id === columnId);
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
        <Group align="flex-start" gap="md" wrap="nowrap">
          <Box w={250}>
            <PalettePanel />
          </Box>
          <Box style={{ flex: 1, minWidth: 0 }}>
            <CanvasPanel />
          </Box>
          <Box w={300}>
            <PropertiesPanel />
          </Box>
        </Group>
      </Stack>
    </DndContext>
  );
};
