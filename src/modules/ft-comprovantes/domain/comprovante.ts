export interface DeliveryReceipt {
  id: string;
  modalidade: "kit" | "individual" | "beneficios";
  edital: string;
  pessoa: { nome: string; cpf: string };
  entregue_em: string;
  responsavel: string;
  competencia?: string;
  itens: Array<{
    nome: string;
    tamanho?: string;
    quantidade?: number;
    descricao?: string | null;
  }>;
  estorno: { data: string; motivo: string } | null;
}

/** CPF remains encrypted until the application prepares the render request. */
export interface DeliveryReceiptRepository {
  material(id: string): Promise<DeliveryReceipt | null>;
  benefit(
    editalId: string,
    deliveryId: string,
  ): Promise<DeliveryReceipt | null>;
}
