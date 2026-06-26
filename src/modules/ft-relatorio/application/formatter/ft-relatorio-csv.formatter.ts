import { FtRelatorioPagamento } from "../../domain/services/ft-relatorio-pagamento.service.js";

export class FtRelatorioCsvFormatter {
  format(relatorio: FtRelatorioPagamento): string {
    const rows: any[][] = [
      ["Edital"],
      ["Id:", relatorio.edital.id],
      ["Nome:", relatorio.edital.name],
      ["Publicacao:", this.toDateOnly(relatorio.edital.data_publicacao)],
      ["Vencimento:", this.toDateOnly(relatorio.edital.data_vencimento)],
      ["Pagamento:", relatorio.edital.dia_pagamento],
      ["Valor:", this.formatCurrency(relatorio.edital.valor_bolsa)],
      ["Status:", relatorio.edital.status],
      ["Periodo:", relatorio.periodo.data_inicio, relatorio.periodo.data_fim],
      ["Dias uteis:", relatorio.dias_uteis],
      [],
      ["Bolsistas agrupados por local de pagamento"],
    ];

    const header = [
      "bco",
      "ag",
      "dig_ag",
      "conta",
      "dig_conta",
      "nome",
      "valor",
      "vencimento",
      "cpf",
      "local",
      "dias_uteis",
      "faltas",
      "valor_bruto",
      "desconto",
      "valor_liquido",
    ];

    for (const local of relatorio.locais) {
      rows.push([]);
      rows.push([`Local de pagamento: ${local.local}`]);
      rows.push(header);
      rows.push(
        ...local.rows.map((row) => [
          row.bco,
          row.ag,
          row.dig_ag,
          row.conta,
          row.dig_conta,
          row.nome,
          this.formatCurrency(row.valor_liquido),
          row.vencimento,
          row.cpf,
          row.local,
          row.dias_uteis,
          row.faltas,
          this.formatCurrency(row.valor_bruto),
          this.formatCurrency(row.desconto),
          this.formatCurrency(row.valor_liquido),
        ]),
      );
      rows.push([
        "Total de bolsistas local:",
        local.total_bolsistas,
        "Total do local:",
        this.formatCurrency(local.total_valor),
      ]);
    }

    rows.push([
      "Total de bolsistas geral:",
      relatorio.total_bolsistas,
      "Total do valor geral:",
      this.formatCurrency(relatorio.total_valor),
    ]);

    return rows.map((row) => row.map((cell) => this.formatCell(cell)).join(";")).join("\n");
  }

  private formatCell(cell: any): string {
    return cell === undefined || cell === null ? "" : String(cell);
  }

  private formatCurrency(value: any): string {
    const numberValue = Number(value || 0);
    return numberValue.toFixed(2);
  }

  private toDateOnly(value: any): string {
    return new Date(value).toISOString().split("T")[0];
  }
}
