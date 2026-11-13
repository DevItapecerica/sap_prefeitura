import type {
  PayrollReader,
  PayrollClosure,
} from "../../domain/repositories/payroll-unit-of-work.js";
import type { Holerite } from "../../domain/entities/holerite.js";
import type { PdfRenderer } from "../../../../core/contracts/pdf-renderer.js";
import { CpfMask } from "../../../../core/utils/cpf-mask.js";
import { ftError } from "../../../ft-bolsista/application/utils/ft-error.js";
import { monthPeriod } from "./ft-fechamento-folha.service.js";

export class GerarHoleriteUseCase {
  constructor(
    private readonly reader: Pick<PayrollReader, "closure">,
    private readonly pdf: PdfRenderer<Holerite>,
  ) {}

  async folha(editalId: string, mes: string): Promise<PayrollClosure> {
    monthPeriod(mes);
    const folha = await this.reader.closure(editalId, mes);
    if (!folha)
      throw ftError(409, "Feche a folha deste mês antes de emitir holerites.");
    return folha;
  }

  async execute(
    bolsistaId: string,
    editalId: string,
    mes: string,
    requestId?: string,
  ) {
    return this.render(await this.folha(editalId, mes), bolsistaId, requestId);
  }

  async render(folha: PayrollClosure, bolsistaId: string, requestId?: string) {
    const rows = folha.snapshot.rows.filter(
      (row) => row.bolsista_id === bolsistaId,
    );
    if (!rows.length)
      throw ftError(
        404,
        "Bolsista não consta na folha fechada desta competência.",
      );
    const centavos = (value: number) => Math.round(value * 100);
    const data: Holerite = {
      edital: folha.snapshot.edital_nome || folha.edital_id,
      competencia: folha.mes,
      periodo: folha.snapshot.periodo,
      pessoa: {
        id: bolsistaId,
        nome: rows[0].nome,
        cpf: CpfMask.middleDigits(rows[0].cpf),
      },
      demonstrativos: rows.map((row) => ({
        pagador: row.pagador,
        data_pagamento: row.data_pagamento,
        bruto_centavos: centavos(row.valor_bruto),
        desconto_centavos: centavos(row.desconto),
        liquido_centavos: centavos(row.valor_liquido),
        descontos: row.descontos_detalhados ?? [
          {
            descricao: "Descontos — detalhamento não registrado",
            referencia: "Não registrado",
            centavos: centavos(row.desconto),
          },
        ],
      })),
    };
    return this.pdf.execute(data, requestId);
  }
}
