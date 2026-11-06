import ts from "typescript";
import { readdirSync, readFileSync } from "node:fs";
import { join, relative, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const slash = (path) => path.replaceAll("\\", "/");

function importDetails(node) {
  const bindings = node.importClause?.namedBindings;
  if (!bindings || !ts.isNamedImports(bindings))
    return { names: ["*"], typeOnly: Boolean(node.importClause?.isTypeOnly) };
  return {
    names: bindings.elements.map(
      (element) => (element.propertyName || element.name).text,
    ),
    typeOnly: Boolean(
      node.importClause?.isTypeOnly ||
      (bindings.elements.length &&
        bindings.elements.every((element) => element.isTypeOnly)),
    ),
  };
}

function isLoaderCall(node) {
  if (!ts.isCallExpression(node)) return false;
  return (
    node.expression.kind === ts.SyntaxKind.ImportKeyword ||
    (ts.isIdentifier(node.expression) && node.expression.text === "require")
  );
}

function nativeHttpName(expression) {
  if (ts.isIdentifier(expression)) return expression.text;
  if (
    !ts.isPropertyAccessExpression(expression) ||
    !ts.isIdentifier(expression.expression)
  )
    return null;
  if (["window", "globalThis"].includes(expression.expression.text))
    return expression.name.text;
  return null;
}

function protectsComputedImports(layers, source, mode) {
  return (
    layers.domain ||
    layers.application ||
    (layers.http && !layers.composition) ||
    (mode === "frontend" &&
      /\/(?:components|pages|hooks|context|providers)\//.test(source))
  );
}
export function dependencies(text, file = "example.ts") {
  const tree = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true);
  const found = [];
  const intrinsic = (node, specifier) => {
    const position = tree.getLineAndCharacterOfPosition(node.getStart(tree));
    found.push({
      specifier,
      line: position.line + 1,
      names: ["*"],
      typeOnly: false,
    });
  };
  const add = (node, literal, names = [], typeOnly = false) => {
    if (!literal || !ts.isStringLiteralLike(literal)) return;
    const position = tree.getLineAndCharacterOfPosition(node.getStart(tree));
    found.push({
      specifier: literal.text,
      line: position.line + 1,
      names,
      typeOnly,
    });
  };
  function visit(node) {
    if (ts.isImportDeclaration(node)) {
      const details = importDetails(node);
      add(node, node.moduleSpecifier, details.names, details.typeOnly);
    } else if (ts.isExportDeclaration(node))
      add(node, node.moduleSpecifier, ["*"]);
    else if (ts.isImportTypeNode(node) && ts.isLiteralTypeNode(node.argument))
      add(node, node.argument.literal, ["*"]);
    else if (isLoaderCall(node)) {
      if (node.arguments[0] && ts.isStringLiteralLike(node.arguments[0]))
        add(node, node.arguments[0], ["*"]);
      else intrinsic(node, "<computed-import>");
    } else if (ts.isCallExpression(node) || ts.isNewExpression(node)) {
      const name = nativeHttpName(node.expression);
      if (["fetch", "XMLHttpRequest"].includes(name))
        intrinsic(node, "<native-http>");
    }
    ts.forEachChild(node, visit);
  }
  visit(tree);
  return found;
}

function dependencyTarget(source, specifier) {
  if (!specifier.startsWith(".")) return specifier;
  return slash(resolve(dirname("/" + source), specifier));
}

export function violation(source, dependency, mode) {
  source = slash(source);
  const specifier = slash(dependency.specifier);
  const target = dependencyTarget(source, specifier);
  const domain = /(^|\/)domain\//.test(source);
  const application =
    /(^|\/)application\//.test(source) || /\/auth\.service\./.test(source);
  const http =
    /\/(?:router|routes|controller)s?\//.test(source) ||
    /\.(?:router|routes|controller)\./.test(source);
  const composition =
    /\/(?:factories|bootstrap)\//.test(source) ||
    /\.(?:factory|factories)\./.test(source) ||
    source === "src/server.ts";
  const technical =
    specifier === "<native-http>" ||
    /(^|\/)(?:sequelize|axios|sharp|pdf-lib|archiver)(?:\/|$)/.test(
      specifier,
    ) ||
    /^(?:node:)?(?:fs|http|https)(?:\/|$)/.test(specifier) ||
    /\/infra\/(?:database|http|files|pdf|rendering|storage|mail)\//.test(
      target,
    );
  if (
    specifier === "<computed-import>" &&
    protectsComputedImports(
      { domain, application, http, composition },
      source,
      mode,
    )
  )
    return "protected layers must use statically identifiable imports";
  if (domain && /\/(?:application|interface|infra)\//.test(target))
    return "domain must not depend on outer layers";
  if (domain && technical) return "domain must not depend on technical drivers";
  if (domain && /(?:^|\/)appError\.js$/.test(target))
    return "domain must use semantic business errors";
  if (application && technical)
    return "application must use a port for persistence, transport or rendering";
  if (
    application &&
    /\/(?:factories|interface)\/|\.(?:factory|factories)\.|\/DbTypes\.js$|\/core\/event\/index\.js$|\/(?:AesCrypt|sha256)\.service\.js$/.test(
      target,
    )
  )
    return "application must receive adapters through contracts";
  if (
    http &&
    !composition &&
    (/\/infra\/database\//.test(target) ||
      /(^|\/)sequelize(?:\/|$)/.test(specifier) ||
      /\/DbTypes\.js$/.test(target))
  )
    return "HTTP handlers must receive composed use cases";
  if (mode === "frontend")
    return frontendViolation(source, target, specifier, dependency);
  return null;
}

function frontendViolation(source, target, specifier, dependency) {
  const serviceFile =
    /\/(?:service|services)\//.test(source) || /\.service\.[jt]s$/.test(source);
  const hook =
    serviceFile ||
    /\/hooks\//.test(source) ||
    /\/use[A-Z][^/]*\.[jt]sx?$/.test(source);
  const provider =
    /\/(?:context|contexts|providers)\//.test(source) ||
    /Provider\.[jt]sx?$/.test(source);
  const ui = /\/(?:components|pages)\//.test(source);
  const client =
    specifier === "<native-http>" ||
    /(^|\/)(?:API|api-client|http-client)(?:\.[jt]s)?$/.test(target) ||
    /(?:^|[/@])api\/API$/.test(target) ||
    specifier === "axios";
  const service =
    /\/(?:service|services)\//.test(target) ||
    (/(?:workflow|estoque)-api$/.test(target) &&
      dependency.names.some((name) =>
        ["*", "workflowApi", "estoqueApi"].includes(name),
      ));
  if ((ui || provider || hook) && !serviceFile && client)
    return "components, hooks and providers must delegate HTTP clients to services";
  if (ui && !provider && !hook && service && !dependency.typeOnly)
    return "components must delegate service orchestration to hooks";
  return null;
}

export function check(root, mode) {
  const failures = [];
  function walk(directory) {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      if (entry.isDirectory()) {
        if (!["__tests__", "generated"].includes(entry.name))
          walk(join(directory, entry.name));
        continue;
      }
      if (
        !/\.[jt]sx?$/.test(entry.name) ||
        /\.(?:test|spec|d)\.[jt]sx?$/.test(entry.name)
      )
        continue;
      const path = join(directory, entry.name),
        source = slash(relative(root, path));
      for (const dependency of dependencies(readFileSync(path, "utf8"), path)) {
        const reason = violation(source, dependency, mode);
        if (reason)
          failures.push(
            `${source}:${dependency.line}: ${reason}: ${dependency.specifier}`,
          );
      }
    }
  }
  walk(join(root, "src"));
  return failures;
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
  const mode = process.argv[2] || "backend";
  const failures = check(root, mode);
  if (failures.length) {
    process.stderr.write(failures.join("\n") + "\n");
    process.exitCode = 1;
  } else process.stdout.write("Architecture boundaries verified.\n");
}
