import { Setor } from "../../domain/entity/Setor.js";
import { SetorRepository } from "../../domain/repository/setor.repository.js";

export class FakeSetorRepository implements SetorRepository {
  setores = new Map<number, Setor>([
    [1, new Setor(1, "Administração", "Setor principal")],
    [2, new Setor(2, "TI", "Tecnologia")],
  ]);
  failUpdate = false;
  failDelete = false;

  findOneSetor(id: number) {
    return Promise.resolve(this.setores.get(id) ?? null);
  }

  findAllSetor() {
    return Promise.resolve([...this.setores.values()]);
  }

  createSetor(data: Pick<Setor, "name" | "description">) {
    const setor = new Setor(3, data.name, data.description);
    this.setores.set(setor.id, setor);
    return Promise.resolve(setor);
  }

  updateSetor(
    id: number,
    data: Pick<Setor, "name" | "description">,
  ) {
    if (this.failUpdate || !this.setores.has(id)) return Promise.resolve(null);
    const setor = new Setor(id, data.name, data.description);
    this.setores.set(id, setor);
    return Promise.resolve(setor);
  }

  deleteSetor(id: number) {
    if (this.failDelete) return Promise.resolve(false);
    return Promise.resolve(this.setores.delete(id));
  }
}
