export interface CreateOrderItemDto {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  currency?: string;
}

export interface CreateOrderDto {
  customerId: string;
  items: CreateOrderItemDto[];
}

export interface OrderResponseDto {
  id: string;
  customerId: string;
  status: string;
  items: {
    productId: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    subtotal: number;
    currency: string;
  }[];
  total: {
    amount: number;
    currency: string;
  };
  createdAt: string;
  updatedAt: string;
}
