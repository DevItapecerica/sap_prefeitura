import { DataTypes as D } from 'sequelize';

// Authorization belongs to each operation, never to a client-supplied flag.
export const exceptionColumns = {
  excecao_motivo: { type: D.TEXT, allowNull: true },
  excecao_autor_id: { type: D.STRING(64), allowNull: true },
  excecao_em: { type: D.DATE, allowNull: true },
};
