import { Injectable, NotFoundException } from '@nestjs/common';
import { OrderStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { OrdersGateway } from './orders.gateway';
import { CreateOrderDto } from './dto/create-order.dto';

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly gateway: OrdersGateway,
  ) {}

  async create(customerId: string, dto: CreateOrderDto) {
    // Fetch product prices from DB
    const productIds = dto.items.map((i) => i.productId);
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds } },
    });

    const productMap = new Map(products.map((p) => [p.id, p]));

    let total = 0;
    const orderItems = dto.items.map((item) => {
      const product = productMap.get(item.productId);
      if (!product) throw new NotFoundException(`Product ${item.productId} not found`);
      const price = product.price * item.quantity;
      total += price;
      return {
        productId: item.productId,
        quantity: item.quantity,
        price: product.price,
      };
    });

    const order = await this.prisma.order.create({
      data: {
        customerId,
        storeId: dto.storeId,
        address: dto.address,
        notes: dto.notes,
        total,
        items: { create: orderItems },
      },
      include: {
        customer: true,
        store: true,
        items: { include: { product: true } },
      },
    });

    this.gateway.notifyNewOrder(dto.storeId, order);
    return order;
  }

  async findById(id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        customer: true,
        store: true,
        items: { include: { product: true } },
        deliveryUser: true,
      },
    });
    if (!order) throw new NotFoundException('Order not found');
    return order;
  }

  async updateStatus(id: string, status: OrderStatus) {
    const order = await this.prisma.order.update({
      where: { id },
      data: { status },
      include: {
        customer: true,
        store: true,
        items: { include: { product: true } },
      },
    });

    this.gateway.notifyOrderUpdate(id, order);
    return order;
  }

  async findByStore(storeId: string) {
    return this.prisma.order.findMany({
      where: { storeId },
      include: {
        customer: true,
        items: { include: { product: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByCustomer(customerId: string) {
    return this.prisma.order.findMany({
      where: { customerId },
      include: {
        store: true,
        items: { include: { product: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async assignDelivery(orderId: string, deliveryUserId: string) {
    return this.prisma.order.update({
      where: { id: orderId },
      data: { deliveryUserId },
    });
  }
}
