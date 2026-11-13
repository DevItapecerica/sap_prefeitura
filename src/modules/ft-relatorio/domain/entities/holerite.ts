export interface Holerite {
  edital: string;
  competencia: string;
  pessoa: { id: string; nome: string; cpf: string };
  periodo: { data_inicio: string; data_fim: string };
  demonstrativos: Array<{
    pagador: string;
    data_pagamento: string;
    bruto_centavos: number;
    descontos: Array<{
      descricao: string;
      referencia: string;
      centavos: number;
    }>;
    desconto_centavos: number;
    liquido_centavos: number;
  }>;
}
