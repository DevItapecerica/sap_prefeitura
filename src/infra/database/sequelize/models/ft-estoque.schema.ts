import { DataTypes as D } from 'sequelize';
const id = () => ({ type: D.UUID, defaultValue: D.UUIDV4, primaryKey: true });
const uuid = (allowNull = false) => ({ type: D.UUID, allowNull });
const text = (size: number) => ({ type: D.STRING(size), allowNull: false });
const integer = (value = 0) => ({ type: D.INTEGER.UNSIGNED, allowNull: false, defaultValue: value });
export const estoqueTables = {
  FtEstoqueControle: { table: 'ft_estoque_controle', columns: { id: { type: D.INTEGER, primaryKey: true }, versao: integer() } },
  FtEstoqueItem: { table: 'ft_estoque_itens', columns: { id: id(), nome: text(120), epi: { type: D.BOOLEAN, allowNull: false }, ativo: { type: D.BOOLEAN, allowNull: false, defaultValue: true } } },
  FtEstoqueVariacao: { table: 'ft_estoque_variacoes', columns: { id: id(), item_id: uuid(), tamanho: text(40), tamanho_chave: text(40), custo_centavos: integer(), saldo: integer(), ativo: { type: D.BOOLEAN, allowNull: false, defaultValue: true } } },
  FtEstoqueEntrega: { table: 'ft_estoque_entregas', columns: { id: id(), participacao_id: uuid(), edital_id: uuid(), bolsista_id: uuid(),
    kit_ativo_participacao_id: uuid(true), tipo: { type: D.ENUM('kit', 'individual'), allowNull: false }, autor_id: text(64), entregue_em: { type: D.DATE, allowNull: false },
    justificativa: { type: D.TEXT, allowNull: true }, total_centavos: { type: D.BIGINT.UNSIGNED, allowNull: false },
    estornado_em: { type: D.DATE, allowNull: true }, estornado_por: { type: D.STRING(64), allowNull: true }, motivo_estorno: { type: D.TEXT, allowNull: true } } },
  FtEstoqueEntregaItem: { table: 'ft_estoque_entrega_itens', columns: { id: id(), entrega_id: uuid(), variacao_id: uuid(), nome: text(120), tamanho: text(40), quantidade: integer(), custo_centavos: integer() } },
  FtEstoqueMovimento: { table: 'ft_estoque_movimentos', columns: { id: id(), variacao_id: uuid(), entrega_id: uuid(true), tipo: { type: D.ENUM('entrada', 'ajuste', 'entrega', 'estorno'), allowNull: false },
    delta: { type: D.INTEGER, allowNull: false }, saldo_apos: integer(), autor_id: text(64), data: { type: D.DATE, allowNull: false }, motivo: { type: D.TEXT, allowNull: true } } },
  FtEstoqueOperacao: { table: 'ft_estoque_operacoes', columns: { id: id(), assinatura: text(64), resultado: { type: D.TEXT('long'), allowNull: false } } },
};
export type EstoqueModel = keyof typeof estoqueTables;
