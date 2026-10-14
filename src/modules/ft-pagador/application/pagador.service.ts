import { ftError } from "../../ft-bolsista/application/utils/ft-error.js";
import { PagadorInput, PagadorQuery } from "../domain/pagador.js";
import { PagadorRepository } from "../domain/pagador.repository.js";

const normalize = (input: PagadorInput): PagadorInput => {
  const nome = String(input?.nome ?? "")
    .trim()
    .replace(/\s+/g, " ");
  const quantidade = Number(input?.quantidade);
  if (!nome) throw ftError(400, "Nome do pagador e obrigatorio");
  if (!Number.isInteger(quantidade) || quantidade < 0) {
    throw ftError(400, "Quantidade deve ser um inteiro nao negativo");
  }
  return { nome, quantidade };
};

export class PagadorService {
  constructor(private readonly repository: PagadorRepository) {}

  list(query: PagadorQuery) {
    return this.repository.list(query);
  }

  async listCapacityByEdital(editalId: string) {
    const pagadores = await this.repository.listCapacityByEdital(editalId);
    if (!pagadores) throw ftError(404, "Edital nao encontrado");
    return pagadores;
  }

  async get(uuid: string) {
    const item = await this.repository.findById(uuid);
    if (!item) throw ftError(404, "Pagador nao encontrado");
    return item;
  }

  async create(raw: PagadorInput) {
    const input = normalize(raw);
    if (await this.repository.findByName(input.nome))
      throw ftError(409, "Ja existe um pagador com esse nome");
    return this.repository.create(input);
  }

  async update(uuid: string, raw: PagadorInput) {
    const item = await this.get(uuid);
    const input = normalize(raw);
    const duplicate = await this.repository.findByName(input.nome);
    if (duplicate && duplicate.get("uuid") !== uuid)
      throw ftError(409, "Ja existe um pagador com esse nome");
    const occupation = await this.repository.maxActiveOccupation(uuid);
    if (input.quantidade < occupation) {
      throw ftError(
        409,
        `Quantidade nao pode ser menor que a ocupacao ativa (${occupation})`,
      );
    }
    return {
      before: item.toJSON(),
      after: await this.repository.update(item, input),
    };
  }

  async delete(uuid: string) {
    const item = await this.get(uuid);
    const before = item.toJSON();
    await this.repository.softDelete(item);
    return before;
  }
}
