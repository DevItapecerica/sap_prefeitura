import AppError from "../../../../core/appError.js";
import { BenefitRuleError } from "../../domain/beneficios.contracts.js";

export async function executeBenefitOperation<T>(
  work: () => Promise<T>,
): Promise<T> {
  try {
    return await work();
  } catch (error) {
    if (error instanceof BenefitRuleError) {
      const conflict = [
        "DUPLICATE",
        "BENEFIT_ALREADY_DELIVERED",
        "BENEFIT_ALREADY_REVERSED",
        "BENEFIT_INELIGIBLE",
      ].includes(error.code);
      throw new AppError(error.message, conflict ? 409 : 422, error.code);
    }
    throw error;
  }
}
export function requiredProgram<T>(value: T | null): T {
  if (!value)
    throw new AppError(
      "Edital não encontrado.",
      404,
      "BENEFIT_PROGRAM_NOT_FOUND",
    );
  return value;
}
export function requiredParticipation<T>(value: T | null): T {
  if (!value)
    throw new AppError(
      "Participação não encontrada neste edital.",
      404,
      "BENEFIT_PARTICIPATION_NOT_FOUND",
    );
  return value;
}
