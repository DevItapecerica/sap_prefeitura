import test from "node:test";
import assert from "node:assert/strict";
import db from "../../index.js";
import { SequelizeComprovanteEntregaRepository } from "../sequelize.comprovante-entrega.repository.js";
import { SequelizeStockRepository } from "../sequelize.estoque.repository.js";
import { SequelizeBeneficiosRepository } from "../sequelize.beneficios.repository.js";
import type { DeliveryDetail } from "../../../../../modules/ft-estoque/domain/estoque.contracts.js";
import type {
  BenefitDelivery,
  BenefitParticipationContext,
} from "../../../../../modules/ft-beneficios/domain/beneficios.contracts.js";

test("receipt adapter resolves only the requested delivery, keeps snapshots and rejects mismatched identities", async (t) => {
  const source = new SequelizeComprovanteEntregaRepository(db);
  const stock: DeliveryDetail = {
    id: "delivery",
    participacao_id: "part",
    edital_id: "edital",
    bolsista_id: "person",
    kit_ativo_participacao_id: null,
    tipo: "individual",
    autor_id: "1",
    entregue_em: "2026-11-01T12:00:00Z",
    justificativa: "Reposição",
    total_centavos: 9001,
    nome: "Nome antigo",
    edital_nome: "Nome antigo",
    responsavel: "Operador",
    responsavel_estorno: null,
    estornado_em: "2026-11-02T12:00:00Z",
    motivo_estorno: "Erro de registro",
    itens: [
      {
        id: "line",
        entrega_id: "delivery",
        variacao_id: "size",
        nome: "Bota histórica",
        tamanho: "38",
        quantidade: 1,
        custo_centavos: 9001,
      },
    ],
  };
  const record = t.mock.method(
    SequelizeStockRepository.prototype,
    "deliveryRecord",
    async () => stock,
  );
  t.mock.method(
    SequelizeStockRepository.prototype,
    "delivery",
    async () => stock,
  );
  const participation = t.mock.method(
    db.BolsistasEdital,
    "findByPk",
    async () => ({ edital_id: "edital", bolsista_id: "person" }),
  );
  t.mock.method(db.Bolsistas, "findByPk", async () => ({
    municipe_uuid: "citizen",
  }));
  t.mock.method(
    db.MunicipeModel,
    "findByPk",
    async (_id: string, options: { paranoid: boolean }) => {
      assert.equal(_id, "citizen");
      assert.equal(options.paranoid, false);
      return { nome: "Nome atual", cpf: "encrypted" };
    },
  );
  t.mock.method(db.Edital, "findByPk", async () => ({ name: "Edital atual" }));
  const result = await source.material("delivery");
  assert.equal(result?.pessoa.nome, "Nome atual");
  assert.equal(result?.edital, "Edital atual");
  assert.deepEqual(result?.itens, [
    { nome: "Bota histórica", tamanho: "38", quantidade: 1 },
  ]);
  assert.equal(result?.estorno?.motivo, "Erro de registro");
  participation.mock.mockImplementation(async () => ({
    edital_id: "wrong",
    bolsista_id: "person",
  }));
  assert.equal(await source.material("delivery"), null);
  record.mock.mockImplementation(async () => null);
  assert.equal(await source.material("missing"), null);
});

test("benefit adapter scopes the lookup to edital and checks person identity across participation returns", async (t) => {
  const source = new SequelizeComprovanteEntregaRepository(db);
  const delivery: BenefitDelivery = {
    id: "delivery",
    participacao_id: "part",
    edital_id: "edital",
    pessoa_id: "citizen",
    mes: "2026-11",
    entregue_em: "2026-11-01T12:00:00Z",
    autor_id: "1",
    responsavel: "Operador",
    estornado_em: null,
    estornado_por: null,
    responsavel_estorno: null,
    motivo_estorno: null,
    itens: [
      {
        id: "benefit",
        nome: "Cesta histórica",
        descricao: "Descrição preservada",
      },
    ],
  };
  const lookup = t.mock.method(
    SequelizeBeneficiosRepository.prototype,
    "delivery",
    async (edital: string, id: string) => {
      assert.equal(id, "delivery");
      return edital === "edital" ? delivery : null;
    },
  );
  t.mock.method(
    SequelizeBeneficiosRepository.prototype,
    "participation",
    async () =>
      ({
        pessoa: { id: "citizen", nome: "Ana", cpf: "encrypted" },
      }) as BenefitParticipationContext,
  );
  t.mock.method(db.Edital, "findByPk", async () => ({ name: "Edital atual" }));
  assert.equal(await source.benefit("wrong", "delivery"), null);
  const result = await source.benefit("edital", "delivery");
  assert.equal(result?.competencia, "2026-11");
  assert.equal(result?.itens[0].nome, "Cesta histórica");
  assert.ok(!("id" in result!.itens[0]));
  lookup.mock.mockImplementation(async () => ({
    ...delivery,
    pessoa_id: "another-person",
  }));
  assert.equal(await source.benefit("edital", "delivery"), null);
});
