export class OrderItemDto {
  productId: string;
  quantity: number;
}

export class CreateOrderDto {
  storeId: string;
  address: string;
  notes?: string;
  items: OrderItemDto[];
}
