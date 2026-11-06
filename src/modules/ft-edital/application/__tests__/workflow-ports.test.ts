import assert from "node:assert/strict";
import test from "node:test";
import { fakePort } from "../../../../core/contracts/__tests__/fake-port.js";
import type {
  Program,
  Participation,
  Registration,
  WorkflowTransaction,
  WorkflowUnitOfWork,
} from "../../domain/repositories/workflow.repository.js";
import { EditalWorkflowService } from "../use-case/edital-workflow.service.js";
import {
  enrollmentAnswers,
  enrollmentSnapshot,
} from "../utils/enrollment-content.js";

const actor = { id: 1, requestId: "request" };
const bank = {
  bco: "001",
  ag: "0012",
  dig_ag: "X",
  conta: "000123",
  dig_conta: "0",
};
const allocation = {
  pagador_id: "payer",
  turno_id: "shift",
  local: "Secretaria",
  data_inicio: "2026-10-22",
};
function fixture() {
  let state: {
    program: Program;
    people: Participation[];
    events: number;
    audits: number;
    bankWrites: number;
  } = {
    program: {
      id: "edital",
      fase: "aberto",
      status: "ativo",
      name: "Edital",
      idade_maxima: 65,
      data_publicacao: "2026-01-01",
      vigencia_inicio: "2026-01-01",
      data_vencimento: "2026-12-31",
      inscricoes_inicio: "2026-10-01T09:00:00-03:00",
      inscricoes_fim: "2026-10-31T18:00:00-03:00",
      vagas: 10,
      dia_pagamento: 5,
      valor_bolsa: 900,
      carga_semanal: 30,
      carga_mensal: 180,
      duracao_meses: 6,
      prorrogacao_meses: 3,
      permitir_participacao_anterior: true,
      permitir_retorno: true,
    },
    people: [],
    events: 0,
    audits: 0,
    bankWrites: 0,
  };
  const registration: Registration = {
    id: "inscricao",
    edital_id: "edital",
    bolsista_id: "bolsista",
    status: "inscrito",
    snapshot: JSON.stringify({ nascimento: "1990-01-01", nome: "Maria" }),
    respostas: JSON.stringify({
      desempregado: true,
      possui_renda: false,
      recebe_previdencia: false,
      inicio_residencia: "2020-01-01",
      vulnerabilidade_atestada: true,
      beneficiario_familiar: false,
      aceite: true,
    }),
  };
  let inside = false,
    failAudit = false,
    closedMonth: string | null = null;
  const locks: string[] = [];
  const ports = fakePort<WorkflowTransaction>({
    edital: async () => {
      if (inside) locks.push("edital");
      return state.program;
    },
    registration: async () => registration,
    identity: async () => ({ id: "bolsista", municipe_uuid: "municipe" }),
    lockPerson: async () => {
      assert.ok(inside);
      locks.push("municipe");
      return { uuid: "municipe" };
    },
    lockRegistration: async () => {
      assert.ok(inside);
      locks.push("inscricao");
      return registration;
    },
    lockParticipation: async (id) => {
      assert.ok(inside);
      locks.push("participacao");
      return state.people.find((row) => row.id === id)!;
    },
    participation: async (_id, id) =>
      state.people.find((row) => row.id === id) || null,
    firstClosedMonth: async () => closedMonth,
    identityHistory: async (_id, exclude) =>
      state.people.filter((row) => row.id !== exclude),
    countOccupations: async () => 0,
    config: async (_id, kind) => ({
      uuid: kind === "pagadores" ? "payer" : "shift",
      edital_id: "edital",
      nome: "Configuração",
      quantidade: 10,
      hora_inicio: "08:00",
      hora_fim: "14:00",
    }),
    createParticipation: async (input) => {
      assert.ok(inside);
      const row = { ...input, id: "participacao-" + state.people.length };
      state.people.push(row);
      return row;
    },
    updateEdital: async (_id, input) => {
      assert.ok(inside);
      Object.assign(state.program, input);
      return state.program;
    },
    updateParticipation: async (id, input) => {
      assert.ok(inside);
      const row = state.people.find((row) => row.id === id)!;
      Object.assign(row, input);
      return row;
    },
    saveBankData: async () => {
      assert.ok(inside);
      state.bankWrites++;
    },
    addEvent: async () => {
      assert.ok(inside);
      state.events++;
    },
    recordAudit: async () => {
      assert.ok(inside);
      if (failAudit) throw new Error("audit failed");
      state.audits++;
    },
  });
  const unit: WorkflowUnitOfWork = {
    read: ports,
    run: async (work) => {
      const before = structuredClone(state);
      inside = true;
      try {
        return await work(ports);
      } catch (error) {
        state = before;
        throw error;
      } finally {
        inside = false;
      }
    },
  };
  const crypto = {
    encrypt: async (value: string) => value,
    decrypt: async (value: string) => value,
  };
  return {
    service: new EditalWorkflowService(
      unit,
      crypto,
      () => new Date("2026-10-22T15:00:00Z"),
    ),
    state: () => state,
    locks,
    failAudit: () => {
      failAudit = true;
    },
    closeMonth: () => {
      closedMonth = "2026-10";
    },
  };
}

