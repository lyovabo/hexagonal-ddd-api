import winston from 'winston';
import { config } from '../../../config';

export class Logger {
  private readonly logger: winston.Logger;

  constructor(context?: string) {
    this.logger = winston.createLogger({
      level: config.logging.level,
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        config.logging.format === 'json'
          ? winston.format.json()
          : winston.format.colorize(),
      ),
      defaultMeta: { service: 'hexagonal-ddd-api', context },
      transports: [new winston.transports.Console()],
    });
  }

  info(message: string, meta?: object): void {
    this.logger.info(message, meta);
  }

  warn(message: string, meta?: object): void {
    this.logger.warn(message, meta);
  }

  error(message: string, meta?: object): void {
    this.logger.error(message, meta);
  }

  debug(message: string, meta?: object): void {
    this.logger.debug(message, meta);
  }
}

export const logger = new Logger('app');
