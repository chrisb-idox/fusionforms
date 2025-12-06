import { useEffect } from 'react';
import {
  Button,
  Checkbox,
  Group,
  NumberInput,
  Radio,
  Select,
  Stack,
  Text,
  TextInput,
  Textarea,
  Table,
} from '@mantine/core';
import { Controller, useForm } from 'react-hook-form';
import type { Control, FieldValues, SubmitHandler } from 'react-hook-form';
import type { FieldSchema, FormSchema, RowSchema } from '../../types/formSchema';

interface FormRendererProps {
  schema: FormSchema;
  onSubmit?: SubmitHandler<FieldValues>;
}

const getBindingToken = (field: FieldSchema) =>
  field.bindingProperty ? `\${${field.bindingProperty}}` : null;

const buildDefaultValues = (schema: FormSchema) => {
  const defaults: Record<string, unknown> = {};
  schema.sections.forEach((section) =>
    section.rows.forEach((row) =>
      row.columns.forEach((column) =>
        column.fields.forEach((field) => {
          const boundValue = getBindingToken(field) || undefined;
          const fallback =
            field.type === 'checkbox'
              ? false
              : field.type === 'radio' || field.type === 'select'
                ? ''
                : '';
          defaults[field.name] = field.defaultValue ?? boundValue ?? fallback;
        }),
      ),
    ),
  );
  return defaults;
};

const buildRules = (field: FieldSchema) => {
  const rules: Record<string, unknown> = {};
  field.validations?.forEach((validation) => {
    switch (validation.type) {
      case 'required':
        rules.required = validation.message || 'Required';
        break;
      case 'min':
        rules.min = {
          value: Number(validation.value) || 0,
          message: validation.message || 'Too small',
        };
        break;
      case 'max':
        rules.max = {
          value: Number(validation.value) || 0,
          message: validation.message || 'Too large',
        };
        break;
      case 'pattern':
        if (validation.value) {
          rules.pattern = {
            value: new RegExp(String(validation.value)),
            message: validation.message || 'Invalid format',
          };
        }
        break;
      default:
        break;
    }
  });
  return rules;
};

const FieldRenderer = ({
  field,
  control,
}: {
  field: FieldSchema;
  control: Control<FieldValues>;
}) => {
  const rules = buildRules(field);
  const bindingToken = getBindingToken(field);
  const description = field.helpText ? (
    <Text size="sm" c="dimmed">
      {field.helpText}
    </Text>
  ) : undefined;
  switch (field.type) {
    case 'text':
      return (
        <Controller
          name={field.name}
          control={control}
          rules={rules}
          render={({ field: controllerField, fieldState }) => (
            <TextInput
              {...controllerField}
              value={controllerField.value ?? bindingToken ?? ''}
              label={field.label}
              placeholder={field.placeholder}
              description={description}
              error={fieldState.error?.message}
              styles={
                bindingToken
                  ? {
                    input: {
                      fontStyle: 'italic',
                    },
                  }
                  : undefined
              }
            />
          )}
        />
      );
    case 'textarea':
      return (
        <Controller
          name={field.name}
          control={control}
          rules={rules}
          render={({ field: controllerField, fieldState }) => (
            <Textarea
              {...controllerField}
              value={controllerField.value ?? bindingToken ?? ''}
              label={field.label}
              placeholder={field.placeholder}
              description={description}
              error={fieldState.error?.message}
              autosize
              minRows={3}
              styles={
                bindingToken
                  ? {
                    input: {
                      fontStyle: 'italic',
                    },
                  }
                  : undefined
              }
            />
          )}
        />
      );
    case 'number':
      return (
        <Controller
          name={field.name}
          control={control}
          rules={rules}
          render={({ field: controllerField, fieldState }) => (
            <NumberInput
              {...controllerField}
              label={field.label}
              placeholder={field.placeholder}
              description={description}
              error={fieldState.error?.message}
              styles={
                bindingToken
                  ? {
                    input: {
                      fontStyle: 'italic',
                    },
                  }
                  : undefined
              }
            />
          )}
        />
      );
    case 'date':
      return (
        <Controller
          name={field.name}
          control={control}
          rules={rules}
          render={({ field: controllerField, fieldState }) => (
            <TextInput
              {...controllerField}
              value={controllerField.value ?? bindingToken ?? ''}
              type="date"
              label={field.label}
              description={description}
              error={fieldState.error?.message}
              styles={
                bindingToken
                  ? {
                    input: {
                      fontStyle: 'italic',
                    },
                  }
                  : undefined
              }
            />
          )}
        />
      );
    case 'select':
      return (
        <Controller
          name={field.name}
          control={control}
          rules={rules}
          render={({ field: controllerField, fieldState }) => (
            <Select
              {...controllerField}
              data={field.options || []}
              label={field.label}
              placeholder={field.placeholder}
              description={description}
              error={fieldState.error?.message}
              styles={
                bindingToken
                  ? {
                    input: {
                      fontStyle: 'italic',
                    },
                  }
                  : undefined
              }
            />
          )}
        />
      );
    case 'checkbox':
      return (
        <Controller
          name={field.name}
          control={control}
          rules={rules}
          render={({ field: controllerField, fieldState }) => (
            <Checkbox
              {...controllerField}
              checked={!!controllerField.value}
              label={field.label}
              description={description}
              error={fieldState.error?.message}
              styles={
                bindingToken
                  ? {
                    label: { fontStyle: 'italic' },
                  }
                  : undefined
              }
            />
          )}
        />
      );
    case 'radio':
      return (
        <Controller
          name={field.name}
          control={control}
          rules={rules}
          render={({ field: controllerField, fieldState }) => (
            <Radio.Group
              {...controllerField}
              label={field.label}
              description={description}
              error={fieldState.error?.message}
              styles={
                bindingToken
                  ? {
                    label: { fontStyle: 'italic' },
                  }
                  : undefined
              }
            >
              <Stack gap={4} mt="xs">
                {(field.options || []).map((option) => (
                  <Radio key={option.value} value={option.value} label={option.label} />
                ))}
              </Stack>
            </Radio.Group>
          )}
        />
      );
    default:
      return (
        <Text size="sm" c="dimmed">
          Unsupported field type
        </Text>
      );
  }
};

