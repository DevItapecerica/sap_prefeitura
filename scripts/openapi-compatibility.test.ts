import assert from 'node:assert/strict';
import test from 'node:test';
import { normalizeOpenApiDocument } from './openapi-compatibility.js';

test('converte null JSON Schema em um schema OpenAPI 3.0 que permite somente null', () => {
  const input = { paths: { '/x': { get: { responses: { 200: { content: { 'application/json': { schema: { anyOf: [{ type: 'integer' }, { type: 'null' }] } } } } } } } } };
  const output: any = normalizeOpenApiDocument(input);
  const schema = output.paths['/x'].get.responses[200].content['application/json'].schema;
  assert.deepEqual(schema.anyOf, [{ type: 'integer' }, { type: 'string', nullable: true, enum: [null] }]);
  assert.equal((input as any).paths['/x'].get.responses[200].content['application/json'].schema.anyOf[1].type, 'null');
});

test('preserva restrições enum e allOf ao representar o tipo null', () => {
  const output: any = normalizeOpenApiDocument({ components: { schemas: {
    RestrictedNull: { type: 'null', enum: ['not-null'], allOf: [{ description: 'constraint' }] },
  } } });
  assert.deepEqual(output.components.schemas.RestrictedNull, {
    type: 'string', nullable: true, enum: [null],
    allOf: [{ description: 'constraint' }, { enum: ['not-null'] }],
  });
});

test('preserva uniões, constraints, referências e dados de exemplo sem reescrever payloads', () => {
  const input = { components: { schemas: {
    Union: { type: ['string', 'number', 'null'], description: 'union' },
    Object: { type: 'object', properties: { count: { type: ['integer', 'null'], minimum: 0 }, ref: { $ref: '#/components/schemas/Union' } }, example: { type: ['number', 'null'] } },
    OnlyNull: { type: 'null' },
  } } };
  const output: any = normalizeOpenApiDocument(input);
  assert.deepEqual(output.components.schemas.Union, { description: 'union', allOf: [{ anyOf: [{ type: 'string' }, { type: 'number' }, { type: 'string', nullable: true, enum: [null] }] }] });
  assert.deepEqual(output.components.schemas.Object.properties.count, { type: 'integer', nullable: true, minimum: 0 });
  assert.deepEqual(output.components.schemas.Object.properties.ref, { $ref: '#/components/schemas/Union' });
  assert.deepEqual(output.components.schemas.Object.example, { type: ['number', 'null'] });
  assert.deepEqual(output.components.schemas.OnlyNull, { type: 'string', nullable: true, enum: [null] });
});
