import { randomUUID } from "node:crypto";
import {
  Model,
  Op,
  Transaction,
  UniqueConstraintError,
  type ModelStatic,
} from "sequelize";
import db from "../index.js";
import type { DbObject } from "../../../../core/types/DbTypes.js";
import type {
  Benefit,
  BenefitDelivery,
  BenefitQuery,
  BenefitParticipationContext,
  BenefitReportSource,
  BenefitTransaction,
  BenefitUnitOfWork,
} from "../../../../modules/ft-beneficios/domain/beneficios.contracts.js";
import { BenefitRuleError } from "../../../../modules/ft-beneficios/domain/beneficios.contracts.js";
import type {
  Program,
  Participation,
} from "../../../../modules/ft-edital/domain/repositories/workflow.repository.js";
import type { AuditCommand } from "../../../../modules/audit/domain/entity/audit-command.js";
import type {
  BenefitDeliveryAttributes,
  BenefitDeliveryModel,
  BenefitItemAttributes,
  BenefitItemModel,
  BenefitCoverageModel,
  BenefitOperationModel,
} from "../models/ft-beneficios.types.js";
import type {
  TransactionalAuditFactory,
  ScopedAuditWriter,
} from "./transactional-audit.js";

type DeliveryProjection = BenefitDeliveryAttributes & {
  itens: BenefitItemAttributes[];
  pessoa?: { nome: string };
};
type ParticipationProjection = Participation & {
  bolsista: {
    municipe_uuid: string;
    municipe: { uuid: string; nome: string; cpf: string };
  };
};

