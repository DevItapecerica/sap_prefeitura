type JsonObject = Record<string, any>;
const isObject = (value: unknown): value is JsonObject => value !== null && typeof value === 'object' && !Array.isArray(value);
const literalNull = () => ({ type: 'string', nullable: true, enum: [null] });

function schema(value: unknown): unknown {
  if (!isObject(value)) return value;
  const output: JsonObject = { ...value };
  for (const key of ['properties', 'patternProperties', 'definitions', '$defs']) {
    if (isObject(output[key])) output[key] = Object.fromEntries(Object.entries(output[key]).map(([name, child]) => [name, schema(child)]));
  }
  for (const key of ['items', 'additionalProperties', 'not']) {
    if (isObject(output[key])) output[key] = schema(output[key]);
  }
  for (const key of ['allOf', 'anyOf', 'oneOf']) {
    if (Array.isArray(output[key])) output[key] = output[key].map(schema);
  }
  if (output.type === 'null') {
    const normalized: JsonObject = { ...output, ...literalNull() };
    // The null-only representation must intersect, not replace, original constraints.
    if (Array.isArray(output.enum)) normalized.allOf = [...(output.allOf ?? []), { enum: output.enum }];
    return normalized;
  }
  if (Array.isArray(output.type)) {
    const nonNull = output.type.filter((type: string) => type !== 'null');
    const nullable = output.type.includes('null');
    if (nonNull.length === 1) {
      output.type = nonNull[0];
      if (nullable) output.nullable = true;
    } else {
      const types = output.type;
      delete output.type;
      output.allOf = [...(output.allOf ?? []), { anyOf: types.map((type: string) => type === 'null' ? literalNull() : { type }) }];
    }
  }
  return output;
}

// Convert only schema locations. Example/default/enum payloads are data, not schemas.
export function normalizeOpenApiDocument(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(normalizeOpenApiDocument);
  if (!isObject(value)) return value;
  return Object.fromEntries(Object.entries(value).map(([key, child]) => {
    if (['example', 'examples', 'default', 'enum'].includes(key)) return [key, child];
    if (key === 'schema') return [key, schema(child)];
    if (key === 'schemas' && isObject(child)) return [key, Object.fromEntries(Object.entries(child).map(([name, definition]) => [name, schema(definition)]))];
    return [key, normalizeOpenApiDocument(child)];
  }));
}
