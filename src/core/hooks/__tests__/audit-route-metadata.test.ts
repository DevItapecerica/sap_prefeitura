import assert from "node:assert/strict";
import test from "node:test";
import { readdirSync } from "node:fs";
import { join, resolve } from "node:path";
import ts from "typescript";

const root = process.cwd();
const configuration = ts.readConfigFile(
  join(root, "tsconfig.json"),
  ts.sys.readFile,
);
const parsed = ts.parseJsonConfigFileContent(
  configuration.config,
  ts.sys,
  root,
);
const program = ts.createProgram(parsed.fileNames, parsed.options);
const checker = program.getTypeChecker();

function property(
  expression: ts.Expression | undefined,
  name: string,
  seen = new Set<ts.Node>(),
): ts.Expression | undefined {
  if (!expression || seen.has(expression)) return undefined;
  seen.add(expression);
  if (ts.isAsExpression(expression) || ts.isParenthesizedExpression(expression))
    return property(expression.expression, name, seen);
  if (ts.isIdentifier(expression)) {
    let symbol = checker.getSymbolAtLocation(expression);
    if (symbol && symbol.flags & ts.SymbolFlags.Alias)
      symbol = checker.getAliasedSymbol(symbol);
    const declaration = symbol?.valueDeclaration;
    if (declaration && ts.isVariableDeclaration(declaration))
      return property(declaration.initializer, name, seen);
  }
  if (!ts.isObjectLiteralExpression(expression)) return undefined;
  for (const member of [...expression.properties].reverse()) {
    if (
      ts.isPropertyAssignment(member) &&
      (ts.isIdentifier(member.name) || ts.isStringLiteral(member.name)) &&
      member.name.text === name
    )
      return member.initializer;
    if (ts.isSpreadAssignment(member)) {
      const inherited = property(member.expression, name, seen);
      if (inherited) return inherited;
    }
  }
  return undefined;
}

function completeAudit(config: ts.Expression | undefined): boolean {
  const audit = property(config, "audit");
  return ["failureAction", "module", "resourceType"].every((name) => {
    let value = property(audit, name);
    while (
      value &&
      (ts.isAsExpression(value) || ts.isParenthesizedExpression(value))
    )
      value = value.expression;
    return value != null && ts.isStringLiteral(value) && value.text.length > 0;
  });
}

test("todas as rotas de negocio declaram auditoria, inclusive configuracoes importadas", () => {
  const uncovered: string[] = [];
  let routes = 0;
  const files = readdirSync(join(root, "src/modules"), {
    recursive: true,
    withFileTypes: true,
  }).filter(
    (entry) =>
      entry.isFile() && /\.(route|routes|router)\.ts$/.test(entry.name),
  );
  for (const file of files) {
    const source = program.getSourceFile(resolve(file.parentPath, file.name));
    assert.ok(source);
    function visit(node: ts.Node) {
      if (
        ts.isCallExpression(node) &&
        ts.isPropertyAccessExpression(node.expression) &&
        node.expression.expression.getText(source) === "fastify"
      ) {
        const method = node.expression.name.text;
        if (
          ["route", "get", "post", "put", "patch", "delete"].includes(method)
        ) {
          routes++;
          const options =
            method === "route" ? node.arguments[0] : node.arguments[1];
          if (!completeAudit(property(options, "config")))
            uncovered.push(
              source!.fileName +
                ":" +
                source!.getLineAndCharacterOfPosition(node.getStart()).line,
            );
        }
      }
      ts.forEachChild(node, visit);
    }
    visit(source);
  }
  assert.ok(routes > 100);
  assert.deepEqual(uncovered, []);
});

test("auditoria incompleta nao e aceita como metadata de uma rota", () => {
  const source = ts.createSourceFile(
    "fixture.ts",
    'const config = { audit: { module: "ft", resourceType: "edital" } };',
    ts.ScriptTarget.Latest,
    true,
  );
  const declaration = (source.statements[0] as ts.VariableStatement)
    .declarationList.declarations[0];
  assert.equal(completeAudit(declaration.initializer), false);
});
