import { IsEnum } from 'class-validator';
import { OrderStatus } from '../../orders/order-status.enum';

export class UpdateNotificationStatusDto {
  @IsEnum(OrderStatus)
  status: OrderStatus;
}
