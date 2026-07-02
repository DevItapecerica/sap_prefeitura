import { FtEdital } from "../../../ft-edital/domain/entity/FtEdital.js";
import { FtRelatorioPeriodo } from "../dto/ft-relatorio.dto.js";
import { FtRelatorioBolsista } from "../../domain/entities/ft-relatorio.entity.js";

type FtRelatorioFaltas = {
  edital: FtEdital;
  periodo: FtRelatorioPeriodo;
  mes: string;
  bolsistas: FtRelatorioBolsista[];
};

export class FtRelatorioFaltasCsvFormatter {
  format(relatorio: FtRelatorioFaltas): string {
    const rows: any[][] = [
      ["Relatorio de faltas"],
      ["Edital:", relatorio.edital.id],
      ["Nome:", relatorio.edital.name],
      ["Mes:", relatorio.mes],
      ["Periodo:", relatorio.periodo.data_inicio, relatorio.periodo.data_fim],
      [],
      [
        "id_bolsista",
        "nome",
        "cpf",
        "status",
        "total_faltas",
        "datas_faltas",
        "observacoes",
      ],
    ];

    for (const item of relatorio.bolsistas) {
      const faltas = [...item.faltas].sort((a, b) =>
        String(a.data_falta).localeCompare(String(b.data_falta)),
      );

      rows.push([
        item.bolsista.id,
        item.bolsista.nome,
        item.bolsista.cpf,
        item.bolsista.status,
        faltas.length,
        faltas.map((falta) => this.formatDate(falta.data_falta)).join(", "),
        faltas
          .map((falta) => String(falta.observacao || "").trim())
          .filter(Boolean)
          .join(" | "),
      ]);
    }

    return rows.map((row) => row.map((cell) => this.formatCell(cell)).join(";")).join("\n");
  }

  private formatCell(cell: any): string {
    return cell === undefined || cell === null ? "" : String(cell);
  }

  private formatDate(value: string | Date): string {
    const date = new Date(`${String(value).slice(0, 10)}T00:00:00.000Z`);
    const day = String(date.getUTCDate()).padStart(2, "0");
    const month = String(date.getUTCMonth() + 1).padStart(2, "0");
    const year = date.getUTCFullYear();

    return `${day}/${month}/${year}`;
  }
}
