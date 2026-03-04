export class AppError extends Error {
  public statusCode: number;
  public code: string;
  public isOperational: boolean;
  public originalError: any;

  constructor(message: string, statusCode = 500, code = "INTERNAL_ERROR", originalError?: any) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
  }
}

export default AppError;