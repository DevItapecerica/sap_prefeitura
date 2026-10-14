import { Op } from "sequelize";
import db from "../index.js";
import { FtSchedulerRepository } from "../../../../modules/ft-edital/domain/repositories/ft-scheduler.repository.js";

export class SequelizeFtSchedulerRepository implements FtSchedulerRepository {
  findExpiredActiveEditais(now: Date) {
    return db.Edital.findAll({
      where: {
        data_vencimento: { [Op.lt]: now },
        status: "ativo",
      },
      include: [
        {
          model: db.Bolsistas,
          as: "bolsistas",
          through: {
            where: { status: "ativo" },
            attributes: [
              "id",
              "bolsista_id",
              "edital_id",
              "status",
              "data_vinculo",
              "expire_at",
              "canceled_at",
              "concluded_at",
              "expired_at",
            ],
          },
        },
      ],
    });
  }

  findExpiredActiveVinculos(now: Date) {
    return db.BolsistasEdital.findAll({
      where: {
        expire_at: { [Op.lt]: now },
        status: "ativo",
      },
    });
  }

  async concludeExpiredEdital(edital: any) {
    return db.sequelize.transaction(async (transaction: any) => {
      let vinculosUpdated = 0;
      const now = new Date();
      const before = edital.toJSON();
      const vinculos: Array<{ before: unknown; after: unknown }> = [];

      edital.set("status", "inativo");
      await edital.save({ transaction });

      for (const bolsista of edital.get("bolsistas") || []) {
        const vinculo = bolsista.get("BolsistasEdital");

        if (vinculo) {
          const vinculoBefore = vinculo.toJSON();
          vinculo.set({
            status: "concluido",
            concluded_at: now,
          });
          await vinculo.save({ transaction });
          vinculosUpdated += 1;
          vinculos.push({
            before: vinculoBefore,
            after: vinculo.toJSON(),
          });
        }
      }

      return {
        editalId: edital.get("id"),
        editalName: edital.get("name"),
        vinculosUpdated,
        before,
        after: edital.toJSON(),
        vinculos,
      };
    });
  }

  async expireVinculo(vinculo: any) {
    return db.sequelize.transaction(async (transaction: any) => {
      const bolsistaId = vinculo.get("bolsista_id");
      const editalId = vinculo.get("edital_id");
      const before = {
        vinculo: vinculo.toJSON(),
        bolsistaId,
      };

      vinculo.set({
        status: "expirado",
        expired_at: new Date(),
      });
      await vinculo.save({ transaction });

      return {
        bolsistaId,
        vinculoId: vinculo.get("id"),
        editalId,
        before,
        after: {
          vinculo: vinculo.toJSON(),
          bolsistaId,
        },
      };
    });
  }
}
