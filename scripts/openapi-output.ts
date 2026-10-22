import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { normalizeOpenApiDocument } from "./openapi-compatibility.js";

export async function writeSapOpenApi(document: unknown, projectDirectory = process.cwd()): Promise<void> {
  const contents = `${JSON.stringify(normalizeOpenApiDocument(document), null, 2)}\n`;
  const directories = [resolve(projectDirectory, "contracts"), resolve(projectDirectory, "..", "contracts")];
  for (const directory of directories) {
    await mkdir(directory, { recursive: true });
    await writeFile(resolve(directory, "sap.openapi.json"), contents, "utf8");
  }
}
