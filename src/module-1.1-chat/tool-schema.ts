export function toGeminiSchema(schema: unknown): unknown {
  if (Array.isArray(schema)) return schema.map(toGeminiSchema);
  if (!schema || typeof schema !== 'object') return schema;
  const input = schema as Record<string, unknown>;
  const output: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(input)) {
    if (key === 'type' && typeof value === 'string') output[key] = value.toUpperCase();
    else if (key === 'properties' && value && typeof value === 'object') {
      output[key] = Object.fromEntries(Object.entries(value as Record<string, unknown>).map(([name, item]) => [name, toGeminiSchema(item)]));
    } else if (key === 'items') output[key] = toGeminiSchema(value);
    else output[key] = value;
  }
  return output;
}