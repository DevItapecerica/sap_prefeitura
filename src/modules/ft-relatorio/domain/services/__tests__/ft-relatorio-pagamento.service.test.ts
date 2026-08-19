import test from "node:test";
import assert from "node:assert/strict";
import { pagador } from "../../../../ft-bolsista/application/utils/pagador.js";
import { FtRelatorioPagamentoService } from "../ft-relatorio-pagamento.service.js";
import {
  FtRelatorioBolsista,
  FtRelatorioVinculo,
} from "../../entities/ft-relatorio.entity.js";
import { FtEdital } from "../../../../ft-edital/domain/entity/FtEdital.js";
import { FtBolsista } from "../../../../ft-bolsista/domain/entity/FtBolsista.js";
import { FtPaymentInfo } from "../../../../ft-bolsista/domain/entity/FtPaymentInfo.js";
import { FtBolsistaFalta } from "../../../../ft-bolsista/domain/entity/FtBolsistaFalta.js";

const edital = (valorBolsa: string) =>
  new FtEdital(
    "Edital 1",
    "2026-01-01",
    "2026-12-31",
    10,
    valorBolsa,
    "ativo",
    "edital-1",
  );

const paymentInfo = () =>
  new FtPaymentInfo("001", pagador[0].id, "1234", "0", "123456", "1");

const bolsista = (
  id: string,
  nome: string,
  cpf: string,
  faltas: FtBolsistaFalta[],
  vinculos: FtRelatorioVinculo[] = [],
) =>
  new FtRelatorioBolsista(
    new FtBolsista(
      nome,
      cpf,
      "Sede",
      "00000000",
      "0",
      "Rua A",
      "Centro",
      "Cidade",
      "SP",
      null,
      "ativo",
      paymentInfo(),
      id,
    ),
    faltas,
    vinculos,
  );

const falta = (dataFalta: string) =>
  new FtBolsistaFalta("bolsista-1", "edital-1", dataFalta);

test("FtRelatorioPagamentoService calcula dias uteis e desconto por faltas", () => {
  const service = new FtRelatorioPagamentoService();
  const relatorio = service.execute(
    [
      bolsista("bolsista-1", "Maria", "52998224725", [
        falta("2026-06-01"),
        falta("2026-06-01"),
        falta("2026-06-06"),
        falta("2026-06-08"),
        falta("2026-07-01"),
      ]),
    ],
    edital("1000.00"),
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
      bolsista("bolsista-2", "Joao", "12345678900", [
        falta("2026-06-01"),
        falta("2026-06-02"),
        falta("2026-06-03"),
        falta("2026-06-04"),
        falta("2026-06-05"),
      ]),
    ],
    edital("100.00"),
    { data_inicio: "2026-06-01", data_fim: "2026-06-05" },
  );

  const row = relatorio.locais[0].rows[0];

  assert.equal(row.faltas, 5);
  assert.equal(row.desconto, 100);
  assert.equal(row.valor_liquido, 0);
});

test("FtRelatorioPagamentoService calcula proporcional por inicio e fim operacional do vinculo", () => {
  const service = new FtRelatorioPagamentoService();
  const relatorio = service.execute(
    [
      bolsista(
        "bolsista-3",
        "Ana",
        "11122233344",
        [
          falta("2026-06-10"),
          falta("2026-06-20"),
          falta("2026-06-22"),
        ],
        [
          new FtRelatorioVinculo(
            "cancelado",
            "2026-06-08",
            "2027-06-08",
            "2026-06-19",
          ),
        ],
      ),
    ],
    edital("1000.00"),
    { data_inicio: "2026-06-01", data_fim: "2026-06-30" },
  );

  const row = relatorio.locais[0].rows[0];

  assert.equal(relatorio.dias_uteis, 22);
  assert.equal(row.dias_uteis, 10);
  assert.equal(row.faltas, 1);
  assert.equal(row.valor_bruto, 1000);
  assert.equal(row.desconto, 590.91);
  assert.equal(row.valor_liquido, 409.09);
  assert.equal(relatorio.total_valor, 409.09);
});

test("FtRelatorioPagamentoService soma multiplas janelas de vinculo sem contar fim de semana", () => {
  const service = new FtRelatorioPagamentoService();
  const relatorio = service.execute(
    [
      bolsista(
        "bolsista-4",
        "Carlos",
        "99988877766",
        [
          falta("2026-06-04"),
          falta("2026-06-12"),
          falta("2026-06-15"),
        ],
        [
          new FtRelatorioVinculo(
            "cancelado",
            "2026-06-03",
            "2027-06-03",
            "2026-06-05",
          ),
          new FtRelatorioVinculo(
            "expirado",
            "2026-06-10",
            "2026-06-12",
            null,
            null,
            "2026-06-12",
          ),
        ],
      ),
    ],
    edital("1000.00"),
    { data_inicio: "2026-06-01", data_fim: "2026-06-30" },
  );

  const row = relatorio.locais[0].rows[0];

  assert.equal(row.dias_uteis, 6);
  assert.equal(row.faltas, 2);
  assert.equal(row.desconto, 818.18);
  assert.equal(row.valor_liquido, 181.82);
});
