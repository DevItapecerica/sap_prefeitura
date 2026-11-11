import type { FastifyRequest } from "fastify";
import type { EstoqueService } from "../../application/estoque.service.js";
import type {
  StockQuery,
  CompleteInput,
  ItemInput,
  VariationInput,
  Operation,
  StockInput,
  DeliveryInput,
  ReversalInput,
} from "../../domain/estoque.contracts.js";
export type EstoqueUseCases = Pick<
  EstoqueService,
  | "items"
  | "createComplete"
  | "item"
  | "saveItem"
  | "saveVariation"
  | "variations"
  | "variation"
  | "stock"
  | "movements"
  | "recipients"
  | "preview"
  | "deliver"
  | "deliveries"
  | "delivery"
  | "reverse"
>;
export class EstoqueController {
  constructor(private service: EstoqueUseCases) {}
  readonly listItems = (
    r: FastifyRequest<{
      Querystring: StockQuery;
      Params: Record<string, never>;
      Body: never;
    }>,
  ) => this.service.items(r.query);
  readonly createComplete = (
    r: FastifyRequest<{
      Querystring: StockQuery;
      Params: Record<string, never>;
      Body: CompleteInput;
    }>,
  ) => this.service.createComplete(r.body, { id: r.user.id, requestId: r.id });
  readonly getItem = (
    r: FastifyRequest<{
      Querystring: StockQuery;
      Params: { id: string };
      Body: never;
    }>,
  ) => this.service.item(r.params.id);
  readonly createItem = (
    r: FastifyRequest<{
      Querystring: StockQuery;
      Params: Record<string, never>;
      Body: ItemInput;
    }>,
  ) =>
    this.service.saveItem(undefined, r.body, {
      id: r.user.id,
      requestId: r.id,
    });
  readonly updateItem = (
    r: FastifyRequest<{
      Querystring: StockQuery;
      Params: { id: string };
      Body: ItemInput;
    }>,
  ) =>
    this.service.saveItem(r.params.id, r.body, {
      id: r.user.id,
      requestId: r.id,
    });
  readonly removeItem = (
    r: FastifyRequest<{
      Querystring: StockQuery;
      Params: { id: string };
      Body: Operation;
    }>,
  ) =>
    this.service.saveItem(
      r.params.id,
      r.body,
      { id: r.user.id, requestId: r.id },
      true,
    );
  readonly listVariations = (
    r: FastifyRequest<{
      Querystring: StockQuery;
      Params: Record<string, never>;
      Body: never;
    }>,
  ) => this.service.variations(r.query);
  readonly listItemVariations = (
    r: FastifyRequest<{
      Querystring: StockQuery;
      Params: { id: string };
      Body: never;
    }>,
  ) => this.service.variations({ ...r.query, item_id: r.params.id });
  readonly getVariation = (
    r: FastifyRequest<{
      Querystring: StockQuery;
      Params: { id: string };
      Body: never;
    }>,
  ) => this.service.variation(r.params.id);
  readonly createVariation = (
    r: FastifyRequest<{
      Querystring: StockQuery;
      Params: { id: string };
      Body: VariationInput;
    }>,
  ) =>
    this.service.saveVariation(r.params.id, undefined, r.body, {
      id: r.user.id,
      requestId: r.id,
    });
  readonly updateVariation = (
    r: FastifyRequest<{
      Querystring: StockQuery;
      Params: { itemId: string; id: string };
      Body: VariationInput;
    }>,
  ) =>
    this.service.saveVariation(r.params.itemId, r.params.id, r.body, {
      id: r.user.id,
      requestId: r.id,
    });
  readonly removeVariation = (
    r: FastifyRequest<{
      Querystring: StockQuery;
      Params: { itemId: string; id: string };
      Body: Operation;
    }>,
  ) =>
    this.service.saveVariation(
      r.params.itemId,
      r.params.id,
      r.body,
      { id: r.user.id, requestId: r.id },
      true,
    );
  readonly registerEntry = (
    r: FastifyRequest<{
      Querystring: StockQuery;
      Params: { id: string };
      Body: StockInput;
    }>,
  ) =>
    this.service.stock(
      r.params.id,
      r.body,
      { id: r.user.id, requestId: r.id },
      false,
    );
  readonly adjustStock = (
    r: FastifyRequest<{
      Querystring: StockQuery;
      Params: { id: string };
      Body: StockInput;
    }>,
  ) =>
    this.service.stock(
      r.params.id,
      r.body,
      { id: r.user.id, requestId: r.id },
      true,
    );
  readonly listMovements = (
    r: FastifyRequest<{
      Querystring: StockQuery;
      Params: Record<string, never>;
      Body: never;
    }>,
  ) => this.service.movements(r.query);
  readonly listRecipients = (
    r: FastifyRequest<{
      Querystring: StockQuery;
      Params: Record<string, never>;
      Body: never;
    }>,
  ) => this.service.recipients(r.query);
  readonly previewDelivery = (
    r: FastifyRequest<{
      Querystring: StockQuery;
      Params: { id: string };
      Body: never;
    }>,
  ) => this.service.preview(r.params.id);
  readonly deliverKit = (
    r: FastifyRequest<{
      Querystring: StockQuery;
      Params: Record<string, never>;
      Body: DeliveryInput;
    }>,
  ) => this.service.deliver("kit", r.body, { id: r.user.id, requestId: r.id });
  readonly deliverIndividual = (
    r: FastifyRequest<{
      Querystring: StockQuery;
      Params: Record<string, never>;
      Body: DeliveryInput;
    }>,
  ) =>
    this.service.deliver("individual", r.body, {
      id: r.user.id,
      requestId: r.id,
    });
  readonly listDeliveries = (
    r: FastifyRequest<{
      Querystring: StockQuery;
      Params: Record<string, never>;
      Body: never;
    }>,
  ) => this.service.deliveries(r.query);
  readonly getDelivery = (
    r: FastifyRequest<{
      Querystring: StockQuery;
      Params: { id: string };
      Body: never;
    }>,
  ) => this.service.delivery(r.params.id);
  readonly reverseDelivery = (
    r: FastifyRequest<{
      Querystring: StockQuery;
      Params: { id: string };
      Body: ReversalInput;
    }>,
  ) =>
    this.service.reverse(r.params.id, r.body, {
      id: r.user.id,
      requestId: r.id,
    });
}
