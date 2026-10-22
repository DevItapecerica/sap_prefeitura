import assert from 'node:assert/strict';
import test from 'node:test';
import { permissionKey } from './permission-key.js';

test('stable keys reject ambiguity without normalization', () => {
  assert.equal(permissionKey('ft', 'remover_bolsista'), 'ft:remover_bolsista');
  for (const value of ['', 'FT', 'ft:excluir', ' ft', 'ft-']) {
    assert.throws(() => permissionKey(value, 'acessar'), TypeError);
    assert.throws(() => permissionKey('ft', value), TypeError);
  }
  assert.throws(() => permissionKey('a'.repeat(65), 'acessar'), TypeError);
  assert.throws(() => permissionKey('ft', 'a'.repeat(97)), TypeError);
});
