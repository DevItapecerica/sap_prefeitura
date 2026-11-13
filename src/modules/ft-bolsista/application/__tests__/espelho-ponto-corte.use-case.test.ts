import assert from "node:assert/strict";
import test from "node:test";
import { GerarEspelhoPontoBolsistaUseCase } from "../use-case/gerar-espelho-ponto-bolsista.use-case.js";
import type { FtBolsistaRepository } from "../../domain/repositories/ft-bolsista.repository.js";
import type { EspelhoPontoRequestDto } from "../../../espelho-ponto/application/dto/espelho-ponto.dto.js";

type Reader = Pick<
  FtBolsistaRepository,
  | "findById"
  | "findEditalById"
  | "findHistoricoByBolsistaId"
  | "findFaltasByBolsistaPeriodo"
>;
const now = () => new Date("2026-11-13T15:00:00Z");
function reader(start = "2026-11-01"): Reader {
  return {
    findById: async () => ({ id: "b1", municipe: { nome: "Maria" } }),
    findEditalById: async () => ({ id: "e1", name: "Edital" }),
    findHistoricoByBolsistaId: async () => [
      {
        edital_id: "e1",
        data_vinculo: start,
        expire_at: "2026-12-31",
        turno_hora_inicio_snapshot: "08:00",
        turno_hora_fim_snapshot: "14:00",
      },
    ],
    findFaltasByBolsistaPeriodo: async (_person, _edital, inicio, fim) => {
      assert.equal(inicio, "2026-11-01");
      assert.equal(fim, "2026-11-13");
      return [
        { data_falta: "2026-11-12", observacao: "Falta passada" },
        { data_falta: "2026-11-12", observacao: "Segunda observação" },
        { data_falta: "2026-11-14", observacao: "Não pode aparecer" },
        { data_falta: "2026-10-31", observacao: "Fora do mês" },
      ];
    },
  };
}
test("individual PDF keeps the calendar month and marks future days without asserting attendance or counting future absences", async () => {
  let payload: EspelhoPontoRequestDto | undefined;
  const service = new GerarEspelhoPontoBolsistaUseCase(
    reader(),
    {
      execute: async (data, requestId) => {
        payload = data;
        assert.equal(requestId, "request");
        return {
          file: Buffer.from("%PDF-test"),
          contentType: "application/pdf",
          contentDisposition: "inline",
        };
      },
    },
    now,
  );
  await service.execute("b1", "e1", "2026-11", "request");
  assert.ok(payload);
  assert.deepEqual(payload.periodo, {
    referencia: "11/2026",
    inicio: "2026-11-01",
    fim: "2026-11-13",
  });
  assert.equal(payload.dias.length, 30);
  assert.equal(payload.dias.at(-1)?.data, "2026-11-30");
  const today = payload.dias.find((day) => day.data === "2026-11-13");
  assert.equal(today?.situacao, "Normal");
  assert.equal(today?.horarioPrevisto, "08:00 14:00");
  const future = payload.dias.filter((day) => day.data > "2026-11-13");
  assert.equal(future.length, 17);
  assert.ok(
    future.every(
      (day) =>
        day.situacao === "Dia futuro" &&
        day.horarioPrevisto === "" &&
        day.marcacoes.length === 0 &&
        day.apontamentos.length === 0,
    ),
  );
  assert.match(payload.observacoes || "", /Apurado até 13\/11\/2026/);
  assert.equal(payload.totais.faltas, "1");
  assert.ok(!JSON.stringify(payload).includes("Não pode aparecer"));
});
test("future month and future participation never call PDF generation", async () => {
  let reads = 0;
  const source = reader("2026-11-14");
  source.findById = async () => {
    reads++;
    return { id: "b1" };
  };
  const service = new GerarEspelhoPontoBolsistaUseCase(
    source,
    {
      execute: async () => {
        throw new Error("must not render");
      },
    },
    now,
  );
  await assert.rejects(service.execute("b1", "e1", "2026-12"), {
    statusCode: 400,
    code: "FT_MS",
  });
  assert.equal(reads, 0);
  await assert.rejects(service.execute("b1", "e1", "2026-11"), {
    statusCode: 409,
  });
});
test("trusted internal batch reference overrides the individual clock without adding an HTTP input", async () => {
  const service = new GerarEspelhoPontoBolsistaUseCase(
    reader(),
    {
      execute: async (data) => {
        assert.equal(data.periodo.fim, "2026-11-13");
        return {
          file: Buffer.from("%PDF-test"),
          contentType: "application/pdf",
          contentDisposition: "inline",
        };
      },
    },
    () => new Date("2026-11-14T03:30:00Z"),
  );
  await service.execute("b1", "e1", "2026-11", undefined, {
    referenceDate: now(),
  });
});
