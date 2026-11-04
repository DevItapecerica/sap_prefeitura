import assert from 'node:assert/strict';
import test from 'node:test';
import { dependencies, violation } from './check-architecture.mjs';

const dependency = (specifier, names = ['*'], typeOnly = false) => ({ specifier, names, typeOnly });
test('extracts static imports, dynamic imports, reexports, require and import types with locations', () => {
  const found = dependencies(`import { A } from './a.js';
export { B } from './b.js';
const c = import('./c.js');
type D = import('./d.js').D;
const e = require('./e.js');
import type { F } from './f.js';`);
  assert.deepEqual(found.map(row => [row.specifier, row.line]), ['./a.js','./b.js','./c.js','./d.js','./e.js','./f.js'].map((name, i) => [name, i + 1]));
  assert.equal(found.at(-1).typeOnly, true);
});
test('domain rejects outer layers even when imports are dynamic, reexported or type only', () => {
  for (const code of [`import type { Dto } from '../../application/dto.js';`, `export * from '../../infra/repository.js';`, `const driver = import('sequelize');`, `type Driver = import('sequelize').Transaction;`]) {
    for (const entry of dependencies(code)) assert.ok(violation('src/modules/example/domain/entity/item.ts', entry, 'backend'));
  }
  assert.equal(violation('src/modules/example/domain/policy.ts', dependency('./entity.js'), 'backend'), null);
});
test('application uses ports, with composition and technical code confined to factories/adapters', () => {
  assert.ok(violation('src/modules/example/application/service.ts', dependency('axios'), 'backend'));
  assert.ok(violation('src/modules/example/application/service.ts', dependency('../../../../infra/database/sequelize/repository.js'), 'backend'));
  assert.ok(violation('src/modules/example/application/service.ts', dependency('../../factories/repository.factory.js'), 'backend'));
  assert.equal(violation('src/modules/example/application/service.ts', dependency('../../domain/repository.js'), 'backend'), null);
  assert.equal(violation('src/modules/example/factories/item.factory.ts', dependency('../../../../infra/database/sequelize/repository.js'), 'backend'), null);
  assert.equal(violation('src/core/infra/rendering/document.ts', dependency('pdf-lib'), 'backend'), null);
  assert.ok(violation('src/modules/example/interface/controller/item.controller.ts', dependency('../../../../infra/database/sequelize/index.js'), 'backend'));
});
test('frontend keeps transport in services and stateful orchestration in hooks', () => {
  for (const client of ['@/api/API', '@api/API', '../../api/API', 'axios']) {
    assert.ok(violation('src/components/Editor.jsx', dependency(client), 'frontend'));
    assert.ok(violation('src/context/UserProvider.jsx', dependency(client), 'frontend'));
    assert.ok(violation('src/hooks/useEditor.js', dependency(client), 'frontend'));
    assert.equal(violation('src/service/editorService.ts', dependency(client), 'frontend'), null);
  }
  assert.ok(violation('src/pages/Editor.jsx', dependency('@/service/editorService'), 'frontend'));
  assert.equal(violation('src/hooks/useEditor.ts', dependency('@/service/editorService'), 'frontend'), null);
  assert.equal(violation('src/context/UserProvider.jsx', dependency('@/service/sessionService'), 'frontend'), null);
  assert.equal(violation('src/components/Editor.tsx', dependency('@/service/editorService', ['EditorData'], true), 'frontend'), null);
});

test('native HTTP and computed imports cannot bypass protected layers', () => {
  for (const code of ['fetch("/api");', 'window.fetch("/api");', 'globalThis.fetch("/api");', 'new XMLHttpRequest();']) {
    const [entry] = dependencies(code);
    assert.equal(entry.specifier, '<native-http>');
    assert.ok(violation('src/pages/Editor.jsx', entry, 'frontend'));
    assert.ok(violation('src/modules/example/application/service.ts', entry, 'backend'));
    assert.equal(violation('src/service/editorService.ts', entry, 'frontend'), null);
  }
  const [entry] = dependencies('const module = import(name);');
  assert.ok(violation('src/modules/example/domain/policy.ts', entry, 'backend'));
  assert.equal(violation('src/infra/rendering/loader.ts', entry, 'backend'), null);
});
