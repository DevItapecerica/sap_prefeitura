import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const modulesRoot = join(process.cwd(), "src", "modules");

test("todas as rotas de negócio declaram metadata de falha de auditoria", () => {
  const routeFiles = readdirSync(modulesRoot, {
    recursive: true,
    withFileTypes: true,
  }).filter(
    (entry) =>
      entry.isFile() &&
      /\.(route|routes|router)\.ts$/.test(entry.name),
  );

  const uncovered: string[] = [];
  for (const entry of routeFiles) {
    const file = join(entry.parentPath, entry.name);
    const source = readFileSync(file, "utf8");
    const routeDeclarations =
      (source.match(/method:\s*"(?:GET|POST|PUT|PATCH|DELETE)"/g) ?? [])
        .length +
      (source.match(/fastify\.(?:get|post|put|patch|delete)(?:<|\()/g) ?? [])
        .length;
    const auditDeclarations = (source.match(/audit:\s*\{/g) ?? []).length;
    if (routeDeclarations !== auditDeclarations) {
      uncovered.push(
        `${file}: ${routeDeclarations} rotas, ${auditDeclarations} metadatas`,
      );
    }
  }

  assert.deepEqual(uncovered, []);
});
