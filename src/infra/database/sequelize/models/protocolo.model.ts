import { Sequelize } from "sequelize";
import { defineProtocolCoreModels } from "./protocol-core-models.js";
import { defineProtocolSupportModels } from "./protocol-support-models.js";

export default (sequelize: Sequelize) => {
  const { Service, Form, Protocol } = defineProtocolCoreModels(sequelize);
  const { Movement, Requirement, Attachment, PrivacyRequest } = defineProtocolSupportModels(sequelize);

  Service.hasMany(Form, { foreignKey: "serviceId", as: "forms" });
  Form.belongsTo(Service, { foreignKey: "serviceId", as: "service" });
  Protocol.belongsTo(Service, { foreignKey: "serviceId", as: "service" });
  Protocol.belongsTo(Form, { foreignKey: "formId", as: "form" });
  Protocol.belongsTo(Protocol, { foreignKey: "relatedProtocolId", as: "relatedProtocol" });
  Protocol.hasMany(Protocol, { foreignKey: "relatedProtocolId", as: "relatedProtocols" });
  Protocol.hasMany(Movement, { foreignKey: "protocolId", as: "movements" });
  Protocol.hasMany(Requirement, { foreignKey: "protocolId", as: "requirements" });
  Protocol.hasMany(Attachment, { foreignKey: "protocolId", as: "attachments" });
  Protocol.hasMany(PrivacyRequest, { foreignKey: "protocolId", as: "privacyRequests" });

  return Protocol;
};
