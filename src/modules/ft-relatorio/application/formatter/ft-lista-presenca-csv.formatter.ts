import { FtEdital } from "../../../ft-edital/domain/entity/FtEdital.js";
import { FtRelatorioPeriodo } from "../dto/ft-relatorio.dto.js";
import { FtRelatorioBolsista } from "../../domain/entities/ft-relatorio.entity.js";

type FtListaPresenca = {
  edital: FtEdital;
  periodo: FtRelatorioPeriodo;
  mes: string;
  bolsistas: FtRelatorioBolsista[];
};

export class FtListaPresencaCsvFormatter {
  format(relatorio: FtListaPresenca): string {
    const dias = this.daysInPeriod(relatorio.periodo);
    const rows: any[][] = [
      ["Lista de presenca"],
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
        ...dias.map((dia) => this.formatDayHeader(dia)),
        "total_presencas",
        "total_faltas",
      ],
    ];

    for (const item of relatorio.bolsistas) {
      const faltas = new Set(
        item.faltas.map((falta) => this.toDateOnly(falta.data_falta)),
      );
      let totalPresencas = 0;
      let totalFaltas = 0;
      const marcacoes = dias.map((dia) => {
        if (this.isWeekend(dia)) return "";
        if (!this.isDiaTrabalhado(item, dia)) return "";

        if (faltas.has(dia)) {
          totalFaltas += 1;
          return "F";
        }

        totalPresencas += 1;
        return "P";
      });

      rows.push([
        item.bolsista.id,
        item.bolsista.nome,
        item.bolsista.cpf,
        item.bolsista.status,
        ...marcacoes,
        totalPresencas,
        totalFaltas,
      ]);
    }

    return rows.map((row) => row.map((cell) => this.formatCell(cell)).join(";")).join("\n");
  }

  private isDiaTrabalhado(item: FtRelatorioBolsista, dia: string): boolean {
    if (!item.vinculos.length) {
      return true;
    }

    return item.vinculos.some((vinculo) => {
      const inicio = this.toDateOnly(vinculo.data_vinculo);
      const fim = this.getFimOperacional(vinculo);

      return dia >= inicio && (!fim || dia <= fim);
    });
  }

  private getFimOperacional(vinculo: FtRelatorioBolsista["vinculos"][number]) {
    const fim =
      vinculo.canceled_at ||
      vinculo.concluded_at ||
      vinculo.expired_at ||
      vinculo.expire_at;

    return fim ? this.toDateOnly(fim) : null;
  }

  private daysInPeriod(periodo: FtRelatorioPeriodo): string[] {
    const start = new Date(`${periodo.data_inicio}T00:00:00.000Z`);
    const end = new Date(`${periodo.data_fim}T00:00:00.000Z`);
    const days: string[] = [];

    for (
      const current = new Date(start);
      current.getTime() <= end.getTime();
      current.setUTCDate(current.getUTCDate() + 1)
    ) {
      days.push(current.toISOString().slice(0, 10));
    }

    return days;
  }

  private formatDayHeader(value: string): string {
    const [, month, day] = value.split("-");
    return `${day}/${month}`;
  }

  private toDateOnly(value: string | Date): string {
    return value instanceof Date
      ? value.toISOString().slice(0, 10)
      : String(value).slice(0, 10);
  }

  private isWeekend(value: string): boolean {
    const date = new Date(`${value}T00:00:00.000Z`);
    const day = date.getUTCDay();
    return day === 0 || day === 6;
  }

  private formatCell(cell: any): string {
    return cell === undefined || cell === null ? "" : String(cell);
  }
}
