export type MunicipeData = {
  nome: string;
  cpf: string;
  nascimento: string;
  telefone: string | null;
  rua: string;
  bairro: string;
  cidade: string;
  uf: string;
  cep: string;
  numero: string;
  complemento: string | null;
};

export type MunicipeChanges = {
  cpf?: string;
  nascimento?: string;
  telefone?: string | null;
  rua?: string;
  bairro?: string;
  cidade?: string;
  uf?: string;
  cep?: string;
  numero?: string;
  complemento?: string | null;
};
