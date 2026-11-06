import assert from "node:assert/strict";
import test from "node:test";
import { createHash } from "node:crypto";
import { Op } from "sequelize";
import { SequelizeWorkflowRepository } from "../sequelize.workflow.repository.js";
test("people filters preserve escaped name/CPF and exception scopes before pagination", async () => {
  let where: any;
  const list = async (query: any) => {
    where = query.where;
    return { rows: [], count: 0 };
  };
  const db: any = {
    Edital: { findByPk: async () => ({ id: "edital" }) },
    FtInscricao: { findAndCountAll: list },
    BolsistasEdital: { findAndCountAll: list },
  };
  const service = new SequelizeWorkflowRepository(db);
  await service.people("edital", { search: "  A%_  " }, true);
  assert.deepEqual(where[Op.and], [
    { "$bolsista.municipe.nome$": { [Op.like]: "%A\\%\\_%" } },
  ]);
  await service.people("edital", { search: "001.234.567-89" }, false);
  assert.deepEqual(where[Op.and], [
    {
      "$bolsista.municipe.cpfHash$": createHash("sha256")
        .update("00123456789")
        .digest("hex"),
    },
  ]);
  for (const inscriptions of [true, false]) {
    const registration = inscriptions ? "excecao_em" : "$inscricao.excecao_em$";
    const convocation = inscriptions
      ? "$participacoes.excecao_em$"
      : "excecao_em";
    const cases = [
      ["inscricao", { [registration]: { [Op.ne]: null } }],
      ["convocacao", { [convocation]: { [Op.ne]: null } }],
      [
        "qualquer",
        {
          [Op.or]: [
            { [registration]: { [Op.ne]: null } },
            { [convocation]: { [Op.ne]: null } },
          ],
        },
      ],
      ["nenhuma", { [registration]: null, [convocation]: null }],
    ] as const;
    for (const [excecao, expected] of cases) {
      await service.people("edital", { excecao }, inscriptions);
      assert.deepEqual(where[Op.and], [expected]);
    }
    await service.people("edital", {}, inscriptions);
    assert.deepEqual(where, { edital_id: "edital" });
  }
});
