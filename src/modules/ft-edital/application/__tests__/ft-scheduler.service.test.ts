import test from "node:test";
import assert from "node:assert/strict";
import { FtSchedulerService } from "../use-case/ft-scheduler.service.js";
import { __testing } from "../../scheduler/ft-scheduler.js";

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
      bolsistasUpdated: 3,
      vinculosUpdated: 3,
    };
  }

  async expireVinculo(vinculo: any) {
    this.expired += 1;
    return {
      bolsistaId: `bolsista-${vinculo.id}`,
      vinculoId: vinculo.id,
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
    bolsistasInativados: 5,
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
    bolsistasInativados: 0,
    vinculosConcluidos: 0,
    vinculosExpirados: 0,
  });
});

test("FT scheduler calcula proxima execucao para 01:00", () => {
  const beforeOne = new Date("2026-06-09T00:30:00");
  const afterOne = new Date("2026-06-09T01:30:00");

  assert.equal(__testing.getDelayUntilNextRun(beforeOne), 30 * 60 * 1000);
  assert.equal(__testing.getDelayUntilNextRun(afterOne), 23.5 * 60 * 60 * 1000);
});
