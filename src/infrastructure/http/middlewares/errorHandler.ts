import { Request, Response, NextFunction } from 'express';
import { logger } from './Logger';

export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
    public readonly code?: string,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: {
        code: err.code ?? 'APP_ERROR',
        message: err.message,
      },
    });
    return;
  }

  // Domain validation errors
  if (err.message.includes('not found')) {
    res.status(404).json({ error: { code: 'NOT_FOUND', message: err.message } });
    return;
  }

  if (err.message.includes('Cannot ') || err.message.includes('required')) {
    res.status(422).json({ error: { code: 'BUSINESS_RULE_VIOLATION', message: err.message } });
    return;
  }

  logger.error('Unhandled error', { error: err.message, stack: err.stack, path: req.path });
  res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } });
}

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    error: { code: 'ROUTE_NOT_FOUND', message: `Route ${req.method} ${req.path} not found` },
  });
}
