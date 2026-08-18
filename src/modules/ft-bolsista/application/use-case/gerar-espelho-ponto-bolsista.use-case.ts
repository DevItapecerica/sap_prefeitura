import { FtBolsistaRepository } from "../../domain/repositories/ft-bolsista.repository.js";
import RenderEspelhoPontoPdfUseCase from "../../../espelho-ponto/application/use-case/render-espelho-ponto-pdf.use-case.js";
import { ftError } from "../utils/ft-error.js";

type PdfGateway = Pick<RenderEspelhoPontoPdfUseCase, "execute">;

export class GerarEspelhoPontoBolsistaUseCase {
  constructor(
    private readonly repository: FtBolsistaRepository,
    private readonly pdfGateway: PdfGateway,
  ) {}

  async execute(bolsistaId: string, editalId: string, mes: string) {
    const periodo = this.parseMonth(mes);
    const bolsista = await this.repository.findById(bolsistaId);
    if (!bolsista) throw ftError(404, "Bolsista not found");

    const edital = await this.repository.findEditalById(editalId);
    if (!edital) throw ftError(404, "Edital not found");

    const vinculo = await this.repository.findVinculo(bolsistaId, editalId);
    if (!vinculo) throw ftError(404, "Vinculo entre bolsista e edital nao encontrado");

    const link = this.plain(vinculo);
    const inicioVinculo = this.dateOnly(link.data_vinculo);
    const fimVinculo = this.dateOnly(
      link.canceled_at || link.concluded_at || link.expired_at || link.expire_at,
    );
    if (inicioVinculo > periodo.fim || (fimVinculo && fimVinculo < periodo.inicio)) {
      throw ftError(409, "O vinculo nao abrange o mes selecionado");
    }

    const faltas = await this.repository.findFaltasByBolsistaPeriodo(
      bolsistaId, editalId, periodo.inicio, periodo.fim,
    );
    const faltasPorDia = new Map<string, string[]>();
    for (const row of faltas) {
      const falta = this.plain(row);
      const day = this.dateOnly(falta.data_falta);
      if (!day) continue;
      const notes = faltasPorDia.get(day) ?? [];
      if (falta.observacao) notes.push(String(falta.observacao));
      faltasPorDia.set(day, notes);
    }

    const person = this.plain(bolsista);
    const notice = this.plain(edital);
    const days = this.days(periodo.inicio, periodo.fim).map((data) => {
      const weekday = new Date(`${data}T00:00:00.000Z`).getUTCDay();
      const inLink = data >= inicioVinculo && (!fimVinculo || data <= fimVinculo);
      const hasAbsence = faltasPorDia.has(data);
      const situacao = !inLink ? "Fora do vínculo" : weekday === 0 ? "DSR" : weekday === 6 ? "Folga" : hasAbsence ? "Falta" : "Normal";
      return {
        data,
        situacao,
        horarioPrevisto: inLink && weekday > 0 && weekday < 6 ? "07:00 16:00" : "",
        marcacoes: [] as string[],
        apontamentos: hasAbsence ? faltasPorDia.get(data)! : [],
      };
    });

    const address = [person.logradouro, person.numero, person.bairro, person.cidade, person.uf]
      .filter(Boolean).join(", ");
    return this.pdfGateway.execute({
      name: `espelho-ponto-${person.nome || bolsistaId}-${mes}`,
      servidor: {
        matricula: String(person.id || bolsistaId), nome: String(person.nome || ""),
        cargo: "Bolsista", unidade: String(person.local || ""),
        horario: "07:00 16:00", localTrabalho: String(person.local || ""), endereco: address,
      },
      periodo: { referencia: `${mes.slice(5, 7)}/${mes.slice(0, 4)}`, inicio: periodo.inicio, fim: periodo.fim },
      dias: days,
      totais: { horaExtra50: "00:00", horaExtra100: "00:00", adicionalNoturno: "00:00", atrasoSaidaAntecipada: "00:00", faltas: String(faltasPorDia.size) },
      observacoes: `Edital: ${notice.name || editalId}`,
    });
  }

  private parseMonth(value: string) {
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(value || "")) throw ftError(400, "Mes invalido");
    const [year, month] = value.split("-").map(Number);
    const last = new Date(Date.UTC(year!, month!, 0)).getUTCDate();
    return { inicio: `${value}-01`, fim: `${value}-${String(last).padStart(2, "0")}` };
  }

  private days(start: string, end: string) {
    const result: string[] = [];
    for (const date = new Date(`${start}T00:00:00.000Z`); date <= new Date(`${end}T00:00:00.000Z`); date.setUTCDate(date.getUTCDate() + 1)) result.push(date.toISOString().slice(0, 10));
    return result;
  }

  private dateOnly(value?: string | Date | null): string {
    if (!value) return "";
    return value instanceof Date ? value.toISOString().slice(0, 10) : String(value).slice(0, 10);
  }

  private plain(value: any): any { return value?.toJSON?.() ?? value ?? {}; }
}
