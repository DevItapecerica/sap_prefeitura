import assert from 'node:assert/strict';
import test from 'node:test';
import bootstrap from '../20261021092000-ensure-action-permissions.js';
import seed from '../20261022131000-ft-exception-permissions.js';
import { accessFixture } from '../../migrations/__tests__/action-permissions.fixture.js';

test('FT exception seed adds missing actions idempotently without granting or resetting permissions', async () => {
  const f = accessFixture();
  await bootstrap.up(f.qi);
  const actions = ['cadastrar_inscricao_excecao', 'convocar_inscrito_excecao'];
  const newIds = f.data.permission_actions.filter(p => actions.includes(p.action)).map(p => p.id);
  f.data.role_permissions = f.data.role_permissions.filter(p => !newIds.includes(p.permission_action_id));
  f.data.permission_actions = f.data.permission_actions.filter(p => !newIds.includes(p.id));
  const grants = structuredClone(f.data.role_permissions);
  await seed.up(f.qi);
  const once = structuredClone(f.data.permission_actions);
  await seed.up(f.qi);
  assert.deepEqual(f.data.permission_actions, once);
  assert.deepEqual(f.data.role_permissions, grants);
  for (const action of actions) assert.equal(once.filter(p => p.module_key === 'ft' && p.action === action).length, 1);
});
