import { mapPeaadRuleError } from "../../ft-bolsista/application/utils/map-peaad-rule-error.js";
import { createHash } from "node:crypto";
import { ftError } from "../../ft-bolsista/application/utils/ft-error.js";
import {
  businessDate,
  dateOnly,
} from "../../ft-edital/domain/services/edital-workflow.policy.js";
import {
  tamanhoKey,
  cents,
  reason,
  quantity,
  text,
} from "../domain/estoque.policy.js";
import type {
  Actor,
  EstoqueUnitOfWork,
  StockReader,
  StockTransaction,
  StockParticipant,
  StockVariation,
  StockQuery,
  Operation,
  ItemInput,
  VariationInput,
  CompleteInput,
  StockInput,
  DeliveryInput,
  ReversalInput,
  StockItem,
} from "../domain/estoque.contracts.js";
// Persisted signatures use UTF-16 ordering, independent of the server locale.
const compareKeys = (left: string, right: string) => {
  if (left < right) return -1;
  if (left > right) return 1;
  return 0;
};
const canonical = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .sort(([left], [right]) => compareKeys(left, right))
        .map(([key, value]) => [key, canonical(value)]),
    );
  }
  return value;
};
const hash = (data: unknown) =>
  createHash("sha256")
    .update(JSON.stringify(canonical(data)))
    .digest("hex");
