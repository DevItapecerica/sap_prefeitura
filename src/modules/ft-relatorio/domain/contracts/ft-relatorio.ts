export interface FtRelatorioQuery {
  versao?: string;
  page?: number;
  limit?: number;
  data_inicio?: string;
  data_fim?: string;
}

export interface FtRelatorioFaltasQuery {
  mes?: string;
}

export interface FtRelatorioPeriodo {
  data_inicio: string;
  data_fim: string;
}
