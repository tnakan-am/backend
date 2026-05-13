import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Order } from './order.entity';
import { OrderStatus } from '../order-status.enum';

@Entity('order_products')
@Index(['orderId'])
@Index(['productId'])
@Index(['vendorId'])
export class OrderProduct {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  orderId: string;

  @ManyToOne(() => Order, (order) => order.products, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'orderId' })
  order: Order;

  @Column({ type: 'uuid' })
  productId: string;

  @Column({ type: 'uuid' })
  vendorId: string;

  // Denormalised product snapshot — preserves history if the product later changes.
  @Column()
  name: string;

  @Column({ length: 32 })
  unit: string;

  @Column({
    type: 'numeric',
    precision: 12,
    scale: 2,
    transformer: {
      to: (v: number) => v,
      from: (v: string) => parseFloat(v),
    },
  })
  price: number;

  @Column()
  image: string;

  @Column({ type: 'text' })
  description: string;

  @Column({
    type: 'numeric',
    precision: 12,
    scale: 3,
    transformer: {
      to: (v: number) => v,
      from: (v: string) => parseFloat(v),
    },
  })
  quantity: number;

  @Column({ type: 'enum', enum: OrderStatus, default: OrderStatus.pending })
  status: OrderStatus;

  @Column({ type: 'text', nullable: true })
  comment: string | null;

  @Column({ type: 'uuid', nullable: true })
  reviewRef: string | null;
}
