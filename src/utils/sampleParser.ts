import type { FieldSchema, FieldType, FormSchema, RowSchema } from '../types/formSchema';
import { createId } from '../types/formSchema';

const getBindingProperty = (value: string | null | undefined): string | undefined => {
  if (!value) return undefined;
  const match = value.match(/\$\{\s*([^}]+)\s*}/);
  return match?.[1];
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
    label,
    placeholder,
    bindingProperty,
    defaultValue,
    helpText: undefined,
    options,
    validations: [],
  };
};

const groupFieldsIntoRows = (fieldGroups: FieldSchema[][][]): RowSchema[] => {
  const rows: RowSchema[] = [];

  fieldGroups.forEach((group) => {
    if (group.length === 0) return;
    const span: 1 | 2 | 3 | 4 =
      group.length === 1 ? 4 : group.length === 2 ? 2 : group.length === 3 ? 1 : 1;
    rows.push({
      id: createId(),
      columns: group.map((fieldsInColumn) => ({
        id: createId(),
        span,
        fields: fieldsInColumn,
      })),
    });
  });

  return rows;
};

export const parseSampleHtmlToSchema = (html: string, sampleName: string): FormSchema => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  const headingText =
    doc.querySelector('h1,h2,h3')?.textContent?.trim() || sampleName || 'Imported sample';

  const tableRows = Array.from(doc.querySelectorAll('tr'));

  const rowFieldGroups: FieldSchema[][][] = tableRows
    .map((tr) => {
      const cells = Array.from(tr.querySelectorAll('td,th'));
      const cellFields = cells
        .map((cell) =>
          Array.from(cell.querySelectorAll('input, textarea, select')).map((el) =>
            mapElementToField(doc, el),
          ),
        )
        .filter((fields) => fields.length > 0);

      if (cellFields.length > 0) {
        return cellFields as FieldSchema[][];
      }

      const directFields = Array.from(tr.querySelectorAll('input, textarea, select')).map(
        (el) => mapElementToField(doc, el),
      );
      return directFields.length ? [directFields] : [];
    })
    .filter((group) => group.length > 0);

  let rows = groupFieldsIntoRows(rowFieldGroups);

  if (rows.length === 0) {
    const allFields = Array.from(doc.querySelectorAll('input, textarea, select')).map((el) =>
      mapElementToField(doc, el),
    );
    const fallbackGroups: FieldSchema[][][] = [];
    for (let i = 0; i < allFields.length; i += 2) {
      fallbackGroups.push([allFields.slice(i, i + 2)]);
    }
    rows = groupFieldsIntoRows(fallbackGroups);
  }

  const section = {
    id: createId(),
    title: headingText,
    rows,
  };

  return {
    id: createId(),
    name: headingText,
    description: `Imported from sample: ${sampleName}`,
    version: 1,
    sections: rows.length > 0 ? [section] : [],
  };
};
