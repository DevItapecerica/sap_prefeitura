import { QueryInterface } from "sequelize";
import { ensureServiceAccessDefaultsForSeed } from "./helpers/service-access-defaults.js";

const SERVICE_ID = 12;
export default {
  up: async (q: QueryInterface) => q.sequelize.transaction(async (transaction) => {
    const now = new Date();
    if (!await q.rawSelect("services", { where: { id: SERVICE_ID }, transaction }, "id")) await q.bulkInsert("services", [{ id: SERVICE_ID, name: "Protocolo Geral", description: "Triagem e acompanhamento de protocolos municipais", url: "/services/12/protocolo", tag: "admin", createdAt: now, updatedAt: now, deletedAt: null }], { transaction });
    await ensureServiceAccessDefaultsForSeed(q, SERVICE_ID, { transaction });
    if (!await q.rawSelect("protocol_services", { where: { name: "Protocolo Geral" }, transaction }, "id")) {
      await q.bulkInsert("protocol_services", [{ name: "Protocolo Geral", description: "Solicitacao geral direcionada ao Protocolo Central", default_sector_id: null, deadline_days: 15, active: true, published_form_id: null, created_at: now, updated_at: now }], { transaction });
      const protocolServiceId = Number(await q.rawSelect("protocol_services", { where: { name: "Protocolo Geral" }, transaction }, "id"));
      await q.bulkInsert("protocol_forms", [{ service_id: protocolServiceId, version: 1, fields: JSON.stringify([{ key: "descricao", label: "Descricao da solicitacao", type: "textarea", required: true }, { key: "endereco", label: "Endereco relacionado", type: "address", required: false }]), published_at: now, created_at: now, updated_at: now }], { transaction });
      const formId = Number(await q.rawSelect("protocol_forms", { where: { service_id: protocolServiceId, version: 1 }, transaction }, "id"));
      await q.bulkUpdate("protocol_services", { published_form_id: formId, updated_at: now }, { id: protocolServiceId }, { transaction });
    }
  }),
  down: async (q: QueryInterface) => q.sequelize.transaction(async (transaction) => {
    await q.bulkDelete("service_visibilities", { service_id: SERVICE_ID }, { transaction }); await q.bulkDelete("permissions", { service_id: SERVICE_ID }, { transaction }); await q.bulkDelete("services", { id: SERVICE_ID }, { transaction });
    const id = await q.rawSelect("protocol_services", { where: { name: "Protocolo Geral" }, transaction }, "id"); if (id) { await q.bulkUpdate("protocol_services", { published_form_id: null }, { id }, { transaction }); await q.bulkDelete("protocol_forms", { service_id: id }, { transaction }); await q.bulkDelete("protocol_services", { id }, { transaction }); }
  }),
};
