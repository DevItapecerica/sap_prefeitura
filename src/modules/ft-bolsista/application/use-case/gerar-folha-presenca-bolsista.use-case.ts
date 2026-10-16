import { FtBolsistaRepository } from "../../domain/repositories/ft-bolsista.repository.js";
import RenderFolhaPresencaPdfUseCase from "../../../espelho-ponto/application/use-case/render-folha-presenca-pdf.use-case.js";
import { ftError } from "../utils/ft-error.js";
import {
  getVinculoOperationalEnd,
  resolveTurnoSnapshot,
  selectVinculosForPeriod,
} from "../../../ft-edital/domain/services/ft-vinculo-period.service.js";

type PdfGateway = Pick<RenderFolhaPresencaPdfUseCase, "execute">;

export class GerarFolhaPresencaBolsistaUseCase {
  constructor(
    private readonly repository: FtBolsistaRepository,
    private readonly pdfGateway: PdfGateway,
  ) {}

  async execute(
    bolsistaId: string,
    editalId: string,
    mes: string,
    requestId?: string,
  ) {
    const periodo = this.parseMonth(mes);
    const bolsista = await this.repository.findById(bolsistaId);
    if (!bolsista) throw ftError(404, "Bolsista not found");

    const edital = await this.repository.findEditalById(editalId);
    if (!edital) throw ftError(404, "Edital not found");

    const vinculos =
      await this.repository.findHistoricoByBolsistaId(bolsistaId);
    const vigentes = selectVinculosForPeriod(
      vinculos.filter(
        (item: any) =>
          String(item.get?.("edital_id") ?? item.edital_id) === editalId,
      ),
      { inicio: periodo.inicio, fim: periodo.fim },
    );
    if (!vigentes.length)
      throw ftError(409, "O vinculo nao abrange o mes selecionado");
    if (vigentes.length > 1)
      throw ftError(
        409,
        "Existem multiplos vinculos vigentes no mes informado",
      );
    const vinculo = vigentes[0];

    const person = this.plain(bolsista);
    const municipe = this.plain(person.municipe);
    const address = [
      municipe.rua,
      municipe.numero,
      municipe.bairro,
      municipe.cidade,
      municipe.uf,
    ]
      .filter(Boolean)
      .join(", ");

    return this.pdfGateway.execute(
      {
        name: `folha-presenca-${municipe.nome || bolsistaId}-${mes}`,
        servidor: {
          matricula: String(person.id || bolsistaId),
          nome: String(municipe.nome || ""),
          cargo: "Bolsista",
          unidade: String(vinculo.local || ""),
          horario: this.horarioTurno(resolveTurnoSnapshot(vinculo)),
          localTrabalho: String(vinculo.local || ""),
          endereco: address,
        },
        periodo: {
          referencia: `${mes.slice(5, 7)}/${mes.slice(0, 4)}`,
          inicio: periodo.inicio,
          fim: periodo.fim,
        },
        dias: this.days(
          periodo.inicio,
          periodo.fim,
          this.dateOnly(vinculo.data_vinculo),
          this.endDate(vinculo),
        ),
        observacoes: "",
      },
      requestId,
    );
  }

  private parseMonth(value: string) {
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(value || ""))
      throw ftError(400, "Mes invalido");
    const [year, month] = value.split("-").map(Number);
    const last = new Date(Date.UTC(year!, month!, 0)).getUTCDate();
    return {
      inicio: `${value}-01`,
      fim: `${value}-${String(last).padStart(2, "0")}`,
    };
  }

  private days(start: string, end: string, linkStart: string, linkEnd: string) {
    const result: Array<{ data: string; situacao: string }> = [];
    for (
      const date = new Date(`${start}T00:00:00.000Z`);
      date <= new Date(`${end}T00:00:00.000Z`);
      date.setUTCDate(date.getUTCDate() + 1)
    ) {
      const data = date.toISOString().slice(0, 10);
      const inLink = data >= linkStart && (!linkEnd || data <= linkEnd);
      const weekday = date.getUTCDay();
      const situacao = !inLink
        ? "Fora do vínculo"
        : weekday === 0
          ? "DSR"
          : weekday === 6
            ? "Folga"
            : "Normal";
      result.push({ data, situacao });
    }
    return result;
  }

  private endDate(link: any): string {
    return getVinculoOperationalEnd(link);
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
