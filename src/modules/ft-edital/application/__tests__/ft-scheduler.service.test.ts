import test from "node:test";
import assert from "node:assert/strict";
import { FtSchedulerService } from "../use-case/ft-scheduler.service.js";
import {
  __testing,
  startFtScheduler,
} from "../../scheduler/ft-scheduler.js";

class FakeFtSchedulerRepository {
  expiredEditais = [{ id: "edital-1" }];
  expiredVinculos = [{ id: "vinculo-1" }, { id: "vinculo-2" }];
  nowReceived: Date | null = null;
  concluded = 0;
  expired = 0;

  async findExpiredActiveEditais(now: Date) {
    this.nowReceived = now;
    return this.expiredEditais;
  }

  async findExpiredActiveVinculos() {
    return this.expiredVinculos;
  }

  async concludeExpiredEdital() {
    this.concluded += 1;
    return {
      editalId: "edital-1",
      editalName: "Edital 1",
      vinculosUpdated: 3,
      before: { status: "ativo" },
      after: { status: "inativo" },
      vinculos: [],
    };
  }

  async expireVinculo(vinculo: any) {
    this.expired += 1;
    return {
      bolsistaId: `bolsista-${vinculo.id}`,
      vinculoId: vinculo.id,
      editalId: "edital-1",
      before: { status: "ativo" },
      after: { status: "expirado" },
    };
  }
}

test("FtSchedulerService inativa editais vencidos e expira vinculos vencidos", async () => {
  const repository = new FakeFtSchedulerRepository();
  const service = new FtSchedulerService(repository);
  const now = new Date("2026-06-09T12:00:00.000Z");

  const result = await service.run(now);

  assert.equal(repository.nowReceived, now);
  assert.equal(repository.concluded, 1);
  assert.equal(repository.expired, 2);
  assert.deepEqual(result, {
    editaisInativados: 1,
    vinculosConcluidos: 3,
    vinculosExpirados: 2,
  });
});

test("FtSchedulerService retorna zeros quando nao ha pendencias", async () => {
  const repository = new FakeFtSchedulerRepository();
  repository.expiredEditais = [];
  repository.expiredVinculos = [];
  const service = new FtSchedulerService(repository);

  const result = await service.run(new Date("2026-06-09T12:00:00.000Z"));

  assert.deepEqual(result, {
    editaisInativados: 0,
    vinculosConcluidos: 0,
    vinculosExpirados: 0,
  });
});

test("FtSchedulerService publica auditoria das transicoes automaticas", async () => {
  const repository = new FakeFtSchedulerRepository();
  const events: Array<{ name: string; payload: any }> = [];
  const service = new FtSchedulerService(repository, {
    publish: async (name: string, payload: any) => {
      events.push({ name, payload });
    },
  } as any);

  await service.run(
    new Date("2026-06-09T12:00:00.000Z"),
    {
      correlationId: "scheduler-1",
      actor: { id: "system" },
      origin: { type: "SCHEDULER", route: "ft-scheduler" },
    },
  );

  assert.equal(events.length, 3);
  assert.equal(events[0].name, "FT_EDITAL_CONCLUDED");
  assert.equal(events[1].name, "FT_EDITAL_VINCULO_EXPIRED");
  assert.equal(events[2].name, "FT_EDITAL_VINCULO_EXPIRED");
});

test("FT scheduler calcula proxima execucao para 01:00", () => {
  const beforeOne = new Date("2026-06-09T00:30:00");
  const afterOne = new Date("2026-06-09T01:30:00");

  assert.equal(__testing.getDelayUntilNextRun(beforeOne), 30 * 60 * 1000);
  assert.equal(__testing.getDelayUntilNextRun(afterOne), 23.5 * 60 * 60 * 1000);
});

test("FT scheduler executa imediatamente ao iniciar", async () => {
  let executions = 0;
  const logger = {
    info: () => undefined,
    warn: () => undefined,
    error: () => undefined,
  } as any;

  const scheduler = startFtScheduler(logger, async () => {
    executions += 1;
  });

  await new Promise<void>((resolve) => setImmediate(resolve));
  scheduler.stop();

  assert.equal(executions, 1);
});
