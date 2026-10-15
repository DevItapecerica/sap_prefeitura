export interface PagadorData {
  uuid: string;
  nome: string;
  quantidade: number;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
}

export interface PagadorInput {
  nome: string;
  quantidade: number;
}

export interface PagadorQuery {
  page?: string | number;
  limit?: string | number;
  search?: string;
}

export interface PagadorCapacity {
  uuid: string;
  nome: string;
  quantidade: number;
  ativos: number;
  disponiveis: number;
}
