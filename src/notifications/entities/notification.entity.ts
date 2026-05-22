import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { OrderStatus } from '../../orders/order-status.enum';

@Entity('notifications')
@Index(['userId', 'createdAt'])
@Index(['orderId'])
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // The recipient (vendor in most cases).
  @Column({ type: 'uuid' })
  userId: string;

  @Column({ type: 'uuid' })
  orderId: string;

  @Column({ type: 'uuid', array: true, default: () => "'{}'::uuid[]" })
  productIds: string[];

  @Column({ type: 'enum', enum: OrderStatus, default: OrderStatus.pending })
  status: OrderStatus;

  @CreateDateColumn()
  createdAt: Date;
}
