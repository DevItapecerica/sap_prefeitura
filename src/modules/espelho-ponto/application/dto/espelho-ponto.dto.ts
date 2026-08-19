export interface EspelhoPontoRequestDto {
  name?: string;
  servidor: {
    matricula: string; nome: string; nomeAnterior?: string; cargo?: string;
    especialidade?: string; unidade?: string; horario?: string;
    localTrabalho?: string; endereco?: string;
  };
  periodo: { referencia: string; inicio: string; fim: string };
  dias: Array<{ data: string; situacao: string; horarioPrevisto: string; marcacoes: string[]; apontamentos: string[] }>;
  totais: { horaExtra50: string; horaExtra100: string; adicionalNoturno: string; atrasoSaidaAntecipada: string; faltas: string };
  observacoes?: string;
}

export interface EspelhoPontoPdfDto {
  file: Buffer; contentType: string; contentDisposition: string; contentLength?: string;
}
