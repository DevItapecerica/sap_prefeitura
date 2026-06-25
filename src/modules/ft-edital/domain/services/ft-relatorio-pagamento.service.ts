import { pagador } from "../../../ft-bolsista/application/utils/pagador.js";

export type FtRelatorioPeriodo = {
  data_inicio: string;
  data_fim: string;
};

export type FtRelatorioBolsistaRow = {
  bco?: string;
  ag?: string;
  dig_ag?: string;
  conta?: string;
  dig_conta?: string;
  nome: string;
  cpf: string;
  local: string;
  vencimento: string;
  dias_uteis: number;
  faltas: number;
  valor_bruto: number;
  desconto: number;
  valor_liquido: number;
};

export type FtRelatorioLocal = {
  local: string;
  rows: FtRelatorioBolsistaRow[];
  total_bolsistas: number;
  total_valor: number;
};

export type FtRelatorioPagamento = {
  edital: any;
  periodo: FtRelatorioPeriodo;
  dias_uteis: number;
  locais: FtRelatorioLocal[];
  total_bolsistas: number;
  total_valor: number;
};

export class FtRelatorioPagamentoService {
  execute(
    bolsistas: any[],
    edital: any,
    periodo: FtRelatorioPeriodo,
  ): FtRelatorioPagamento {
    const editalData = this.toPlain(edital);
    const diasUteis = this.countBusinessDays(
      periodo.data_inicio,
      periodo.data_fim,
    );
    const valorBruto = Number(editalData.valor_bolsa);
    const valorDiario = diasUteis > 0 ? valorBruto / diasUteis : 0;
    const grouped: Record<string, FtRelatorioBolsistaRow[]> = {};

    for (const bolsistaModel of bolsistas) {
      const bolsista = this.toPlain(bolsistaModel);

      if (bolsista.status !== "ativo") continue;

      const local =
        pagador.find((item) => item.id === bolsista.payment_info?.pagador_id)
          ?.name || "SEM LOCAL";
      const faltas = this.countFaltasUteisDistintas(
        bolsista.faltas || [],
        periodo,
      );
      const desconto = Math.min(valorBruto, faltas * valorDiario);
      const valorLiquido = Math.max(0, valorBruto - desconto);

      if (!grouped[local]) {
        grouped[local] = [];
      }

      grouped[local].push({
        bco: bolsista.payment_info?.bco,
        ag: bolsista.payment_info?.ag,
        dig_ag: bolsista.payment_info?.dig_ag,
        conta: bolsista.payment_info?.conta,
        dig_conta: bolsista.payment_info?.dig_conta,
        nome: bolsista.nome,
        cpf: `${bolsista.cpf}`,
        local,
        vencimento: this.toDateOnly(editalData.data_vencimento),
        dias_uteis: diasUteis,
        faltas,
        valor_bruto: this.roundCurrency(valorBruto),
        desconto: this.roundCurrency(desconto),
        valor_liquido: this.roundCurrency(valorLiquido),
      });
    }

    const locais = Object.keys(grouped).map((local) => {
      const rows = grouped[local];
      return {
        local,
        rows,
        total_bolsistas: rows.length,
        total_valor: this.roundCurrency(
          rows.reduce((total, row) => total + row.valor_liquido, 0),
        ),
      };
    });

    return {
      edital: editalData,
      periodo,
      dias_uteis: diasUteis,
      locais,
      total_bolsistas: locais.reduce(
        (total, local) => total + local.total_bolsistas,
        0,
      ),
      total_valor: this.roundCurrency(
        locais.reduce((total, local) => total + local.total_valor, 0),
      ),
    };
  }

  countBusinessDays(dataInicio: string, dataFim: string): number {
    const start = this.parseDateOnly(dataInicio);
    const end = this.parseDateOnly(dataFim);
    let total = 0;

    for (
      const current = new Date(start);
      current.getTime() <= end.getTime();
      current.setUTCDate(current.getUTCDate() + 1)
    ) {
      if (this.isBusinessDay(current)) {
        total += 1;
      }
    }

    return total;
  }

  private countFaltasUteisDistintas(
    faltas: any[],
    periodo: FtRelatorioPeriodo,
  ): number {
    const uniqueDates = new Set<string>();

    for (const faltaModel of faltas) {
      const falta = this.toPlain(faltaModel);
      const dataFalta = this.toDateOnly(falta.data_falta);

      if (
        dataFalta < periodo.data_inicio ||
        dataFalta > periodo.data_fim ||
        !this.isBusinessDay(this.parseDateOnly(dataFalta))
      ) {
        continue;
      }

      uniqueDates.add(dataFalta);
    }

    return uniqueDates.size;
  }

  private isBusinessDay(date: Date): boolean {
    const day = date.getUTCDay();
    return day !== 0 && day !== 6;
  }

  private parseDateOnly(value: string): Date {
    return new Date(`${value}T00:00:00.000Z`);
  }

  private toDateOnly(value: any): string {
    return new Date(value).toISOString().split("T")[0];
  }

  private toPlain(data: any) {
    return data?.toJSON ? data.toJSON() : data;
  }

  private roundCurrency(value: number): number {
    return Math.round((value + Number.EPSILON) * 100) / 100;
  }
}
