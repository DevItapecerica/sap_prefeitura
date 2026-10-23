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
      const current = await db.Edital.findByPk(edital.get('id'), { transaction, lock: transaction.LOCK.UPDATE });
      if (!current || current.get('status') !== 'ativo' || new Date(current.get('data_vencimento')) >= new Date()) return { editalId: edital.get('id'), editalName: edital.get('name'), vinculosUpdated: 0, before: {}, after: {}, vinculos: [] };
      edital = current;
      let vinculosUpdated = 0;
      const now = new Date();
      const before = edital.toJSON();
      const vinculos: Array<{ before: unknown; after: unknown }> = [];

      edital.set("status", "inativo");
      edital.set('fase', 'encerrado');
      await edital.save({ transaction });

      await db.BolsistasEdital.update({ status: 'cancelado', canceled_at: now, observacao: 'Vigencia do edital encerrada' }, { where: { edital_id: edital.get('id'), status: 'convocado' }, transaction });

      const active = await db.BolsistasEdital.findAll({ where: { edital_id: edital.get('id'), status: 'ativo' }, transaction, lock: transaction.LOCK.UPDATE });
      for (const vinculo of active) {

        if (vinculo) {
          const vinculoBefore = vinculo.toJSON();
          vinculo.set({
            status: "concluido",
            concluded_at: edital.get('data_vencimento'),
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
      await db.Edital.findByPk(vinculo.get('edital_id'), { transaction, lock: transaction.LOCK.UPDATE });
      vinculo = await db.BolsistasEdital.findByPk(vinculo.get('id'), { transaction, lock: transaction.LOCK.UPDATE });
      if (vinculo.get('status') !== 'ativo' || new Date(vinculo.get('expire_at')) >= new Date()) return { bolsistaId: vinculo.get('bolsista_id'), editalId: vinculo.get('edital_id'), vinculoId: vinculo.get('id'), before: {}, after: {} };
      const bolsistaId = vinculo.get("bolsista_id");
      const editalId = vinculo.get("edital_id");
      const before = {
        vinculo: vinculo.toJSON(),
        bolsistaId,
      };

      vinculo.set({
        status: "expirado",
        expired_at: vinculo.get('expire_at'),
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
