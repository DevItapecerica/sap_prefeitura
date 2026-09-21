import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import Fastify from "fastify";
import swagger from "@fastify/swagger";

import App from "../src/app.js";

const sortObject = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(sortObject);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, child]) => [key, sortObject(child)]),
  );
};

const app = Fastify({ logger: false });
await app.register(swagger, {
  openapi: {
    info: { title: "SAP Prefeitura API", version: "2.0.0" },
    components: {
      securitySchemes: {
        JWTToken: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
      },
    },
  },
});
await app.register(App, { prefix: "/api/v2", runtimeWorkers: false });
await app.ready();

const document = app.swagger() as Record<string, any>;
for (const [path, operations] of Object.entries(document.paths || {})) {
  for (const [method, operation] of Object.entries(operations as Record<string, any>)) {
    if (operation && typeof operation === "object" && !operation.operationId) {
      operation.operationId = `${method}_${path}`
        .replace(/[^a-zA-Z0-9]+/g, "_")
        .replace(/^_|_$/g, "");
    }
  }
}

const outputDirectory = resolve(process.cwd(), "..", "contracts");
await mkdir(outputDirectory, { recursive: true });
await writeFile(
  resolve(outputDirectory, "sap.openapi.json"),
  `${JSON.stringify(sortObject(document), null, 2)}\n`,
  "utf8",
);
await app.close();
