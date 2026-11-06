import assert from "node:assert/strict";
import test from "node:test";
import fs from "node:fs";
import ts from "typescript";

test("disposable workflow harness imports application/database modules only after selecting its target", () => {
  const source = fs.readFileSync(
    new URL("./test-ft-workflow.ts", import.meta.url),
    "utf8",
  );
  const tree = ts.createSourceFile(
    "test-ft-workflow.ts",
    source,
    ts.ScriptTarget.Latest,
    true,
  );
  for (const node of tree.statements) {
    if (
      !ts.isImportDeclaration(node) ||
      !ts.isStringLiteral(node.moduleSpecifier)
    )
      continue;
    assert.ok(
      !node.moduleSpecifier.text.startsWith("../src/"),
      "Static application imports can read .env before the guarded disposable URL is applied",
    );
  }
  const targetSet = source.indexOf("DATABASE_URL: target");
  assert.ok(targetSet > source.indexOf("Refusing unsafe FT test target"));
  const databaseImport = source.indexOf(
    'import("../src/infra/database/sequelize/index.js")',
  );
  assert.ok(databaseImport > targetSet);
});
