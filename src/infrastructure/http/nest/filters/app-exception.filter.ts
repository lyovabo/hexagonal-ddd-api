import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { AppError } from '../../middlewares/errorHandler';
import { logger } from '../../middlewares/Logger';

@Catch()
export class AppExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<{ path: string; method: string }>();

    if (exception instanceof AppError) {
      res.status(exception.statusCode).json({
        error: { code: exception.code ?? 'APP_ERROR', message: exception.message },
      });
      return;
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const body = exception.getResponse();
      res.status(status).json(
        typeof body === 'string'
          ? { error: { code: 'HTTP_EXCEPTION', message: body } }
          : body,
      );
      return;
    }

    if (exception instanceof Error) {
      if (exception.message.includes('not found')) {
        res.status(404).json({ error: { code: 'NOT_FOUND', message: exception.message } });
        return;
      }
      if (exception.message.includes('Cannot ') || exception.message.includes('required')) {
        res.status(422).json({ error: { code: 'BUSINESS_RULE_VIOLATION', message: exception.message } });
        return;
      }
      logger.error('Unhandled error', {
        error: exception.message,
        stack: exception.stack,
        path: req.path,
      });
    }

    res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' },
    });
  }
}
