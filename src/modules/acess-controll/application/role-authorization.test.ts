import assert from 'node:assert/strict';
import test from 'node:test';
import { AuthorizationUseCase } from './authorization.usecase.js';

test('explicit action requires entry, visibility, existing role and current user role', async () => {
  let role = 2;
  const grants = new Map([[2, ['acessar', 'remover_bolsista']], [3, ['acessar', 'excluir_bolsista']]]);
  const subject = new AuthorizationUseCase({
    user: async () => ({role_id: role, setor_id: 9}),
    roleExists: async () => true,
    service: async () => ({id: 6, module: 'ft'}),
    visible: async () => true,
    actions: async (id: number) => grants.get(id) ?? [],
  });
  await subject.authorize(10, 'ft', 'remover_bolsista');
  await assert.rejects(subject.authorize(10, 'ft', 'excluir_bolsista'));
  role = 3;
  await assert.rejects(subject.authorize(10, 'ft', 'remover_bolsista'));
  await subject.authorize(10, 'ft', 'excluir_bolsista');
  grants.set(3, ['excluir_bolsista']);
  await assert.rejects(subject.authorize(10, 'ft', 'excluir_bolsista'));
});
