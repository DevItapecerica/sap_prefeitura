import assert from "node:assert/strict";
import test from "node:test";
import { randomUUID } from "node:crypto";
import { fakePort } from "../../../../core/contracts/__tests__/fake-port.js";
import { EstoqueService } from "../estoque.service.js";
import type {
  StockTransaction,
  EstoqueUnitOfWork,
  StockItem,
  StockVariation,
  Movement,
  Delivery,
  DeliveryItem,
  ParticipantContext,
} from "../../domain/estoque.contracts.js";

const actor = { id: 1, requestId: "request" };
function fixture() {
  let state: {
    items: StockItem[];
    sizes: StockVariation[];
    moves: Movement[];
    deliveries: Delivery[];
    lines: DeliveryItem[];
    audit: number;
    version: number;
    operations: Record<string, { assinatura: string; resultado: string }>;
  } = {
    items: [],
    sizes: [],
    moves: [],
    deliveries: [],
    lines: [],
    audit: 0,
    version: 0,
    operations: {},
  };
  let auditFails = false,
    inside = false;
  const locks: string[] = [];
  const context: ParticipantContext = {
    participation: {
      id: "participation-1",
      edital_id: "program-1",
      bolsista_id: "person-1",
      status: "ativo",
      expire_at: "2026-12-31",
    },
    edital: {
      id: "program-1",
      name: "Edital",
      fase: "aberto",
      vigencia_inicio: "2026-01-01",
      data_publicacao: "2026-01-01",
      data_vencimento: "2026-12-31",
    },
  };
  const ports = fakePort<StockTransaction>({
    lockParticipant: async () => {
      assert.ok(inside);
      locks.push("edital/participacao");
      return context;
    },
    lockCatalog: async () => {
      assert.ok(inside);
      locks.push("controle");
      return true;
    },
    participant: async () => context,
    participantName: async (id) => ({
      id,
      nome: "Maria",
      edital_nome: "Edital",
    }),
    catalog: async () => ({
      version: state.version,
      rows: state.items
        .filter((item) => item.ativo)
        .map((item) => ({
          ...item,
          variacoes: state.sizes.filter(
            (size) => size.item_id === item.id && size.ativo,
          ),
        })),
    }),
    activeKit: async (id) =>
      state.deliveries.find((row) => row.kit_ativo_participacao_id === id) ||
      null,
    previousOperation: async (id) => state.operations[id] || null,
    rememberOperation: async (id, assinatura, resultado) => {
      assert.ok(inside);
      state.operations[id] = { assinatura, resultado };
    },
    advanceCatalog: async () => {
      state.version++;
    },
    item: async (id) => state.items.find((item) => item.id === id) || null,
    variation: async (id) => state.sizes.find((size) => size.id === id) || null,
    duplicateSize: async (id, key, exceptId) =>
      state.sizes.some(
        (size) =>
          size.item_id === id &&
          size.tamanho_chave === key &&
          size.id !== exceptId,
      ),
    createItem: async (input) => {
      const row = { ...input, id: "item-" + state.items.length };
      state.items.push(row);
      return row;
    },
    createVariation: async (input) => {
      assert.equal(input.saldo, 0);
      const row = {
        ...input,
        custo_unitario: input.custo_centavos / 100,
        id: "size-" + state.sizes.length,
      };
      state.sizes.push(row);
      return row;
    },
    updateVariation: async (id, input) => {
      const row = state.sizes.find((row) => row.id === id)!;
      Object.assign(row, input);
      return row;
    },
    createMovement: async (input) => {
      assert.ok(inside);
      const row = { ...input, id: "move-" + state.moves.length };
      state.moves.push(row);
      return row;
    },
    createDelivery: async (input) => {
      const row = { ...input, id: "delivery-" + state.deliveries.length };
      state.deliveries.push(row);
      return row;
    },
    createDeliveredItem: async (input) => {
      const row = { ...input, id: "line-" + state.lines.length };
      state.lines.push(row);
      return row;
    },
    deliveryRecord: async (id) =>
      state.deliveries.find((row) => row.id === id) || null,
    deliveredItems: async (id) =>
      state.lines.filter((row) => row.entrega_id === id),
    updateDelivery: async (id, input) => {
      const row = state.deliveries.find((row) => row.id === id)!;
      Object.assign(row, input);
      return row;
    },
    recordAudit: async () => {
      assert.ok(inside);
      if (auditFails) throw new Error("audit failed");
      state.audit++;
    },
  });
  const unit: EstoqueUnitOfWork = {
    read: ports,
    run: async (work) => {
      const before = structuredClone(state);
      inside = true;
      try {
        return await work(ports);
      } catch (error) {
        state = before;
        throw error;
      } finally {
        inside = false;
      }
    },
  };
  return {
    service: new EstoqueService(unit, () => new Date("2026-11-03T15:00:00Z")),
    state: () => state,
    locks,
    context,
    failAudit: () => {
      auditFails = true;
    },
  };
}

