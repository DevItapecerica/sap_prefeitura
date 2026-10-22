import assert from "node:assert/strict";
import test from "node:test";
import { spawnSync } from "node:child_process";
import { configurePermissionsTestEnvironment } from './permissions-test-target.js';

test('guard rejects connection-option query overrides without attempting a database connection', () => {
  for (const query of ['host=example.invalid', 'user=root', 'database=production', 'socketPath=%2Funsafe.sock', 'initSql=DROP%20TABLE%20roles', 'host=example.invalid&user=root&database=production']) {
    assert.throws(() => configurePermissionsTestEnvironment({ DATABASE_URL: `mariadb://runner:synthetic@127.0.0.1/sap_permissions_test?${query}`, PERMISSIONS_TEST_RESET: 'YES' }), /PERMISSIONS_TEST_TARGET_REFUSED/);
  }
});

test('guard rejects encoded privileged usernames without attempting a database connection', () => {
  for (const username of ['%72oot', 'r%6fot', 'ROOT']) {
    assert.throws(() => configurePermissionsTestEnvironment({ DATABASE_URL: `mariadb://${username}:synthetic@127.0.0.1/sap_permissions_test`, PERMISSIONS_TEST_RESET: 'YES' }), /PERMISSIONS_TEST_TARGET_REFUSED/);
  }
});

for (const script of ['test-action-permissions-mariadb.ts', 'test-action-permissions-runtime.ts', 'serve-permissions-e2e.ts']) {
for (const [name, url, reset = "YES"] of [
  ["variável ausente", ""],
  ["consentimento de reset ausente", "mariadb://permissions_runner:test@127.0.0.1/sap_permissions_test", ""],
  ["banco sem sufixo de teste", "mariadb://permissions_runner:test@127.0.0.1:3306/sap"],
  ["host remoto", "mariadb://permissions_runner:test@example.invalid/sap_permissions_test"],
  ["opções de conexão na query", "mariadb://permissions_runner:test@127.0.0.1/sap_permissions_test?host=example.invalid&user=root&database=production"],
  ["usuário root", "mariadb://root:test@127.0.0.1/sap_permissions_test"],
]) {
  test(`${script}: recusa ${name} antes de conectar e sem expor credenciais`, () => {
    const result = spawnSync(process.execPath, ["--import", "tsx", `scripts/${script}`], {
      encoding: "utf8",
      env: { ...process.env, DATABASE_URL: url, PERMISSIONS_TEST_RESET: reset },
    });
    assert.equal(result.status, 1);
    assert.match(result.stderr, /PERMISSIONS_TEST_TARGET_REFUSED/);
    assert.doesNotMatch(result.stderr, /mariadb:\/\//);
    assert.doesNotMatch(result.stderr, /ECONNREFUSED|ENOTFOUND/);
  });
}
}
