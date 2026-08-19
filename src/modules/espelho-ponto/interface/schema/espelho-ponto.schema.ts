import { FastifySchema } from "fastify";

const text = { type: "string" } as const;
const requiredText = { type: "string", minLength: 1 } as const;

export const renderEspelhoPontoPdfSchema: FastifySchema = {
  tags: ["Espelhos de ponto"], summary: "Gerar espelho de ponto em PDF",
  security: [{ JWTToken: [] }],
  body: {
    type: "object", additionalProperties: false, required: ["servidor", "periodo", "dias", "totais"],
    properties: {
      name: text,
      servidor: { type: "object", additionalProperties: false, required: ["matricula", "nome"], properties: { matricula: requiredText, nome: requiredText, nomeAnterior: text, cargo: text, especialidade: text, unidade: text, horario: text, localTrabalho: text, endereco: text } },
      periodo: { type: "object", additionalProperties: false, required: ["referencia", "inicio", "fim"], properties: { referencia: { type: "string", pattern: "^(0[1-9]|1[0-2])/\\d{4}$" }, inicio: { type: "string", format: "date" }, fim: { type: "string", format: "date" } } },
      dias: { type: "array", minItems: 1, maxItems: 31, items: { type: "object", additionalProperties: false, required: ["data", "situacao", "horarioPrevisto", "marcacoes", "apontamentos"], properties: { data: { type: "string", format: "date" }, situacao: requiredText, horarioPrevisto: text, marcacoes: { type: "array", items: text }, apontamentos: { type: "array", items: text } } } },
      totais: { type: "object", additionalProperties: false, required: ["horaExtra50", "horaExtra100", "adicionalNoturno", "atrasoSaidaAntecipada", "faltas"], properties: { horaExtra50: text, horaExtra100: text, adicionalNoturno: text, atrasoSaidaAntecipada: text, faltas: text } },
      observacoes: text,
    },
  },
  response: { 200: { description: "Espelho de ponto em PDF", content: { "application/pdf": { schema: { type: "string", format: "binary" } } } } },
};
