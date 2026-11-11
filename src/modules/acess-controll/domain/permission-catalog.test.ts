import assert from 'node:assert/strict';
import test from 'node:test';
import { PERMISSION_CATALOG, MODULE_SERVICE_IDS } from './permission-catalog.js';
import { permissionKey } from './permission-key.js';

test('catalog exactly covers the approved module/action inventory without duplicates', () => {
  const counts = Object.fromEntries(Object.entries(Object.groupBy(PERMISSION_CATALOG, p => p.module)).map(([module, actions]) => [module, actions!.length]));
  assert.deepEqual(counts, { usuarios: 6, setores: 5, servicos: 5, roles: 5, demandas_ti: 1, ft: 69, iptu: 1, municipes: 4, esporte: 14, auditoria: 3 });
  assert.ok(PERMISSION_CATALOG.filter(p => ['encaixar_inscricao', 'ativar_participacao', 'convocar_inscrito'].includes(p.action)).every(p => p.legacyFlag === null));
  const keys = PERMISSION_CATALOG.map(p => permissionKey(p.module, p.action));
  assert.equal(new Set(keys).size, keys.length);
  for (const p of PERMISSION_CATALOG) assert.equal(p.serviceId, MODULE_SERVICE_IDS[p.module]);
  for (const module of Object.keys(MODULE_SERVICE_IDS)) assert.ok(keys.includes(`${module}:acessar`));
  for (const action of ['remover_bolsista', 'excluir_bolsista', 'gerenciar_permissoes']) assert.ok(PERMISSION_CATALOG.some(entry => entry.action === action));
  assert.ok(Object.isFrozen(PERMISSION_CATALOG));
  for (const action of ['cadastrar_inscricao_excecao', 'convocar_inscrito_excecao']) assert.ok(PERMISSION_CATALOG.some(entry => entry.action === action));
  assert.ok(PERMISSION_CATALOG.every(Object.isFrozen));
});
