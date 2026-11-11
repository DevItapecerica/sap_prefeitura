import { editalColumns } from "../models/ft-edital.schema.js";
import { DataTypes as D, QueryInterface, QueryTypes } from "sequelize";

const uuid = "CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin";
const timestamps = () => ({
  createdAt: { type: D.DATE, allowNull: false },
  updatedAt: { type: D.DATE, allowNull: false },
  deletedAt: { type: D.DATE, allowNull: true },
});

export default {
  async up(q: QueryInterface) {
    // This release targets a fresh schema. Never silently convert an existing FT population.
    const rows = await q.sequelize.query<{ total: number }>(
      "SELECT COUNT(*) AS total FROM edital",
      { type: QueryTypes.SELECT },
    );
    if (Number(rows[0].total))
      throw new Error(
        "FT edital workflow requires an empty FT database. Do not reset the application database automatically.",
      );
    for (const [name, definition] of Object.entries(editalColumns).filter(([name]) => name !== 'idade_maxima'))
      await q.addColumn("edital", name, definition);
    for (const table of ["pagadores", "turnos"]) {
      await q.addColumn(table, "edital_id", {
        type: uuid,
        allowNull: true,
        references: { model: "edital", key: "id" },
        onDelete: "RESTRICT",
      });
      const indexes = (await q.showIndex(table)) as any[];
      for (const index of indexes)
        if (
          index.unique &&
          index.fields.length === 1 &&
          index.fields[0].attribute === "nome"
        )
          await q.removeIndex(table, index.name);
      await q.addIndex(table, ["edital_id", "nome"], {
        unique: true,
        name: "uq_" + table + "_edital_nome",
      });
    }
    for (const table of ["ft_edital_locais", "ft_edital_beneficios"]) {
      await q.createTable(table, {
        id: { type: uuid, primaryKey: true, allowNull: false },
        edital_id: {
          type: uuid,
          allowNull: false,
          references: { model: "edital", key: "id" },
          onDelete: "RESTRICT",
        },
        nome: { type: D.STRING(120), allowNull: false },
        descricao: { type: D.TEXT, allowNull: true },
        ...timestamps(),
      });
      await q.addIndex(table, ["edital_id", "nome"], { unique: true });
    }
    await q.createTable("ft_inscricoes", {
      id: { type: uuid, primaryKey: true, allowNull: false },
      edital_id: {
        type: uuid,
        allowNull: false,
        references: { model: "edital", key: "id" },
        onDelete: "RESTRICT",
      },
      bolsista_id: {
        type: uuid,
        allowNull: false,
        references: { model: "bolsistas", key: "id" },
        onDelete: "RESTRICT",
      },
      respostas: { type: D.TEXT, allowNull: false },
      snapshot: { type: D.TEXT, allowNull: false },
      encaixe_motivo: { type: D.TEXT, allowNull: true },
      criado_por: { type: D.INTEGER, allowNull: false },
      status: {
        type: D.STRING(16),
        allowNull: false,
        defaultValue: "inscrito",
      },
      ...timestamps(),
    });
    await q.addIndex("ft_inscricoes", ["edital_id", "bolsista_id"], {
      unique: true,
      name: "uq_inscricao_edital_pessoa",
    });
    await q.addColumn("bolsistas_edital", "inscricao_id", {
      type: uuid,
      allowNull: true,
      references: { model: "ft_inscricoes", key: "id" },
      onDelete: "RESTRICT",
    });
    await q.addColumn("bolsistas_edital", "local_id", {
      type: uuid,
      allowNull: true,
      references: { model: "ft_edital_locais", key: "id" },
      onDelete: "RESTRICT",
    });
    await q.addColumn("bolsistas_edital", "ativado_em", {
      type: D.DATE,
      allowNull: true,
    });
    await q.changeColumn("bolsistas_edital", "status", {
      type: D.ENUM(
        "convocado",
        "ativo",
        "inativo",
        "concluido",
        "cancelado",
        "expirado",
      ),
      allowNull: false,
      defaultValue: "convocado",
    });
    await q.addIndex("bolsistas_edital", ["edital_id", "status"], {
      name: "ix_ft_ocupacao",
    });
    await q.addColumn("bolsista_faltas", "bolsista_edital_id", {
      type: uuid,
      allowNull: true,
      references: { model: "bolsistas_edital", key: "id" },
      onDelete: "RESTRICT",
    });
    await q.createTable("ft_workflow_eventos", {
      id: { type: uuid, primaryKey: true, allowNull: false },
      edital_id: { type: uuid, allowNull: false },
      recurso_id: { type: uuid, allowNull: false },
      acao: { type: D.STRING(48), allowNull: false },
      ator_id: { type: D.STRING(64), allowNull: false },
      request_id: { type: D.STRING(64), allowNull: false },
      motivo: { type: D.TEXT, allowNull: true },
      ...timestamps(),
    });
  },
  async down(q: QueryInterface) {
    const rows = await q.sequelize.query<{ total: number }>(
      "SELECT (SELECT COUNT(*) FROM ft_inscricoes) + (SELECT COUNT(*) FROM edital) AS total",
      { type: QueryTypes.SELECT },
    );
    if (Number(rows[0].total))
      throw new Error(
        "Rollback refused: preserve inscriptions and participation history; use a forward fix.",
      );
    await q.dropTable("ft_workflow_eventos");
    await q.removeColumn("bolsista_faltas", "bolsista_edital_id");
    await q.removeIndex("bolsistas_edital", "ix_ft_ocupacao");
    for (const col of ["ativado_em", "local_id", "inscricao_id"])
      await q.removeColumn("bolsistas_edital", col);
    await q.changeColumn("bolsistas_edital", "status", {
      type: D.ENUM("ativo", "inativo", "concluido", "cancelado", "expirado"),
      allowNull: false,
      defaultValue: "ativo",
    });
    for (const table of [
      "ft_inscricoes",
      "ft_edital_beneficios",
      "ft_edital_locais",
    ])
      await q.dropTable(table);
    for (const table of ["pagadores", "turnos"]) {
      const references = (await q.getForeignKeyReferencesForTable(
        table,
      )) as unknown as Array<{ columnName: string; constraintName: string }>;
      for (const reference of references)
        if (reference.columnName === "edital_id")
          await q.removeConstraint(table, reference.constraintName);
      await q.removeIndex(table, "uq_" + table + "_edital_nome");
      await q.removeColumn(table, "edital_id");
      await q.addIndex(table, ["nome"], { unique: true, name: "nome" });
    }
    for (const col of Object.keys(editalColumns).filter(name => name !== 'idade_maxima').reverse())
      await q.removeColumn("edital", col);
  },
};