test("workflow uses identity, program and participation locks, retaining bank requirements", async () => {
  const f = fixture();
  const row = await f.service.call("edital", "inscricao", allocation, actor);
  assert.deepEqual(f.locks, ["municipe", "edital", "inscricao"]);
  assert.equal(f.state().events, 1);
  assert.equal(f.state().audits, 1);
  await assert.rejects(
    f.service.transition(
      "edital",
      row.id,
      "ativar",
      { data_inicio: allocation.data_inicio, payment_info: {} },
      actor,
    ),
    /pagamento/,
  );
  assert.equal(f.state().bankWrites, 0);
  assert.equal(f.state().people[0].status, "convocado");
  f.locks.length = 0;
  await f.service.transition(
    "edital",
    row.id,
    "ativar",
    { data_inicio: allocation.data_inicio, payment_info: bank },
    actor,
  );
  assert.deepEqual(f.locks, ["municipe", "edital", "participacao"]);
  assert.equal(f.state().people[0].status, "ativo");
});

test("workflow rolls durable events and data back on audit failure", async () => {
  const f = fixture();
  f.failAudit();
  await assert.rejects(
    f.service.call("edital", "inscricao", allocation, actor),
    /audit failed/,
  );
  assert.equal(f.state().people.length, 0);
  assert.equal(f.state().events, 0);
  assert.equal(f.state().program.primeira_convocacao_em, undefined);
});

test("closed payroll is supplied through the port and blocks normal and exceptional calls", async () => {
  const f = fixture();
  f.closeMonth();
  for (const exception of [false, true])
    await assert.rejects(
      f.service.call(
        "edital",
        "inscricao",
        { ...allocation, motivo: "Autorizado" },
        actor,
        exception,
      ),
      /2026-10/,
    );
  assert.equal(f.state().people.length, 0);
  assert.equal(f.state().events, 0);
});

test("historical declarations remain absent, while explicit negative answers retain their meaning", () => {
  assert.deepEqual(enrollmentAnswers("{}"), {});
  assert.deepEqual(enrollmentAnswers('{"possui_renda":false}'), {
    possui_renda: false,
  });
  assert.throws(
    () => enrollmentAnswers('{"possui_renda":"false"}'),
    /Invalid stored/,
  );
  for (const json of ["null", "[]", "false"])
    assert.throws(() => enrollmentAnswers(json), /Invalid stored/);
  assert.deepEqual(enrollmentSnapshot('{"nome":"Maria","nascimento":null}'), {
    nome: "Maria",
    nascimento: null,
  });
  assert.deepEqual(enrollmentSnapshot("{}"), {});
});
