import { PeaadRuleError } from "../../ft-bolsista/domain/errors/peaad-rule.error.js";
export const tamanhoKey = (value: string) =>
  value
    .trim()
    .replace(/\s+/g, " ")
    .normalize("NFKC")
    .toLocaleUpperCase("pt-BR");
export function cents(value: number) {
  const rounded = Math.round(value * 100);
  if (
    !Number.isFinite(value) ||
    value < 0 ||
    rounded > 999999999 ||
    Math.abs(value * 100 - rounded) > 0.000001
  )
    throw new PeaadRuleError(
      "STOCK_COST_INVALID",
      "Informe um custo válido, com até duas casas decimais.",
    );
  return rounded;
}
export function reason(value: unknown) {
  if (
    typeof value !== "string" ||
    value.trim().length < 3 ||
    value.trim().length > 1000
  )
    throw new PeaadRuleError(
      "STOCK_REASON_INVALID",
      "Informe uma justificativa de 3 a 1000 caracteres.",
    );
  return value.trim();
}
export const quantity = (value: number, signed = false) => {
  if (
    !Number.isInteger(value) ||
    value === 0 ||
    Math.abs(value) > 1000000 ||
    (!signed && value < 0)
  )
    throw new PeaadRuleError(
      "STOCK_QUANTITY_INVALID",
      "Informe uma quantidade inteira válida.",
    );
  return value as number;
};
export const text = (value: unknown, max: number) => {
  if (typeof value !== "string" || !value.trim() || value.trim().length > max)
    throw new PeaadRuleError(
      "STOCK_TEXT_INVALID",
      "Texto obrigatório ou acima do limite permitido.",
    );
  return value.trim().replace(/\s+/g, " ");
};
