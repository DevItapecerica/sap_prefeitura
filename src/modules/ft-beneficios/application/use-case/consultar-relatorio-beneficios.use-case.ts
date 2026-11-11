import type {
  BenefitReader,
  BenefitQuery,
} from "../../domain/beneficios.contracts.js";
import { businessDate } from "../../../ft-edital/domain/services/edital-workflow.policy.js";
import { BeneficiosPolicy } from "../../domain/beneficios.policy.js";
import { BeneficiosMapper } from "../mapper/beneficios.mapper.js";
import {
  executeBenefitOperation,
  requiredProgram,
} from "../utils/beneficios-errors.js";

export class ConsultarRelatorioBeneficiosUseCase {
  constructor(
    private readonly repository: BenefitReader,
    private readonly policy: BeneficiosPolicy,
    private readonly mapper: BeneficiosMapper,
    private readonly clock: () => Date = () => new Date(),
  ) {}
  async execute(id: string, query: BenefitQuery = {}) {
    const result = await this.complete(id, query);
    const limit = Math.min(50, Math.max(1, Number(query.limit) || 20)),
      offset = Math.max(0, Number(query.page) || 0) * limit;
    return { ...result, rows: result.rows.slice(offset, offset + limit) };
  }
  complete(id: string, query: BenefitQuery = {}) {
    return executeBenefitOperation(async () => {
      const edital = requiredProgram(await this.repository.edital(id)),
        now = this.clock();
      const month = this.policy.month(
        query.mes || this.policy.currentMonth(now),
        now,
      );
      const source = await this.repository.reportSource(
        edital,
        month,
        businessDate(now),
      );
      const identities = new Set(
        source.participacoes
          .filter((p) => this.policy.workedInMonth(p, edital, month, now))
          .map((p) => p.pessoa_id),
      );
      const search = query.search?.trim().toLocaleLowerCase("pt-BR") || "";
      const persons = await Promise.all(
        source.pessoas.map((person) => this.mapper.person(person)),
      );
      const rows = persons
        .filter(
          (person) =>
            identities.has(person.id) &&
            (!search ||
              person.nome.toLocaleLowerCase("pt-BR").includes(search) ||
              (/^\d{11}$/.test(search.replace(/\D/g, "")) &&
                person.cpf.replace(/\D/g, "") === search.replace(/\D/g, ""))),
        )
        .flatMap((person) =>
          source.beneficios
            .filter(
              (benefit) =>
                !query.beneficio_id || benefit.id === query.beneficio_id,
            )
            .map((benefit) => {
              const delivery = source.entregas.find(
                (row) =>
                  row.pessoa_id === person.id &&
                  !row.estornado_em &&
                  row.itens.some((item) => item.id === benefit.id),
              );
              return {
                pessoa_id: person.id,
                nome: person.nome,
                cpf: person.cpf,
                beneficio_id: benefit.id,
                beneficio:
                  delivery?.itens.find((item) => item.id === benefit.id)
                    ?.nome || benefit.nome,
                mes: month,
                situacao: delivery ? "retirado" : "pendente",
                entregue_em: delivery?.entregue_em || null,
                responsavel: delivery?.responsavel || null,
              };
            }),
        );
      const filtered = rows.filter(
        (row) =>
          !query.situacao ||
          query.situacao === "todos" ||
          row.situacao ===
            (query.situacao === "retirados" ? "retirado" : "pendente"),
      );
      return {
        rows: filtered,
        count: filtered.length,
        mes: month,
        totais: {
          previstos: rows.length,
          retirados: rows.filter((row) => row.situacao === "retirado").length,
          pendentes: rows.filter((row) => row.situacao === "pendente").length,
        },
        beneficios: source.beneficios,
      };
    });
  }
}
