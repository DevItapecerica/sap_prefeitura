import { PagadorCapacity, PagadorInput, PagadorQuery } from "./pagador.js";

export interface PagadorRepository {
  list(query: PagadorQuery): Promise<{ count: number; rows: any[] }>;
  findById(uuid: string, includeDeleted?: boolean): Promise<any | null>;
  findByName(nome: string): Promise<any | null>;
  create(input: PagadorInput): Promise<any>;
  update(instance: any, input: PagadorInput): Promise<any>;
  softDelete(instance: any): Promise<void>;
  maxActiveOccupation(uuid: string): Promise<number>;
  listCapacityByEdital(editalId: string): Promise<PagadorCapacity[] | null>;
}
