import type { FieldSchema, FormSchema, RowSchema, SectionSchema } from '../types/formSchema';

const attrsToString = (attrs?: Record<string, string>) =>
  attrs
    ? Object.entries(attrs)
        .map(([key, value]) => `${key}="${value}"`)
        .join(' ')
    : '';

const encodeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const bindingToken = (field: FieldSchema) =>
  field.bindingProperty ? `\${${field.bindingProperty}}` : undefined;

const renderField = (field: FieldSchema) => {
  const attrs = { ...(field.htmlAttributes || {}) };
  attrs.id = field.originalId || attrs.id || field.name;
  attrs.name = field.originalName || attrs.name || field.name;

  const attrString = attrsToString(attrs);
  const value =
    bindingToken(field) ??
    (typeof field.defaultValue === 'string' || typeof field.defaultValue === 'number'
      ? String(field.defaultValue)
      : '');

  switch (field.type) {
    case 'textarea':
      return `<label for="${attrs.id || attrs.name}">${encodeHtml(field.label)}</label><textarea ${attrString}>${encodeHtml(
        value,
      )}</textarea>`;
    case 'select':
      return `<label for="${attrs.id || attrs.name}">${encodeHtml(field.label)}</label><select ${attrString}>${(field.options || [])
        .map((opt) => `<option value="${encodeHtml(opt.value)}">${encodeHtml(opt.label)}</option>`)
        .join('')}</select>`;
    case 'checkbox':
      return `<label><input type="checkbox" ${attrString} value="${encodeHtml(
        value || 'on',
      )}" /> ${encodeHtml(field.label)}</label>`;
    case 'radio':
      return `<div>${encodeHtml(field.label)}${(field.options || [])
        .map(
          (opt) =>
            `<label><input type="radio" ${attrString} value="${encodeHtml(opt.value)}" /> ${encodeHtml(
              opt.label,
            )}</label>`,
        )
        .join('')}</div>`;
    case 'date':
      return `<label for="${attrs.id || attrs.name}">${encodeHtml(field.label)}</label><input type="date" ${attrString} value="${encodeHtml(
        value,
      )}" />`;
    case 'number':
      return `<label for="${attrs.id || attrs.name}">${encodeHtml(field.label)}</label><input type="number" ${attrString} value="${encodeHtml(
        value,
      )}" />`;
    default:
      return `<label for="${attrs.id || attrs.name}">${encodeHtml(field.label)}</label><input type="text" ${attrString} value="${encodeHtml(
        value,
      )}" />`;
  }
};

const renderTable = (rows: RowSchema[], tableAttrs?: Record<string, string>): string => {
  return `<table ${attrsToString(tableAttrs)}><tbody>${rows
    .map(
      (row) =>
        `<tr ${attrsToString(row.htmlAttributes)}>${row.columns
          .map((column) => {
            const cellAttrs = {
              ...column.htmlAttributes,
              ...(column.colSpan && column.colSpan > 1 ? { colspan: String(column.colSpan) } : {}),
              ...(column.rowSpan && column.rowSpan > 1 ? { rowspan: String(column.rowSpan) } : {}),
            };
            const fieldsHtml = column.fields.map((field) => renderField(field)).join('');
            const nestedHtml = (column.nestedTables || [])
              .map((table) => renderTable(table.rows, table.tableAttributes))
              .join('');
            const staticHtml = column.staticHtml || '';
            return `<td ${attrsToString(cellAttrs)}>${staticHtml}${fieldsHtml}${nestedHtml}</td>`;
          })
          .join('')}</tr>`,
    )
    .join('')}</tbody></table>`;
};

const renderSection = (section: SectionSchema) => {
  if (section.layout === 'table') {
    return renderTable(section.rows, section.tableAttributes);
  }

  const rows = section.rows
    .map((row) => {
      const cols = row.columns
        .map((col) => {
          const fieldsHtml = col.fields.map((field) => renderField(field)).join('');
          return `<div style="flex:${col.span / 4}; padding:4px;">${fieldsHtml}</div>`;
        })
        .join('');
      return `<div style="display:flex; gap:8px;">${cols}</div>`;
    })
    .join('');

  return `<section>${rows}</section>`;
};

export const schemaToHtml = (schema: FormSchema) => {
  const body = schema.sections.map((section) => renderSection(section)).join('\n');
  return `<!doctype html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>${encodeHtml(schema.name)}</title>
</head>
<body>
${body}
</body>
</html>`;
};
