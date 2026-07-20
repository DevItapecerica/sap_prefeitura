import { Setor } from "../../domain/entity/Setor.js";

export interface UpdateSetorResultDto {
  before: Setor;
  after: Setor;
}
