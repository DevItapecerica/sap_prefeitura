import test from "node:test";
import assert from "node:assert/strict";
import axios from "axios";
import { AxiosComprovanteEntregaGateway } from "./axios-comprovante-entrega.gateway.js";
import type { DeliveryReceipt } from "../../modules/ft-comprovantes/domain/comprovante.js";

const receipt: DeliveryReceipt = {
  id: "delivery",
  modalidade: "kit",
  edital: "Edital",
  pessoa: { nome: "Pessoa", cpf: "***.234.567-**" },
  entregue_em: "2026-11-01T12:00:00Z",
  responsavel: "Operador",
  itens: [],
  estorno: null,
};
test("PDF adapter forwards masked payload, timeout and request ID, validates content and allows retry", async (t) => {
  const post = t.mock.method(
    axios,
    "post",
    async (
      url: string,
      body: unknown,
      config: { timeout: number; headers?: Record<string, string> },
    ) => {
      assert.equal(url, "http://pdf/api/v1/comprovantes-entrega/render");
      assert.equal(body, receipt);
      assert.equal(config.timeout, 15000);
      assert.equal(config.headers?.["X-Request-Id"], "request");
      return {
        data: Buffer.from("%PDF-test"),
        headers: { "content-type": "application/pdf" },
      };
    },
  );
  const adapter = new AxiosComprovanteEntregaGateway("http://pdf/api/v1/");
  const file = await adapter.execute(receipt, "request");
  assert.equal(file.file.toString(), "%PDF-test");
  assert.match(file.contentDisposition, /comprovante-kit-delivery.pdf/);
  for (const response of [
    {
      data: Buffer.from("oops"),
      headers: { "content-type": "application/pdf" },
    },
    {
      data: Buffer.from("%PDF-test"),
      headers: { "content-type": "text/html" },
    },
  ]) {
    post.mock.mockImplementation(async () => response);
    await assert.rejects(adapter.execute(receipt), {
      statusCode: 502,
      code: "PDF_SERVICE_UNAVAILABLE",
    });
  }
  post.mock.mockImplementation(async () => {
    throw new Error("connection refused");
  });
  await assert.rejects(adapter.execute(receipt), { statusCode: 502 });
  post.mock.mockImplementation(async () => ({
    data: Buffer.from("%PDF-recovered"),
    headers: { "content-type": "application/pdf" },
  }));
  assert.equal(
    (await adapter.execute(receipt)).file.toString(),
    "%PDF-recovered",
  );
});
