export enum ChamadoStatus {
  ABERTO = "aberto",
  EM_PROGRESSO = "em_progresso",
  RESOLVIDO = "resolvido",
  FECHADO = "fechado",
  CANCELADO = "cancelado",
}

export enum ChamadoTipo {
  MANUTENCAO = "manutencao",
  REPARO = "reparo",
  INSTALACAO = "instalacao",
  SUPORTE = "suporte",
  OUTROS = "outros",
}

export enum ChamadoPrioridade {
  BAIXA = "baixa",
  MEDIA = "media",
  ALTA = "alta",
  CRITICA = "critica",
}

export class Chamado {
  constructor(
    public id: string,
    public patrimonio: string,
    public status: ChamadoStatus,
    public tipo: ChamadoTipo,
    public dataEntrada: Date,
    public setorId: number,
    public solicitanteId: number | string,
    public descricao: string,
    public prioridade: ChamadoPrioridade,
    public responsavelId?: number | string | null,
    public observacoes?: string | null,
    public dataResolucao?: Date | null,
    public createdAt?: Date,
    public updatedAt?: Date,
    public deletedAt?: Date | null,
  ) {}
}