export { tamanhoKey, cents, reason };
export class EstoqueService {
  constructor(
    private unit: EstoqueUnitOfWork,
    private clock = () => new Date(),
  ) {}
  private required<T>(row: T | null): T {
    if (!row) throw ftError(404, "Registro não encontrado.");
    return row;
  }
  private async participant(
    id: string,
    ports: StockReader = this.unit.read,
    eligible = true,
  ) {
    const context = await ports.participant(id);
    if (!context) throw ftError(404, "Participação ou edital indisponível.");
    const { participation: row, edital } = context;
    if (eligible) {
      const today = businessDate(this.clock());
      if (
        edital.fase !== "aberto" ||
        today < dateOnly(edital.vigencia_inicio || edital.data_publicacao) ||
        today > dateOnly(edital.data_vencimento)
      )
        throw ftError(409, "O edital deve estar aberto e vigente.");
      if (
        !["convocado", "ativo"].includes(row.status) ||
        (row.status === "ativo" &&
          (!row.expire_at || dateOnly(row.expire_at) < today))
      )
        throw ftError(
          409,
          "Somente convocados ou ativos não vencidos podem receber itens.",
        );
    }
    return row;
  }
  private async write<T extends { id: string }, D extends Operation>(
    operation: string,
    data: D,
    actor: Actor,
    work: (
      ports: StockTransaction,
      participation?: StockParticipant,
    ) => Promise<T>,
    participationId?: string,
  ): Promise<T> {
    if (
      !/^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/i.test(
        data.operacao_id || "",
      )
    )
      throw ftError(422, "Identificador da operação obrigatório.");
    const signature = hash({ operation, actor: String(actor.id), data });
    return this.unit.run(async (ports) => {
      const context = participationId
        ? await ports.lockParticipant(participationId)
        : undefined;
      if (participationId && !context)
        throw ftError(404, "Participação ou edital indisponível.");
      if (!(await ports.lockCatalog()))
        throw ftError(503, "Estoque não inicializado.");
      const previous = await ports.previousOperation(data.operacao_id);
      if (previous) {
        if (previous.assinatura !== signature)
          throw ftError(
            409,
            "Identificador de operação já utilizado com outros dados.",
          );
        return JSON.parse(previous.resultado) as T;
      }
      const result = await work(ports, context?.participation);
      await ports.recordAudit({
        actor: { userId: actor.id },
        action:
          operation.startsWith("criar") ||
          operation.startsWith("entregar") ||
          operation === "entrada"
            ? "CREATE"
            : "UPDATE",
        module: "ft-estoque",
        resourceType: "estoque",
        resourceId: result.id,
        result: "SUCCESS",
        requestId: actor.requestId,
        metadata: { operation, operacao_id: data.operacao_id },
      });
      await ports.rememberOperation(
        data.operacao_id,
        signature,
        JSON.stringify(result),
      );
      return result;
    });
  }
  items(query: StockQuery = {}) {
    return this.unit.read.items(query);
  }
  async item(id: string) {
    try {
      return this.required(await this.unit.read.item(id));
    } catch (error) {
      throw mapPeaadRuleError(error);
    }
  }
  variations(query: StockQuery = {}) {
    return this.unit.read.variations(query);
  }
  async variation(id: string) {
    try {
      return this.required(await this.unit.read.variation(id));
    } catch (error) {
      throw mapPeaadRuleError(error);
    }
  }
  movements(query: StockQuery) {
    return this.unit.read.movements(query);
  }
  recipients(query: StockQuery) {
    return this.unit.read.recipients(query, businessDate(this.clock()));
  }
  deliveries(query: StockQuery) {
    return this.unit.read.deliveries(query);
  }
  delivery(id: string) {
    return this.unit.read.delivery(id);
  }
  private async catalog(ports: StockReader = this.unit.read) {
    const catalog = await ports.catalog();
    if (!catalog) throw ftError(503, "Estoque não inicializado.");
    const signature = catalog.rows.map((p) => ({
      id: p.id,
      nome: p.nome,
      epi: p.epi,
      variacoes: p.variacoes.map((v) => ({
        id: v.id,
        tamanho: v.tamanho,
        custo_centavos: v.custo_centavos,
      })),
    }));
    return { rows: catalog.rows, versao: hash([catalog.version, signature]) };
  }
  async preview(id: string) {
    try {
      await this.participant(id);
      const [catalog, kit, participante] = await Promise.all([
        this.catalog(),
        this.unit.read.activeKit(id),
        this.unit.read.participantName(id),
      ]);
      return {
        ...catalog,
        participante,
        kit_entregue: Boolean(kit),
        kit_entrega_id: kit?.id || null,
      };
    } catch (error) {
      throw mapPeaadRuleError(error);
    }
  }
  private itemValues(data: Pick<ItemInput, "nome" | "epi" | "ativo">) {
    if (typeof data.epi !== "boolean")
      throw ftError(422, "Informe se o item é EPI.");
    return {
      nome: text(data.nome, 120),
      epi: data.epi,
      ativo: data.ativo ?? true,
    };
  }
  private variationValues(
    itemId: string,
    data: Pick<VariationInput, "tamanho" | "custo_unitario" | "ativo">,
  ) {
    const tamanho = text(data.tamanho, 40);
    return {
      item_id: itemId,
      tamanho,
      tamanho_chave: text(tamanhoKey(tamanho), 40),
      custo_centavos: cents(data.custo_unitario),
      ativo: data.ativo ?? true,
    };
  }
  async createComplete(data: CompleteInput, actor: Actor) {
    try {
      return await this.write("criar_item_completo", data, actor, async (t) => {
        if (
          !Array.isArray(data.tamanhos) ||
          !data.tamanhos.length ||
          data.tamanhos.length > 100
        )
          throw ftError(422, "Cadastre entre 1 e 100 tamanhos.");
        const keys = new Set<string>();
        const entries = data.tamanhos.map((size) => {
          const values = this.variationValues("", size),
            initial = size.quantidade_inicial ?? 0;
          if (initial !== 0) quantity(initial);
          if (keys.has(values.tamanho_chave))
            throw ftError(409, "Não repita tamanhos no cadastro.");
          keys.add(values.tamanho_chave);
          return { values, initial };
        });
        const item = await t.createItem(this.itemValues(data as ItemInput));
        const variacoes = [];
        for (const entry of entries) {
          const row = await t.createVariation({
            ...entry.values,
            item_id: item.id,
            saldo: 0,
          });
          if (entry.initial)
            await this.move(t, row, entry.initial, "entrada", actor);
          variacoes.push({
            ...row,
            custo_unitario: Number(row.custo_centavos) / 100,
          });
        }
        await t.advanceCatalog();
        return { ...item, variacoes };
      });
    } catch (error) {
      throw mapPeaadRuleError(error);
    }
  }
  async saveItem(
    id: string | undefined,
    data: ItemInput | Operation,
    actor: Actor,
    remove = false,
  ) {
    try {
      return await this.write(
        id ? "editar_item" : "criar_item",
        { ...data, id },
        actor,
        async (t) => {
          const row = id ? this.required(await t.item(id)) : null;
          const values = remove
            ? { ativo: false }
            : this.itemValues(data as ItemInput);
          const result = row
            ? await t.updateItem(row.id, values)
            : await t.createItem(this.itemValues(data as ItemInput));
          await t.advanceCatalog();
          return result;
        },
      );
    } catch (error) {
      throw mapPeaadRuleError(error);
    }
  }
  async saveVariation(
    itemId: string,
    id: string | undefined,
    data: VariationInput | Operation,
    actor: Actor,
    remove = false,
  ) {
    try {
      return await this.write(
        id ? "editar_variacao" : "criar_variacao",
        { ...data, itemId, id },
        actor,
        async (t) => {
          const parent = this.required(await t.item(itemId));
          const row = id ? this.required(await t.variation(id)) : null;
          if (row && row.item_id !== itemId)
            throw ftError(404, "Tamanho não pertence ao item.");
          if (!parent.ativo && !remove)
            throw ftError(
              409,
              "Reative o item antes de alterar seus tamanhos.",
            );
          let values: Partial<StockVariation> = { ativo: false };
          if (!remove) {
            const normalized = this.variationValues(
                itemId,
                data as VariationInput,
              ),
              key = normalized.tamanho_chave;
            const duplicate = await t.duplicateSize(itemId, key, id);
            if (duplicate)
              throw ftError(
                409,
                "Tamanho já cadastrado neste item; reative o existente se necessário.",
              );
            values = normalized;
          }
          const result = row
            ? await t.updateVariation(row.id, values)
            : await t.createVariation({
                ...this.variationValues(itemId, data as VariationInput),
                saldo: 0,
              });
          await t.advanceCatalog();
          return {
            ...result,
            custo_unitario: Number(result.custo_centavos) / 100,
          };
        },
      );
    } catch (error) {
      throw mapPeaadRuleError(error);
    }
  }
  private async move(
    t: StockTransaction,
    variation: StockVariation,
    delta: number,
    tipo: string,
    actor: Actor,
    motivo?: string,
    entregaId?: string,
  ) {
    const saldo = Number(variation.saldo) + delta;
    if (!Number.isSafeInteger(saldo) || saldo < 0 || saldo > 1000000000)
      throw ftError(
        409,
        "Saldo insuficiente ou acima do limite para o tamanho " +
          variation.tamanho +
          ".",
      );
    Object.assign(variation, await t.updateVariation(variation.id, { saldo }));
    return t.createMovement({
      variacao_id: variation.id,
      entrega_id: entregaId || null,
      tipo,
      delta,
      saldo_apos: saldo,
      autor_id: String(actor.id),
      data: this.clock(),
      motivo: motivo || null,
    });
  }
  async stock(id: string, data: StockInput, actor: Actor, adjustment: boolean) {
    try {
      return await this.write(
        adjustment ? "ajuste" : "entrada",
        { ...data, id },
        actor,
        async (t) => {
          const row = this.required(await t.variation(id)),
            parent = this.required(await t.item(row.item_id));
          if (!adjustment && (!row.ativo || !parent.ativo))
            throw ftError(
              409,
              "Reative o item e seu tamanho antes de registrar entrada.",
            );
          return await this.move(
            t,
            row,
            quantity(data.quantidade, adjustment),
            adjustment ? "ajuste" : "entrada",
            actor,
            adjustment ? reason(data.justificativa) : undefined,
          );
        },
      );
    } catch (error) {
      throw mapPeaadRuleError(error);
    }
  }
  async deliver(tipo: "kit" | "individual", data: DeliveryInput, actor: Actor) {
    try {
      return await this.write(
        "entregar_" + tipo,
        data,
        actor,
        async (t, participant) => {
          const p = this.required(participant || null);
          await this.participant(p.id, t);
          const catalog = await this.catalog(t);
          if (data.versao !== catalog.versao)
            throw ftError(
              409,
              "O catálogo ou os custos mudaram. Confira novamente a entrega.",
            );
          if (tipo === "kit" && (await t.activeKit(p.id)))
            throw ftError(
              409,
              "Esta participação já recebeu um kit. Utilize entrega individual justificada.",
            );
          const selected = data.itens;
          if (!Array.isArray(selected) || !selected.length)
            throw ftError(422, "Selecione os itens da entrega.");
          const ids = new Set(selected.map((i) => i.variacao_id));
          if (
            ids.size !== selected.length ||
            (tipo === "individual" && selected.length !== 1)
          )
            throw ftError(422, "Seleção de itens inválida.");
          const lines = selected.map((i) => {
            const product = catalog.rows.find((product) =>
              product.variacoes.some((v) => v.id === i.variacao_id),
            );
            const variation = product?.variacoes.find(
              (v) => v.id === i.variacao_id,
            );
            if (!variation)
              throw ftError(409, "Item ou tamanho inativo ou indisponível.");
            return {
              product: product!,
              variation,
              quantidade: quantity(i.quantidade),
            };
          });
          if (tipo === "kit") {
            const required = catalog.rows.filter((p) => p.epi);
            if (
              !required.length ||
              lines.length !== required.length ||
              new Set(lines.map((l) => l.product.id)).size !==
                required.length ||
              lines.some((l) => !l.product.epi || l.quantidade !== 1)
            )
              throw ftError(
                422,
                "O kit deve conter uma unidade de cada tipo de EPI ativo.",
              );
          }
          const total = lines.reduce(
            (sum: number, l) =>
              sum + Number(l.variation.custo_centavos) * l.quantidade,
            0,
          );
          if (!Number.isSafeInteger(total))
            throw ftError(422, "Custo total acima do limite.");
          const delivery = await t.createDelivery({
            participacao_id: p.id,
            edital_id: p.edital_id,
            bolsista_id: p.bolsista_id,
            kit_ativo_participacao_id: tipo === "kit" ? p.id : null,
            tipo,
            autor_id: String(actor.id),
            entregue_em: this.clock(),
            total_centavos: total,
            justificativa:
              tipo === "individual" ? reason(data.justificativa) : null,
          });
          const orderedLines = lines.toSorted((a, b) =>
            a.variation.id.localeCompare(b.variation.id),
          );
          for (const line of orderedLines) {
            const row = this.required(await t.variation(line.variation.id));
            await this.move(
              t,
              row,
              -line.quantidade,
              "entrega",
              actor,
              undefined,
              delivery.id,
            );
            await t.createDeliveredItem({
              entrega_id: delivery.id,
              variacao_id: row.id,
              nome: line.product.nome,
              tamanho: row.tamanho,
              quantidade: line.quantidade,
              custo_centavos: row.custo_centavos,
            });
          }
          return delivery;
        },
        data.participacao_id,
      );
    } catch (error) {
      throw mapPeaadRuleError(error);
    }
  }
  async reverse(id: string, data: ReversalInput, actor: Actor) {
    try {
      const seed = this.required(await this.unit.read.deliveryRecord(id));
      return await this.write(
        "estornar_entrega",
        { ...data, id },
        actor,
        async (t) => {
          const row = this.required(await t.deliveryRecord(id));
          if (row.estornado_em) throw ftError(409, "Entrega já estornada.");
          const motivo = reason(data.justificativa),
            lines = await t.deliveredItems(id);
          for (const line of lines)
            await this.move(
              t,
              this.required(await t.variation(line.variacao_id)),
              Number(line.quantidade),
              "estorno",
              actor,
              motivo,
              id,
            );
          Object.assign(
            row,
            await t.updateDelivery(row.id, {
              estornado_em: this.clock(),
              estornado_por: String(actor.id),
              motivo_estorno: motivo,
              kit_ativo_participacao_id: null,
            }),
          );
          return row;
        },
        seed.participacao_id,
      );
    } catch (error) {
      throw mapPeaadRuleError(error);
    }
  }
}
