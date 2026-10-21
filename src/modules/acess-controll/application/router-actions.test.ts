import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';
test('bolsista cancellation is an explicit action distinct from deleting cadastro', () => {
 const source = readFileSync(new URL('../../ft-bolsista/interface/router/frente-de-trabalho-bolsista.router.ts', import.meta.url),'utf8');
 assert.match(source, /allow\("remover_bolsista"\)/);
 assert.match(source, /allow\("excluir_bolsista"\)/);
 assert.doesNotMatch(source, /request\.method/);
});
