import AppError from "../../../../core/appError.js";

export const ftError = (statusCode: number, message: string) => {
  return new AppError(message, statusCode, "FT_MS");
};
