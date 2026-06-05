import { Request, Response, NextFunction } from 'express';
import { CreateOrderUseCase } from '../../../application/use-cases/CreateOrderUseCase';
import { GetOrderUseCase } from '../../../application/use-cases/GetOrderUseCase';
import { UpdateOrderStatusUseCase } from '../../../application/use-cases/UpdateOrderStatusUseCase';

export class OrderController {
  constructor(
    private readonly createOrder: CreateOrderUseCase,
    private readonly getOrder: GetOrderUseCase,
    private readonly updateOrderStatus: UpdateOrderStatusUseCase,
  ) {}

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const order = await this.createOrder.execute(req.body);
      res.status(201).json({ data: order });
    } catch (err) {
      next(err);
    }
  };

  getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const order = await this.getOrder.execute(req.params.id);
      res.status(200).json({ data: order });
    } catch (err) {
      next(err);
    }
  };

  confirm = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const order = await this.updateOrderStatus.execute(req.params.id, 'confirm');
      res.status(200).json({ data: order });
    } catch (err) {
      next(err);
    }
  };

  ship = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const order = await this.updateOrderStatus.execute(req.params.id, 'ship');
      res.status(200).json({ data: order });
    } catch (err) {
      next(err);
    }
  };

  cancel = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const order = await this.updateOrderStatus.execute(req.params.id, 'cancel');
      res.status(200).json({ data: order });
    } catch (err) {
      next(err);
    }
  };
}
