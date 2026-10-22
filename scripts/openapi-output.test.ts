import assert from "node:assert/strict";
import test from "node:test";
import { mkdir, mkdtemp, readFile, rm } from "node:fs/promises";
import { resolve } from "node:path";
import { writeSapOpenApi } from "./openapi-output.js";

test("versiona contrato canônico e mantém cópia idêntica no workspace", async () => {
  const scratch = resolve("node_modules/.cache");
  await mkdir(scratch, { recursive: true });
  const fixture = await mkdtemp(resolve(scratch, "sap-openapi-"));
  try {
    const project = resolve(fixture, "backend");
    const document = { openapi: "3.0.3", paths: { "/permissions/me": { get: { operationId: "permissionsMe" } } } };
    await writeSapOpenApi(document, project);
    const canonical = await readFile(resolve(project, "contracts/sap.openapi.json"), "utf8");
    const workspace = await readFile(resolve(fixture, "contracts/sap.openapi.json"), "utf8");
    assert.equal(canonical, workspace);
    assert.deepEqual(JSON.parse(canonical), document);
    assert.ok(canonical.endsWith("\n"));
    const updated = { ...document, info: { title: "updated" } };
    await writeSapOpenApi(updated, project);
    assert.deepEqual(JSON.parse(await readFile(resolve(project, "contracts/sap.openapi.json"), "utf8")), updated);
  } finally {
    await rm(fixture, { recursive: true, force: true });
  }
});
