import assert from "node:assert/strict";
import test from "node:test";
import Fastify from "fastify";
import swagger from "@fastify/swagger";
import routes from "../protocolo.routes.js";

test("OpenAPI publica contratos e segurança das rotas críticas", async (t) => {
  const app = Fastify({ logger: false });
  t.after(() => app.close());
  await app.register(swagger, {
    openapi: {
      info: { title: "SAP Prefeitura", version: "1.0.0" },
      components: { securitySchemes: { JWTToken: { type: "http", scheme: "bearer" } } },
    },
  });
  await app.register(routes, { prefix: "/protocolo" });
  await app.ready();

  const document = app.swagger() as any;
  const publicDetail = document.paths["/protocolo/public/protocols/{id}"].get;
  const internalList = document.paths["/protocolo/internal/protocols"].get;
  const internalOpening = document.paths["/protocolo/internal/protocols"].post;
  const permissionUpdate = document.paths["/protocolo/internal/permissions/{roleId}"].put;
  const catalog = document.paths["/protocolo/internal/services"].get;
  const draftCreation = document.paths["/protocolo/internal/services/drafts"].post;

  assert.deepEqual(publicDetail.security, [{ JWTToken: [] }]);
  assert.equal(publicDetail.parameters.find((item: any) => item.name === "id").schema.format, "uuid");
  assert.deepEqual(internalList.security, [{ JWTToken: [] }]);
  assert.ok(internalList.parameters.some((item: any) => item.name === "state"));
  assert.deepEqual(internalOpening.security, [{ JWTToken: [] }]);
  const openingSchema = internalOpening.requestBody.content["application/json"].schema;
  assert.equal(openingSchema.additionalProperties, false);
  assert.ok(openingSchema.required.includes("citizenId"));
  assert.deepEqual(permissionUpdate.security, [{ JWTToken: [] }]);
  const permissionSchema = permissionUpdate.requestBody.content["application/json"].schema;
  assert.equal(permissionSchema.additionalProperties, false);
  assert.equal(permissionSchema.required.length, 9);
  assert.ok(permissionSchema.required.includes("managePrivacy"));
  assert.ok(permissionSchema.required.includes("viewRestricted"));
  assert.ok(permissionSchema.required.includes("viewOperations"));
  assert.deepEqual(catalog.security, [{ JWTToken: [] }]);
  assert.deepEqual(draftCreation.security, [{ JWTToken: [] }]);
  const draftSchema = draftCreation.requestBody.content["application/json"].schema;
  assert.equal(draftSchema.additionalProperties, false);
  assert.ok(draftSchema.required.includes("fields"));
  assert.ok(draftSchema.properties.protocolType.enum.includes("DENUNCIA"));
  assert.equal(draftCreation.responses["201"].content["application/json"].schema.properties.data.additionalProperties, false);

  for (const [path, pathItem] of Object.entries(document.paths) as [string, any][]) {
    if (!path.startsWith("/protocolo/")) continue;
    for (const method of ["get", "post", "put", "patch", "delete"]) {
      const operation = pathItem[method];
      if (!operation) continue;
      assert.ok(operation.responses, `${method.toUpperCase()} ${path} deve declarar respostas`);
      assert.ok(
        Object.keys(operation.responses).some((status) => /^2\d\d$/.test(status)),
        `${method.toUpperCase()} ${path} deve declarar uma resposta de sucesso`,
      );
    }
  }

  const publicDetailSchema = publicDetail.responses["200"].content["application/json"].schema.properties.data;
  assert.equal(publicDetailSchema.additionalProperties, false);
  assert.equal(publicDetailSchema.properties.contactEmail, undefined);
  assert.equal(publicDetailSchema.properties.contactEmailHash, undefined);
  assert.equal(publicDetailSchema.properties.movements.items.properties.internalMessage, undefined);
  assert.equal(publicDetailSchema.properties.attachments.items.properties.storageKey, undefined);
  assert.ok(publicDetail.responses["401"]);
  assert.ok(publicDetail.responses["404"]);

  const internalDetailSchema = document.paths["/protocolo/internal/protocols/{id}"].get.responses["200"]
    .content["application/json"].schema.properties.data;
  assert.equal(internalDetailSchema.properties.contactEmail, undefined);
  assert.equal(internalDetailSchema.properties.contactEmailHash, undefined);
  assert.equal(internalDetailSchema.properties.attachments.items.properties.storageKey, undefined);
  assert.ok(internalDetailSchema.properties.legalHoldAt);

  const publicPrivacy = document.paths["/protocolo/public/privacy-requests"].post;
  assert.deepEqual(publicPrivacy.security, [{ JWTToken: [] }]);
  const publicPrivacySchema = publicPrivacy.responses["201"].content["application/json"].schema.properties.data;
  assert.equal(publicPrivacySchema.additionalProperties, false);
  assert.equal(publicPrivacySchema.properties.citizenId, undefined);
  assert.equal(publicPrivacySchema.properties.handledBy, undefined);
  assert.equal(publicPrivacySchema.properties.encryptedDetails, undefined);

  const internalPrivacy = document.paths["/protocolo/internal/privacy-requests"].get;
  assert.deepEqual(internalPrivacy.security, [{ JWTToken: [] }]);
  const internalPrivacyItem = internalPrivacy.responses["200"].content["application/json"].schema.properties.data.items;
  assert.ok(internalPrivacyItem.properties.citizenId);
  assert.equal(internalPrivacyItem.properties.encryptedDetails, undefined);

  const retention = document.paths["/protocolo/internal/retention-preview"].get;
  assert.deepEqual(retention.security, [{ JWTToken: [] }]);
  assert.equal(retention.responses["200"].content["application/json"].schema.properties.data.additionalProperties, false);

  const operations = document.paths["/protocolo/internal/operations"].get;
  assert.deepEqual(operations.security, [{ JWTToken: [] }]);
  const operationsSchema = operations.responses["200"].content["application/json"].schema.properties.data;
  assert.equal(operationsSchema.additionalProperties, false);
  assert.equal(operationsSchema.properties.protocols.additionalProperties, false);

  const readiness = document.paths["/protocolo/health/readiness"].get;
  assert.ok(readiness.responses["200"]);
  assert.ok(readiness.responses["503"]);

  const notice = document.paths["/protocolo/public/privacy-notice"].get;
  const noticeSchema = notice.responses["200"].content["application/json"].schema.properties.data;
  assert.ok(noticeSchema.required.includes("version"));
  assert.ok(noticeSchema.required.includes("rights"));

  const receiptSchema = document.paths["/protocolo/public/protocols/{id}/receipt"].get.responses["200"]
    .content["application/json"].schema;
  assert.equal(receiptSchema.format, "binary");
});
