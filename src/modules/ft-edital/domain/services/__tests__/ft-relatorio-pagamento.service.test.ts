import test from "node:test";
import assert from "node:assert/strict";
import { pagador } from "../../../../ft-bolsista/application/utils/pagador.js";
import { FtRelatorioPagamentoService } from "../ft-relatorio-pagamento.service.js";

test("FtRelatorioPagamentoService calcula dias uteis e desconto por faltas", () => {
  const service = new FtRelatorioPagamentoService();
  const relatorio = service.execute(
    [
      {
        nome: "Maria",
        cpf: "52998224725",
        status: "ativo",
        payment_info: {
          pagador_id: pagador[0].id,
          bco: "001",
          ag: "1234",
          dig_ag: "0",
          conta: "123456",
          dig_conta: "1",
        },
        faltas: [
          { data_falta: "2026-06-01" },
          { data_falta: "2026-06-01" },
          { data_falta: "2026-06-06" },
          { data_falta: "2026-06-08" },
          { data_falta: "2026-07-01" },
        ],
      },
    ],
    {
      id: "edital-1",
      name: "Edital 1",
      data_vencimento: "2026-12-31",
      valor_bolsa: "1000.00",
    },
    { data_inicio: "2026-06-01", data_fim: "2026-06-30" },
  );

  const row = relatorio.locais[0].rows[0];

  assert.equal(relatorio.dias_uteis, 22);
  assert.equal(row.faltas, 2);
  assert.equal(row.valor_bruto, 1000);
  assert.equal(row.desconto, 90.91);
  assert.equal(row.valor_liquido, 909.09);
  assert.equal(relatorio.total_valor, 909.09);
});

test("FtRelatorioPagamentoService limita valor liquido a zero", () => {
  const service = new FtRelatorioPagamentoService();
  const relatorio = service.execute(
    [
      {
        nome: "Joao",
        cpf: "12345678900",
        status: "ativo",
        payment_info: { pagador_id: pagador[0].id },
        faltas: [
          { data_falta: "2026-06-01" },
          { data_falta: "2026-06-02" },
          { data_falta: "2026-06-03" },
          { data_falta: "2026-06-04" },
          { data_falta: "2026-06-05" },
        ],
      },
    ],
    {
      id: "edital-1",
      name: "Edital 1",
      data_vencimento: "2026-12-31",
      valor_bolsa: "100.00",
    },
    { data_inicio: "2026-06-01", data_fim: "2026-06-05" },
  );

  const row = relatorio.locais[0].rows[0];

  assert.equal(row.faltas, 5);
  assert.equal(row.desconto, 100);
  assert.equal(row.valor_liquido, 0);
});
