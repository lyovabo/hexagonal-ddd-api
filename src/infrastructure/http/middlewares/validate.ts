import Joi from 'joi';
import { Request, Response, NextFunction } from 'express';

export const createOrderSchema = Joi.object({
  customerId: Joi.string().required(),
  items: Joi.array()
    .items(
      Joi.object({
        productId: Joi.string().required(),
        productName: Joi.string().required(),
        quantity: Joi.number().integer().min(1).required(),
        unitPrice: Joi.number().positive().required(),
        currency: Joi.string().length(3).uppercase().default('USD'),
      }),
    )
    .min(1)
    .required(),
});

export function validate(schema: Joi.ObjectSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error, value } = schema.validate(req.body, { abortEarly: false, stripUnknown: true });

    if (error) {
      res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request body',
          details: error.details.map(d => ({ field: d.path.join('.'), message: d.message })),
        },
      });
      return;
    }

    req.body = value;
    next();
  };
}
