export type FtRelatorioArquivoStatus = "aguardando" | "processando" | "concluido" | "erro" | "excluido";

export interface FtRelatorioArquivoDto {
  id: string;
  nome_arquivo: string;
  status: FtRelatorioArquivoStatus;
  edital_id: string;
  mes: string;
  solicitado_por: number;
  caminho_arquivo?: string | null;
  tamanho_bytes?: number | null;
  total_bolsistas: number;
  total_gerados: number;
  total_falhas: number;
  tentativas: number;
  mensagem_erro?: string | null;
  iniciado_em?: Date | null;
  concluido_em?: Date | null;
  download_iniciado_em?: Date | null;
  baixado_em?: Date | null;
  excluido_em?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
  edital?: { id: string; name: string };
  solicitante?: { id: number; name: string };
}
