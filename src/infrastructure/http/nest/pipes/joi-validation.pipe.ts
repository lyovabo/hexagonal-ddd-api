import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';
import Joi from 'joi';

@Injectable()
export class JoiValidationPipe implements PipeTransform {
  constructor(private readonly schema: Joi.ObjectSchema) {}

  transform(value: unknown) {
    const { error, value: validated } = this.schema.validate(value, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      throw new BadRequestException({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request body',
          details: error.details.map(d => ({ field: d.path.join('.'), message: d.message })),
        },
      });
    }

    return validated;
  }
}
