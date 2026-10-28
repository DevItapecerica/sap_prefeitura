import { FtRelatorioPagamento } from "../../domain/services/ft-relatorio-pagamento.service.js";

export class FtRelatorioCsvFormatter {
  format(relatorio: FtRelatorioPagamento): string {
    const paymentDate = this.paymentDate(relatorio);
    return relatorio.locais.flatMap(local => local.rows.map(row => [
      row.bco,
      row.ag,
      row.dig_ag,
      row.conta,
      row.dig_conta,
      row.nome,
      // Keep the domain's two-decimal amount, without binary multiplication by 100.
      row.valor_liquido.toFixed(2).replace(".", "").replace(/^0+(?=\d)/, ""),
      paymentDate,
      row.cpf.replace(/\D/g, ""),
    ].map(cell => this.formatCell(cell)).join(";"))).join("\n");
  }

  private formatCell(cell: unknown): string {
    const value = cell === undefined || cell === null ? "" : String(cell);
    return /[;"\r\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
  }

  paymentDate(relatorio: FtRelatorioPagamento): string {
    const [year, month] = relatorio.periodo.data_inicio.split("-").map(Number);
    const lastDay = new Date(Date.UTC(year!, month!, 0)).getUTCDate();
    const day = Math.min(relatorio.edital.dia_pagamento, lastDay);
    return String(day).padStart(2, "0") + String(month).padStart(2, "0") + String(year).padStart(4, "0");
  }
}
