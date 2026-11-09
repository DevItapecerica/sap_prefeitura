import type { BenefitQuery } from "../../domain/beneficios.contracts.js";
import type { ConsultarRelatorioBeneficiosUseCase } from "./consultar-relatorio-beneficios.use-case.js";
const csvCell = (value: unknown) =>
  '"' + String(value ?? "").replace(/"/g, '""') + '"';

export class ExportarRelatorioBeneficiosUseCase {
  constructor(
    private readonly report: Pick<
      ConsultarRelatorioBeneficiosUseCase,
      "complete"
    >,
  ) {}
  async execute(id: string, query: BenefitQuery = {}) {
    const report = await this.report.complete(id, query);
    return (
      "\uFEFF" +
      [
        [
          "Nome",
          "CPF",
          "Benefício",
          "Competência",
          "Situação",
          "Data da retirada",
          "Responsável",
        ],
        ...report.rows.map((row) => [
          row.nome,
          row.cpf,
          row.beneficio,
          row.mes,
          row.situacao,
          row.entregue_em
            ? new Date(row.entregue_em).toLocaleString("pt-BR", {
                timeZone: "America/Sao_Paulo",
              })
            : "",
          row.responsavel,
        ]),
      ]
        .map((row) => row.map(csvCell).join(";"))
        .join("\r\n")
    );
  }
}
