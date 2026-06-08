import { ftError } from "./ft-error.js";

export const pagador = [
  {
    id: "9d0f3aa1-1143-48d2-9cc2-45d38998fe36",
    name: "Secretaria de Esporte e Lazer",
    max_bolsista: 12,
  },
  {
    id: "e3f162d8-6187-456c-b85d-fc9243dcbce8",
    name: "Secretaria de Planejamento e Meio Ambiente",
    max_bolsista: 20,
  },
  {
    id: "22bb6f70-e3fe-49ac-bd62-1fb25afe0a4a",
    name: "Secretaria de Turismo",
    max_bolsista: 5,
  },
  {
    id: "a763d7f0-8d38-45c6-b985-e9143ca7f4d1",
    name: "Secretaria do Desenvolvimento Social e Relacoes do Trabalho",
    max_bolsista: 20,
  },
  {
    id: "20e5601e-d3e8-4e63-8991-68d03a14ba2f",
    name: "Secretaria de Servicos Urbanos",
    max_bolsista: 193,
  },
  {
    id: "d5f9db73-ea63-442d-9aec-05dd5edcd990",
    name: "Secretaria de Educacao",
    max_bolsista: 100,
  },
  {
    id: "290d6314-54d9-4879-8220-0deb321ef892",
    name: "Secretaria de Cultura",
    max_bolsista: 5,
  },
];

export const verifyPagador = (target: string) => {
  const found = pagador.find((item) => item.id === target);

  if (!found) {
    throw ftError(403, "Pagador nao encontrado");
  }

  return found;
};

export const verifyQuantityPagador = (
  maxBolsista: number,
  bolsistaQuantity: number,
) => {
  if (maxBolsista <= bolsistaQuantity) {
    throw ftError(403, "Quantidade maxima de bolsistas alcancada");
  }
};
