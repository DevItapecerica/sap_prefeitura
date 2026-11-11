import assert from "node:assert/strict";
import { randomUUID, createHash } from "node:crypto";
import type { DbObject } from "../src/core/types/DbTypes.js";
import type { IAesCrypt } from "../src/core/security/aes/AesCrypt.interface.js";
import type { BenefitCoverageModel } from "../src/infra/database/sequelize/models/ft-beneficios.types.js";
import type { EditalWorkflowService } from "../src/modules/ft-edital/application/use-case/edital-workflow.service.js";
import type {
  Program,
  Allocation,
} from "../src/modules/ft-edital/domain/repositories/workflow.repository.js";
import type { Answers } from "../src/modules/ft-edital/domain/services/edital-workflow.policy.js";
import { SequelizeBeneficiosUnitOfWork } from "../src/infra/database/sequelize/repositories/sequelize.beneficios.repository.js";
import { beneficiosTestClient } from "../src/modules/ft-beneficios/application/__tests__/beneficios-test-client.js";
import { makeAuditService } from "../src/modules/audit/factories/makeAuditService.js";
import seed from "../src/infra/database/sequelize/seeders/20261109121000-ft-beneficios-permissions.js";
import migration from "../src/infra/database/sequelize/migrations/20261109120000-ft-beneficios-entregas.js";

