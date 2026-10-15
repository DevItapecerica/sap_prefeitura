import { ftError } from "../../ft-bolsista/application/utils/ft-error.js";
import { TurnoInput, TurnoQuery } from "../domain/turno.js";
import { TurnoRepository } from "../domain/turno.repository.js";

const TIME = /^([01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/;
const normalizeTime = (value: unknown) => {
  const time = String(value ?? "").trim();
  if (!TIME.test(time)) throw ftError(400, "Horario invalido");
  return time.slice(0, 5);
};
const normalize = (raw: TurnoInput): TurnoInput => {
  const nome = String(raw?.nome ?? "").trim().replace(/\s+/g, " ");
  if (!nome) throw ftError(400, "Nome do turno e obrigatorio");
  const hora_inicio = normalizeTime(raw?.hora_inicio);
  const hora_fim = normalizeTime(raw?.hora_fim);
  if (hora_inicio === hora_fim) throw ftError(400, "Inicio e fim do turno devem ser diferentes");
  return { nome, hora_inicio, hora_fim };
};

export class TurnoService {
  constructor(private readonly repository: TurnoRepository) {}
  list(query: TurnoQuery) { return this.repository.list(query); }
  async get(uuid: string) {
    const item = await this.repository.findById(uuid);
    if (!item) throw ftError(404, "Turno nao encontrado");
    return item;
  }
  async create(raw: TurnoInput) {
    const input = normalize(raw);
    if (await this.repository.findByName(input.nome)) throw ftError(409, "Ja existe um turno com esse nome");
    return this.repository.create(input);
  }
  async update(uuid: string, raw: TurnoInput) {
    const item = await this.get(uuid);
    const input = normalize(raw);
    const duplicate = await this.repository.findByName(input.nome);
    if (duplicate && duplicate.get("uuid") !== uuid) throw ftError(409, "Ja existe um turno com esse nome");
    return { before: item.toJSON(), after: await this.repository.update(item, input) };
  }
  async delete(uuid: string) {
    const item = await this.get(uuid);
    const before = item.toJSON();
    await this.repository.softDelete(item);
    return before;
  }
}
