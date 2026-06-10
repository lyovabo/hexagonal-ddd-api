import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  HttpCode,
  HttpStatus,
  UsePipes,
  Inject,
} from '@nestjs/common';
import Joi from 'joi';
import { CreateOrderUseCase } from '../../application/use-cases/CreateOrderUseCase';
import { GetOrderUseCase } from '../../application/use-cases/GetOrderUseCase';
import { UpdateOrderStatusUseCase } from '../../application/use-cases/UpdateOrderStatusUseCase';
import { CreateOrderDto } from '../../application/dtos/OrderDto';
import {
  CREATE_ORDER_USE_CASE,
  GET_ORDER_USE_CASE,
  UPDATE_ORDER_STATUS_USE_CASE,
} from './order.tokens';
import { JoiValidationPipe } from '../common/joi-validation.pipe';

const createOrderSchema = Joi.object({
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

@Controller('orders')
export class NestOrderController {
  constructor(
    @Inject(CREATE_ORDER_USE_CASE) private readonly createOrder: CreateOrderUseCase,
    @Inject(GET_ORDER_USE_CASE) private readonly getOrder: GetOrderUseCase,
    @Inject(UPDATE_ORDER_STATUS_USE_CASE) private readonly updateOrderStatus: UpdateOrderStatusUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(new JoiValidationPipe(createOrderSchema))
  async create(@Body() dto: CreateOrderDto) {
    const order = await this.createOrder.execute(dto);
    return { data: order };
  }

  @Get(':id')
  async getById(@Param('id') id: string) {
    const order = await this.getOrder.execute(id);
    return { data: order };
  }

  @Patch(':id/confirm')
  async confirm(@Param('id') id: string) {
    const order = await this.updateOrderStatus.execute(id, 'confirm');
    return { data: order };
  }

  @Patch(':id/ship')
  async ship(@Param('id') id: string) {
    const order = await this.updateOrderStatus.execute(id, 'ship');
    return { data: order };
  }

  @Patch(':id/cancel')
  async cancel(@Param('id') id: string) {
    const order = await this.updateOrderStatus.execute(id, 'cancel');
    return { data: order };
  }
}
