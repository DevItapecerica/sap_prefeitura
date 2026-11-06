import type { TransactionalAuditFactory } from "./transactional-audit.js";
import { Op, Transaction, literal } from "sequelize";
import { createHash } from "node:crypto";
import type { DbObject } from "../../../../core/types/DbTypes.js";
import type {
  StockReader,
  StockTransaction,
  EstoqueUnitOfWork,
  StockItem,
  StockVariation,
  Delivery,
  DeliveryItem,
  Movement,
  ParticipantContext,
  StockQuery,
  Page,
  Catalog,
  Recipient,
  DeliverySummary,
  DeliveryDetail,
  AuditCommand,
} from "../../../../modules/ft-estoque/domain/estoque.contracts.js";
import { tamanhoKey } from "../../../../modules/ft-estoque/domain/estoque.policy.js";
import AppError from "../../../../core/appError.js";
import type { AuditService } from "../../../../modules/audit/application/use-case/audit.service.js";
const plain = (row: any) => row?.toJSON?.() ?? row;
const pagination = (q: StockQuery) => {
  const limit = Math.min(50, Math.max(1, Number(q.limit) || 20));
  return { limit, offset: Math.max(0, Number(q.page) || 0) * limit };
};
const like = (s: string) => "%" + s.trim().replace(/[\\%_]/g, "\\$&") + "%";
const variation = (row: any): StockVariation => ({
  ...plain(row),
  custo_centavos: Number(row.custo_centavos),
  saldo: Number(row.saldo),
  custo_unitario: Number(row.custo_centavos) / 100,
});
export class SequelizeStockRepository implements StockTransaction {
  constructor(
    private database: DbObject,
    private transaction?: Transaction,
    private audit?: Pick<AuditService, "record">,
  ) {}
  private async required(model: string, id: string) {
    const row = await this.database[model].findByPk(id, {
      transaction: this.transaction,
    });
    if (!row) throw new AppError("Registro não encontrado.", 404, "FT_MS");
    return row;
  }
  async item(id: string): Promise<StockItem | null> {
    return plain(
      await this.database.FtEstoqueItem.findByPk(id, {
        transaction: this.transaction,
      }),
    );
  }
  async variation(id: string): Promise<StockVariation | null> {
    const row = await this.database.FtEstoqueVariacao.findByPk(id, {
      transaction: this.transaction,
    });
    return row ? variation(row) : null;
  }
  async deliveryRecord(id: string): Promise<Delivery | null> {
    return plain(
      await this.database.FtEstoqueEntrega.findByPk(id, {
        transaction: this.transaction,
      }),
    );
  }
  async participant(id: string): Promise<ParticipantContext | null> {
    const row = await this.database.BolsistasEdital.findByPk(id, {
      transaction: this.transaction,
    });
    if (!row) return null;
    const edital = await this.database.Edital.findByPk(row.edital_id, {
      transaction: this.transaction,
    });
    return edital ? { participation: plain(row), edital: plain(edital) } : null;
  }
  async lockParticipant(id: string): Promise<ParticipantContext | null> {
    // Resolve only the aggregate ID outside the transaction. A nonlocking read
    // here would establish a stale REPEATABLE READ snapshot before waiting for
    // the edital/control locks, hiding a concurrently committed operation ID.
    const seed = await this.database.BolsistasEdital.findByPk(id);
    if (!seed) throw new AppError("Registro não encontrado.", 404, "FT_MS");
    const edital = await this.database.Edital.findByPk(seed.edital_id, {
      transaction: this.transaction,
      lock: this.transaction!.LOCK.UPDATE,
    });
    const row = await this.database.BolsistasEdital.findByPk(id, {
      transaction: this.transaction,
      lock: this.transaction!.LOCK.UPDATE,
    });
    return edital && row
      ? { participation: plain(row), edital: plain(edital) }
      : null;
  }
  async participantName(id: string) {
    const row = await this.required("BolsistasEdital", id),
      person = await this.required("Bolsistas", row.bolsista_id),
      municipe = await this.required("MunicipeModel", person.municipe_uuid),
      edital = await this.required("Edital", row.edital_id);
    return {
      id,
      nome: String(municipe.nome),
      edital_nome: String(edital.name),
    };
  }
  async activeKit(id: string): Promise<Delivery | null> {
    return plain(
      await this.database.FtEstoqueEntrega.findOne({
        where: { kit_ativo_participacao_id: id },
        transaction: this.transaction,
      }),
    );
  }
  async lockCatalog() {
    return Boolean(
      await this.database.FtEstoqueControle.findByPk(1, {
        transaction: this.transaction,
        lock: this.transaction!.LOCK.UPDATE,
      }),
    );
  }
  async previousOperation(id: string) {
    return plain(
      await this.database.FtEstoqueOperacao.findByPk(id, {
        transaction: this.transaction,
      }),
    ) as { assinatura: string; resultado: string } | null;
  }
  async rememberOperation(id: string, assinatura: string, resultado: string) {
    await this.database.FtEstoqueOperacao.create(
      { id, assinatura, resultado },
      { transaction: this.transaction },
    );
  }
  async advanceCatalog() {
    const row = await this.database.FtEstoqueControle.findByPk(1, {
      transaction: this.transaction,
      lock: this.transaction!.LOCK.UPDATE,
    });
    await row.increment("versao", { transaction: this.transaction });
  }
  async duplicateSize(
    item_id: string,
    tamanho_chave: string,
    exceptId?: string,
  ) {
    return Boolean(
      await this.database.FtEstoqueVariacao.findOne({
        where: {
          item_id,
          tamanho_chave,
          ...(exceptId ? { id: { [Op.ne]: exceptId } } : {}),
        },
        transaction: this.transaction,
      }),
    );
  }
  async catalog(): Promise<Catalog | null> {
    const [control, items, sizes] = await Promise.all([
      this.database.FtEstoqueControle.findByPk(1, {
        transaction: this.transaction,
        ...(this.transaction ? { lock: this.transaction.LOCK.UPDATE } : {}),
      }),
      this.database.FtEstoqueItem.findAll({
        where: { ativo: true },
        order: [["id", "ASC"]],
        transaction: this.transaction,
      }),
      this.database.FtEstoqueVariacao.findAll({
        where: { ativo: true },
        order: [["id", "ASC"]],
        transaction: this.transaction,
      }),
    ]);
    return control
      ? {
          version: Number(control.versao),
          rows: items.map((item: any) => ({
            id: String(item.id),
            nome: String(item.nome),
            epi: Boolean(item.epi),
            variacoes: sizes
              .filter((v: any) => v.item_id === item.id)
              .map(variation),
          })),
        }
      : null;
  }
  async deliveredItems(id: string): Promise<DeliveryItem[]> {
    return (
      await this.database.FtEstoqueEntregaItem.findAll({
        where: { entrega_id: id },
        order: [["variacao_id", "ASC"]],
        transaction: this.transaction,
      })
    ).map(plain);
  }
  async recordAudit(command: AuditCommand) {
    if (!this.audit)
      throw new Error("Audit writer requires a transaction scope");
    await this.audit.record(command);
  }
  async createItem(input: Omit<StockItem, "id">): Promise<StockItem> {
    return plain(
      await this.database.FtEstoqueItem.create(input, {
        transaction: this.transaction,
      }),
    );
  }
  async updateItem(id: string, input: Partial<StockItem>): Promise<StockItem> {
    const row = await this.required("FtEstoqueItem", id);
    return plain(await row.update(input, { transaction: this.transaction }));
  }
  async createVariation(
    input: Omit<StockVariation, "id" | "custo_unitario">,
  ): Promise<StockVariation> {
    return variation(
      await this.database.FtEstoqueVariacao.create(input, {
        transaction: this.transaction,
      }),
    );
  }
  async updateVariation(
    id: string,
    input: Partial<StockVariation>,
  ): Promise<StockVariation> {
    const row = await this.required("FtEstoqueVariacao", id);
    return variation(
      await row.update(input, { transaction: this.transaction }),
    );
  }
  async createDelivery(input: Omit<Delivery, "id">): Promise<Delivery> {
    return plain(
      await this.database.FtEstoqueEntrega.create(input, {
        transaction: this.transaction,
      }),
    );
  }
  async updateDelivery(
    id: string,
    input: Partial<Delivery>,
  ): Promise<Delivery> {
    const row = await this.required("FtEstoqueEntrega", id);
    return plain(await row.update(input, { transaction: this.transaction }));
  }
  async createMovement(input: Omit<Movement, "id">): Promise<Movement> {
    return plain(
      await this.database.FtEstoqueMovimento.create(input, {
        transaction: this.transaction,
      }),
    );
  }
  async createDeliveredItem(
    input: Omit<DeliveryItem, "id">,
  ): Promise<DeliveryItem> {
    return plain(
      await this.database.FtEstoqueEntregaItem.create(input, {
        transaction: this.transaction,
      }),
    );
  }
  async items(
    q: StockQuery = {},
  ): Promise<
    Page<StockItem & { tamanhos_ativos: number; saldo_total: number }>
  > {
    const where: any = {
      ...(q.situacao === "todos" ? {} : { ativo: q.situacao !== "inativos" }),
      ...(q.search ? { nome: { [Op.like]: like(q.search) } } : {}),
      ...(q.epi != null ? { epi: q.epi === true || q.epi === "true" } : {}),
    };
    if (q.tamanho)
      where.id = {
        [Op.in]: literal(
          "(SELECT item_id FROM ft_estoque_variacoes WHERE tamanho_chave=" +
            this.database.sequelize.escape(tamanhoKey(q.tamanho)) +
            (q.situacao === "todos"
              ? ""
              : " AND ativo=" + (q.situacao === "inativos" ? "0" : "1")) +
            ")",
        ),
      };
    const result = await this.database.FtEstoqueItem.findAndCountAll({
      where,
      ...pagination(q),
      order: [
        ["nome", "ASC"],
        ["id", "ASC"],
      ],
    });
    const sizes = result.rows.length
      ? await this.database.FtEstoqueVariacao.findAll({
          where: {
            item_id: { [Op.in]: result.rows.map((r: any) => r.id) },
            ativo: true,
          },
        })
      : [];
    return {
      count: result.count,
      rows: result.rows.map((r: any) => {
        const variations = sizes.filter((v: any) => v.item_id === r.id);
        return {
          ...plain(r),
          tamanhos_ativos: variations.length,
          saldo_total: variations.reduce(
            (sum: number, v: any) => sum + Number(v.saldo),
            0,
          ),
        };
      }),
    };
  }
  async variations(
    q: StockQuery = {},
  ): Promise<Page<StockVariation> & { item: StockItem | null }> {
    const parent = q.item_id
      ? await this.required("FtEstoqueItem", q.item_id)
      : null;
    const where: any = {
      ...(q.item_id ? { item_id: q.item_id } : {}),
      ...(q.situacao === "todos" ? {} : { ativo: q.situacao !== "inativos" }),
      ...(q.tamanho ? { tamanho_chave: tamanhoKey(q.tamanho) } : {}),
    };
    const result = await this.database.FtEstoqueVariacao.findAndCountAll({
      where,
      ...pagination(q),
      order: [
        ["tamanho_chave", "ASC"],
        ["id", "ASC"],
      ],
    });
    return {
      ...result,
      rows: result.rows.map((row: any) => ({
        ...plain(row),
        custo_unitario: Number(row.custo_centavos) / 100,
      })),
      item: plain(parent),
    };
  }
  async movements(
    q: StockQuery,
  ): Promise<
    Page<Movement & { tamanho?: string; nome?: string; responsavel: string }>
  > {
    const result = await this.database.FtEstoqueMovimento.findAndCountAll({
      where: q.variacao_id ? { variacao_id: q.variacao_id } : {},
      ...pagination(q),
      order: [
        ["data", "DESC"],
        ["id", "DESC"],
      ],
    });
    const variations = result.rows.length
      ? await this.database.FtEstoqueVariacao.findAll({
          where: {
            id: { [Op.in]: result.rows.map((r: any) => r.variacao_id) },
          },
        })
      : [];
    const [items, actors] = await Promise.all([
      variations.length
        ? this.database.FtEstoqueItem.findAll({
            where: { id: { [Op.in]: variations.map((v: any) => v.item_id) } },
          })
        : [],
      result.rows.length
        ? this.database.UserModel.findAll({
            where: {
              id: {
                [Op.in]: [...new Set(result.rows.map((r: any) => r.autor_id))],
              },
            },
            paranoid: false,
          })
        : [],
    ]);
    return {
      count: result.count,
      rows: result.rows.map((r: any) => {
        const v = variations.find((v: any) => v.id === r.variacao_id);
        return {
          ...plain(r),
          tamanho: v?.tamanho,
          nome: items.find((i: any) => i.id === v?.item_id)?.nome,
          responsavel:
            actors.find((a: any) => String(a.id) === r.autor_id)?.name ||
            "Usuário " + r.autor_id,
        };
      }),
    };
  }
  async recipients(q: StockQuery, reference: string): Promise<Page<Recipient>> {
    const today = reference,
      start = new Date(today + "T00:00:00-03:00"),
      end = new Date(today + "T23:59:59-03:00");
    const search = String(q.search || "").trim(),
      digits = search.replace(/\D/g, "");
    const where: any = {
      [Op.or]: [
        { status: "convocado" },
        { status: "ativo", expire_at: { [Op.gte]: start } },
      ],
    };
    const result = await this.database.BolsistasEdital.findAndCountAll({
      where,
      ...pagination(q),
      order: [
        ["createdAt", "DESC"],
        ["id", "DESC"],
      ],
      include: [
        {
          model: this.database.Edital,
          as: "edital",
          required: true,
          attributes: ["id", "name"],
          where: {
            fase: "aberto",
            [Op.or]: [
              { vigencia_inicio: { [Op.lte]: today } },
              { vigencia_inicio: null },
            ],
            data_vencimento: { [Op.gte]: start },
            data_publicacao: { [Op.lte]: end },
          },
        },
        {
          model: this.database.Bolsistas,
          as: "bolsista",
          required: true,
          attributes: ["id"],
          include: [
            {
              model: this.database.MunicipeModel,
              as: "municipe",
              required: true,
              attributes: ["uuid", "nome"],
              ...(search
                ? {
                    where:
                      digits.length === 11 && /^[\d.\s-]+$/.test(search)
                        ? {
                            cpfHash: createHash("sha256")
                              .update(digits)
                              .digest("hex"),
                          }
                        : { nome: { [Op.like]: like(search) } },
                  }
                : {}),
            },
          ],
        },
      ],
      distinct: true,
      subQuery: false,
    });
    return {
      rows: result.rows.map((r: any) => ({
        id: r.id,
        status: r.status,
        nome: r.bolsista.municipe.nome,
        edital_id: r.edital_id,
        edital_nome: r.edital.name,
      })),
      count: result.count,
    };
  }
  async deliveries(q: StockQuery): Promise<Page<DeliverySummary>> {
    const where: any = {
      ...(q.participacao_id ? { participacao_id: q.participacao_id } : {}),
      ...(q.tipo ? { tipo: q.tipo } : {}),
      ...(q.situacao === "estornadas"
        ? { estornado_em: { [Op.ne]: null } }
        : q.situacao === "vigentes"
          ? { estornado_em: null }
          : {}),
    };
    const search = String(q.search || "").trim(),
      digits = search.replace(/\D/g, "");
    if (search) {
      const condition =
        digits.length === 11 && /^[\d.\s-]+$/.test(search)
          ? "m.cpfHash=" +
            this.database.sequelize.escape(
              createHash("sha256").update(digits).digest("hex"),
            )
          : "m.nome LIKE " + this.database.sequelize.escape(like(search));
      where.bolsista_id = {
        [Op.in]: literal(
          "(SELECT b.id FROM bolsistas b INNER JOIN municipes m ON m.uuid=b.municipe_uuid WHERE " +
            condition +
            ")",
        ),
      };
    }
    const result = await this.database.FtEstoqueEntrega.findAndCountAll({
      where,
      ...pagination(q),
      order: [
        ["entregue_em", "DESC"],
        ["id", "DESC"],
      ],
    });
    return {
      count: result.count,
      rows: await this.deliverySummaries(result.rows),
    };
  }
  private async deliverySummaries(rows: any[]) {
    if (!rows.length) return [];
    const [people, editais, actors] = await Promise.all([
      this.database.Bolsistas.findAll({
        where: { id: { [Op.in]: rows.map((r) => r.bolsista_id) } },
        paranoid: false,
      }),
      this.database.Edital.findAll({
        where: { id: { [Op.in]: rows.map((r) => r.edital_id) } },
        attributes: ["id", "name"],
        paranoid: false,
      }),
      this.database.UserModel.findAll({
        where: {
          id: {
            [Op.in]: [
              ...new Set(
                rows
                  .flatMap((r) => [r.autor_id, r.estornado_por])
                  .filter(Boolean),
              ),
            ],
          },
        },
        attributes: ["id", "name"],
        paranoid: false,
      }),
    ]);
    const municipes = people.length
      ? await this.database.MunicipeModel.findAll({
          where: { uuid: { [Op.in]: people.map((p: any) => p.municipe_uuid) } },
          attributes: ["uuid", "nome"],
          paranoid: false,
        })
      : [];
    const names = new Map(actors.map((a: any) => [String(a.id), a.name]));
    return rows.map((r) => {
      const person = people.find((p: any) => p.id === r.bolsista_id);
      return {
        ...plain(r),
        total_centavos: Number(r.total_centavos),
        nome:
          municipes.find((m: any) => m.uuid === person?.municipe_uuid)?.nome ||
          "Bolsista indisponível",
        edital_nome:
          editais.find((e: any) => e.id === r.edital_id)?.name ||
          "Edital indisponível",
        responsavel: names.get(String(r.autor_id)) || "Usuário " + r.autor_id,
        responsavel_estorno:
          names.get(String(r.estornado_por)) || r.estornado_por || null,
      };
    });
  }
  async delivery(id: string): Promise<DeliveryDetail> {
    const row = await this.required("FtEstoqueEntrega", id);
    const itens = await this.database.FtEstoqueEntregaItem.findAll({
      where: { entrega_id: id },
      order: [
        ["nome", "ASC"],
        ["id", "ASC"],
      ],
    });
    return {
      ...(await this.deliverySummaries([row]))[0],
      itens: itens.map(plain),
    };
  }
}
export class SequelizeEstoqueUnitOfWork implements EstoqueUnitOfWork {
  readonly read: StockReader;
  constructor(
    private database: DbObject,
    private audit: TransactionalAuditFactory,
  ) {
    this.read = new SequelizeStockRepository(database);
  }
  run<T>(work: (ports: StockTransaction) => Promise<T>): Promise<T> {
    return this.database.sequelize.transaction((transaction) =>
      work(
        new SequelizeStockRepository(
          this.database,
          transaction,
          this.audit(transaction),
        ),
      ),
    );
  }
}
