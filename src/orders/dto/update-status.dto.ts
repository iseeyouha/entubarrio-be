import { OrderStatus } from '@prisma/client';

export class UpdateStatusDto {
  status: OrderStatus;
}