export class SequelizeBeneficiosRepository implements BenefitTransaction {
  private readonly deliveries: ModelStatic<BenefitDeliveryModel>;
  private readonly items: ModelStatic<BenefitItemModel>;
  private readonly coverages: ModelStatic<BenefitCoverageModel>;
  private readonly operations: ModelStatic<BenefitOperationModel>;
  constructor(
    private readonly database: DbObject = db,
    private readonly transaction?: Transaction,
    private readonly auditWriter?: ScopedAuditWriter,
  ) {
    this.deliveries = database.FtBeneficioEntrega;
    this.items = database.FtBeneficioEntregaItem;
    this.coverages = database.FtBeneficioRetirada;
    this.operations = database.FtBeneficioOperacao;
  }
  private scope() {
    return { transaction: this.transaction };
  }
  private lock() {
    return { ...this.scope(), lock: this.transaction?.LOCK.UPDATE };
  }
  private participantIncludes() {
    return [
      {
        model: this.database.Bolsistas,
        as: "bolsista",
        required: true,
        paranoid: false,
        include: [
          {
            model: this.database.MunicipeModel,
            as: "municipe",
            required: true,
            paranoid: false,
            attributes: ["uuid", "nome", "cpf"],
          },
        ],
      },
    ];
  }
  private itemInclude() {
    return {
      model: this.items,
      as: "itens",
      separate: true,
      order: [
        ["nome", "ASC"],
        ["beneficio_id", "ASC"],
      ] as [string, string][],
    };
  }
  private toContext(row: Model): BenefitParticipationContext {
    const { bolsista, ...participacao } = row.get({
      plain: true,
    }) as ParticipationProjection;
    if (!bolsista?.municipe)
      throw new Error("Benefit participant associations are missing");
    return {
      participacao: { ...participacao, pessoa_id: bolsista.municipe_uuid },
      pessoa: {
        id: bolsista.municipe.uuid,
        nome: bolsista.municipe.nome,
        cpf: bolsista.municipe.cpf,
      },
    };
  }
  private toDelivery(row: BenefitDeliveryModel): BenefitDelivery {
    const {
      itens,
      pessoa: _pessoa,
      ...data
    } = row.get({ plain: true }) as DeliveryProjection;
    return {
      ...data,
      entregue_em: new Date(data.entregue_em).toISOString(),
      estornado_em: data.estornado_em
        ? new Date(data.estornado_em).toISOString()
        : null,
      itens: itens.map((item) => ({
        id: item.beneficio_id,
        nome: item.nome,
        descricao: item.descricao,
      })),
    };
  }
  newId() {
    return randomUUID();
  }
  async actorName(id: string | number) {
    const user = await this.database.UserModel.findByPk(id, {
      attributes: ["name"],
      paranoid: false,
      ...this.scope(),
    });
    return String(user?.get("name") || id);
  }
  async edital(id: string): Promise<Program | null> {
    const row = await this.database.Edital.findByPk(id, this.scope());
    return row ? (row.get({ plain: true }) as Program) : null;
  }
  async lockEdital(id: string): Promise<Program | null> {
    const row = await this.database.Edital.findByPk(id, this.lock());
    return row ? (row.get({ plain: true }) as Program) : null;
  }
  async participation(
    editalId: string,
    participationId: string,
  ): Promise<BenefitParticipationContext | null> {
    const row = await this.database.BolsistasEdital.findOne({
      where: { id: participationId, edital_id: editalId },
      include: this.participantIncludes(),
      paranoid: false,
      ...this.scope(),
    });
    return row ? this.toContext(row) : null;
  }
  async lockParticipation(
    editalId: string,
    participationId: string,
  ): Promise<BenefitParticipationContext | null> {
    const row = await this.database.BolsistasEdital.findOne({
      where: { id: participationId, edital_id: editalId },
      paranoid: false,
      ...this.lock(),
    });
    return row ? this.participation(editalId, participationId) : null;
  }
  async benefits(editalId: string): Promise<Benefit[]> {
    const rows: Model[] = await this.database.FtEditalBeneficio.findAll({
      where: { edital_id: editalId },
      attributes: ["id", "nome", "descricao"],
      order: [
        ["nome", "ASC"],
        ["id", "ASC"],
      ],
      ...this.scope(),
    });
    return rows.map((row) => row.get({ plain: true }) as Benefit);
  }
  async currentDeliveries(editalId: string, personId: string, month: string) {
    const rows = await this.deliveries.findAll({
      where: {
        edital_id: editalId,
        pessoa_id: personId,
        mes: month,
        estornado_em: null,
      },
      include: [this.itemInclude()],
      order: [
        ["entregue_em", "DESC"],
        ["id", "DESC"],
      ],
      ...this.scope(),
    });
    return rows.map((row) => this.toDelivery(row));
  }
  async delivery(editalId: string, deliveryId: string) {
    const row = await this.deliveries.findOne({
      where: { id: deliveryId, edital_id: editalId },
      include: [this.itemInclude()],
      ...this.scope(),
    });
    return row ? this.toDelivery(row) : null;
  }
  async history(editalId: string, query: BenefitQuery) {
    const limit = Math.min(50, Math.max(1, Number(query.limit) || 20));
    const result = await this.deliveries.findAndCountAll({
      where: {
        edital_id: editalId,
        ...(query.mes ? { mes: query.mes } : {}),
        ...(query.participacao_id
          ? { participacao_id: query.participacao_id }
          : {}),
      },
      include: [
        this.itemInclude(),
        {
          model: this.database.MunicipeModel,
          as: "pessoa",
          attributes: ["nome"],
          paranoid: false,
          required: false,
        },
      ],
      distinct: true,
      limit,
      offset: Math.max(0, Number(query.page) || 0) * limit,
      order: [
        ["entregue_em", "DESC"],
        ["id", "DESC"],
      ],
      ...this.scope(),
    });
    return {
      rows: result.rows.map((row) => ({
        ...this.toDelivery(row),
        nome:
          (row.get({ plain: true }) as DeliveryProjection).pessoa?.nome || "—",
      })),
      count: result.count,
    };
  }
  async reportSource(
    edital: Program,
    month: string,
    today: string,
  ): Promise<BenefitReportSource> {
    const [year, number] = month.split("-").map(Number);
    const upper =
      today.slice(0, 7) === month
        ? today
        : new Date(Date.UTC(year, number, 0, 12)).toISOString().slice(0, 10);
    const start = new Date(month + "-01T00:00:00-03:00"),
      end = new Date(upper + "T23:59:59.999-03:00");
    const endConditions = [
      "expire_at",
      "concluded_at",
      "canceled_at",
      "expired_at",
    ].map((field) => ({
      [Op.or]: [{ [field]: null }, { [field]: { [Op.gte]: start } }],
    }));
    const rows: Model[] = await this.database.BolsistasEdital.findAll({
      where: {
        edital_id: edital.id,
        ativado_em: { [Op.ne]: null },
        data_vinculo: { [Op.lte]: end },
        [Op.and]: endConditions,
      },
      include: this.participantIncludes(),
      paranoid: false,
      order: [["id", "ASC"]],
      ...this.scope(),
    });
    const contexts = rows.map((row) => this.toContext(row));
    const people = new Map(
      contexts.map((context) => [context.pessoa.id, context.pessoa]),
    );
    const deliveries = people.size
      ? await this.deliveries.findAll({
          where: {
            edital_id: edital.id,
            mes: month,
            pessoa_id: { [Op.in]: [...people.keys()] },
            estornado_em: null,
          },
          include: [this.itemInclude()],
          order: [
            ["entregue_em", "DESC"],
            ["id", "DESC"],
          ],
          ...this.scope(),
        })
      : [];
    return {
      edital,
      participacoes: contexts.map((c) => c.participacao),
      pessoas: [...people.values()].sort((a, b) => a.id.localeCompare(b.id)),
      beneficios: await this.benefits(edital.id),
      entregas: deliveries.map((row) => this.toDelivery(row)),
    };
  }
  async operation(id: string) {
    const row = await this.operations.findByPk(id, this.scope());
    return row
      ? {
          assinatura: row.getDataValue("assinatura"),
          resultado: row.getDataValue("resultado"),
        }
      : null;
  }
  async remember(
    id: string,
    editalId: string,
    signature: string,
    encryptedResult: string,
  ) {
    await this.operations.create(
      {
        id,
        edital_id: editalId,
        assinatura: signature,
        resultado: encryptedResult,
      },
      this.scope(),
    );
  }
  async create(delivery: BenefitDelivery) {
    const { itens, ...record } = delivery;
    await this.deliveries.create(
      {
        ...record,
        entregue_em: new Date(record.entregue_em),
        estornado_em: record.estornado_em
          ? new Date(record.estornado_em)
          : null,
      },
      this.scope(),
    );
    await this.items.bulkCreate(
      itens.map((item) => ({
        entrega_id: delivery.id,
        beneficio_id: item.id,
        nome: item.nome,
        descricao: item.descricao,
      })),
      this.scope(),
    );
    await this.coverages.bulkCreate(
      itens.map((item) => ({
        edital_id: delivery.edital_id,
        pessoa_id: delivery.pessoa_id,
        beneficio_id: item.id,
        mes: delivery.mes,
        entrega_id: delivery.id,
      })),
      this.scope(),
    );
  }
  async reverse(delivery: BenefitDelivery) {
    await this.deliveries.update(
      {
        estornado_em: delivery.estornado_em
          ? new Date(delivery.estornado_em)
          : null,
        estornado_por: delivery.estornado_por,
        responsavel_estorno: delivery.responsavel_estorno,
        motivo_estorno: delivery.motivo_estorno,
      },
      {
        where: { id: delivery.id, edital_id: delivery.edital_id },
        ...this.scope(),
      },
    );
    await this.coverages.destroy({
      where: { entrega_id: delivery.id },
      ...this.scope(),
    });
  }
  async audit(command: AuditCommand) {
    if (!this.auditWriter) throw new Error("Transactional audit required");
    await this.auditWriter.record(command);
  }
}
export class SequelizeBeneficiosUnitOfWork implements BenefitUnitOfWork {
  readonly read: SequelizeBeneficiosRepository;
  constructor(
    private readonly auditFactory: TransactionalAuditFactory,
    private readonly database: DbObject = db,
  ) {
    this.read = new SequelizeBeneficiosRepository(database);
  }
  async run<T>(work: (ports: BenefitTransaction) => Promise<T>): Promise<T> {
    try {
      return await this.database.sequelize.transaction((transaction) =>
        work(
          new SequelizeBeneficiosRepository(
            this.database,
            transaction,
            this.auditFactory(transaction),
          ),
        ),
      );
    } catch (error) {
      if (error instanceof UniqueConstraintError)
        throw new BenefitRuleError(
          "DUPLICATE",
          "Operação ou retirada já registrada. Confira novamente.",
        );
      throw error;
    }
  }
}
