import db from "../index.js";
import type { DbObject } from "../../../../core/types/DbTypes.js";
import type {
  DeliveryReceipt,
  DeliveryReceiptRepository,
} from "../../../../modules/ft-comprovantes/domain/comprovante.js";
import { SequelizeStockRepository } from "./sequelize.estoque.repository.js";
import { SequelizeBeneficiosRepository } from "./sequelize.beneficios.repository.js";

export class SequelizeComprovanteEntregaRepository implements DeliveryReceiptRepository {
  constructor(private readonly database: DbObject = db) {}

  async material(id: string): Promise<DeliveryReceipt | null> {
    const stock = new SequelizeStockRepository(this.database);
    const record = await stock.deliveryRecord(id);
    if (!record) return null;
    const detail = await stock.delivery(id);
    const participation = await this.database.BolsistasEdital.findByPk(
      detail.participacao_id,
      { paranoid: false },
    );
    if (
      !participation ||
      String(participation.edital_id) !== detail.edital_id ||
      String(participation.bolsista_id) !== detail.bolsista_id
    )
      return null;
    const person = await this.database.Bolsistas.findByPk(detail.bolsista_id, {
      paranoid: false,
    });
    if (!person) return null;
    const citizen = await this.database.MunicipeModel.findByPk(
      person.municipe_uuid,
      {
        attributes: ["nome", "cpf"],
        paranoid: false,
      },
    );
    const edital = await this.database.Edital.findByPk(detail.edital_id, {
      paranoid: false,
    });
    if (!citizen || !edital) return null;
    return {
      id: detail.id,
      modalidade: detail.tipo,
      edital: String(edital.name),
      pessoa: { nome: String(citizen.nome), cpf: String(citizen.cpf) },
      entregue_em: new Date(detail.entregue_em).toISOString(),
      responsavel: detail.responsavel,
      itens: detail.itens.map(({ nome, tamanho, quantidade }) => ({
        nome,
        tamanho,
        quantidade,
      })),
      estorno: detail.estornado_em
        ? {
            data: new Date(detail.estornado_em).toISOString(),
            motivo: detail.motivo_estorno || "",
          }
        : null,
    };
  }

  async benefit(
    editalId: string,
    deliveryId: string,
  ): Promise<DeliveryReceipt | null> {
    const repository = new SequelizeBeneficiosRepository(this.database);
    const delivery = await repository.delivery(editalId, deliveryId);
    if (!delivery) return null;
    const context = await repository.participation(
      editalId,
      delivery.participacao_id,
    );
    const edital = await this.database.Edital.findByPk(editalId, {
      paranoid: false,
    });
    if (!context || !edital || context.pessoa.id !== delivery.pessoa_id)
      return null;
    return {
      id: delivery.id,
      modalidade: "beneficios",
      edital: String(edital.name),
      pessoa: { nome: context.pessoa.nome, cpf: context.pessoa.cpf },
      entregue_em: delivery.entregue_em,
      competencia: delivery.mes,
      responsavel: delivery.responsavel,
      itens: delivery.itens.map(({ nome, descricao }) => ({ nome, descricao })),
      estorno: delivery.estornado_em
        ? {
            data: delivery.estornado_em,
            motivo: delivery.motivo_estorno || "",
          }
        : null,
    };
  }
}
