import assert from "node:assert/strict";
import test from "node:test";
import RenderEspelhoPontoPdfUseCase from "../use-case/render-espelho-ponto-pdf.use-case.js";

const payload = { servidor: { matricula: "123", nome: "Maria" }, periodo: { referencia: "05/2026", inicio: "2026-05-01", fim: "2026-05-31" }, dias: [{ data: "2026-05-01", situacao: "Normal", horarioPrevisto: "08:00", marcacoes: [], apontamentos: [] }], totais: { horaExtra50: "0", horaExtra100: "0", adicionalNoturno: "0", atrasoSaidaAntecipada: "0", faltas: "0" } };

test("preserva PDF e cabeçalhos retornados pelo serviço", async () => {
  const http = { post: async () => ({ data: Buffer.from("%PDF-1.7"), headers: { "content-type": "application/pdf", "content-disposition": "inline; filename=teste.pdf", "content-length": "8" } }) } as any;
  const result = await new RenderEspelhoPontoPdfUseCase("http://pdf/api/v1", http).execute(payload);
  assert.equal(result.file.toString(), "%PDF-1.7"); assert.equal(result.contentDisposition, "inline; filename=teste.pdf"); assert.equal(result.contentLength, "8");
});

for (const invalid of [Buffer.from("erro"), Buffer.from("%PDF")]) {
  test("converte resposta inválida ou indisponibilidade em 502", async () => {
    const http = { post: async () => ({ data: invalid, headers: { "content-type": invalid.length === 4 ? "text/plain" : "application/pdf" } }) } as any;
    await assert.rejects(() => new RenderEspelhoPontoPdfUseCase("http://pdf/api/v1", http).execute(payload), (error: any) => error.statusCode === 502 && error.code === "PDF_SERVICE_UNAVAILABLE");
  });
}
