import test from "node:test";
import assert from "node:assert/strict";
import { SetorService } from "../use-case/setor.service.js";
import { Setor } from "../../domain/entity/Setor.js";

const logger = { info() {} };

class FakeSetorRepository {
  setores = new Map<number, Setor>([[1, new Setor(1, "TI", "Tecnologia")]]);

  async findOneSetor(id: number) {
    return this.setores.get(id) ?? null;
  }

  async findAllSetor() {
    return [...this.setores.values()];
  }

  async createSetor(data: any) {
    const setor = new Setor(2, data.name, data.description);
    this.setores.set(2, setor);
    return setor;
  }

  async updateSetor(id: number, data: any) {
    const setor = this.setores.get(id);
    if (!setor) return null;
    const updated = new Setor(id, data.name ?? setor.name, data.description ?? setor.description);
    this.setores.set(id, updated);
    return updated;
  }

  async deleteSetor(id: number) {
    return this.setores.delete(id);
  }
}

test("SetorService executa fluxos principais", async () => {
  const service = new SetorService(new FakeSetorRepository() as any, logger);

  assert.equal((await service.findAllSetor()).length, 1);
  assert.equal((await service.findOneSetor(1))?.name, "TI");
  assert.equal((await service.createSetor({ name: "Saude", description: "Saude" })).id, 2);
  assert.equal((await service.updateSetor(1, { name: "Tecnologia" }))?.name, "Tecnologia");
  assert.equal(await service.deleteSetor(1), true);
});
