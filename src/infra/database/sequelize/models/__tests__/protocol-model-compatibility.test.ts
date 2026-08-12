import assert from "node:assert/strict";
import test from "node:test";
import { Sequelize } from "sequelize";
import defineProtocolModels from "../protocolo.model.js";

test("modelos extraídos preservam nomes, tabelas e associações do protocolo", async (t) => {
  const sequelize = new Sequelize("mariadb://user:password@127.0.0.1:3306/model_test", { logging: false });
  t.after(() => sequelize.close());
  const protocol = defineProtocolModels(sequelize);

  const expectedTables: Record<string, string> = {
    ProtocolServiceModel: "protocol_services", ProtocolFormModel: "protocol_forms", ProtocolModel: "protocols",
    ProtocolMovementModel: "protocol_movements", ProtocolRequirementModel: "protocol_requirements", ProtocolAttachmentModel: "protocol_attachments",
    ProtocolAccessCodeModel: "protocol_access_codes", ProtocolCounterModel: "protocol_counters", ProtocolNotificationModel: "protocol_notifications",
    ProtocolPrivacyRequestModel: "protocol_privacy_requests",
  };
  for (const [name, table] of Object.entries(expectedTables)) assert.equal(sequelize.models[name]?.getTableName(), table);
  assert.equal(protocol.name, "ProtocolModel");
  assert.deepEqual(Object.keys(protocol.associations).sort(), ["attachments", "form", "movements", "privacyRequests", "relatedProtocol", "relatedProtocols", "requirements", "service"]);
  assert.deepEqual(Object.keys(sequelize.models.ProtocolServiceModel.associations), ["forms"]);
});
