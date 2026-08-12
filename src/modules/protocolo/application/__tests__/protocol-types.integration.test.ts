import assert from "node:assert/strict";
import test from "node:test";
import { randomUUID } from "node:crypto";
import type { ProtocolType } from "../../domain/protocol-type.js";

const databaseUrl = process.env.PROTOCOL_DB_TEST_URL;

test("tipos preservam política, recurso pertence ao titular e denúncia exige acesso restrito", {
  skip: databaseUrl ? false : "PROTOCOL_DB_TEST_URL nao configurada",
  timeout: 30_000,
}, async () => {
  process.env.DATABASE_URL = databaseUrl!;
  const [{ default: db }, { ProtocolService }, { PROTOCOL_TYPE_POLICY_VERSION }] = await Promise.all([
    import("../../../../infra/database/sequelize/index.js"),
    import("../protocol.service.js"),
    import("../../domain/protocol-type.js"),
  ]);
  (db.sequelize as any).options.logging = false;
  const models = db.sequelize.models as Record<string, any>;
  const suffix = randomUUID().slice(0, 8);
  const created: Record<string, any> = { protocols: [], services: [] };
  const fakeMailer = { sendCode: async () => undefined, sendNotification: async () => undefined };
  const fakeAes = { encrypt: async (value: string) => `encrypted:${value}`, decrypt: async (value: string) => value.replace(/^encrypted:/, "") };
  const service = new ProtocolService(fakeMailer as any, fakeAes as any);

  const makeSession = (citizen: any, marker: string) => ({
    kind: "protocol-citizen" as const,
    citizenId: citizen.uuid,
    cpfHash: citizen.cpfHash,
    emailHash: marker.repeat(64),
    email: `${marker}-${suffix}@example.invalid`,
  });
  const makeService = async (name: string, protocolType: ProtocolType) => {
    const draft = await service.createServiceWithDraft({
      name: `${name} ${suffix}`, description: `Teste de ${name}`, deadlineDays: 10,
      defaultSectorId: created.sector.id, protocolType,
      fields: [{ key: "descricao", label: "Descrição", type: "textarea", required: true }],
    });
    await service.publishForm(draft.service.id, draft.form.id);
    created.services.push(draft.service);
    return draft.service;
  };

  try {
    await db.sequelize.authenticate();
    created.sector = await models.SetorModel.create({ name: `Tipos E2E ${suffix}` });
    const citizenDefaults = { nascimento: "1990-01-01", telefone: "11999999999", rua: "Rua", bairro: "Centro", cidade: "Itapecerica da Serra", uf: "SP", cep: "06850000", numero: "1", complemento: null, author: "PROTOCOL_TYPES_E2E", cepHash: "c".repeat(64) };
    created.citizen = await models.MunicipeModel.create({ ...citizenDefaults, nome: "Titular Tipos", cpf: `encrypted-a-${suffix}`, cpfHash: "a".repeat(56) + suffix });
    created.otherCitizen = await models.MunicipeModel.create({ ...citizenDefaults, nome: "Outro Titular", cpf: `encrypted-b-${suffix}`, cpfHash: "b".repeat(56) + suffix });
    const citizenSession = makeSession(created.citizen, "a");
    const otherSession = makeSession(created.otherCitizen, "b");

    const requirementService = await makeService("Requerimento", "REQUERIMENTO");
    created.base = await service.createProtocol(citizenSession, { serviceId: requirementService.id, subject: "Decisão original", answers: { descricao: "Pedido base" } });
    created.protocols.push(created.base);
    await service.transition(created.base.id, "EM_ANALISE", { actorType: "SYSTEM", publicMessage: "Em análise" });
    await service.transition(created.base.id, "INDEFERIDO", { actorType: "SYSTEM", publicMessage: "Indeferido para teste" });

    const appealService = await makeService("Recurso", "RECURSO");
    await assert.rejects(
      service.createProtocol(citizenSession, { serviceId: appealService.id, subject: "Sem vínculo", answers: { descricao: "Recurso" } }),
      (error: any) => error?.code === "RELATED_PROTOCOL_REQUIRED",
    );
    await assert.rejects(
      service.createProtocol(otherSession, { serviceId: appealService.id, relatedProtocolId: created.base.id, subject: "Vínculo alheio", answers: { descricao: "Recurso" } }),
      (error: any) => error?.code === "RELATED_PROTOCOL_NOT_FOUND",
    );
    created.appeal = await service.createProtocol(citizenSession, { serviceId: appealService.id, relatedProtocolId: created.base.id, subject: "Recurso válido", answers: { descricao: "Revisar decisão" } });
    created.protocols.unshift(created.appeal);
    assert.equal(created.appeal.protocolType, "RECURSO");
    assert.equal(created.appeal.relatedProtocolId, created.base.id);

    const reportService = await makeService("Denúncia", "DENUNCIA");
    created.report = await service.createProtocol(citizenSession, { serviceId: reportService.id, subject: "Relato identificado", answers: { descricao: "Fato a apurar" } });
    created.protocols.unshift(created.report);
    assert.equal(created.report.protocolType, "DENUNCIA");
    assert.equal(created.report.confidentiality, "RESTRICTED");
    assert.equal(created.report.typePolicyVersion, PROTOCOL_TYPE_POLICY_VERSION);
    assert.equal((await service.listCitizen(otherSession)).some((item: any) => item.id === created.report.id), false);

    const sectorUser = { id: 200, role_id: 20, setor_id: created.sector.id };
    assert.equal((await service.listInternal({}, sectorUser, false)).some((item: any) => item.id === created.report.id), false);
    assert.equal((await service.listInternal({}, sectorUser, true)).some((item: any) => item.id === created.report.id), true);
    assert.equal((await service.listInternal({ protocolType: "RECURSO" }, sectorUser, true)).every((item: any) => item.protocolType === "RECURSO"), true);
  } finally {
    for (const protocol of created.protocols) if (protocol?.id) await models.ProtocolModel.destroy({ where: { id: protocol.id }, force: true }).catch(() => undefined);
    for (const protocolService of created.services) {
      await models.ProtocolServiceModel.update({ publishedFormId: null }, { where: { id: protocolService.id } }).catch(() => undefined);
      await models.ProtocolFormModel.destroy({ where: { serviceId: protocolService.id }, force: true }).catch(() => undefined);
      await models.ProtocolServiceModel.destroy({ where: { id: protocolService.id }, force: true }).catch(() => undefined);
    }
    for (const citizen of [created.otherCitizen, created.citizen]) if (citizen?.uuid) await models.MunicipeModel.destroy({ where: { uuid: citizen.uuid }, force: true }).catch(() => undefined);
    if (created.sector?.id) await models.SetorModel.destroy({ where: { id: created.sector.id } }).catch(() => undefined);
    await db.sequelize.close();
  }
});
