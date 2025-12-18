import { createContext, useContext, useMemo, useReducer } from 'react';
import type { ReactNode } from 'react';
import type {
  ColumnSchema,
  FieldSchema,
  FieldType,
  FormSchema,
  RowSchema,
  SectionSchema,
  Selection,
  TableSchema,
} from '../types/formSchema';
import {
  createDefaultField,
  createEmptyRow,
  createEmptySection,
  createNestedTable,
  createTableSection,
  createStaticBlock,
} from './formBuilderHelpers';

interface FormBuilderState {
  schema: FormSchema;
  selection: Selection | null;
}

type Action =
  | { type: 'setSchema'; payload: FormSchema }
  | { type: 'selectElement'; payload: Selection | null }
  | { type: 'updateForm'; payload: Partial<FormSchema> }
  | { type: 'updateSection'; payload: { id: string; data: Partial<SectionSchema> } }
  | { type: 'updateRow'; payload: { id: string; data: Partial<RowSchema> } }
  | { type: 'updateField'; payload: { id: string; data: Partial<FieldSchema> } }
  | { type: 'addSection'; payload?: { title?: string } }
  | { type: 'addTableSection'; payload?: { title?: string; columns?: number } }
  | { type: 'addRow'; payload: { sectionId: string } }
  | { type: 'addField'; payload: { columnId: string; type?: FieldType } }
  | { type: 'addNestedTable'; payload: { columnId: string } }
  | { type: 'addStaticBlock'; payload: { columnId: string; blockType?: 'html' | 'richtext' } }
  | { type: 'removeSection'; payload: { id: string } }
  | { type: 'removeRow'; payload: { id: string } }
  | { type: 'removeField'; payload: { id: string } }
  | { type: 'removeStaticBlock'; payload: { id: string } }
  | { type: 'reorderRows'; payload: { sectionId: string; from: number; to: number } }
  | { type: 'reorderFields'; payload: { columnId: string; from: number; to: number } }
  | { type: 'updateStaticBlock'; payload: { id: string; html: string } };

interface FormBuilderContextValue extends FormBuilderState {
  setSchema: (schema: FormSchema) => void;
  selectElement: (selection: Selection | null) => void;
  updateForm: (data: Partial<FormSchema>) => void;
  updateSection: (id: string, data: Partial<SectionSchema>) => void;
  updateRow: (id: string, data: Partial<RowSchema>) => void;
  updateField: (id: string, data: Partial<FieldSchema>) => void;
  addSection: (title?: string) => void;
  addTableSection: (title?: string, columns?: number) => void;
  addRow: (sectionId: string) => void;
  addField: (columnId: string, type?: FieldType) => void;
  addNestedTable: (columnId: string) => void;
  addStaticBlock: (columnId: string, blockType?: 'html' | 'richtext') => void;
  removeSection: (id: string) => void;
  removeRow: (id: string) => void;
  removeField: (id: string) => void;
  removeStaticBlock: (id: string) => void;
  reorderRows: (sectionId: string, from: number, to: number) => void;
  reorderFields: (columnId: string, from: number, to: number) => void;
  updateStaticBlock: (id: string, html: string) => void;
}

const FormBuilderContext = createContext<FormBuilderContextValue | undefined>(
  undefined,
);

const reorder = <T,>(items: T[], from: number, to: number) => {
  const next = [...items];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next;
};

function mapColumnsDeep(
  columns: ColumnSchema[],
  updater: (column: ColumnSchema) => ColumnSchema,
): ColumnSchema[] {
  return columns.map((column) => {
    const updated = updater(column);
    const nestedTables: TableSchema[] | undefined = column.nestedTables?.map((table) => ({
      ...table,
      rows: mapRowsDeep(table.rows, updater),
    }));

    return nestedTables ? { ...updated, nestedTables } : updated;
  });
}

function mapRowsDeep(
  rows: RowSchema[],
  updater: (column: ColumnSchema) => ColumnSchema,
): RowSchema[] {
  return rows.map((row) => ({
    ...row,
    columns: mapColumnsDeep(row.columns, updater),
  }));
}

