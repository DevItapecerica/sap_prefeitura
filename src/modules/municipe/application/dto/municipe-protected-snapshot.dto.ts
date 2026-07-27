export interface MunicipeProtectedSnapshot {
  uuid?: string;
  nome: string;
  cpf: string;
  cpfHash?: string;
  nascimento: string;
  telefone: string | null;
  rua: string;
  bairro: string;
  cidade: string;
  uf: string;
  cep: string;
  cepHash?: string;
  numero: string;
  complemento: string | null;
  author: string | number;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
}
