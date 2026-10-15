import assert from "node:assert/strict";
import test from "node:test";
import RenderFolhaPresencaPdfUseCase from "../use-case/render-folha-presenca-pdf.use-case.js";

const payload = {
  servidor: { matricula: "123", nome: "Maria" },
  periodo: { referencia: "05/2026", inicio: "2026-05-01", fim: "2026-05-31" },
  dias: [{ data: "2026-05-01", situacao: "Normal" }],
};

test("solicita folha de presenca e preserva o PDF", async () => {
  let capturedUrl = "";
  let capturedPayload: any;
  const http = {
    post: async (url: string, body: unknown) => {
      capturedUrl = url;
      capturedPayload = body;
      return { data: Buffer.from("%PDF-1.7"), headers: { "content-type": "application/pdf" } };
    },
  } as any;
  const result = await new RenderFolhaPresencaPdfUseCase("http://pdf/api/v1/", http).execute(payload);
  assert.equal(capturedUrl, "http://pdf/api/v1/folhas-presenca/render");
  assert.equal(capturedPayload, payload);
  assert.equal(result.file.toString(), "%PDF-1.7");
  assert.match(result.contentDisposition, /folha-presenca-123-05-2026\.pdf/);
});

test("converte resposta invalida em 502", async () => {
  const http = { post: async () => ({ data: Buffer.from("erro"), headers: { "content-type": "application/pdf" } }) } as any;
  await assert.rejects(
    () => new RenderFolhaPresencaPdfUseCase("http://pdf/api/v1", http).execute(payload),
    (error: any) => error.statusCode === 502 && error.code === "PDF_SERVICE_UNAVAILABLE",
  );
});
