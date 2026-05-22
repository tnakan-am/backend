import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { OrderProduct } from './order-product.entity';
import { OrderStatusHistory } from './order-status-history.entity';
import { OrderStatus } from '../order-status.enum';

export { OrderStatus };

export interface OrderAddress {
  street?: string;
  city?: string;
  region?: string;
  zip?: string;
  country?: string;
  house?: string;
}

@Entity('orders')
@Index(['userId'])
@Index(['createdAt'])
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  userId: string;

  @Column()
  userPhone: string;

  @Column({ type: 'enum', enum: OrderStatus, default: OrderStatus.pending })
  status: OrderStatus;

  @Column({
    type: 'numeric',
    precision: 12,
    scale: 2,
    transformer: {
      to: (v: number) => v,
      from: (v: string) => parseFloat(v),
    },
  })
  total: number;

  @Column({ type: 'jsonb' })
  address: OrderAddress;

  @Column({ type: 'uuid', array: true, default: () => "'{}'::uuid[]" })
  vendorIds: string[];

  @Column({ type: 'uuid', array: true, default: () => "'{}'::uuid[]" })
  productIds: string[];

  @Column({ type: 'timestamptz', nullable: true })
  paidAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => OrderProduct, (op) => op.order, { cascade: true })
  products: OrderProduct[];

  @OneToMany(() => OrderStatusHistory, (h) => h.order, { cascade: true })
  statusHistory: OrderStatusHistory[];
}
