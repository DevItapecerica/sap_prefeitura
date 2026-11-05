import type { TransactionalAuditFactory } from "./transactional-audit.js";
import { Op, Transaction } from "sequelize";
import { createHash } from "node:crypto";
import type { DbObject } from "../../../../core/types/DbTypes.js";
import type { AuditCommand } from "../../../../modules/audit/domain/entity/audit-command.js";
import type { AuditService } from "../../../../modules/audit/application/use-case/audit.service.js";
import type {
  WorkflowReader,
  WorkflowTransaction,
  WorkflowUnitOfWork,
  Program,
  Participation,
  Registration,
  Person,
  ParticipantIdentity,
  Config,
  ConfigKind,
  ConfigInput,
  RecordKind,
  DatedRecord,
  BankData,
  WorkflowEvent,
  WorkflowQuery,
  OccupationFilter,
  PeopleSource,
  HistorySource,
  Page,
} from "../../../../modules/ft-edital/domain/repositories/workflow.repository.js";
const plain = (row: any) => row?.toJSON?.() ?? row;
const occupied = ["convocado", "ativo"];
const models = {
  pagadores: "Pagador",
  turnos: "Turno",
  locais: "FtEditalLocal",
  beneficios: "FtEditalBeneficio",
} as const;
const pagination = (q: WorkflowQuery = {}) => {
  const limit = Math.min(50, Math.max(1, Number(q.limit) || 20));
  return { limit, offset: Math.max(0, Number(q.page) || 0) * limit };
};
const lifecycle = [
  "inscrever",
  "inscrever_excecao",
  "convocar",
  "convocar_excecao",
  "ativar",
  "alocar",
  "prorrogar",
  "cancelar",
  "concluir",
  "expirar",
];
export class SequelizeWorkflowRepository implements WorkflowTransaction {
  constructor(
    private db: DbObject,
    private transaction?: Transaction,
    private audit?: Pick<AuditService, "record">,
  ) {}
  async recordAudit(input: AuditCommand) {
    if (!this.audit) throw new Error("Workflow audit adapter not configured");
    await this.audit.record(input);
  }
  private scope(lock = false) {
    return {
      transaction: this.transaction,
      ...(lock && this.transaction
        ? { lock: this.transaction.LOCK.UPDATE }
        : {}),
    };
  }
  async edital(id: string): Promise<Program | null> {
    return plain(await this.db.Edital.findByPk(id, this.scope(true)));
  }
  async listEditais(query: WorkflowQuery, now: Date): Promise<Page<Program>> {
    const where: any = {};
    if (query.search)
      where.name = {
        [Op.like]: "%" + query.search.trim().replace(/[\\%_]/g, "\\$&") + "%",
      };
    if (query.fase) where.fase = query.fase;
    if (
      query.inscricoes_abertas === true ||
      query.inscricoes_abertas === "true"
    )
      where[Op.and] = {
        fase: "aberto",
        inscricoes_inicio: { [Op.lte]: now },
        inscricoes_fim: { [Op.gte]: now },
        data_vencimento: {
          [Op.gte]:
            new Intl.DateTimeFormat("en-CA", {
              timeZone: "America/Sao_Paulo",
              year: "numeric",
              month: "2-digit",
              day: "2-digit",
            }).format(now) + "T00:00:00-03:00",
        },
      };
    const result = await this.db.Edital.findAndCountAll({
      ...pagination(query),
      order: [
        ["createdAt", "DESC"],
        ["id", "DESC"],
      ],
      where,
    });
    return { rows: result.rows.map(plain), count: result.count };
  }
  private occupationWhere(filter: OccupationFilter) {
    return {
      edital_id: filter.editalId,
      status: filter.status || occupied,
      ...(filter.pagadorId ? { pagador_id: filter.pagadorId } : {}),
      ...(filter.turnoId ? { turno_id: filter.turnoId } : {}),
      ...(filter.localId ? { local_id: filter.localId } : {}),
      ...(filter.excludeId ? { id: { [Op.ne]: filter.excludeId } } : {}),
    };
  }
  countOccupations(filter: OccupationFilter): Promise<number> {
    return this.db.BolsistasEdital.count({
      where: this.occupationWhere(filter),
      ...this.scope(),
    });
  }
  async hasClosedPayroll(editalId: string) {
    return Boolean(
      await this.db.FtFolhaFechamento.count({
        where: { edital_id: editalId },
        ...this.scope(),
      }),
    );
  }
  async firstClosedMonth(editalId: string, start: string, end: string) {
    if (!start || !end || start > end) return null;
    const row = await this.db.FtFolhaFechamento.findOne({
      where: {
        edital_id: editalId,
        mes: { [Op.between]: [start.slice(0, 7), end.slice(0, 7)] },
      },
      attributes: ["mes"],
      order: [["mes", "ASC"]],
      ...this.scope(),
    });
    return row ? String(row.mes) : null;
  }
  async configs(
    id: string,
    kind: ConfigKind,
    query: WorkflowQuery,
  ): Promise<Page<Config>> {
    const result = await this.db[models[kind]].findAndCountAll({
      where: {
        edital_id: id,
        ...(query.search
          ? { nome: { [Op.like]: "%" + query.search.trim() + "%" } }
          : {}),
      },
      ...pagination(query),
      order: [["nome", "ASC"]],
      ...this.scope(),
    });
    return { rows: result.rows.map(plain), count: result.count };
  }
  async config(
    id: string,
    kind: ConfigKind,
    itemId: string,
  ): Promise<Config | null> {
    return plain(
      await this.db[models[kind]].findOne({
        where: {
          [kind === "pagadores" || kind === "turnos" ? "uuid" : "id"]: itemId,
          edital_id: id,
        },
        ...this.scope(true),
      }),
    );
  }
  async person(id: string): Promise<Person | null> {
    return plain(await this.db.MunicipeModel.findByPk(id, this.scope()));
  }
  async lockPerson(id: string): Promise<Person | null> {
    return plain(await this.db.MunicipeModel.findByPk(id, this.scope(true)));
  }
  async identity(id: string): Promise<ParticipantIdentity | null> {
    return plain(await this.db.Bolsistas.findByPk(id, this.scope()));
  }
  async identityForPerson(id: string): Promise<ParticipantIdentity | null> {
    return plain(
      await this.db.Bolsistas.findOne({
        where: { municipe_uuid: id },
        ...this.scope(),
      }),
    );
  }
  async registration(
    id: string,
    registrationId: string,
  ): Promise<Registration | null> {
    return plain(
      await this.db.FtInscricao.findOne({
        where: { id: registrationId, edital_id: id },
        ...this.scope(),
      }),
    );
  }
  async registrationForIdentity(
    id: string,
    identityId: string,
  ): Promise<Registration | null> {
    return plain(
      await this.db.FtInscricao.findOne({
        where: { edital_id: id, bolsista_id: identityId },
        paranoid: false,
        ...this.scope(),
      }),
    );
  }
  async participation(
    id: string,
    participationId: string,
  ): Promise<Participation | null> {
    return plain(
      await this.db.BolsistasEdital.findOne({
        where: { id: participationId, edital_id: id },
        ...this.scope(),
      }),
    );
  }
  async lockRegistration(id: string): Promise<Registration> {
    return plain(await this.db.FtInscricao.findByPk(id, this.scope(true)));
  }
  async lockParticipation(id: string): Promise<Participation> {
    return plain(await this.db.BolsistasEdital.findByPk(id, this.scope(true)));
  }
  async identityHistory(
    id: string,
    excludeId?: string,
  ): Promise<Participation[]> {
    return (
      await this.db.BolsistasEdital.findAll({
        where: {
          bolsista_id: id,
          ...(excludeId ? { id: { [Op.ne]: excludeId } } : {}),
        },
        paranoid: false,
        ...this.scope(),
      })
    ).map(plain);
  }
  async occupations(editalId: string): Promise<Participation[]> {
    return (
      await this.db.BolsistasEdital.findAll({
        where: { edital_id: editalId, status: occupied },
        ...this.scope(),
      })
    ).map(plain);
  }
  async records(
    id: string,
    participationId: string,
    kind: RecordKind,
    query: WorkflowQuery,
  ): Promise<Page<DatedRecord>> {
    const result = await this.db[
      kind === "faltas" ? "BolsistaFalta" : "BolsistaOcorrencia"
    ].findAndCountAll({
      where: { bolsista_edital_id: participationId },
      ...pagination(query),
      order: [["createdAt", "DESC"]],
      ...this.scope(),
    });
    return { rows: result.rows.map(plain), count: result.count };
  }
  async datedRecord(
    participationId: string,
    kind: RecordKind,
    id: string,
  ): Promise<DatedRecord | null> {
    return plain(
      await this.db[
        kind === "faltas" ? "BolsistaFalta" : "BolsistaOcorrencia"
      ].findOne({
        where: { id, bolsista_edital_id: participationId },
        ...this.scope(),
      }),
    );
  }
  async hasAbsence(participationId: string, date: string) {
    return Boolean(
      await this.db.BolsistaFalta.count({
        where: { bolsista_edital_id: participationId, data_falta: date },
        ...this.scope(),
      }),
    );
  }
  async createEdital(input: Omit<Program, "id">): Promise<Program> {
    return plain(await this.db.Edital.create(input, this.scope()));
  }
  async updateEdital(id: string, input: Partial<Program>): Promise<Program> {
    const row = await this.db.Edital.findByPk(id, this.scope());
    return plain(await row.update(input, this.scope()));
  }
  async updateParticipation(
    id: string,
    input: Partial<Participation>,
  ): Promise<Participation> {
    const row = await this.db.BolsistasEdital.findByPk(id, this.scope());
    return plain(await row.update(input, this.scope()));
  }
  async closeOccupations(id: string, now: Date) {
    await this.db.BolsistasEdital.update(
      { status: "cancelado", canceled_at: now, observacao: "Edital encerrado" },
      { where: { edital_id: id, status: "convocado" }, ...this.scope() },
    );
    await this.db.BolsistasEdital.update(
      { status: "concluido", concluded_at: now },
      { where: { edital_id: id, status: "ativo" }, ...this.scope() },
    );
  }
  async saveConfig(
    edital_id: string,
    kind: ConfigKind,
    id: string | undefined,
    input: ConfigInput | null,
  ): Promise<Config> {
    const Model = this.db[models[kind]],
      pk = ["pagadores", "turnos"].includes(kind) ? "uuid" : "id";
    const row = id
      ? await Model.findOne({
          where: { [pk]: id, edital_id },
          ...this.scope(true),
        })
      : null;
    if (row && !input) {
      await row.destroy(this.scope());
      return plain(row);
    }
    return plain(
      row
        ? await row.update(input, this.scope())
        : await Model.create({ ...input, edital_id }, this.scope()),
    );
  }
  async ensureIdentity(id: string): Promise<ParticipantIdentity> {
    const [row] = await this.db.Bolsistas.findOrCreate({
      where: { municipe_uuid: id },
      defaults: { municipe_uuid: id },
      ...this.scope(),
    });
    return plain(row);
  }
  async createRegistration(
    input: Omit<Registration, "id" | "status">,
  ): Promise<Registration> {
    return plain(await this.db.FtInscricao.create(input, this.scope()));
  }
  async createParticipation(
    input: Omit<Participation, "id">,
  ): Promise<Participation> {
    return plain(await this.db.BolsistasEdital.create(input, this.scope()));
  }
  async saveBankData(bolsista_id: string, input: BankData) {
    const [row] = await this.db.PaymentInfo.findOrCreate({
      where: { bolsista_id },
      defaults: { ...input, bolsista_id },
      ...this.scope(),
    });
    await row.update(input, this.scope());
  }
  async addEvent(input: Omit<WorkflowEvent, "id" | "createdAt">) {
    await this.db.FtWorkflowEvento.create(input, this.scope());
  }
  async createDatedRecord(kind: RecordKind, input: Omit<DatedRecord, "id">) {
    await this.db[
      kind === "faltas" ? "BolsistaFalta" : "BolsistaOcorrencia"
    ].create(input, this.scope());
  }
  async deleteDatedRecord(kind: RecordKind, id: string) {
    const row = await this.db[
      kind === "faltas" ? "BolsistaFalta" : "BolsistaOcorrencia"
    ].findByPk(id, this.scope());
    await row.destroy(this.scope());
  }
  private searchFilter(search: string) {
    const digits = search.replace(/\D/g, "");
    if (digits.length === 11 && /^[\d.\s-]+$/.test(search)) {
      return {
        "$bolsista.municipe.cpfHash$": createHash("sha256")
          .update(digits)
          .digest("hex"),
      };
    }
    return {
      "$bolsista.municipe.nome$": {
        [Op.like]: "%" + search.replace(/[\\%_]/g, "\\$&") + "%",
      },
    };
  }
  private exceptionFilter(mode: string | undefined, inscriptions: boolean) {
    const registration = inscriptions ? "excecao_em" : "$inscricao.excecao_em$";
    const convocation = inscriptions
      ? "$participacoes.excecao_em$"
      : "excecao_em";
    switch (mode) {
      case "inscricao":
        return { [registration]: { [Op.ne]: null } };
      case "convocacao":
        return { [convocation]: { [Op.ne]: null } };
      case "qualquer":
        return {
          [Op.or]: [
            { [registration]: { [Op.ne]: null } },
            { [convocation]: { [Op.ne]: null } },
          ],
        };
      case "nenhuma":
        return { [registration]: null, [convocation]: null };
      default:
        return undefined;
    }
  }
  private filters(query: WorkflowQuery, inscriptions: boolean) {
    const conditions: any[] = [];
    const search = String(query.search || "").trim();
    if (search) conditions.push(this.searchFilter(search));
    const prefix = inscriptions ? "participacoes." : "";
    for (const field of ["pagador_id", "turno_id"] as const)
      if (query[field])
        conditions.push({
          [inscriptions ? "$" + prefix + field + "$" : field]: query[field],
        });
    if (query.status)
      conditions.push(
        inscriptions
          ? {
              [Op.or]: [
                { "$participacoes.status$": query.status },
                { "$participacoes.id$": null, status: query.status },
              ],
            }
          : { status: query.status },
      );
    if (!inscriptions && query.grupo_status === "encerrados")
      conditions.push({
        status: { [Op.in]: ["concluido", "cancelado", "expirado", "inativo"] },
      });
    const exception = this.exceptionFilter(query.excecao, inscriptions);
    if (exception) conditions.push(exception);
    return conditions.length ? { [Op.and]: conditions } : {};
  }
  async people(
    id: string,
    query: WorkflowQuery,
    inscriptions: boolean,
  ): Promise<Page<PeopleSource>> {
    const e = plain(await this.db.Edital.findByPk(id));
    if (!e) return { rows: [], count: 0 };
    const include: any[] = [
      {
        model: this.db.Bolsistas,
        as: "bolsista",
        paranoid: false,
        required: true,
        include: [
          {
            model: this.db.MunicipeModel,
            as: "municipe",
            paranoid: false,
            required: true,
            attributes: ["uuid", "nome"],
          },
          ...(!inscriptions
            ? [{ model: this.db.PaymentInfo, as: "payment_info" }]
            : []),
        ],
      },
    ];
    if (inscriptions)
      include.push({
        model: this.db.BolsistasEdital,
        as: "participacoes",
        required: false,
        duplicating: false,
        where: { edital_id: id, status: ["convocado", "ativo"] },
      });
    else
      include.push(
        { model: this.db.FtInscricao, as: "inscricao", required: false },
        { model: this.db.Pagador, as: "pagador", paranoid: false },
      );
    const Model = inscriptions ? this.db.FtInscricao : this.db.BolsistasEdital;
    const result = await Model.findAndCountAll({
      where: { edital_id: id, ...this.filters(query, inscriptions) },
      include,
      distinct: true,
      subQuery: false,
      ...pagination(query),
      order: [
        ["createdAt", "DESC"],
        ["id", "DESC"],
      ],
    });
    return { rows: result.rows.map(plain), count: result.count };
  }
  async historySource(
    id: string,
    resource: string,
    inscriptions: boolean,
  ): Promise<HistorySource | null> {
    const row = await (
      inscriptions ? this.db.FtInscricao : this.db.BolsistasEdital
    ).findOne({ where: { id: resource, edital_id: id }, paranoid: false });
    if (!row) return null;
    const registration = inscriptions
      ? row
      : row.inscricao_id
        ? await this.db.FtInscricao.findOne({
            where: { id: row.inscricao_id, edital_id: id },
            paranoid: false,
          })
        : null;
    const participations = registration
      ? await this.db.BolsistasEdital.findAll({
          where: { inscricao_id: registration.id, edital_id: id },
          paranoid: false,
        })
      : [row];
    const ids = [
      ...new Set(
        [registration?.id, ...participations.map((p: any) => p.id)].filter(
          Boolean,
        ),
      ),
    ];
    const events = await this.db.FtWorkflowEvento.findAll({
      where: {
        edital_id: id,
        recurso_id: { [Op.in]: ids },
        acao: { [Op.in]: lifecycle },
      },
      order: [
        ["createdAt", "ASC"],
        ["id", "ASC"],
      ],
    });
    const actors = [
      ...new Set(
        events
          .map((event: any) => String(event.ator_id))
          .filter((actor: string) => /^\d+$/.test(actor)),
      ),
    ];
    const users = actors.length
      ? await this.db.UserModel.findAll({
          where: { id: { [Op.in]: actors } },
          attributes: ["id", "name"],
          paranoid: false,
        })
      : [];
    return {
      registration: plain(registration),
      participations: participations.map(plain),
      events: events.map(plain),
      actors: users.map(plain),
    };
  }
}
export class SequelizeWorkflowUnitOfWork implements WorkflowUnitOfWork {
  readonly read: WorkflowReader;
  constructor(
    private db: DbObject,
    private audit: TransactionalAuditFactory,
  ) {
    this.read = new SequelizeWorkflowRepository(db);
  }
  run<T>(work: (ports: WorkflowTransaction) => Promise<T>) {
    return this.db.sequelize.transaction((transaction) =>
      work(
        new SequelizeWorkflowRepository(
          this.db,
          transaction,
          this.audit(transaction),
        ),
      ),
    );
  }
}
