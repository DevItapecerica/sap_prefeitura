import test from "node:test";
import assert from "node:assert/strict";
import axios from "axios";
import { AxiosHoleriteGateway } from "./axios-holerite.gateway.js";
import type { Holerite } from "../../modules/ft-relatorio/domain/entities/holerite.js";

test("holerite adapter validates PDF bytes and MIME, timeout, request identity and safe recovery", async (t) => {
  const data: Holerite = {
    edital: "Edital",
    competencia: "2026-11",
    pessoa: { id: "id/unsafe", nome: "José", cpf: "***.345.678-**" },
    periodo: { data_inicio: "2026-11-01", data_fim: "2026-11-30" },
    demonstrativos: [],
  };
  const post = t.mock.method(
    axios,
    "post",
    async (
      url: string,
      payload: unknown,
      config: { timeout: number; headers?: Record<string, string> },
    ) => {
      assert.equal(url, "http://pdf/api/v1/holerites/render");
      assert.equal(payload, data);
      assert.equal(config.timeout, 15000);
      assert.equal(config.headers?.["X-Request-Id"], "request");
      return {
        data: Buffer.from("%PDF-real"),
        headers: { "content-type": "application/pdf" },
      };
    },
  );
  const gateway = new AxiosHoleriteGateway("http://pdf/api/v1/");
  assert.match(
    (await gateway.execute(data, "request")).contentDisposition,
    /holerite-2026-11-idunsafe.pdf/,
  );
  for (const response of [
    {
      data: Buffer.from("oops"),
      headers: { "content-type": "application/pdf" },
    },
    {
      data: Buffer.from("%PDF-real"),
      headers: { "content-type": "text/html" },
    },
  ]) {
    post.mock.mockImplementation(async () => response);
    await assert.rejects(gateway.execute(data), {
      statusCode: 502,
      code: "PDF_SERVICE_UNAVAILABLE",
    });
  }
  post.mock.mockImplementation(async () => {
    throw new Error("secret internal response");
  });
  await assert.rejects(gateway.execute(data), {
    message: "Não foi possível gerar o holerite. Tente novamente.",
  });
  post.mock.mockImplementation(async () => ({
    data: Buffer.from("%PDF-recovered"),
    headers: { "content-type": "application/pdf" },
  }));
  assert.equal((await gateway.execute(data)).file.toString(), "%PDF-recovered");
});
