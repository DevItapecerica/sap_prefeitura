import ModalidadeService from "../use-case/modalidade.service.js";
import Modalidade from "../../domain/entity/Modalidade.js";

export class FakeModalidadeRepository {
  modalidades = new Map<string, Modalidade>();
  lastQuery: any = null;
  nextId = 1;

  async createModalidade(modalidade: Modalidade) {
    modalidade.uuid = `mod-${this.nextId++}`;
    this.modalidades.set(modalidade.uuid, modalidade);
    return modalidade;
  }

  async findAllModalidades(query?: any) {
    this.lastQuery = query;
    let modalidades = [...this.modalidades.values()];

    if (query?.search) {
      modalidades = modalidades.filter((modalidade) =>
        modalidade.nome.includes(query.search),
      );
    }

    return { modalidades, count: modalidades.length };
  }

  async findOneModalidade(uuid: string) {
    return this.modalidades.get(uuid) ?? null;
  }

  async findByNome(nome: string) {
    return (
      [...this.modalidades.values()].find(
        (modalidade) => modalidade.nome === nome,
      ) ?? null
    );
  }

  async updateModalidade(uuid: string, data: any) {
    const modalidade = this.modalidades.get(uuid);
    if (!modalidade) return null;
    Object.assign(modalidade, data);
    return modalidade;
  }

  async deleteModalidade(uuid: string) {
    return this.modalidades.delete(uuid);
  }
}

export function makeService() {
  const modalidadeRepo = new FakeModalidadeRepository();
  return {
    modalidadeRepo,
    service: new ModalidadeService(modalidadeRepo as any),
  };
}
