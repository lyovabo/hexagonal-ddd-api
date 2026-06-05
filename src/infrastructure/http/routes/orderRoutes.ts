import { Router } from 'express';
import { OrderController } from '../controllers/OrderController';
import { validate, createOrderSchema } from '../middlewares/validate';

export function createOrderRouter(controller: OrderController): Router {
  const router = Router();

  router.post('/', validate(createOrderSchema), controller.create);
  router.get('/:id', controller.getById);
  router.patch('/:id/confirm', controller.confirm);
  router.patch('/:id/ship', controller.ship);
  router.patch('/:id/cancel', controller.cancel);

  return router;
}