const reducer = (state: FormBuilderState, action: Action): FormBuilderState => {
  switch (action.type) {
    case 'setSchema':
      return { ...state, schema: action.payload };
    case 'selectElement':
      return { ...state, selection: action.payload };
    case 'updateForm':
      return { ...state, schema: { ...state.schema, ...action.payload } };
    case 'updateSection':
      return {
        ...state,
        schema: {
          ...state.schema,
          sections: state.schema.sections.map((section) =>
            section.id === action.payload.id
              ? { ...section, ...action.payload.data }
              : section,
          ),
        },
      };
    case 'updateRow':
      return {
        ...state,
        schema: {
          ...state.schema,
          sections: state.schema.sections.map((section) => ({
            ...section,
            rows: mapRowsDeep(section.rows, (column) => column).map((row) =>
              row.id === action.payload.id ? { ...row, ...action.payload.data } : row,
            ),
          })),
        },
      };
    case 'updateField':
      return {
        ...state,
        schema: {
          ...state.schema,
          sections: state.schema.sections.map((section) => ({
            ...section,
            rows: mapRowsDeep(section.rows, (column) => ({
              ...column,
              fields: column.fields.map((field) =>
                field.id === action.payload.id ? { ...field, ...action.payload.data } : field,
              ),
            })),
          })),
        },
      };
    case 'addSection':
      return {
        ...state,
        schema: {
          ...state.schema,
          sections: [...state.schema.sections, createEmptySection(action.payload?.title)],
        },
      };
    case 'addTableSection':
      return {
        ...state,
        schema: {
          ...state.schema,
          sections: [...state.schema.sections, createTableSection(action.payload?.title, action.payload?.columns)],
        },
      };
    case 'addRow':
      return {
        ...state,
        schema: {
          ...state.schema,
          sections: state.schema.sections.map((section) =>
            section.id === action.payload.sectionId
              ? { ...section, rows: [...section.rows, createEmptyRow()] }
              : section,
          ),
        },
      };
    case 'addNestedTable':
      return {
        ...state,
        schema: {
          ...state.schema,
          sections: state.schema.sections.map((section) => ({
            ...section,
            rows: mapRowsDeep(section.rows, (column) =>
              column.id === action.payload.columnId
                ? {
                    ...column,
                    nestedTables: [...(column.nestedTables || []), createNestedTable()],
                  }
                : column,
            ),
          })),
        },
      };
    case 'addStaticBlock':
      return {
        ...state,
        schema: {
          ...state.schema,
          sections: state.schema.sections.map((section) => ({
            ...section,
            rows: mapRowsDeep(section.rows, (column) =>
              column.id === action.payload.columnId
                ? {
                    ...column,
                    staticBlocks: [...(column.staticBlocks || []), createStaticBlock(undefined, action.payload.blockType)],
                  }
                : column,
            ),
          })),
        },
      };
    case 'addField':
      return {
        ...state,
        schema: {
          ...state.schema,
          sections: state.schema.sections.map((section) => ({
            ...section,
            rows: mapRowsDeep(section.rows, (column) =>
              column.id === action.payload.columnId
                ? {
                    ...column,
                    fields: [...column.fields, createDefaultField(action.payload.type)],
                  }
                : column,
            ),
          })),
        },
      };
    case 'removeSection':
      return {
        ...state,
        schema: {
          ...state.schema,
          sections: state.schema.sections.filter(
            (section) => section.id !== action.payload.id,
          ),
        },
        selection:
          state.selection?.id === action.payload.id ? { type: 'form', id: state.schema.id } : state.selection,
      };
    case 'removeRow':
      return {
        ...state,
        schema: {
          ...state.schema,
          sections: state.schema.sections.map((section) => ({
            ...section,
            rows: section.rows.filter((row) => row.id !== action.payload.id),
          })),
        },
        selection:
          state.selection?.id === action.payload.id ? { type: 'form', id: state.schema.id } : state.selection,
      };
    case 'removeField':
      return {
        ...state,
        schema: {
          ...state.schema,
          sections: state.schema.sections.map((section) => ({
            ...section,
            rows: mapRowsDeep(section.rows, (column) => ({
              ...column,
              fields: column.fields.filter((field) => field.id !== action.payload.id),
            })),
          })),
        },
        selection:
          state.selection?.id === action.payload.id ? { type: 'form', id: state.schema.id } : state.selection,
      };
    case 'removeStaticBlock':
      return {
        ...state,
        schema: {
          ...state.schema,
          sections: state.schema.sections.map((section) => ({
            ...section,
            rows: mapRowsDeep(section.rows, (column) => ({
              ...column,
              staticBlocks: (column.staticBlocks || []).filter(
                (block) => block.id !== action.payload.id,
              ),
            })),
          })),
        },
        selection:
          state.selection?.id === action.payload.id ? { type: 'form', id: state.schema.id } : state.selection,
      };
    case 'reorderRows':
      return {
        ...state,
        schema: {
          ...state.schema,
          sections: state.schema.sections.map((section) =>
            section.id === action.payload.sectionId
              ? {
                  ...section,
                  rows: reorder(section.rows, action.payload.from, action.payload.to),
                }
              : section,
          ),
        },
      };
    case 'reorderFields':
      return {
        ...state,
        schema: {
          ...state.schema,
          sections: state.schema.sections.map((section) => ({
            ...section,
            rows: mapRowsDeep(section.rows, (column) =>
              column.id === action.payload.columnId
                ? {
                    ...column,
                    fields: reorder(column.fields, action.payload.from, action.payload.to),
                  }
                : column,
            ),
          })),
        },
      };
    case 'updateStaticBlock':
      return {
        ...state,
        schema: {
          ...state.schema,
          sections: state.schema.sections.map((section) => ({
            ...section,
            rows: mapRowsDeep(section.rows, (column) => ({
              ...column,
              staticBlocks: (column.staticBlocks || []).map((block) =>
                block.id === action.payload.id ? { ...block, html: action.payload.html } : block,
              ),
            })),
          })),
        },
      };
    default:
      return state;
  }
};

