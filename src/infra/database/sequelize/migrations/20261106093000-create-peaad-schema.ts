import { QueryInterface, literal } from "sequelize";
import { assertEmptyTables } from "./helpers/fresh-schema.js";

export const tables = [
  "edital",
  "bolsistas",
  "pagadores",
  "turnos",
  "ft_edital_locais",
  "ft_edital_beneficios",
  "payment_info",
  "bolsista_image",
  "ft_inscricoes",
  "bolsistas_edital",
  "bolsista_faltas",
  "bolsista_ocorrencias",
  "ft_workflow_eventos",
  "ft_relatorio_arquivos",
];

export default {
  async up(query: QueryInterface): Promise<void> {
    await query.createTable(
      "edital",
      {
        id: {
          type: "CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin",
          allowNull: false,
          primaryKey: true,
          defaultValue: literal("UUID()"),
        },
        name: { type: "VARCHAR(255)", allowNull: false },
        data_publicacao: { type: "DATETIME", allowNull: false },
        data_vencimento: { type: "DATETIME", allowNull: false },
        dia_pagamento: { type: "INT(11)", allowNull: false },
        valor_bolsa: { type: "DECIMAL(10,2)", allowNull: false },
        status: {
          type: "ENUM('ativo','inativo')",
          allowNull: true,
          defaultValue: "ativo",
        },
        createdAt: {
          type: "DATETIME",
          allowNull: false,
          defaultValue: literal("CURRENT_TIMESTAMP"),
        },
        updatedAt: {
          type: "DATETIME",
          allowNull: false,
          defaultValue: literal("CURRENT_TIMESTAMP"),
        },
        deletedAt: { type: "DATETIME", allowNull: true },
        fase: {
          type: "VARCHAR(16)",
          allowNull: false,
          defaultValue: "rascunho",
        },
        vigencia_inicio: { type: "DATE", allowNull: true },
        inscricoes_inicio: { type: "DATETIME", allowNull: true },
        inscricoes_fim: { type: "DATETIME", allowNull: true },
        vagas: { type: "INT(10) UNSIGNED", allowNull: false, defaultValue: 0 },
        carga_semanal: {
          type: "DECIMAL(6,2)",
          allowNull: false,
          defaultValue: 0,
        },
        carga_mensal: {
          type: "DECIMAL(6,2)",
          allowNull: false,
          defaultValue: 0,
        },
        duracao_meses: {
          type: "INT(10) UNSIGNED",
          allowNull: false,
          defaultValue: 6,
        },
        prorrogacao_meses: {
          type: "INT(10) UNSIGNED",
          allowNull: false,
          defaultValue: 0,
        },
        permitir_participacao_anterior: {
          type: "TINYINT(1)",
          allowNull: false,
          defaultValue: 0,
        },
        permitir_retorno: {
          type: "TINYINT(1)",
          allowNull: false,
          defaultValue: 0,
        },
        primeira_convocacao_em: { type: "DATETIME", allowNull: true },
        idade_maxima: { type: "INT(10) UNSIGNED", allowNull: false },
      },
      { engine: "InnoDB", charset: "utf8mb4", collate: "utf8mb4_general_ci" },
    );
    await query.createTable(
      "bolsistas",
      {
        id: {
          type: "CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin",
          allowNull: false,
          primaryKey: true,
          defaultValue: literal("UUID()"),
        },
        createdAt: {
          type: "DATETIME",
          allowNull: false,
          defaultValue: literal("CURRENT_TIMESTAMP"),
        },
        updatedAt: {
          type: "DATETIME",
          allowNull: false,
          defaultValue: literal("CURRENT_TIMESTAMP"),
        },
        deletedAt: { type: "DATETIME", allowNull: true },
        municipe_uuid: {
          type: "CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin",
          allowNull: false,
        },
      },
      { engine: "InnoDB", charset: "utf8mb4", collate: "utf8mb4_general_ci" },
    );
    await query.addIndex("bolsistas", ["municipe_uuid"], {
      name: "uq_bolsistas_municipe_uuid",
      unique: true,
    });
    await query.createTable(
      "pagadores",
      {
        uuid: {
          type: "CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin",
          allowNull: false,
          primaryKey: true,
        },
        nome: { type: "VARCHAR(255)", allowNull: false },
        quantidade: { type: "INT(10) UNSIGNED", allowNull: false },
        createdAt: { type: "DATETIME", allowNull: false },
        updatedAt: { type: "DATETIME", allowNull: false },
        deletedAt: { type: "DATETIME", allowNull: true },
        edital_id: {
          type: "CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin",
          allowNull: true,
        },
      },
      { engine: "InnoDB", charset: "utf8mb4", collate: "utf8mb4_general_ci" },
    );
    await query.addIndex("pagadores", ["edital_id", "nome"], {
      name: "uq_pagadores_edital_nome",
      unique: true,
    });
    await query.createTable(
      "turnos",
      {
        uuid: {
          type: "CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin",
          allowNull: false,
          primaryKey: true,
        },
        nome: { type: "VARCHAR(120)", allowNull: false },
        hora_inicio: { type: "TIME", allowNull: false },
        hora_fim: { type: "TIME", allowNull: false },
        createdAt: { type: "DATETIME", allowNull: false },
        updatedAt: { type: "DATETIME", allowNull: false },
        deletedAt: { type: "DATETIME", allowNull: true },
        edital_id: {
          type: "CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin",
          allowNull: true,
        },
      },
      { engine: "InnoDB", charset: "utf8mb4", collate: "utf8mb4_general_ci" },
    );
    await query.addIndex("turnos", ["edital_id", "nome"], {
      name: "uq_turnos_edital_nome",
      unique: true,
    });
    await query.createTable(
      "ft_edital_locais",
      {
        id: {
          type: "CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin",
          allowNull: false,
          primaryKey: true,
        },
        edital_id: {
          type: "CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin",
          allowNull: false,
        },
        nome: { type: "VARCHAR(120)", allowNull: false },
        descricao: { type: "TEXT", allowNull: true },
        createdAt: { type: "DATETIME", allowNull: false },
        updatedAt: { type: "DATETIME", allowNull: false },
        deletedAt: { type: "DATETIME", allowNull: true },
      },
      { engine: "InnoDB", charset: "utf8mb4", collate: "utf8mb4_general_ci" },
    );
    await query.addIndex("ft_edital_locais", ["edital_id", "nome"], {
      name: "ft_edital_locais_edital_id_nome",
      unique: true,
    });
    await query.createTable(
      "ft_edital_beneficios",
      {
        id: {
          type: "CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin",
          allowNull: false,
          primaryKey: true,
        },
        edital_id: {
          type: "CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin",
          allowNull: false,
        },
        nome: { type: "VARCHAR(120)", allowNull: false },
        descricao: { type: "TEXT", allowNull: true },
        createdAt: { type: "DATETIME", allowNull: false },
        updatedAt: { type: "DATETIME", allowNull: false },
        deletedAt: { type: "DATETIME", allowNull: true },
      },
      { engine: "InnoDB", charset: "utf8mb4", collate: "utf8mb4_general_ci" },
    );
    await query.addIndex("ft_edital_beneficios", ["edital_id", "nome"], {
      name: "ft_edital_beneficios_edital_id_nome",
      unique: true,
    });
    await query.createTable(
      "payment_info",
      {
        id: {
          type: "CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin",
          allowNull: false,
          primaryKey: true,
          defaultValue: literal("UUID()"),
        },
        bolsista_id: {
          type: "CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin",
          allowNull: false,
        },
        bco: { type: "VARCHAR(3)", allowNull: false },
        ag: { type: "VARCHAR(4)", allowNull: false },
        dig_ag: { type: "VARCHAR(1)", allowNull: false },
        conta: { type: "VARCHAR(11)", allowNull: false },
        dig_conta: { type: "VARCHAR(1)", allowNull: false },
        createdAt: {
          type: "DATETIME",
          allowNull: false,
          defaultValue: literal("CURRENT_TIMESTAMP"),
        },
        updatedAt: {
          type: "DATETIME",
          allowNull: false,
          defaultValue: literal("CURRENT_TIMESTAMP"),
        },
        deletedAt: { type: "DATETIME", allowNull: true },
      },
      { engine: "InnoDB", charset: "utf8mb4", collate: "utf8mb4_general_ci" },
    );
    await query.addIndex("payment_info", ["bolsista_id"], {
      name: "bolsista_id",
      unique: false,
    });
    await query.createTable(
      "bolsista_image",
      {
        id: {
          type: "CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin",
          allowNull: false,
          primaryKey: true,
          defaultValue: literal("UUID()"),
        },
        bolsista_id: {
          type: "CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin",
          allowNull: false,
        },
        type_id: { type: "INT(11)", allowNull: false },
        path: { type: "VARCHAR(255)", allowNull: false },
        mime: { type: "VARCHAR(255)", allowNull: false },
        createdAt: {
          type: "DATETIME",
          allowNull: false,
          defaultValue: literal("CURRENT_TIMESTAMP"),
        },
        updatedAt: {
          type: "DATETIME",
          allowNull: false,
          defaultValue: literal("CURRENT_TIMESTAMP"),
        },
        deletedAt: { type: "DATETIME", allowNull: true },
      },
      { engine: "InnoDB", charset: "utf8mb4", collate: "utf8mb4_general_ci" },
    );
    await query.addIndex("bolsista_image", ["bolsista_id"], {
      name: "bolsista_id",
      unique: false,
    });
    await query.createTable(
      "ft_inscricoes",
      {
        id: {
          type: "CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin",
          allowNull: false,
          primaryKey: true,
        },
        edital_id: {
          type: "CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin",
          allowNull: false,
        },
        bolsista_id: {
          type: "CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin",
          allowNull: false,
        },
        respostas: { type: "TEXT", allowNull: false },
        snapshot: { type: "TEXT", allowNull: false },
        encaixe_motivo: { type: "TEXT", allowNull: true },
        criado_por: { type: "INT(11)", allowNull: false },
        status: {
          type: "VARCHAR(16)",
          allowNull: false,
          defaultValue: "inscrito",
        },
        createdAt: { type: "DATETIME", allowNull: false },
        updatedAt: { type: "DATETIME", allowNull: false },
        deletedAt: { type: "DATETIME", allowNull: true },
        excecao_motivo: { type: "TEXT", allowNull: true },
        excecao_autor_id: { type: "VARCHAR(64)", allowNull: true },
        excecao_em: { type: "DATETIME", allowNull: true },
      },
      { engine: "InnoDB", charset: "utf8mb4", collate: "utf8mb4_general_ci" },
    );
    await query.addIndex("ft_inscricoes", ["edital_id", "bolsista_id"], {
      name: "uq_inscricao_edital_pessoa",
      unique: true,
    });
    await query.addIndex("ft_inscricoes", ["bolsista_id"], {
      name: "bolsista_id",
      unique: false,
    });
    await query.createTable(
      "bolsistas_edital",
      {
        bolsista_id: {
          type: "CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin",
          allowNull: false,
        },
        edital_id: {
          type: "CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin",
          allowNull: false,
        },
        data_vinculo: {
          type: "DATETIME",
          allowNull: false,
          defaultValue: literal("CURRENT_TIMESTAMP"),
        },
        status: {
          type: "ENUM('convocado','ativo','inativo','concluido','cancelado','expirado')",
          allowNull: false,
          defaultValue: "convocado",
        },
        expire_at: { type: "DATETIME", allowNull: true },
        prorrogated: { type: "TINYINT(1)", allowNull: false, defaultValue: 0 },
        createdAt: {
          type: "DATETIME",
          allowNull: false,
          defaultValue: literal("CURRENT_TIMESTAMP"),
        },
        updatedAt: {
          type: "DATETIME",
          allowNull: false,
          defaultValue: literal("CURRENT_TIMESTAMP"),
        },
        deletedAt: { type: "DATETIME", allowNull: true },
        id: {
          type: "CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin",
          allowNull: false,
          primaryKey: true,
          defaultValue: literal("UUID()"),
        },
        canceled_at: { type: "DATETIME", allowNull: true },
        concluded_at: { type: "DATETIME", allowNull: true },
        expired_at: { type: "DATETIME", allowNull: true },
        observacao: { type: "TEXT", allowNull: true },
        local: { type: "VARCHAR(255)", allowNull: false },
        pagador_id: {
          type: "CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin",
          allowNull: true,
        },
        turno_id: {
          type: "CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin",
          allowNull: true,
        },
        turno_nome_snapshot: { type: "VARCHAR(120)", allowNull: true },
        turno_hora_inicio_snapshot: { type: "TIME", allowNull: true },
        turno_hora_fim_snapshot: { type: "TIME", allowNull: true },
        inscricao_id: {
          type: "CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin",
          allowNull: true,
        },
        local_id: {
          type: "CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin",
          allowNull: true,
        },
        ativado_em: { type: "DATETIME", allowNull: true },
        excecao_motivo: { type: "TEXT", allowNull: true },
        excecao_autor_id: { type: "VARCHAR(64)", allowNull: true },
        excecao_em: { type: "DATETIME", allowNull: true },
      },
      { engine: "InnoDB", charset: "utf8mb4", collate: "utf8mb4_general_ci" },
    );
    await query.addIndex("bolsistas_edital", ["bolsista_id", "edital_id"], {
      name: "idx_bolsistas_edital_bolsista_edital",
      unique: false,
    });
    await query.addIndex("bolsistas_edital", ["pagador_id"], {
      name: "fk_bolsistas_edital_pagador_id",
      unique: false,
    });
    await query.addIndex(
      "bolsistas_edital",
      ["edital_id", "pagador_id", "status"],
      { name: "idx_bolsistas_edital_pagador_capacidade", unique: false },
    );
    await query.addIndex("bolsistas_edital", ["turno_id"], {
      name: "idx_bolsistas_edital_turno",
      unique: false,
    });
    await query.addIndex("bolsistas_edital", ["inscricao_id"], {
      name: "bolsistas_edital_inscricao_id_foreign_idx",
      unique: false,
    });
    await query.addIndex("bolsistas_edital", ["local_id"], {
      name: "bolsistas_edital_local_id_foreign_idx",
      unique: false,
    });
    await query.addIndex("bolsistas_edital", ["edital_id", "status"], {
      name: "ix_ft_ocupacao",
      unique: false,
    });
    await query.createTable(
      "bolsista_faltas",
      {
        id: {
          type: "CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin",
          allowNull: false,
          primaryKey: true,
          defaultValue: literal("UUID()"),
        },
        bolsista_id: {
          type: "CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin",
          allowNull: false,
        },
        edital_id: {
          type: "CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin",
          allowNull: false,
        },
        data_falta: { type: "DATE", allowNull: false },
        observacao: { type: "TEXT", allowNull: true },
        createdAt: {
          type: "DATETIME",
          allowNull: false,
          defaultValue: literal("CURRENT_TIMESTAMP"),
        },
        updatedAt: {
          type: "DATETIME",
          allowNull: false,
          defaultValue: literal("CURRENT_TIMESTAMP"),
        },
        deletedAt: { type: "DATETIME", allowNull: true },
        bolsista_edital_id: {
          type: "CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin",
          allowNull: true,
        },
      },
      { engine: "InnoDB", charset: "utf8mb4", collate: "utf8mb4_general_ci" },
    );
    await query.addIndex("bolsista_faltas", ["bolsista_id"], {
      name: "idx_bolsista_faltas_bolsista_id",
      unique: false,
    });
    await query.addIndex("bolsista_faltas", ["edital_id"], {
      name: "idx_bolsista_faltas_edital_id",
      unique: false,
    });
    await query.addIndex("bolsista_faltas", ["data_falta"], {
      name: "idx_bolsista_faltas_data_falta",
      unique: false,
    });
    await query.addIndex("bolsista_faltas", ["bolsista_edital_id"], {
      name: "bolsista_faltas_bolsista_edital_id_foreign_idx",
      unique: false,
    });
    await query.createTable(
      "bolsista_ocorrencias",
      {
        id: {
          type: "CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin",
          allowNull: false,
          primaryKey: true,
          defaultValue: literal("UUID()"),
        },
        bolsista_edital_id: {
          type: "CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin",
          allowNull: false,
        },
        data_ocorrencia: { type: "DATE", allowNull: false },
        descricao: { type: "TEXT", allowNull: false },
        author_id: { type: "INT(11)", allowNull: false },
        createdAt: {
          type: "DATETIME",
          allowNull: false,
          defaultValue: literal("CURRENT_TIMESTAMP"),
        },
        updatedAt: {
          type: "DATETIME",
          allowNull: false,
          defaultValue: literal("CURRENT_TIMESTAMP"),
        },
        deletedAt: { type: "DATETIME", allowNull: true },
      },
      { engine: "InnoDB", charset: "utf8mb4", collate: "utf8mb4_general_ci" },
    );
    await query.addIndex("bolsista_ocorrencias", ["author_id"], {
      name: "author_id",
      unique: false,
    });
    await query.addIndex("bolsista_ocorrencias", ["bolsista_edital_id"], {
      name: "idx_bolsista_ocorrencias_vinculo",
      unique: false,
    });
    await query.addIndex("bolsista_ocorrencias", ["data_ocorrencia"], {
      name: "idx_bolsista_ocorrencias_data",
      unique: false,
    });
    await query.createTable(
      "ft_workflow_eventos",
      {
        id: {
          type: "CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin",
          allowNull: false,
          primaryKey: true,
        },
        edital_id: {
          type: "CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin",
          allowNull: false,
        },
        recurso_id: {
          type: "CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin",
          allowNull: false,
        },
        acao: { type: "VARCHAR(48)", allowNull: false },
        ator_id: { type: "VARCHAR(64)", allowNull: false },
        request_id: { type: "VARCHAR(64)", allowNull: false },
        motivo: { type: "TEXT", allowNull: true },
        createdAt: { type: "DATETIME", allowNull: false },
        updatedAt: { type: "DATETIME", allowNull: false },
        deletedAt: { type: "DATETIME", allowNull: true },
      },
      { engine: "InnoDB", charset: "utf8mb4", collate: "utf8mb4_general_ci" },
    );
    await query.addIndex(
      "ft_workflow_eventos",
      ["edital_id", "recurso_id", "createdAt", "id"],
      { name: "idx_ft_eventos_timeline", unique: false },
    );
    await query.createTable(
      "ft_relatorio_arquivos",
      {
        id: {
          type: "CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin",
          allowNull: false,
          primaryKey: true,
        },
        nome_arquivo: { type: "VARCHAR(255)", allowNull: false },
        status: {
          type: "ENUM('aguardando','processando','concluido','erro','excluido')",
          allowNull: false,
          defaultValue: "aguardando",
        },
        edital_id: {
          type: "CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin",
          allowNull: false,
        },
        mes: { type: "VARCHAR(7)", allowNull: false },
        solicitado_por: { type: "INT(11)", allowNull: false },
        caminho_arquivo: { type: "VARCHAR(1024)", allowNull: true },
        tamanho_bytes: { type: "BIGINT(20)", allowNull: true },
        total_bolsistas: { type: "INT(11)", allowNull: false, defaultValue: 0 },
        total_gerados: { type: "INT(11)", allowNull: false, defaultValue: 0 },
        total_falhas: { type: "INT(11)", allowNull: false, defaultValue: 0 },
        tentativas: { type: "INT(11)", allowNull: false, defaultValue: 0 },
        mensagem_erro: { type: "TEXT", allowNull: true },
        iniciado_em: { type: "DATETIME", allowNull: true },
        concluido_em: { type: "DATETIME", allowNull: true },
        download_iniciado_em: { type: "DATETIME", allowNull: true },
        baixado_em: { type: "DATETIME", allowNull: true },
        excluido_em: { type: "DATETIME", allowNull: true },
        created_at: { type: "DATETIME", allowNull: false },
        updated_at: { type: "DATETIME", allowNull: false },
        tipo: {
          type: "VARCHAR(32)",
          allowNull: false,
          defaultValue: "espelhos_ponto",
        },
      },
      { engine: "InnoDB", charset: "utf8mb4", collate: "utf8mb4_general_ci" },
    );
    await query.addIndex("ft_relatorio_arquivos", ["edital_id"], {
      name: "edital_id",
      unique: false,
    });
    await query.addIndex("ft_relatorio_arquivos", ["status"], {
      name: "ft_relatorio_arquivos_status",
      unique: false,
    });
    await query.addIndex("ft_relatorio_arquivos", ["solicitado_por"], {
      name: "ft_relatorio_arquivos_solicitado_por",
      unique: false,
    });
    await query.addIndex("ft_relatorio_arquivos", ["created_at"], {
      name: "ft_relatorio_arquivos_created_at",
      unique: false,
    });
    await query.addConstraint("bolsistas", {
      fields: ["municipe_uuid"],
      type: "foreign key",
      name: "fk_bolsistas_municipe_uuid",
      references: { table: "municipes", field: "uuid" },
      onUpdate: "CASCADE",
      onDelete: "RESTRICT",
    });
    await query.addConstraint("pagadores", {
      fields: ["edital_id"],
      type: "foreign key",
      name: "pagadores_edital_id_foreign_idx",
      references: { table: "edital", field: "id" },
      onUpdate: "RESTRICT",
      onDelete: "RESTRICT",
    });
    await query.addConstraint("turnos", {
      fields: ["edital_id"],
      type: "foreign key",
      name: "turnos_edital_id_foreign_idx",
      references: { table: "edital", field: "id" },
      onUpdate: "RESTRICT",
      onDelete: "RESTRICT",
    });
    await query.addConstraint("ft_edital_locais", {
      fields: ["edital_id"],
      type: "foreign key",
      name: "ft_edital_locais_ibfk_1",
      references: { table: "edital", field: "id" },
      onUpdate: "RESTRICT",
      onDelete: "RESTRICT",
    });
    await query.addConstraint("ft_edital_beneficios", {
      fields: ["edital_id"],
      type: "foreign key",
      name: "ft_edital_beneficios_ibfk_1",
      references: { table: "edital", field: "id" },
      onUpdate: "RESTRICT",
      onDelete: "RESTRICT",
    });
    await query.addConstraint("payment_info", {
      fields: ["bolsista_id"],
      type: "foreign key",
      name: "payment_info_ibfk_1",
      references: { table: "bolsistas", field: "id" },
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
    });
    await query.addConstraint("bolsista_image", {
      fields: ["bolsista_id"],
      type: "foreign key",
      name: "bolsista_image_ibfk_1",
      references: { table: "bolsistas", field: "id" },
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
    });
    await query.addConstraint("ft_inscricoes", {
      fields: ["edital_id"],
      type: "foreign key",
      name: "ft_inscricoes_ibfk_1",
      references: { table: "edital", field: "id" },
      onUpdate: "RESTRICT",
      onDelete: "RESTRICT",
    });
    await query.addConstraint("ft_inscricoes", {
      fields: ["bolsista_id"],
      type: "foreign key",
      name: "ft_inscricoes_ibfk_2",
      references: { table: "bolsistas", field: "id" },
      onUpdate: "RESTRICT",
      onDelete: "RESTRICT",
    });
    await query.addConstraint("bolsistas_edital", {
      fields: ["bolsista_id"],
      type: "foreign key",
      name: "bolsistas_edital_ibfk_1",
      references: { table: "bolsistas", field: "id" },
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
    });
    await query.addConstraint("bolsistas_edital", {
      fields: ["edital_id"],
      type: "foreign key",
      name: "bolsistas_edital_ibfk_2",
      references: { table: "edital", field: "id" },
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
    });
    await query.addConstraint("bolsistas_edital", {
      fields: ["inscricao_id"],
      type: "foreign key",
      name: "bolsistas_edital_inscricao_id_foreign_idx",
      references: { table: "ft_inscricoes", field: "id" },
      onUpdate: "RESTRICT",
      onDelete: "RESTRICT",
    });
    await query.addConstraint("bolsistas_edital", {
      fields: ["local_id"],
      type: "foreign key",
      name: "bolsistas_edital_local_id_foreign_idx",
      references: { table: "ft_edital_locais", field: "id" },
      onUpdate: "RESTRICT",
      onDelete: "RESTRICT",
    });
    await query.addConstraint("bolsistas_edital", {
      fields: ["pagador_id"],
      type: "foreign key",
      name: "fk_bolsistas_edital_pagador_id",
      references: { table: "pagadores", field: "uuid" },
      onUpdate: "CASCADE",
      onDelete: "RESTRICT",
    });
    await query.addConstraint("bolsistas_edital", {
      fields: ["turno_id"],
      type: "foreign key",
      name: "fk_bolsistas_edital_turno_id",
      references: { table: "turnos", field: "uuid" },
      onUpdate: "CASCADE",
      onDelete: "RESTRICT",
    });
    await query.addConstraint("bolsista_faltas", {
      fields: ["bolsista_edital_id"],
      type: "foreign key",
      name: "bolsista_faltas_bolsista_edital_id_foreign_idx",
      references: { table: "bolsistas_edital", field: "id" },
      onUpdate: "RESTRICT",
      onDelete: "RESTRICT",
    });
    await query.addConstraint("bolsista_faltas", {
      fields: ["bolsista_id"],
      type: "foreign key",
      name: "bolsista_faltas_ibfk_1",
      references: { table: "bolsistas", field: "id" },
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
    });
    await query.addConstraint("bolsista_faltas", {
      fields: ["edital_id"],
      type: "foreign key",
      name: "bolsista_faltas_ibfk_2",
      references: { table: "edital", field: "id" },
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
    });
    await query.addConstraint("bolsista_ocorrencias", {
      fields: ["bolsista_edital_id"],
      type: "foreign key",
      name: "bolsista_ocorrencias_ibfk_1",
      references: { table: "bolsistas_edital", field: "id" },
      onUpdate: "CASCADE",
      onDelete: "RESTRICT",
    });
    await query.addConstraint("bolsista_ocorrencias", {
      fields: ["author_id"],
      type: "foreign key",
      name: "bolsista_ocorrencias_ibfk_2",
      references: { table: "users", field: "id" },
      onUpdate: "CASCADE",
      onDelete: "RESTRICT",
    });
    await query.addConstraint("ft_relatorio_arquivos", {
      fields: ["edital_id"],
      type: "foreign key",
      name: "ft_relatorio_arquivos_ibfk_1",
      references: { table: "edital", field: "id" },
      onUpdate: "CASCADE",
      onDelete: "RESTRICT",
    });
    await query.addConstraint("ft_relatorio_arquivos", {
      fields: ["solicitado_por"],
      type: "foreign key",
      name: "ft_relatorio_arquivos_ibfk_2",
      references: { table: "users", field: "id" },
      onUpdate: "CASCADE",
      onDelete: "RESTRICT",
    });
  },
  async down(query: QueryInterface): Promise<void> {
    await assertEmptyTables(query, [
      "edital",
      "bolsistas",
      "pagadores",
      "turnos",
      "ft_edital_locais",
      "ft_edital_beneficios",
      "payment_info",
      "bolsista_image",
      "ft_inscricoes",
      "bolsistas_edital",
      "bolsista_faltas",
      "bolsista_ocorrencias",
      "ft_workflow_eventos",
      "ft_relatorio_arquivos",
    ]);
    await query.dropTable("ft_relatorio_arquivos");
    await query.dropTable("ft_workflow_eventos");
    await query.dropTable("bolsista_ocorrencias");
    await query.dropTable("bolsista_faltas");
    await query.dropTable("bolsistas_edital");
    await query.dropTable("ft_inscricoes");
    await query.dropTable("bolsista_image");
    await query.dropTable("payment_info");
    await query.dropTable("ft_edital_beneficios");
    await query.dropTable("ft_edital_locais");
    await query.dropTable("turnos");
    await query.dropTable("pagadores");
    await query.dropTable("bolsistas");
    await query.dropTable("edital");
  },
};
