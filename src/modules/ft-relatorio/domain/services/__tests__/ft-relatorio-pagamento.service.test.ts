import assert from "node:assert/strict";
import test from "node:test";
import { pagador } from "../../../../ft-bolsista/application/utils/pagador.js";
import { FtRelatorioPagamentoService } from "../ft-relatorio-pagamento.service.js";
import { FtRelatorioBolsista } from "../../entities/ft-relatorio.entity.js";
import { FtEdital } from "../../../../ft-edital/domain/entity/FtEdital.js";

const scenarios = {
  faltasSemDesconto: {
    bolsistas: [{ bolsista: { id: "b1", nome: "Maria", cpf: "52998224725", local: "Sede", status: "ativo", payment_info: { pagador_id: pagador[0].id } }, faltas: ["2026-06-01", "2026-06-01", "2026-06-06", "2026-06-08", "2026-07-01"].map((data_falta) => ({ data_falta })), vinculos: [] }],
    periodo: { data_inicio: "2026-06-01", data_fim: "2026-06-30" },
    expected: { diasUteis: 22, diasTrabalhados: 22, faltas: 2, bruto: 1000 },
  },
  todasAsFaltas: {
    bolsistas: [{ bolsista: { id: "b2", nome: "Joao", cpf: "12345678900", local: "Sede", status: "ativo", payment_info: { pagador_id: pagador[0].id } }, faltas: ["2026-06-01", "2026-06-02", "2026-06-03", "2026-06-04", "2026-06-05"].map((data_falta) => ({ data_falta })), vinculos: [] }],
    periodo: { data_inicio: "2026-06-01", data_fim: "2026-06-05" },
    expected: { diasUteis: 5, diasTrabalhados: 5, faltas: 5, bruto: 100 },
  },
  vinculoParcial: {
    bolsistas: [{ bolsista: { id: "b3", nome: "Ana", cpf: "11122233344", local: "Sede", status: "ativo", payment_info: { pagador_id: pagador[0].id } }, faltas: ["2026-06-10", "2026-06-20", "2026-06-22"].map((data_falta) => ({ data_falta })), vinculos: [{ status: "cancelado", data_vinculo: "2026-06-08", expire_at: "2027-06-08", canceled_at: "2026-06-19" }] }],
    periodo: { data_inicio: "2026-06-01", data_fim: "2026-06-30" },
    expected: { diasUteis: 22, diasTrabalhados: 10, faltas: 1, bruto: 1000 },
  },
  multiplosVinculos: {
    bolsistas: [{ bolsista: { id: "b4", nome: "Carlos", cpf: "99988877766", local: "Sede", status: "ativo", payment_info: { pagador_id: pagador[0].id } }, faltas: ["2026-06-04", "2026-06-12", "2026-06-15"].map((data_falta) => ({ data_falta })), vinculos: [{ status: "cancelado", data_vinculo: "2026-06-03", expire_at: "2027-06-03", canceled_at: "2026-06-05" }, { status: "expirado", data_vinculo: "2026-06-10", expire_at: "2026-06-12", expired_at: "2026-06-12" }] }],
    periodo: { data_inicio: "2026-06-01", data_fim: "2026-06-30" },
    expected: { diasUteis: 22, diasTrabalhados: 6, faltas: 2, bruto: 1000 },
  },
};

function executeScenario(scenario: (typeof scenarios)[keyof typeof scenarios], valorBolsa = "1000.00") {
  return new FtRelatorioPagamentoService().execute(
    scenario.bolsistas as unknown as FtRelatorioBolsista[],
    { valor_bolsa: valorBolsa, data_vencimento: "2026-12-31" } as FtEdital,
    scenario.periodo,
  );
}

function expectedPayment(expected: {
  diasUteis: number;
  diasTrabalhados: number;
  bruto: number;
}) {
  const valorDiario = expected.bruto / expected.diasUteis;
  const descontoCalculado =
    (expected.diasUteis - expected.diasTrabalhados) * valorDiario;

  return {
    desconto: Math.round(descontoCalculado * 100) / 100,
    liquido:
      Math.round((expected.bruto - descontoCalculado) * 100) / 100,
  };
}

test("mantém faltas no relatório sem descontá-las do pagamento", () => {
  const relatorio = executeScenario(scenarios.faltasSemDesconto);
  const row = relatorio.locais[0].rows[0];
  assert.deepEqual(
    {
      diasUteis: relatorio.dias_uteis,
      diasTrabalhados: row.dias_uteis,
      faltas: row.faltas,
      bruto: row.valor_bruto,
      desconto: row.desconto,
      liquido: row.valor_liquido,
    },
    {
      ...scenarios.faltasSemDesconto.expected,
      ...expectedPayment(scenarios.faltasSemDesconto.expected),
    },
  );
  assert.equal(relatorio.total_valor, row.valor_liquido);
});

test("não reduz o pagamento mesmo com falta em todos os dias úteis", () => {
  const row = executeScenario(scenarios.todasAsFaltas, "100.00").locais[0].rows[0];
  assert.deepEqual(
    {
      faltas: row.faltas,
      desconto: row.desconto,
      liquido: row.valor_liquido,
    },
    {
      faltas: scenarios.todasAsFaltas.expected.faltas,
      ...expectedPayment(scenarios.todasAsFaltas.expected),
    },
  );
});

test("desconta somente dias fora da janela do vínculo", () => {
  const relatorio = executeScenario(scenarios.vinculoParcial);
  const row = relatorio.locais[0].rows[0];
  assert.deepEqual(
    {
      diasUteis: relatorio.dias_uteis,
      diasTrabalhados: row.dias_uteis,
      faltas: row.faltas,
      bruto: row.valor_bruto,
      desconto: row.desconto,
      liquido: row.valor_liquido,
    },
    {
      ...scenarios.vinculoParcial.expected,
      ...expectedPayment(scenarios.vinculoParcial.expected),
    },
  );
  assert.equal(relatorio.total_valor, row.valor_liquido);
});

test("soma múltiplas janelas e ignora faltas no cálculo financeiro", () => {
  const row = executeScenario(scenarios.multiplosVinculos).locais[0].rows[0];
  assert.deepEqual(
    {
      diasTrabalhados: row.dias_uteis,
      faltas: row.faltas,
      desconto: row.desconto,
      liquido: row.valor_liquido,
    },
    {
      diasTrabalhados: scenarios.multiplosVinculos.expected.diasTrabalhados,
      faltas: scenarios.multiplosVinculos.expected.faltas,
      ...expectedPayment(scenarios.multiplosVinculos.expected),
    },
  );
});
