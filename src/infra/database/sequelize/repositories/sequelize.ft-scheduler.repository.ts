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
      let bolsistasUpdated = 0;
      let vinculosUpdated = 0;

      edital.set("status", "inativo");
      await edital.save({ transaction });

      for (const bolsista of edital.get("bolsistas") || []) {
        bolsista.set("status", "inativo");
        await bolsista.save({ transaction });
        bolsistasUpdated += 1;

        const vinculo = bolsista.get("BolsistasEdital");

        if (vinculo) {
          vinculo.set({
            status: "concluido",
            concluded_at: new Date(),
          });
          await vinculo.save({ transaction });
          vinculosUpdated += 1;
        }
      }

      return {
        editalId: edital.get("id"),
        editalName: edital.get("name"),
        bolsistasUpdated,
        vinculosUpdated,
      };
    });
  }

  async expireVinculo(vinculo: any) {
    return db.sequelize.transaction(async (transaction: any) => {
      const bolsistaId = vinculo.get("bolsista_id");
      const bolsista = await db.Bolsistas.findByPk(bolsistaId, {
        transaction,
      });

      if (bolsista) {
        bolsista.set("status", "inativo");
        await bolsista.save({ transaction });
      }

      vinculo.set({
        status: "expirado",
        expired_at: new Date(),
      });
      await vinculo.save({ transaction });

      return {
        bolsistaId,
        vinculoId: vinculo.get("id"),
      };
    });
  }
}
