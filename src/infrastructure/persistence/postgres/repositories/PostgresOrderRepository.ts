import { Pool } from 'pg';
import { Order, OrderProps } from '../../../../domain/entities/Order';
import { OrderRepository } from '../../../../domain/repositories/OrderRepository';
import { OrderItem } from '../../../../domain/value-objects/OrderItem';
import { Money } from '../../../../domain/value-objects/Money';
import { OrderStatus } from '../../../../domain/value-objects/OrderStatus';

export class PostgresOrderRepository implements OrderRepository {
  constructor(private readonly pool: Pool) {}

  async findById(id: string): Promise<Order | null> {
    const orderResult = await this.pool.query(
      'SELECT * FROM orders WHERE id = $1',
      [id],
    );
    if (orderResult.rows.length === 0) return null;

    const itemsResult = await this.pool.query(
      'SELECT * FROM order_items WHERE order_id = $1',
      [id],
    );

    return this.toDomain(orderResult.rows[0], itemsResult.rows);
  }

  async findByCustomerId(customerId: string): Promise<Order[]> {
    const ordersResult = await this.pool.query(
      'SELECT * FROM orders WHERE customer_id = $1 ORDER BY created_at DESC',
      [customerId],
    );

    return Promise.all(
      ordersResult.rows.map(async row => {
        const items = await this.pool.query(
          'SELECT * FROM order_items WHERE order_id = $1',
          [row.id],
        );
        return this.toDomain(row, items.rows);
      }),
    );
  }

  async save(order: Order): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      await client.query(
        `INSERT INTO orders (id, customer_id, status, total_amount, total_currency, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          order.id,
          order.customerId,
          order.status,
          order.total.amount,
          order.total.currency,
          order.createdAt,
          order.updatedAt,
        ],
      );

      for (const item of order.items) {
        await client.query(
          `INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price, currency)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            order.id,
            item.productId,
            item.productName,
            item.quantity,
            item.unitPrice.amount,
            item.unitPrice.currency,
          ],
        );
      }

      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async update(order: Order): Promise<void> {
    await this.pool.query(
      `UPDATE orders SET status = $1, updated_at = $2 WHERE id = $3`,
      [order.status, order.updatedAt, order.id],
    );
  }

  async delete(id: string): Promise<void> {
    await this.pool.query('DELETE FROM orders WHERE id = $1', [id]);
  }

  async exists(id: string): Promise<boolean> {
    const result = await this.pool.query(
      'SELECT 1 FROM orders WHERE id = $1',
      [id],
    );
    return result.rows.length > 0;
  }

  private toDomain(orderRow: any, itemRows: any[]): Order {
    const items = itemRows.map(i =>
      OrderItem.create(
        i.product_id,
        i.product_name,
        parseInt(i.quantity, 10),
        Money.of(parseFloat(i.unit_price), i.currency),
      ),
    );

    const props: OrderProps = {
      customerId: orderRow.customer_id,
      status: orderRow.status as OrderStatus,
      items,
      total: Money.of(parseFloat(orderRow.total_amount), orderRow.total_currency),
      createdAt: new Date(orderRow.created_at),
      updatedAt: new Date(orderRow.updated_at),
    };

    return Order.reconstitute(props, orderRow.id);
  }
}
