import test from "node:test";
import assert from "node:assert/strict";
import { GerarComprovanteUseCase } from "./gerar-comprovante.use-case.js";
import type {
  DeliveryReceipt,
  DeliveryReceiptRepository,
} from "../domain/comprovante.js";

const receipt: DeliveryReceipt = {
  id: "delivery",
  modalidade: "kit",
  edital: "Edital atual",
  pessoa: { nome: "Ana", cpf: "encrypted" },
  entregue_em: "2026-11-01T02:30:00Z",
  responsavel: "Operador",
  itens: [{ nome: "Bota histórica", tamanho: "38", quantidade: 1 }],
  estorno: null,
};
test("receipt masks decrypted CPF, forwards snapshots/request ID and never mutates delivery", async () => {
  const calls: unknown[] = [];
  const repository: DeliveryReceiptRepository = {
    material: async (id) => {
      assert.equal(id, receipt.id);
      return receipt;
    },
    benefit: async (edital, id) => {
      assert.equal(edital, "edital");
      assert.equal(id, "benefit");
      return {
        ...receipt,
        modalidade: "beneficios",
        competencia: "2026-10",
        estorno: { data: "2026-11-02T12:00:00Z", motivo: "Erro de entrega" },
      };
    },
  };
  const useCase = new GerarComprovanteUseCase(
    repository,
    {
      decrypt: async (value) => {
        assert.equal(value, "encrypted");
        return "001.234.567-89";
      },
    },
    {
      execute: async (data, requestId) => {
        calls.push({ data, requestId });
        assert.equal(data.pessoa.cpf, "***.234.567-**");
        assert.equal(data.itens[0].nome, "Bota histórica");
        return {
          file: Buffer.from("%PDF-"),
          contentType: "application/pdf",
          contentDisposition: "attachment",
        };
      },
    },
  );
  await useCase.material("delivery", "request-1");
  await useCase.benefit("edital", "benefit", "request-2");
  assert.equal(calls.length, 2);
  assert.equal(receipt.pessoa.cpf, "encrypted");
});
test("missing or mismatched delivery returns 404 without rendering", async () => {
  const useCase = new GerarComprovanteUseCase(
    { material: async () => null, benefit: async () => null },
    {
      decrypt: async () => {
        throw new Error("must not decrypt");
      },
    },
    {
      execute: async () => {
        throw new Error("must not render");
      },
    },
  );
  await assert.rejects(useCase.material("missing"), { statusCode: 404 });
  await assert.rejects(useCase.benefit("wrong-edital", "delivery"), {
    statusCode: 404,
  });
});
test("renderer outage can be retried without a delivery command; invalid CPF stays fully masked", async () => {
  let attempts = 0;
  const useCase = new GerarComprovanteUseCase(
    { material: async () => receipt, benefit: async () => receipt },
    { decrypt: async () => "invalid" },
    {
      execute: async (data) => {
        assert.equal(data.pessoa.cpf, "***.***.***-**");
        if (++attempts === 1) throw new Error("outage");
        return {
          file: Buffer.from("%PDF-"),
          contentType: "application/pdf",
          contentDisposition: "attachment",
        };
      },
    },
  );
  await assert.rejects(useCase.material("delivery"), /outage/);
  await useCase.material("delivery");
  assert.equal(attempts, 2);
});
