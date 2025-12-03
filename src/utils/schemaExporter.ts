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

const indentLine = (line: string, level: number) => `${'  '.repeat(level)}${line}`;

const indentBlock = (block: string, level: number) =>
  block
    .split('\n')
    .map((line) => indentLine(line.trimEnd(), level))
    .join('\n');

const renderFieldLines = (field: FieldSchema, level: number) => {
  const attrs = { ...(field.htmlAttributes || {}) };
  attrs.id = field.originalId || attrs.id || field.name;
  attrs.name = field.originalName || attrs.name || field.name;

  const attrString = attrsToString(attrs);
  const value =
    bindingToken(field) ??
    (typeof field.defaultValue === 'string' || typeof field.defaultValue === 'number'
      ? String(field.defaultValue)
      : '');

  const lines: string[] = [];
  const labelFor = attrs.id || attrs.name;

  switch (field.type) {
    case 'textarea':
      lines.push(
        indentLine(`<label for="${labelFor}">${encodeHtml(field.label)}</label>`, level),
        indentLine(`<textarea ${attrString}>${encodeHtml(value)}</textarea>`, level),
      );
      break;
    case 'select':
      lines.push(
        indentLine(`<label for="${labelFor}">${encodeHtml(field.label)}</label>`, level),
        indentLine(`<select ${attrString}>`, level),
      );
      (field.options || []).forEach((opt) => {
        lines.push(
          indentLine(
            `<option value="${encodeHtml(opt.value)}">${encodeHtml(opt.label)}</option>`,
            level + 1,
          ),
        );
      });
      lines.push(indentLine(`</select>`, level));
      break;
    case 'checkbox':
      lines.push(
        indentLine(
          `<label><input type="checkbox" ${attrString} value="${encodeHtml(
            value || 'on',
          )}" /> ${encodeHtml(field.label)}</label>`,
          level,
        ),
      );
      break;
    case 'radio':
      lines.push(indentLine(`<div>`, level));
      lines.push(indentLine(encodeHtml(field.label), level + 1));
      (field.options || []).forEach((opt) => {
        lines.push(
          indentLine(
            `<label><input type="radio" ${attrString} value="${encodeHtml(opt.value)}" /> ${encodeHtml(
              opt.label,
            )}</label>`,
            level + 1,
          ),
        );
      });
      lines.push(indentLine(`</div>`, level));
      break;
    case 'date':
      lines.push(
        indentLine(`<label for="${labelFor}">${encodeHtml(field.label)}</label>`, level),
        indentLine(
          `<input type="date" ${attrString} value="${encodeHtml(value)}" />`,
          level,
        ),
      );
      break;
    case 'number':
      lines.push(
        indentLine(`<label for="${labelFor}">${encodeHtml(field.label)}</label>`, level),
        indentLine(
          `<input type="number" ${attrString} value="${encodeHtml(value)}" />`,
          level,
        ),
      );
      break;
    default:
      lines.push(
        indentLine(`<label for="${labelFor}">${encodeHtml(field.label)}</label>`, level),
        indentLine(
          `<input type="text" ${attrString} value="${encodeHtml(value)}" />`,
          level,
        ),
      );
      break;
  }

  return lines;
};

const renderTableLines = (
  rows: RowSchema[],
  level: number,
  tableAttrs?: Record<string, string>,
): string[] => {
  const lines: string[] = [];
  lines.push(indentLine(`<table ${attrsToString(tableAttrs)}>`, level));
  lines.push(indentLine(`<tbody>`, level + 1));
  rows.forEach((row) => {
    lines.push(indentLine(`<tr ${attrsToString(row.htmlAttributes)}>`, level + 2));
    row.columns.forEach((column) => {
      const cellAttrs = {
        ...column.htmlAttributes,
        ...(column.colSpan && column.colSpan > 1 ? { colspan: String(column.colSpan) } : {}),
        ...(column.rowSpan && column.rowSpan > 1 ? { rowspan: String(column.rowSpan) } : {}),
      };
      lines.push(indentLine(`<td ${attrsToString(cellAttrs)}>`, level + 3));

      if (column.staticHtml) {
        column.staticHtml
          .split('\n')
          .map((line) => line.trim())
          .filter(Boolean)
          .forEach((line) => lines.push(indentLine(line, level + 4)));
      }

      column.fields.forEach((field) => {
        lines.push(...renderFieldLines(field, level + 4));
      });

      (column.nestedTables || []).forEach((nested) => {
        lines.push(...renderTableLines(nested.rows, level + 4, nested.tableAttributes));
      });

      lines.push(indentLine(`</td>`, level + 3));
    });
    lines.push(indentLine(`</tr>`, level + 2));
  });
  lines.push(indentLine(`</tbody>`, level + 1));
  lines.push(indentLine(`</table>`, level));
  return lines;
};

const renderSectionLines = (section: SectionSchema, level: number): string[] => {
  if (section.layout === 'table') {
    return renderTableLines(section.rows, level, section.tableAttributes);
  }

  const lines: string[] = [];
  lines.push(indentLine(`<section>`, level));
  section.rows.forEach((row) => {
    lines.push(indentLine(`<div style="display:flex; gap:8px;">`, level + 1));
    row.columns.forEach((col) => {
      lines.push(
        indentLine(`<div style="flex:${col.span / 4}; padding:4px;">`, level + 2),
      );
      col.fields.forEach((field) => {
        lines.push(...renderFieldLines(field, level + 3));
      });
      lines.push(indentLine(`</div>`, level + 2));
    });
    lines.push(indentLine(`</div>`, level + 1));
  });
  lines.push(indentLine(`</section>`, level));
  return lines;
};

export const schemaToHtml = (schema: FormSchema) => {
  if (schema.sections.length === 0 && schema.originalHtml) {
    return schema.originalHtml;
  }

  const generatedBody = schema.sections
    .flatMap((section) => renderSectionLines(section, 1))
    .join('\n');

  if (schema.originalBodyHtml) {
    const headContent = schema.originalHeadHtml
      ? indentBlock(schema.originalHeadHtml.trim(), 2)
      : indentBlock(
          `<meta charset="UTF-8" />\n<title>${encodeHtml(schema.name)}</title>`,
          2,
        );

    const bodyContent = [schema.originalBodyHtml.trim(), generatedBody]
      .filter(Boolean)
      .join('\n');

    return `<!doctype html>
<html>
  <head>
${headContent}
  </head>
  <body>
${bodyContent}
  </body>
</html>`;
  }

  const bodyLines = generatedBody;

  return `<!doctype html>
<html>
  <head>
    <meta charset="UTF-8" />
    <title>${encodeHtml(schema.name)}</title>
  </head>
  <body>
${bodyLines}
  </body>
</html>`;
};
