import { TurnoInput, TurnoQuery } from "./turno.js";

export interface TurnoRepository {
  list(query: TurnoQuery): Promise<{ count: number; rows: any[] }>;
  findById(uuid: string, includeDeleted?: boolean): Promise<any | null>;
  findByName(nome: string): Promise<any | null>;
  create(input: TurnoInput): Promise<any>;
  update(instance: any, input: TurnoInput): Promise<any>;
  softDelete(instance: any): Promise<void>;
}