test("legacy operation signatures retain UTF-16 key ordering independent of locale", async () => {
  const f = fixture();
  const data = {
    operacao_id: "00000000-0000-0000-0000-000000000001",
    nome: "Bota",
    epi: true,
    extra: { Z: 1, a: 2, "\u00e1": 3, A: 4 },
  };
  f.state().operations[data.operacao_id] = {
    assinatura:
      "84f988100ecd5cc34a00d5b9ed0f8d1287a376e1f4f8fecf4f633f59e5bf0772",
    resultado: JSON.stringify({ id: "original-item" }),
  };
  assert.deepEqual(await f.service.saveItem(undefined, data, actor), {
    id: "original-item",
  });
  assert.equal(f.state().items.length, 0);
  assert.equal(f.state().version, 0);
});

test("complete registration uses zero balance then movements, is idempotent, and rolls back with audit", async () => {
  const f = fixture(),
    input = {
      operacao_id: randomUUID(),
      nome: "Bota",
      epi: true,
      tamanhos: [
        { tamanho: "38", custo_unitario: 100.01, quantidade_inicial: 3 },
      ],
    };
  const first = await f.service.createComplete(input, actor);
  assert.deepEqual(await f.service.createComplete(input, actor), first);
  assert.equal(f.state().items.length, 1);
  assert.equal(f.state().sizes[0].custo_centavos, 10001);
  assert.equal(f.state().sizes[0].saldo, 3);
  assert.equal(f.state().moves.length, 1);
  assert.equal(f.state().audit, 1);
  f.failAudit();
  await assert.rejects(
    f.service.createComplete(
      { ...input, operacao_id: randomUUID(), nome: "Luva" },
      actor,
    ),
    /audit failed/,
  );
  assert.equal(f.state().items.length, 1);
  assert.equal(f.state().moves.length, 1);
});

test("kit enforces full composition and a single live kit, preserving order and historical costs on reversal", async () => {
  const f = fixture();
  for (const nome of ["Bota", "Luva"])
    await f.service.createComplete(
      {
        operacao_id: randomUUID(),
        nome,
        epi: true,
        tamanhos: [
          { tamanho: "Único", custo_unitario: 15, quantidade_inicial: 2 },
        ],
      },
      actor,
    );
  const preview = await f.service.preview(f.context.participation.id);
  const input = {
    operacao_id: randomUUID(),
    participacao_id: f.context.participation.id,
    versao: preview.versao,
    itens: f
      .state()
      .sizes.map((size) => ({ variacao_id: size.id, quantidade: 1 })),
  };
  await assert.rejects(
    f.service.deliver(
      "kit",
      { ...input, operacao_id: randomUUID(), itens: input.itens.slice(0, 1) },
      actor,
    ),
    /cada tipo de EPI/,
  );
  const delivery = await f.service.deliver("kit", input, actor);
  assert.deepEqual(f.locks.slice(-2), ["edital/participacao", "controle"]);
  await assert.rejects(
    f.service.deliver("kit", { ...input, operacao_id: randomUUID() }, actor),
    /já recebeu/,
  );
  f.state().sizes[0].custo_centavos = 9900;
  const reversed = await f.service.reverse(
    delivery.id,
    { operacao_id: randomUUID(), justificativa: "Devolvido integralmente" },
    actor,
  );
  assert.ok(reversed.estornado_em);
  assert.equal(f.state().sizes[0].saldo, 2);
  assert.equal(f.state().lines[0].custo_centavos, 1500);
  await assert.rejects(
    f.service.reverse(
      delivery.id,
      { operacao_id: randomUUID(), justificativa: "Outra tentativa" },
      actor,
    ),
    /já estornada/,
  );
});