/** Invoked only after the workflow harness has validated its empty disposable target. */
export async function testBeneficios({
  db,
  crypto,
  service: workflow,
  actor,
  answers,
  makeEdital,
}: {
  db: DbObject;
  crypto: IAesCrypt;
  service: EditalWorkflowService;
  actor: { id: number; requestId: string };
  answers: Answers;
  makeEdital: (
    overrides?: Record<string, unknown>,
  ) => Promise<Program & { allocation: Allocation }>;
}) {
  const q = db.sequelize.getQueryInterface();
  await migration.down(q);
  await migration.up(q);
  await seed.up(q);
  await seed.up(q);
  const actions = [
    "consultar_entregas_beneficios",
    "entregar_beneficios",
    "estornar_entrega_beneficios",
    "gerar_relatorio_beneficios",
  ];
  const catalog: number = await db.PermissionActionModel.count({
    where: { module_key: "ft", action: actions },
  });
  assert.equal(catalog, 4);
  const grants: number = await db.RolePermissionsModel.count({
    where: { allowed: true },
    include: [
      {
        model: db.PermissionActionModel,
        as: "permissionAction",
        required: true,
        where: { module_key: "ft", action: actions },
      },
    ],
  });
  assert.equal(grants, 0);
  const e = await makeEdital({ name: "Benefícios SQL", vagas: 5 });
  await workflow.config(
    e.id,
    "beneficios",
    undefined,
    { nome: "Transporte", descricao: "Mensal" },
    actor,
  );
  const key = randomUUID();
  const person = await db.MunicipeModel.create({
    nome: 'Pessoa; "Benefícios"',
    cpf: await crypto.encrypt("00100200304"),
    nascimento: await crypto.encrypt("1990-01-01"),
    telefone: await crypto.encrypt("11999999999"),
    rua: await crypto.encrypt("Rua"),
    bairro: await crypto.encrypt("Centro"),
    cidade: await crypto.encrypt("Itapecerica da Serra"),
    uf: await crypto.encrypt("SP"),
    cep: await crypto.encrypt("06850000"),
    numero: await crypto.encrypt("1"),
    cpfHash: createHash("sha256").update(key).digest("hex"),
    cepHash: key,
    author: "1",
  });
  const registration = await workflow.register(
    e.id,
    { municipe_uuid: person.uuid, respostas: answers },
    actor,
    false,
  );
  const participation = await workflow.call(
    e.id,
    registration.id,
    e.allocation,
    actor,
  );
  await workflow.transition(
    e.id,
    participation.id,
    "ativar",
    {
      data_inicio: "2026-10-22",
      payment_info: {
        bco: "001",
        ag: "0001",
        dig_ag: "X",
        conta: "00002",
        dig_conta: "0",
      },
    },
    actor,
  );
  const service = beneficiosTestClient(
    new SequelizeBeneficiosUnitOfWork(makeAuditService, db),
    crypto,
    () => new Date("2026-10-22T15:00:00Z"),
  );
  const preview = await service.preview(e.id, participation.id);
  assert.equal(preview.impedimento, null);
  assert.equal(preview.beneficios.length, 2);
  const benefit = preview.beneficios[0].id,
    operation = { operacao_id: randomUUID(), beneficio_ids: [benefit] };
  const race = await Promise.allSettled([
    service.deliver(e.id, participation.id, operation, actor),
    service.deliver(
      e.id,
      participation.id,
      { ...operation, operacao_id: randomUUID() },
      actor,
    ),
  ]);
  assert.equal(race.filter((r) => r.status === "fulfilled").length, 1);
  const delivered = (await service.history(e.id)).rows[0];
  const coverage: BenefitCoverageModel | null = await db.FtBeneficioRetirada.findOne({where:{entrega_id:delivered.id}});
  assert.ok(coverage);
  await assert.rejects(db.FtBeneficioRetirada.create(coverage.get({plain:true})));
  const rollbackService = beneficiosTestClient(
    new SequelizeBeneficiosUnitOfWork(
      () => ({
        record: async () => {
          throw Error("Synthetic audit rollback");
        },
      }),
      db,
    ),
    crypto,
    () => new Date("2026-10-22T15:00:00Z"),
  );
  const pending = preview.beneficios.find((b) => b.id !== benefit)!;
  await assert.rejects(
    rollbackService.deliver(
      e.id,
      participation.id,
      { operacao_id: randomUUID(), beneficio_ids: [pending.id] },
      actor,
    ),
    /audit rollback/,
  );
  assert.equal((await service.history(e.id)).count, 1);
  assert.equal(
    (await service.report(e.id, { mes: "2026-10", situacao: "pendentes" }))
      .count,
    1,
  );
  const rev = { operacao_id: randomUUID(), motivo: "Registro incorreto" };
  await service.reverse(e.id, delivered.id, rev, actor);
  await service.reverse(e.id, delivered.id, rev, actor);
  const next = {
    operacao_id: randomUUID(),
    beneficio_ids: [benefit, pending.id],
  };
  const replacement = await service.deliver(
    e.id,
    participation.id,
    next,
    actor,
  );
  assert.equal(
    (await service.deliver(e.id, participation.id, next, actor)).id,
    replacement.id,
  );
  assert.equal(
    (await service.report(e.id, { mes: "2026-10", limit: 1 })).count,
    2,
  );
  assert.ok(
    (await service.csv(e.id, { mes: "2026-10", limit: 1 })).includes(
      '"00100200304"',
    ),
  );
  await assert.rejects(migration.down(q), /preserve/);
  await service.reverse(
    e.id,
    replacement.id,
    { operacao_id: randomUUID(), motivo: "Correção antes do encerramento" },
    actor,
  );
  const closureRace = await Promise.allSettled([
    service.deliver(
      e.id,
      participation.id,
      { operacao_id: randomUUID(), beneficio_ids: [benefit] },
      actor,
    ),
    workflow.phase(e.id, "encerrado", actor),
  ]);
  assert.equal(closureRace[1].status, "fulfilled");
  assert.ok((await service.preview(e.id, participation.id)).impedimento);
  if (closureRace[0].status === "fulfilled")
    await service.reverse(
      e.id,
      closureRace[0].value.id,
      { operacao_id: randomUUID(), motivo: "Estorno após encerramento" },
      actor,
    );
  await assert.rejects(
    service.deliver(
      e.id,
      participation.id,
      { operacao_id: randomUUID(), beneficio_ids: [benefit] },
      actor,
    ),
  );
  assert.equal(
    (await service.report(e.id, { mes: "2026-10" })).totais.pendentes,
    2,
  );
  console.log(
    "PASS benefit SQL: incremental migration, catalog idempotency/no grants, duplicate race, unique coverage, audit rollback, whole reversal, snapshots, CSV and closed-edital history",
  );
}
