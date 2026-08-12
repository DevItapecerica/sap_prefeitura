import assert from "node:assert/strict";
import test from "node:test";
import { formatProtocolCsv, maskCitizenName } from "../protocol.service.js";

test("exportacao CSV protege separadores e formulas", () => {
  const csv = formatProtocolCsv([{ publicNumber: "2026/000001", subject: '=HYPERLINK("evil")', state: "EM_ANALISE", currentSectorId: 2, assigneeId: 3, createdAt: new Date("2026-01-01T10:00:00Z"), dueAt: new Date("2026-01-10T10:00:00Z") }]);
  assert.match(csv, /"'=HYPERLINK\(""evil""\)"/); assert.match(csv, /2026\/000001/);
});

test("comprovante mascara sobrenomes do solicitante", () => {
  assert.equal(maskCitizenName("Maria da Silva Souza"), "Maria d. S. S.");
  assert.equal(maskCitizenName("Joao"), "Joao");
});
