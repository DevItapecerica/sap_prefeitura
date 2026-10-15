import { PagadorCapacity } from "./pagador.js";

export const toPagadorCapacity = (
  pagador: { uuid: string; nome: string; quantidade: number | string },
  ativos: number,
): PagadorCapacity => {
  const quantidade = Number(pagador.quantidade);
  return {
    uuid: pagador.uuid,
    nome: pagador.nome,
    quantidade,
    ativos,
    disponiveis: Math.max(quantidade - ativos, 0),
  };
};
