import assert from "node:assert/strict";
import test from "node:test";
import { randomUUID } from "node:crypto";

const databaseUrl = process.env.PROTOCOL_DB_TEST_URL;

test("jornada persistente isola cidadaos e setores ate a conclusao", {
  skip: databaseUrl ? false : "PROTOCOL_DB_TEST_URL nao configurada",
  timeout: 30_000,
}, async () => {
  process.env.DATABASE_URL = databaseUrl!;

  const [{ default: db }, { ProtocolService }, { ProtocolPrivacyService }, { assertInternalProtocolAccess }, { PROTOCOL_PRIVACY_NOTICE_VERSION }] = await Promise.all([
    import("../../../../infra/database/sequelize/index.js"),
    import("../protocol.service.js"),
    import("../protocol-privacy.service.js"),
    import("../../domain/protocol-access.js"),
    import("../../domain/protocol-privacy.js"),
  ]);
  (db.sequelize as any).options.logging = false;

  const models = db.sequelize.models as Record<string, any>;
  const suffix = randomUUID().slice(0, 8);
  const created: Record<string, any> = {};
  const fakeMailer = {
    sendCode: async () => undefined,
    sendNotification: async () => undefined,
  };
  const fakeAes = {
    encrypt: async (value: string) => `encrypted:${value}`,
    decrypt: async (value: string) => value.replace(/^encrypted:/, ""),
  };
  const service = new ProtocolService(fakeMailer as any, fakeAes as any);
  const privacyService = new ProtocolPrivacyService(fakeAes as any);

  try {
    await db.sequelize.authenticate();

    [created.adminRole, created.adminRoleOwned] = await models.RolesModel.findOrCreate({
      where: { id: 1 },
      defaults: { name: `Administrador E2E ${suffix}` },
    });
    created.role = await models.RolesModel.create({ name: `Protocolo E2E ${suffix}` });
    assert.notEqual(Number(created.role.id), 1, "o papel operacional nao pode usar o ID reservado do administrador");
    created.triageSector = await models.SetorModel.create({ name: `Triagem E2E ${suffix}` });
    created.destinationSector = await models.SetorModel.create({ name: `Destino E2E ${suffix}` });
    created.otherSector = await models.SetorModel.create({ name: `Outro E2E ${suffix}` });

    const userDefaults = { password: "not-used-in-integration-test", role_id: created.role.id, firstLogin: false };
    created.triageUser = await models.UserModel.create({
      ...userDefaults,
      name: "Servidor de triagem E2E",
      email: `triagem-${suffix}@example.invalid`,
      setor_id: created.triageSector.id,
    });
    created.destinationUser = await models.UserModel.create({
      ...userDefaults,
      name: "Servidor responsavel E2E",
      email: `destino-${suffix}@example.invalid`,
      setor_id: created.destinationSector.id,
    });
    created.otherUser = await models.UserModel.create({
      ...userDefaults,
      name: "Servidor sem acesso E2E",
      email: `outro-${suffix}@example.invalid`,
      setor_id: created.otherSector.id,
    });

    const citizenDefaults = {
      nascimento: "1990-01-01",
      telefone: "11999999999",
      rua: "Rua de Teste",
      bairro: "Centro",
      cidade: "Itapecerica da Serra",
      uf: "SP",
      cep: "06850000",
      numero: "100",
      complemento: null,
      author: "PROTOCOL_E2E",
      cepHash: "c".repeat(64),
    };
    created.citizen = await models.MunicipeModel.create({
      ...citizenDefaults,
      nome: "Cidadao titular E2E",
      cpf: `encrypted-cpf-a-${suffix}`,
      cpfHash: "a".repeat(56) + suffix,
    });
    created.otherCitizen = await models.MunicipeModel.create({
      ...citizenDefaults,
      nome: "Cidadao sem acesso E2E",
      cpf: `encrypted-cpf-b-${suffix}`,
      cpfHash: "b".repeat(56) + suffix,
    });

    const draft = await service.createServiceWithDraft({
      name: `Protocolo Geral E2E ${suffix}`,
      description: "Servico descartavel para a jornada integrada",
      deadlineDays: 15,
      defaultSectorId: created.triageSector.id,
      active: true,
      fields: [{ key: "pedido", label: "Pedido", type: "textarea", required: true }],
    });
    created.protocolService = draft.service;
    created.originalForm = draft.form;
    assert.equal((await service.listServices()).some((item: any) => item.id === created.protocolService.id), false);
    await service.publishForm(created.protocolService.id, created.originalForm.id);
    assert.equal((await service.listServices()).some((item: any) => item.id === created.protocolService.id), true);

    const citizenSession = {
      kind: "protocol-citizen" as const,
      citizenId: created.citizen.uuid,
      cpfHash: created.citizen.cpfHash,
      emailHash: "1".repeat(64),
      email: `cidadao-${suffix}@example.invalid`,
    };
    const otherCitizenSession = {
      kind: "protocol-citizen" as const,
      citizenId: created.otherCitizen.uuid,
      cpfHash: created.otherCitizen.cpfHash,
      emailHash: "2".repeat(64),
      email: `outro-cidadao-${suffix}@example.invalid`,
    };

    created.protocol = await service.createProtocol(citizenSession, {
      serviceId: created.protocolService.id,
      subject: "Pedido integrado de teste",
      answers: { pedido: "Solicito analise do pedido." },
    });

    assert.match(created.protocol.publicNumber, /^\d{4}\/\d{6}$/);
    assert.equal(created.protocol.state, "EM_TRIAGEM");
    assert.equal(Number(created.protocol.currentSectorId), Number(created.triageSector.id));
    assert.equal((await service.listCitizen(citizenSession)).length, 1);
    assert.equal((await service.listCitizen(otherCitizenSession)).length, 0);
    await assert.rejects(
      service.getCitizenProtocol(otherCitizenSession, created.protocol.id),
      (error: any) => error?.statusCode === 404,
    );

    const triageUser = created.triageUser.toJSON();
    const destinationUser = created.destinationUser.toJSON();
    const otherUser = created.otherUser.toJSON();
    assert.equal((await service.listInternal({}, triageUser)).length, 1);
    assert.equal((await service.listInternal({}, destinationUser)).length, 0);
    assert.throws(
      () => assertInternalProtocolAccess(created.protocol.toJSON(), otherUser, "VIEW"),
      (error: any) => error?.code === "PROTOCOL_SECTOR_DENIED",
    );

    await service.forward(
      created.protocol.id,
      created.destinationSector.id,
      triageUser,
      "Encaminhado ao setor competente",
      "Nota visivel apenas internamente",
    );
    assert.equal((await service.listInternal({}, triageUser)).length, 0);
    assert.equal((await service.listInternal({}, destinationUser)).length, 1);

    await service.assume(created.protocol.id, destinationUser);
    await service.addInternalNote(created.protocol.id, destinationUser, "Analise documental iniciada");
    created.requirement = await service.addRequirement(created.protocol.id, {
      description: "Envie a informacao complementar solicitada",
      dueAt: new Date(Date.now() + 7 * 86_400_000).toISOString(),
    }, destinationUser);

    await assert.rejects(
      service.answerRequirement(otherCitizenSession, created.protocol.id, created.requirement.id, "Resposta indevida"),
      (error: any) => error?.statusCode === 404,
    );
    await service.answerRequirement(
      citizenSession,
      created.protocol.id,
      created.requirement.id,
      "Informacao complementar enviada pelo titular",
    );
    await service.transition(created.protocol.id, "CONCLUIDO", {
      actorId: Number(created.destinationUser.id),
      actorType: "USER",
      publicMessage: "Pedido analisado e concluido",
      requireAssignee: true,
    });

    created.privacyRequest = await privacyService.createRequest(citizenSession, {
      requestType: "ACCESS",
      details: "Solicito confirmação dos dados mantidos neste protocolo",
      protocolId: created.protocol.id,
    });
    assert.equal(created.privacyRequest.details, "Solicito confirmação dos dados mantidos neste protocolo");
    assert.equal(created.privacyRequest.citizenId, undefined);
    await assert.rejects(
      privacyService.createRequest(otherCitizenSession, {
        requestType: "ACCESS",
        details: "Tentativa de associar protocolo de outro titular",
        protocolId: created.protocol.id,
      }),
      (error: any) => error?.code === "PROTOCOL_NOT_FOUND",
    );
    assert.equal((await privacyService.listCitizen(citizenSession)).length, 1);
    assert.equal((await privacyService.listCitizen(otherCitizenSession)).length, 0);
    const privacyDecisions = await Promise.allSettled([
      privacyService.updateRequest(created.privacyRequest.id, {
        status: "FULFILLED",
        response: "Dados confirmados e disponibilizados ao titular",
      }, Number(created.destinationUser.id)),
      privacyService.updateRequest(created.privacyRequest.id, {
        status: "DENIED",
        response: "Negativa concorrente que não deve sobrescrever a primeira decisão",
      }, Number(created.otherUser.id)),
    ]);
    assert.equal(privacyDecisions.filter((result) => result.status === "fulfilled").length, 1);
    assert.equal(privacyDecisions.filter((result) => result.status === "rejected").length, 1);
    const rejectedDecision = privacyDecisions.find((result) => result.status === "rejected") as PromiseRejectedResult;
    assert.equal(rejectedDecision.reason?.code, "PRIVACY_REQUEST_CLOSED");
    const decidedPrivacyRequest = await models.ProtocolPrivacyRequestModel.findByPk(created.privacyRequest.id);
    assert.ok(["FULFILLED", "DENIED"].includes(decidedPrivacyRequest.status));
    assert.ok([Number(created.destinationUser.id), Number(created.otherUser.id)].includes(Number(decidedPrivacyRequest.handledBy)));

    const hold = await privacyService.setLegalHold(
      created.protocol.id,
      true,
      "Preservação necessária para controle administrativo",
      Number(created.destinationUser.id),
    );
    assert.equal(hold.legalHoldActive, true);
    assert.ok(hold.legalHoldAt instanceof Date);
    const heldProtocol = await models.ProtocolModel.findByPk(created.protocol.id);
    assert.match(heldProtocol.encryptedLegalHoldReason, /^encrypted:/);
    await privacyService.setLegalHold(created.protocol.id, false, undefined, Number(created.destinationUser.id));
    const retentionPreview = await privacyService.retentionPreview();
    assert.equal(retentionPreview.mode, "DRY_RUN");
    assert.equal(retentionPreview.policyApproved, false);
    assert.deepEqual(retentionPreview.candidates, []);

    created.newForms = await Promise.all(Array.from({ length: 5 }, (_, index) => service.createForm(created.protocolService.id, [
      { key: "pedido", label: `Pedido atualizado ${index + 1}`, type: "textarea", required: true },
      { key: "categoria", label: "Categoria", type: "select", options: ["A", "B"] },
    ])));
    assert.deepEqual(created.newForms.map((form: any) => Number(form.version)).sort((a: number, b: number) => a - b), [2, 3, 4, 5, 6]);
    created.newForm = created.newForms.find((form: any) => Number(form.version) === 6);
    await service.publishForm(created.protocolService.id, created.newForm.id);

    const storedProtocol = await models.ProtocolModel.findByPk(created.protocol.id);
    const storedRequirement = await models.ProtocolRequirementModel.findByPk(created.requirement.id);
    const publicDetail = (await service.getCitizenProtocol(citizenSession, created.protocol.id)).toJSON();
    const internalDetail = (await service.getInternal(created.protocol.id)).toJSON();

    assert.equal(storedProtocol.state, "CONCLUIDO");
    assert.equal(storedProtocol.privacyNoticeVersion, PROTOCOL_PRIVACY_NOTICE_VERSION);
    assert.equal(storedProtocol.legalHoldAt, null);
    assert.equal(storedProtocol.encryptedLegalHoldReason, null);
    assert.equal(Number(storedProtocol.formId), Number(created.originalForm.id));
    assert.equal(storedRequirement.response, "Informacao complementar enviada pelo titular");
    assert.ok(storedRequirement.resolvedAt instanceof Date);
    assert.equal(publicDetail.contactEmail, undefined);
    assert.equal(publicDetail.contactEmailHash, undefined);
    assert.equal(internalDetail.contactEmailHash, undefined);
    assert.ok(publicDetail.movements.every((movement: any) => movement.internalMessage === undefined));
    assert.ok(internalDetail.movements.some((movement: any) => movement.internalMessage === "Nota visivel apenas internamente"));
    assert.deepEqual(
      internalDetail.movements.map((movement: any) => movement.toState),
      ["EM_TRIAGEM", "EM_ANALISE", "EM_ANALISE", "EM_ANALISE", "AGUARDANDO_COMPLEMENTO", "EM_ANALISE", "CONCLUIDO", "CONCLUIDO", "CONCLUIDO"],
    );
    assert.equal(await models.ProtocolNotificationModel.count({ where: { protocolId: created.protocol.id } }), 6);
  } finally {
    if (created.citizen?.uuid) await models.ProtocolPrivacyRequestModel.destroy({ where: { citizenId: created.citizen.uuid }, force: true }).catch(() => undefined);
    if (created.protocol?.id) await models.ProtocolModel.destroy({ where: { id: created.protocol.id }, force: true }).catch(() => undefined);
    if (created.protocolService?.id) {
      await models.ProtocolServiceModel.update({ publishedFormId: null }, { where: { id: created.protocolService.id } }).catch(() => undefined);
      await models.ProtocolFormModel.destroy({ where: { serviceId: created.protocolService.id }, force: true }).catch(() => undefined);
      await models.ProtocolServiceModel.destroy({ where: { id: created.protocolService.id }, force: true }).catch(() => undefined);
    }
    for (const user of [created.otherUser, created.destinationUser, created.triageUser]) {
      if (user?.id) await models.UserModel.destroy({ where: { id: user.id }, force: true }).catch(() => undefined);
    }
    for (const citizen of [created.otherCitizen, created.citizen]) {
      if (citizen?.uuid) await models.MunicipeModel.destroy({ where: { uuid: citizen.uuid }, force: true }).catch(() => undefined);
    }
    if (created.role?.id) await models.RolesModel.destroy({ where: { id: created.role.id } }).catch(() => undefined);
    if (created.adminRoleOwned && created.adminRole?.id) await models.RolesModel.destroy({ where: { id: created.adminRole.id } }).catch(() => undefined);
    for (const sector of [created.otherSector, created.destinationSector, created.triageSector]) {
      if (sector?.id) await models.SetorModel.destroy({ where: { id: sector.id } }).catch(() => undefined);
    }
    await db.sequelize.close();
  }
});
