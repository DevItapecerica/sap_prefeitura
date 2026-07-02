export interface FtRelatorioQueryDto {
  data_inicio?: string;
  data_fim?: string;
}

export interface FtRelatorioFaltasQueryDto {
  mes?: string;
}

export interface FtRelatorioPeriodo {
  data_inicio: string;
  data_fim: string;
}