interface FormBuilderProviderProps {
  initialSchema: FormSchema;
  children: ReactNode;
}

export const FormBuilderProvider = ({
  initialSchema,
  children,
}: FormBuilderProviderProps) => {
  const [state, dispatch] = useReducer(reducer, {
    schema: initialSchema,
    selection: { type: 'form', id: initialSchema.id },
  });

  const value = useMemo<FormBuilderContextValue>(
    () => ({
      schema: state.schema,
      selection: state.selection,
      setSchema: (schema) => dispatch({ type: 'setSchema', payload: schema }),
      selectElement: (selection) => dispatch({ type: 'selectElement', payload: selection }),
      updateForm: (data) => dispatch({ type: 'updateForm', payload: data }),
      updateSection: (id, data) =>
        dispatch({ type: 'updateSection', payload: { id, data } }),
      updateRow: (id, data) => dispatch({ type: 'updateRow', payload: { id, data } }),
      updateField: (id, data) =>
        dispatch({ type: 'updateField', payload: { id, data } }),
      addSection: (title) => dispatch({ type: 'addSection', payload: { title } }),
      addTableSection: (title, columns) =>
        dispatch({ type: 'addTableSection', payload: { title, columns } }),
      addRow: (sectionId) => dispatch({ type: 'addRow', payload: { sectionId } }),
      addField: (columnId, type) =>
        dispatch({ type: 'addField', payload: { columnId, type } }),
      addNestedTable: (columnId) =>
        dispatch({ type: 'addNestedTable', payload: { columnId } }),
      addStaticBlock: (columnId, blockType) =>
        dispatch({ type: 'addStaticBlock', payload: { columnId, blockType } }),
      removeSection: (id) => dispatch({ type: 'removeSection', payload: { id } }),
      removeRow: (id) => dispatch({ type: 'removeRow', payload: { id } }),
      removeField: (id) => dispatch({ type: 'removeField', payload: { id } }),
      removeStaticBlock: (id) =>
        dispatch({ type: 'removeStaticBlock', payload: { id } }),
      reorderRows: (sectionId, from, to) =>
        dispatch({ type: 'reorderRows', payload: { sectionId, from, to } }),
      reorderFields: (columnId, from, to) =>
        dispatch({ type: 'reorderFields', payload: { columnId, from, to } }),
      updateStaticBlock: (id, html) =>
        dispatch({ type: 'updateStaticBlock', payload: { id, html } }),
    }),
    [state],
  );

  return (
    <FormBuilderContext.Provider value={value}>
      {children}
    </FormBuilderContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useFormBuilder = () => {
  const context = useContext(FormBuilderContext);
  if (!context) {
    throw new Error('useFormBuilder must be used within a FormBuilderProvider');
  }
  return context;
};
