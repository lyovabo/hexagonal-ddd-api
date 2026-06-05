import { Money } from './Money';

export class OrderItem {
  private constructor(
    private readonly _productId: string,
    private readonly _productName: string,
    private readonly _quantity: number,
    private readonly _unitPrice: Money,
  ) {
    if (!_productId) throw new Error('Product ID is required');
    if (_quantity <= 0) throw new Error('Quantity must be positive');
  }

  static create(productId: string, productName: string, quantity: number, unitPrice: Money): OrderItem {
    return new OrderItem(productId, productName, quantity, unitPrice);
  }

  get subtotal(): Money {
    return this._unitPrice.multiply(this._quantity);
  }

  get productId(): string { return this._productId; }
  get productName(): string { return this._productName; }
  get quantity(): number { return this._quantity; }
  get unitPrice(): Money { return this._unitPrice; }
}
