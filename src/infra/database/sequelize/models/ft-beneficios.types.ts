import type { Model } from "sequelize";

export interface BenefitDeliveryAttributes {
  id: string;
  edital_id: string;
  participacao_id: string;
  pessoa_id: string;
  mes: string;
  entregue_em: Date;
  autor_id: string;
  responsavel: string;
  estornado_em: Date | null;
  estornado_por: string | null;
  responsavel_estorno: string | null;
  motivo_estorno: string | null;
}
export interface BenefitItemAttributes {
  entrega_id: string;
  beneficio_id: string;
  nome: string;
  descricao: string | null;
}
export interface BenefitCoverageAttributes {
  edital_id: string;
  pessoa_id: string;
  beneficio_id: string;
  mes: string;
  entrega_id: string;
}
export interface BenefitOperationAttributes {
  id: string;
  edital_id: string;
  assinatura: string;
  resultado: string;
}
export type BenefitDeliveryModel = Model<
  BenefitDeliveryAttributes,
  BenefitDeliveryAttributes
>;
export type BenefitItemModel = Model<
  BenefitItemAttributes,
  BenefitItemAttributes
>;
export type BenefitCoverageModel = Model<
  BenefitCoverageAttributes,
  BenefitCoverageAttributes
>;
export type BenefitOperationModel = Model<
  BenefitOperationAttributes,
  BenefitOperationAttributes
>;
