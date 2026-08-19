import { pagador } from "../../../ft-bolsista/application/utils/pagador.js";
import { FtEdital } from "../../../ft-edital/domain/entity/FtEdital.js";
import { FtRelatorioPeriodo } from "../../application/dto/ft-relatorio.dto.js";
import {
  FtRelatorioBolsista,
  FtRelatorioVinculo,
} from "../entities/ft-relatorio.entity.js";

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
  edital: FtEdital;
  periodo: FtRelatorioPeriodo;
  dias_uteis: number;
  locais: FtRelatorioLocal[];
  total_bolsistas: number;
  total_valor: number;
};

export class FtRelatorioPagamentoService {
  execute(
    bolsistas: FtRelatorioBolsista[],
    edital: FtEdital,
    periodo: FtRelatorioPeriodo,
  ): FtRelatorioPagamento {
    const diasUteis = this.countBusinessDays(
      periodo.data_inicio,
      periodo.data_fim,
    );
    const valorBruto = Number(edital.valor_bolsa);
    const valorDiario = diasUteis > 0 ? valorBruto / diasUteis : 0;
    const grouped: Record<string, FtRelatorioBolsistaRow[]> = {};

    for (const relatorioBolsista of bolsistas) {
      const { bolsista, faltas: bolsistaFaltas } = relatorioBolsista;

      const local =
        pagador.find((item) => item.id === bolsista.payment_info?.pagador_id)
          ?.name || "SEM LOCAL";
      const diasTrabalhados = this.countDiasUteisTrabalhados(
        relatorioBolsista,
        periodo,
      );
      const faltas = this.countFaltasUteisDistintas(
        relatorioBolsista,
        bolsistaFaltas,
        periodo,
      );
      const diasSemVinculo = Math.max(0, diasUteis - diasTrabalhados);
      // As faltas permanecem informativas e não compõem o desconto financeiro.
      const desconto = Math.min(valorBruto, diasSemVinculo * valorDiario);
      const valorLiquido = Math.max(0, valorBruto - desconto);

      if (!grouped[local]) {
        grouped[local] = [];
      }

      grouped[local].push({
        bco: bolsista.payment_info?.bco ?? undefined,
        ag: bolsista.payment_info?.ag ?? undefined,
        dig_ag: bolsista.payment_info?.dig_ag ?? undefined,
        conta: bolsista.payment_info?.conta ?? undefined,
        dig_conta: bolsista.payment_info?.dig_conta ?? undefined,
        nome: bolsista.nome,
        cpf: `${bolsista.cpf}`,
        local,
        vencimento: this.toDateOnly(edital.data_vencimento),
        dias_uteis: diasTrabalhados,
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
      edital,
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
    relatorioBolsista: FtRelatorioBolsista,
    faltas: Array<{ data_falta: string | Date }>,
    periodo: FtRelatorioPeriodo,
  ): number {
    const uniqueDates = new Set<string>();

    for (const falta of faltas) {
      const dataFalta = this.toDateOnly(falta.data_falta);

      if (
        dataFalta < periodo.data_inicio ||
        dataFalta > periodo.data_fim ||
        !this.isBusinessDay(this.parseDateOnly(dataFalta)) ||
        !this.isDiaTrabalhado(relatorioBolsista, dataFalta)
      ) {
        continue;
      }

      uniqueDates.add(dataFalta);
    }

    return uniqueDates.size;
  }

  private countDiasUteisTrabalhados(
    relatorioBolsista: FtRelatorioBolsista,
    periodo: FtRelatorioPeriodo,
  ): number {
    const start = this.parseDateOnly(periodo.data_inicio);
    const end = this.parseDateOnly(periodo.data_fim);
    let total = 0;

    for (
      const current = new Date(start);
      current.getTime() <= end.getTime();
      current.setUTCDate(current.getUTCDate() + 1)
    ) {
      const data = current.toISOString().slice(0, 10);

      if (
        this.isBusinessDay(current) &&
        this.isDiaTrabalhado(relatorioBolsista, data)
      ) {
        total += 1;
      }
    }

    return total;
  }

  private isDiaTrabalhado(
    relatorioBolsista: FtRelatorioBolsista,
    data: string,
  ): boolean {
    if (!relatorioBolsista.vinculos.length) {
      return true;
    }

    return relatorioBolsista.vinculos.some((vinculo) =>
      this.isDentroDoVinculo(data, vinculo),
    );
  }

  private isDentroDoVinculo(
    data: string,
    vinculo: FtRelatorioVinculo,
  ): boolean {
    const inicio = this.toDateOnly(vinculo.data_vinculo);
    const fim = this.getFimOperacional(vinculo);

    return data >= inicio && (!fim || data <= fim);
  }

  private getFimOperacional(vinculo: FtRelatorioVinculo): string | null {
    const fim =
      vinculo.canceled_at ||
      vinculo.concluded_at ||
      vinculo.expired_at ||
      vinculo.expire_at;

    return fim ? this.toDateOnly(fim) : null;
  }

  private isBusinessDay(date: Date): boolean {
    const day = date.getUTCDay();
    return day !== 0 && day !== 6;
  }

  private parseDateOnly(value: string): Date {
    return new Date(`${value}T00:00:00.000Z`);
  }

  private toDateOnly(value: string | Date): string {
    return value instanceof Date
      ? value.toISOString().slice(0, 10)
      : String(value).slice(0, 10);
  }

  private roundCurrency(value: number): number {
    return Math.round((value + Number.EPSILON) * 100) / 100;
  }
}
