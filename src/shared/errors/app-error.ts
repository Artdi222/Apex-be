import { ErrorCodes } from './error-codes';

export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number,
    public code: ErrorCodes
  ) {
    super(message);
    this.name = 'AppError';
  }
}
