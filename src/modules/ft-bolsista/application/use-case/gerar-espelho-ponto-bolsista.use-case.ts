import { mapPeaadRuleError } from "../utils/map-peaad-rule-error.js";
import { FtBolsistaRepository } from "../../domain/repositories/ft-bolsista.repository.js";
import RenderEspelhoPontoPdfUseCase from "../../../espelho-ponto/application/use-case/render-espelho-ponto-pdf.use-case.js";
import { ftError } from "../utils/ft-error.js";
import { EspelhoPontoPeriodoPolicy } from "../../domain/services/espelho-ponto-periodo.policy.js";
import type { EspelhoPontoEmissionContext } from "../dto/espelho-ponto-emission.js";
import {
  getVinculoOperationalEnd,
  resolveTurnoSnapshot,
  selectVinculosForPeriod,
} from "../../../ft-edital/domain/services/ft-vinculo-period.service.js";

type PdfGateway = Pick<RenderEspelhoPontoPdfUseCase, "execute">;

export class GerarEspelhoPontoBolsistaUseCase {
  constructor(
    private readonly repository: Pick<
      FtBolsistaRepository,
      | "findById"
      | "findEditalById"
      | "findHistoricoByBolsistaId"
      | "findFaltasByBolsistaPeriodo"
    >,
    private readonly pdfGateway: PdfGateway,
    private readonly clock = () => new Date(),
    private readonly period = new EspelhoPontoPeriodoPolicy(),
  ) {}

  async execute(
    bolsistaId: string,
    editalId: string,
    mes: string,
    requestId?: string,
    context?: EspelhoPontoEmissionContext,
  ) {
    try {
      const periodo = this.period.resolve(
        mes,
        context?.referenceDate ?? this.clock(),
      );
      const bolsista = await this.repository.findById(bolsistaId);
      if (!bolsista) throw ftError(404, "Bolsista not found");

      const edital = await this.repository.findEditalById(editalId);
      if (!edital) throw ftError(404, "Edital not found");

      const vinculos = (
        await this.repository.findHistoricoByBolsistaId(bolsistaId)
      )
        .map((item: any) => this.plain(item))
        .filter((item: any) => String(item.edital_id) === editalId);
      if (!vinculos.length)
        throw ftError(404, "Vinculo entre bolsista e edital nao encontrado");
      const vigentes = selectVinculosForPeriod(vinculos, {
        inicio: periodo.inicio,
        fim: periodo.fim,
      });
      if (!vigentes.length)
        throw ftError(409, "Vinculo nao vigente no mes informado");
      if (vigentes.length > 1)
        throw ftError(
          409,
          "Existem multiplos vinculos vigentes no mes informado",
        );
      const vinculo = vigentes[0];

      const link = this.plain(vinculo);
      const turno = resolveTurnoSnapshot(link);
      const horarioTurno = this.horarioTurno(turno);
      const inicioVinculo = this.dateOnly(link.data_vinculo);
      const fimVinculo = getVinculoOperationalEnd(link);

      const faltas = await this.repository.findFaltasByBolsistaPeriodo(
        bolsistaId,
        editalId,
        periodo.inicio,
        periodo.fim,
      );
      const faltasPorDia = new Map<string, string[]>();
      for (const row of faltas) {
        const falta = this.plain(row);
        const day = this.dateOnly(falta.data_falta);
        if (!day || day < periodo.inicio || day > periodo.fim) continue;
        const notes = faltasPorDia.get(day) ?? [];
        if (falta.observacao) notes.push(String(falta.observacao));
        faltasPorDia.set(day, notes);
      }

      const person = this.plain(bolsista);
      const municipe = this.plain(person.municipe);
      const notice = this.plain(edital);
      const days = this.days(periodo.inicio, periodo.fimMes).map((data) => {
        const futuro = data > periodo.fim;
        const weekday = new Date(`${data}T00:00:00.000Z`).getUTCDay();
        const inLink =
          data >= inicioVinculo && (!fimVinculo || data <= fimVinculo);
        const hasAbsence = faltasPorDia.has(data);
        const situacao = futuro
          ? "Dia futuro"
          : !inLink
            ? "Fora do vínculo"
            : weekday === 0
              ? "DSR"
              : weekday === 6
                ? "Folga"
                : hasAbsence
                  ? "Falta"
                  : "Normal";
        return {
          data,
          situacao,
          horarioPrevisto:
            !futuro && inLink && weekday > 0 && weekday < 6 && turno.hora_inicio
              ? horarioTurno
              : "",
          marcacoes: [] as string[],
          apontamentos: !futuro && hasAbsence ? faltasPorDia.get(data)! : [],
        };
      });

      const address = [
        municipe.rua,
        municipe.numero,
        municipe.bairro,
        municipe.cidade,
        municipe.uf,
      ]
        .filter(Boolean)
        .join(", ");
      return await this.pdfGateway.execute(
        {
          name: `espelho-ponto-${municipe.nome || bolsistaId}-${mes}`,
          servidor: {
            matricula: String(person.id || bolsistaId),
            nome: String(municipe.nome || ""),
            cargo: "Bolsista",
            unidade: String(link.local || ""),
            horario: horarioTurno,
            localTrabalho: String(link.local || ""),
            endereco: address,
          },
          periodo: {
            referencia: `${mes.slice(5, 7)}/${mes.slice(0, 4)}`,
            inicio: periodo.inicio,
            fim: periodo.fim,
          },
          dias: days,
          totais: {
            horaExtra50: "00:00",
            horaExtra100: "00:00",
            adicionalNoturno: "00:00",
            atrasoSaidaAntecipada: "00:00",
            faltas: String(faltasPorDia.size),
          },
          observacoes: `Edital: ${notice.name || editalId}${periodo.fim < periodo.fimMes ? `\nApurado até ${periodo.fim.split("-").reverse().join("/")} (Brasília). Datas posteriores: Dia futuro.` : ""}`,
        },
        requestId,
      );
    } catch (error) {
      throw mapPeaadRuleError(error);
    }
  }

  private days(start: string, end: string) {
    const result: string[] = [];
    for (
      const date = new Date(`${start}T00:00:00.000Z`);
      date <= new Date(`${end}T00:00:00.000Z`);
      date.setUTCDate(date.getUTCDate() + 1)
    )
      result.push(date.toISOString().slice(0, 10));
    return result;
  }

  private dateOnly(value?: string | Date | null): string {
    if (!value) return "";
    return value instanceof Date
      ? value.toISOString().slice(0, 10)
      : String(value).slice(0, 10);
  }

  private plain(value: any): any {
    return value?.toJSON?.() ?? value ?? {};
  }

  private horarioTurno(turno: any): string {
    const data = this.plain(turno);
    if (!data.hora_inicio || !data.hora_fim) return "Não informado";
    return `${String(data.hora_inicio).slice(0, 5)} ${String(data.hora_fim).slice(0, 5)}`;
  }
}
