import type {
  ColumnSchema,
  FieldSchema,
  FieldType,
  FormSchema,
  RowSchema,
  SectionSchema,
  TableSchema,
} from '../types/formSchema';
import { createId } from '../types/formSchema';

const getBindingProperty = (value: string | null | undefined): string | undefined => {
  if (!value) return undefined;
  const match = value.match(/\$\{\s*([^}]+)\s*}/);
  return match?.[1];
};

const collectAttributes = (element: Element): Record<string, string> => {
  const attrs: Record<string, string> = {};
  element.getAttributeNames().forEach((name) => {
    const value = element.getAttribute(name);
    if (value !== null) {
      attrs[name] = value;
    }
  });
  return attrs;
};

const getLabelForElement = (doc: Document, element: Element): string | undefined => {
  const id = element.getAttribute('id');
  if (id) {
    const byFor = doc.querySelector(`label[for="${id}"]`);
    if (byFor?.textContent) return byFor.textContent.trim();
  }

  const labelled = (element as HTMLInputElement).labels;
  if (labelled && labelled.length > 0) {
    const text = Array.from(labelled)
      .map((labelEl) => labelEl.textContent?.trim())
      .find((val): val is string => Boolean(val));
    if (text) return text;
  }

  const prev = element.previousElementSibling;
  if (prev?.tagName.toLowerCase() === 'label' && prev.textContent) {
    return prev.textContent.trim();
  }

  return undefined;
};

const sanitizeLabel = (raw: string) =>
  raw.replace(/^_+/, '').replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim();

const inferFieldType = (element: Element): FieldType => {
  if (element.tagName.toLowerCase() === 'textarea') return 'textarea';
  if (element.tagName.toLowerCase() === 'select') return 'select';

  const input = element as HTMLInputElement;
  switch ((input.type || 'text').toLowerCase()) {
    case 'number':
      return 'number';
    case 'date':
      return 'date';
    case 'checkbox':
      return 'checkbox';
    case 'radio':
      return 'radio';
    default:
      return 'text';
  }
};

const mapElementToField = (doc: Document, element: Element): FieldSchema => {
  const type = inferFieldType(element);
  const name =
    element.getAttribute('name') ||
    element.getAttribute('id') ||
    `field_${Math.random().toString(36).slice(2, 6)}`;
  const label = getLabelForElement(doc, element) || sanitizeLabel(name);

  const bindingProperty =
    element.tagName.toLowerCase() === 'textarea'
      ? getBindingProperty(element.textContent)
      : getBindingProperty((element as HTMLInputElement).value);

  const defaultValue =
    element.tagName.toLowerCase() === 'textarea'
      ? element.textContent?.trim() || undefined
      : (element as HTMLInputElement).value || undefined;

  const placeholder = (element as HTMLInputElement).placeholder || undefined;

  const options =
    element.tagName.toLowerCase() === 'select'
      ? Array.from(element.querySelectorAll('option')).map((option) => ({
          label: option.textContent?.trim() || option.value || 'Option',
          value: option.value || option.textContent?.trim() || 'option',
        }))
      : undefined;

  return {
    id: createId(),
    type,
    name,
    originalName: name,
    originalId: element.getAttribute('id') || undefined,
    label,
    placeholder,
    bindingProperty,
    defaultValue,
    htmlAttributes: collectAttributes(element),
    helpText: undefined,
    options,
    validations: [],
  };
};

const parseTable = (doc: Document, tableEl: HTMLTableElement): TableSchema => {
  const rowEls = Array.from(
    tableEl.querySelectorAll(':scope > tr, :scope > tbody > tr, :scope > thead > tr'),
  );

  const rows: RowSchema[] = rowEls.map((tr) => {
    const cellEls = Array.from(tr.querySelectorAll(':scope > td, :scope > th'));

    const columns: ColumnSchema[] = cellEls.map((cell) => {
      const nestedTables = Array.from(cell.querySelectorAll(':scope > table')).map(
        (nested) => parseTable(doc, nested as HTMLTableElement),
      );

      const fields = Array.from(cell.querySelectorAll('input, textarea, select'))
        .filter((el) => el.closest('table') === tableEl)
        .map((el) => mapElementToField(doc, el));

      return {
        id: createId(),
        span: 4,
        colSpan: Number(cell.getAttribute('colspan') || '1'),
        rowSpan: Number(cell.getAttribute('rowspan') || '1'),
        htmlAttributes: collectAttributes(cell),
        fields,
        nestedTables,
      };
    });

    return {
      id: createId(),
      columns,
      htmlAttributes: collectAttributes(tr),
    };
  });

  return {
    id: createId(),
    rows,
    tableAttributes: collectAttributes(tableEl),
  };
};

export const parseSampleHtmlToSchema = (html: string, sampleName: string): FormSchema => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  const headingText =
    doc.querySelector('h1,h2,h3')?.textContent?.trim() || sampleName || 'Imported sample';

  const tables = Array.from(doc.querySelectorAll('table')).filter(
    (table) => !table.parentElement?.closest('table'),
  );

  const sections: SectionSchema[] =
    tables.length > 0
      ? tables.map((table, index) => {
          const parsed = parseTable(doc, table as HTMLTableElement);
          return {
            id: createId(),
            title: headingText + (tables.length > 1 ? ` — Table ${index + 1}` : ''),
            rows: parsed.rows,
            layout: 'table',
            tableAttributes: parsed.tableAttributes,
          };
        })
      : [];

  if (sections.length === 0) {
    const allFields = Array.from(doc.querySelectorAll('input, textarea, select')).map((el) =>
      mapElementToField(doc, el),
    );
    const fallbackRows: RowSchema[] = [];
    for (let i = 0; i < allFields.length; i += 2) {
      fallbackRows.push({
        id: createId(),
        columns: allFields.slice(i, i + 2).map((field) => ({
          id: createId(),
          span: 2,
          fields: [field],
        })),
      });
    }
    sections.push({
      id: createId(),
      title: headingText,
      rows: fallbackRows,
      layout: 'stack',
    });
  }

  return {
    id: createId(),
    name: headingText,
    description: `Imported from sample: ${sampleName}`,
    version: 1,
    sections,
  };
};
