import { Order } from '../../domain/entities/Order';
import { OrderResponseDto } from '../dtos/OrderDto';

export class OrderMapper {
  static toDto(order: Order): OrderResponseDto {
    return {
      id: order.id,
      customerId: order.customerId,
      status: order.status,
      items: order.items.map(item => ({
        productId: item.productId,
        productName: item.productName,
        quantity: item.quantity,
        unitPrice: item.unitPrice.amount,
        subtotal: item.subtotal.amount,
        currency: item.unitPrice.currency,
      })),
      total: {
        amount: order.total.amount,
        currency: order.total.currency,
      },
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString(),
    };
  }
}
