export interface FolhaPresencaRequestDto {
  name?: string;
  servidor: {
    matricula: string;
    nome: string;
    nomeAnterior?: string;
    cargo?: string;
    especialidade?: string;
    unidade?: string;
    horario?: string;
    localTrabalho?: string;
    endereco?: string;
  };
  periodo: { referencia: string; inicio: string; fim: string };
  dias: Array<{ data: string; situacao: string }>;
  observacoes?: string;
}

export interface FolhaPresencaPdfDto {
  file: Buffer;
  contentType: string;
  contentDisposition: string;
  contentLength?: string;
}