export const FormRenderer = ({ schema, onSubmit }: FormRendererProps) => {
  const { control, handleSubmit, reset } = useForm({
    defaultValues: buildDefaultValues(schema),
  });

  useEffect(() => {
    reset(buildDefaultValues(schema));
  }, [schema, reset]);
  const submit = handleSubmit(onSubmit ?? ((values) => console.log(values)));

  const hasStaticDocument = Boolean(schema.originalBodyHtml && schema.sections.length === 0);
  const hasAnyFields = schema.sections.some((section) =>
    section.rows.some((row) => row.columns.some((column) => column.fields.length > 0)),
  );

  const renderTable = (rows: RowSchema[]) => (
    <Table
      withRowBorders={false}
      withColumnBorders={false}
      style={{ width: '100%', tableLayout: 'auto' }}
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
                {(column.staticBlocks || []).map((block) => (
                  <div
                    key={block.id}
                    style={{
                      fontSize: 13,
                      color: '#475569',
                      marginBottom: 4,
                      direction: 'ltr',
                      textAlign: 'left',
                    }}
                    dangerouslySetInnerHTML={{ __html: block.html }}
                  />
                ))}
                {!column.staticBlocks?.length && column.staticHtml && (
                  <div
                    style={{ fontSize: 13, color: '#475569', marginBottom: 4 }}
                    dangerouslySetInnerHTML={{ __html: column.staticHtml }}
                  />
                )}
                <Group gap="sm" align="flex-start" wrap="wrap">
                  {column.fields.map((field) => (
                    <FieldRenderer key={field.id} field={field} control={control} />
                  ))}
                </Group>
                <Stack gap={0} pt={0}>
                  {column.nestedTables?.map((nested) => (
                    <Stack key={nested.id} gap={0}>
                      {renderTable(nested.rows)}
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
    <form onSubmit={submit}>
      <Stack gap="lg">
        {hasStaticDocument && (
          <>
            {schema.originalHeadHtml && (
              <div
                aria-hidden
                style={{ display: 'contents' }}
                dangerouslySetInnerHTML={{ __html: schema.originalHeadHtml }}
              />
            )}
            <div dangerouslySetInnerHTML={{ __html: schema.originalBodyHtml || '' }} />
          </>
        )}
        {schema.sections.map((section) => (
          <Stack key={section.id} gap="md">
            <Text fw={700}>{section.title}</Text>
            {section.layout === 'table'
              ? renderTable(section.rows)
              : section.rows.map((row) => (
                <Group key={row.id} align="flex-start" gap="md">
                  {row.columns.map((column) => (
                    <Stack key={column.id} gap="md" style={{ flex: column.span / 4 }}>
                      {(column.staticBlocks || []).map((block) => (
                        <div
                          key={block.id}
                          style={{
                            fontSize: 13,
                            color: '#475569',
                            direction: 'ltr',
                            textAlign: 'left',
                          }}
                          dangerouslySetInnerHTML={{ __html: block.html }}
                        />
                      ))}
                      {!column.staticBlocks?.length && column.staticHtml && (
                        <div
                          style={{ fontSize: 13, color: '#475569' }}
                          dangerouslySetInnerHTML={{ __html: column.staticHtml }}
                        />
                      )}
                      {column.fields.map((field) => (
                        <FieldRenderer key={field.id} field={field} control={control} />
                      ))}
                    </Stack>
                  ))}
                </Group>
              ))}
          </Stack>
        ))}
        {hasAnyFields && (
          <Group justify="flex-end">
            <Button type="submit">Submit</Button>
          </Group>
        )}
      </Stack>
    </form>
  );
};
