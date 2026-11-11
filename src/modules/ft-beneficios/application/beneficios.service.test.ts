import test from "node:test";
import assert from "node:assert/strict";
import { beneficiosTestClient } from "./__tests__/beneficios-test-client.js";
import type {
  BenefitReportSource,
  BenefitTransaction,
  BenefitUnitOfWork,
  BenefitDelivery,
} from "../domain/beneficios.contracts.js";
import { BeneficiosPolicy } from "../domain/beneficios.policy.js";
const now = new Date("2026-11-09T15:00:00Z");
export function benefitFixture() {
  let source: BenefitReportSource = {
    edital: {
      id: "edital",
      name: "Edital",
      fase: "aberto",
      vigencia_inicio: "2026-01-01",
      data_vencimento: "2027-12-31",
      idade_maxima: 65,
      status: "ativo",
      data_publicacao: "2026-01-01",
      inscricoes_inicio: "2026-01-01",
      inscricoes_fim: "2026-12-31",
      vagas: 5,
      dia_pagamento: 5,
      valor_bolsa: 900,
      carga_semanal: 30,
      carga_mensal: 180,
      duracao_meses: 6,
      prorrogacao_meses: 3,
      permitir_participacao_anterior: false,
      permitir_retorno: false,
    },
    pessoas: [{ id: "person", nome: 'Ana; "Credora"', cpf: "00100200304" }],
    participacoes: [
      {
        id: "p1",
        edital_id: "edital",
        bolsista_id: "bolsista",
        pessoa_id: "person",
        status: "ativo",
        ativado_em: "2026-10-20",
        data_vinculo: "2026-10-20",
        expire_at: "2026-12-20",
        pagador_id: "payer",
        turno_id: "shift",
        local: "Praça",
      },
    ],
    beneficios: [
      { id: "b1", nome: "Cesta", descricao: "Mensal" },
      { id: "b2", nome: "Transporte", descricao: null },
    ],
    entregas: [],
  };
  const operations = new Map<
    string,
    { assinatura: string; resultado: string }
  >();
  const audits: unknown[] = [];
  let failAudit = false,
    next = 0;
  const ports: BenefitTransaction = {
    edital: async (id) => (id === "edital" ? source.edital : null),
    lockEdital: async (id) => (id === "edital" ? source.edital : null),
    participation: async (_edital, id) => {
      const p = source.participacoes.find((row) => row.id === id);
      return p
        ? {
            participacao: p,
            pessoa: source.pessoas.find((row) => row.id === p.pessoa_id)!,
          }
        : null;
    },
    lockParticipation: async (_edital, id) => {
      const p = source.participacoes.find((row) => row.id === id);
      return p
        ? {
            participacao: p,
            pessoa: source.pessoas.find((row) => row.id === p.pessoa_id)!,
          }
        : null;
    },
    benefits: async () => source.beneficios,
    currentDeliveries: async (_edital, person, month) =>
      source.entregas.filter(
        (row) =>
          row.pessoa_id === person && row.mes === month && !row.estornado_em,
      ),
    delivery: async (_edital, id) =>
      source.entregas.find((row) => row.id === id) || null,
    history: async (_edital, query) => {
      const rows = source.entregas
        .filter(
          (row) =>
            (!query.mes || row.mes === query.mes) &&
            (!query.participacao_id ||
              row.participacao_id === query.participacao_id),
        )
        .map((row) => ({
          ...row,
          nome: source.pessoas.find((p) => p.id === row.pessoa_id)!.nome,
        }));
      return {
        rows: rows.slice(
          (query.page || 0) * (query.limit || 20),
          ((query.page || 0) + 1) * (query.limit || 20),
        ),
        count: rows.length,
      };
    },
    reportSource: async (_edital, month) => ({
      ...source,
      entregas: source.entregas.filter((row) => row.mes === month),
    }),
    newId: () => "delivery-" + ++next,
    actorName: async () => "Operador",
    operation: async (id) => operations.get(id) || null,
    remember: async (id, _edital, assinatura, resultado) => {
      operations.set(id, { assinatura, resultado });
    },
    create: async (row) => {
      source.entregas.push(row);
    },
    reverse: async (row) => {
      source.entregas = source.entregas.map((value) =>
        value.id === row.id ? row : value,
      );
    },
    audit: async (row) => {
      if (failAudit) throw Error("Audit unavailable");
      audits.push(row);
    },
  };
  const unit: BenefitUnitOfWork = {
    read: ports,
    run: async (work) => {
      const before = structuredClone(source),
        ops = new Map(operations),
        count = audits.length;
      try {
        return await work(ports);
      } catch (error) {
        source = before;
        operations.clear();
        ops.forEach((v, k) => operations.set(k, v));
        audits.length = count;
        throw error;
      }
    },
  };
  return {
    service: beneficiosTestClient(
      unit,
      { encrypt: async (value) => value, decrypt: async (value) => value },
      () => now,
    ),
    source: () => source,
    operations,
    audits,
    setFailAudit: () => {
      failAudit = true;
    },
  };
}
const actor = { id: 1, requestId: "request" };
test("partial delivery, idempotency, person-level duplicate prevention on return and atomic selection", async () => {
  const f = benefitFixture(),
    first = await f.service.deliver(
      "edital",
      "p1",
      { operacao_id: "op1", beneficio_ids: ["b1"] },
      actor,
    );
  assert.equal(
    (await f.service.preview("edital", "p1")).beneficios[0].retirada?.id,
    first.id,
  );
  assert.equal(
    (
      await f.service.deliver(
        "edital",
        "p1",
        { operacao_id: "op1", beneficio_ids: ["b1"] },
        actor,
      )
    ).id,
    first.id,
  );
  assert.equal(f.source().entregas.length, 1);
  f.source().participacoes.push({ ...f.source().participacoes[0], id: "p2" });
  await assert.rejects(
    f.service.deliver(
      "edital",
      "p2",
      { operacao_id: "op2", beneficio_ids: ["b1", "b2"] },
      actor,
    ),
    /já foi retirado/,
  );
  assert.equal(f.source().entregas.length, 1);
  await assert.rejects(
    f.service.deliver(
      "edital",
      "p1",
      { operacao_id: "op1", beneficio_ids: ["b2"] },
      actor,
    ),
    /outros dados/,
  );
  await f.service.deliver(
    "edital",
    "p1",
    { operacao_id: "op3", beneficio_ids: ["b2"] },
    actor,
  );
  assert.equal(f.source().entregas.length, 2);
});
test("whole reversal, justification, independent idempotency and new delivery preserve history snapshots", async () => {
  const f = benefitFixture();
  const d = await f.service.deliver(
    "edital",
    "p1",
    { operacao_id: "op", beneficio_ids: ["b1", "b2"] },
    actor,
  );
  await assert.rejects(
    f.service.reverse(
      "edital",
      d.id,
      { operacao_id: "rev", motivo: " " },
      actor,
    ),
    /justificativa/,
  );
  f.source().beneficios[0].nome = "Novo nome";
  const reversed = await f.service.reverse(
    "edital",
    d.id,
    { operacao_id: "rev", motivo: "Registro incorreto" },
    actor,
  );
  assert.equal(reversed.itens.length, 2);
  assert.equal(reversed.itens[0].nome, "Cesta");
  assert.equal(
    (
      await f.service.reverse(
        "edital",
        d.id,
        { operacao_id: "rev", motivo: "Registro incorreto" },
        actor,
      )
    ).id,
    d.id,
  );
  await assert.rejects(
    f.service.reverse(
      "edital",
      d.id,
      { operacao_id: "rev2", motivo: "Registro incorreto" },
      actor,
    ),
    /já estornada/,
  );
  await f.service.deliver(
    "edital",
    "p1",
    { operacao_id: "new", beneficio_ids: ["b1"] },
    actor,
  );
  assert.equal(
    (await f.service.history("edital", { participacao_id: "p2" })).count,
    0,
  );
  assert.equal(
    (await f.service.history("edital", { participacao_id: "p1" })).count,
    2,
  );
});
test("audit failure rolls back deliveries and operations", async () => {
  const f = benefitFixture();
  f.setFailAudit();
  await assert.rejects(
    f.service.deliver(
      "edital",
      "p1",
      { operacao_id: "op", beneficio_ids: ["b1"] },
      actor,
    ),
    /Audit/,
  );
  assert.equal(f.source().entregas.length, 0);
  assert.equal(f.operations.size, 0);
});
test("monthly report includes ended participants, deduplicates returns, filters before pagination and exports all escaped rows", async () => {
  const f = benefitFixture();
  await f.service.deliver(
    "edital",
    "p1",
    { operacao_id: "op", beneficio_ids: ["b1"] },
    actor,
  );
  f.source().participacoes[0].status = "concluido";
  f.source().participacoes[0].concluded_at = "2026-11-08";
  f.source().participacoes.push({
    ...f.source().participacoes[0],
    id: "return",
  });
  const report = await f.service.report("edital", { mes: "2026-11", limit: 1 });
  assert.equal(report.count, 2);
  assert.equal(report.rows.length, 1);
  assert.deepEqual(report.totais, { previstos: 2, retirados: 1, pendentes: 1 });
  assert.equal(
    (
      await f.service.report("edital", {
        mes: "2026-11",
        situacao: "pendentes",
      })
    ).rows[0].beneficio_id,
    "b2",
  );
  assert.equal(
    (
      await f.service.report("edital", {
        search: "001.002.003-04",
        beneficio_id: "b1",
      })
    ).count,
    1,
  );
  assert.equal(
    (await f.service.report("edital", { search: "ausente" })).count,
    0,
  );
  const csv = await f.service.csv("edital", { limit: 1 });
  assert.equal(csv.split("\r\n").length, 3);
  assert.ok(csv.includes('"Ana; ""Credora"""'));
  assert.ok(csv.includes('"00100200304"'));
});
test("Brazil month boundary, no retroactive/future delivery and ended flag policy", () => {
  const policy = new BeneficiosPolicy(),
    endedPolicy = new BeneficiosPolicy(true);
  const f = benefitFixture(),
    p = f.source().participacoes[0];
  assert.equal(
    policy.month("2026-10", new Date("2026-11-01T02:59:59Z")),
    "2026-10",
  );
  assert.throws(
    () => policy.month("2026-11", new Date("2026-11-01T02:59:59Z")),
    /futura/,
  );
  assert.throws(() => policy.month("2026-13", now), /inválida/);
  assert.match(
    policy.deliveryReason(f.source().edital, p, "2026-10", now)!,
    /mês atual/,
  );
  p.status = "concluido";
  p.concluded_at = "2026-11-08";
  assert.ok(policy.workedInMonth(p, f.source().edital, "2026-11"));
  assert.match(
    policy.deliveryReason(f.source().edital, p, "2026-11", now)!,
    /ativas/,
  );
  assert.equal(
    endedPolicy.deliveryReason(f.source().edital, p, "2026-11", now),
    null,
  );
  p.status = "ativo";
  p.concluded_at = null;
  p.data_vinculo = "2026-11-30";
  assert.equal(
    policy.workedInMonth(p, f.source().edital, "2026-11", now),
    false,
  );
  assert.ok(endedPolicy.deliveryReason(f.source().edital, p, "2026-11", now));
  assert.equal(
    policy.month("2026-11", new Date("2026-11-01T03:00:00Z")),
    "2026-11",
  );
  p.ativado_em = null;
  assert.equal(policy.workedInMonth(p, f.source().edital, "2026-11"), false);
});
test("ineligible, missing and invalid selections are rejected", async () => {
  const f = benefitFixture();
  await assert.rejects(
    f.service.preview("missing", "p1"),
    /Edital não encontrado/,
  );
  await assert.rejects(
    f.service.preview("edital", "missing"),
    /Participação não encontrada/,
  );
  for (const ids of [[], ["missing"], ["b1", "b1"]])
    await assert.rejects(
      f.service.deliver(
        "edital",
        "p1",
        { operacao_id: "bad", beneficio_ids: ids },
        actor,
      ),
    );
  f.source().participacoes[0].expire_at = "2026-11-08";
  await assert.rejects(
    f.service.deliver(
      "edital",
      "p1",
      { operacao_id: "bad", beneficio_ids: ["b1"] },
      actor,
    ),
    /vencida/,
  );
});
