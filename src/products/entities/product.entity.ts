import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum Unit {
  kg = 'kg',
  gram = 'gram',
  liter = 'liter',
  quantity = 'qnt',
}

export enum DeliveryOption {
  nearest = 'Nearest',
  nextDay = 'Next Day',
  afterNextDay = 'After Next Day',
  weekEnd = 'On WeekEnd',
}

@Entity('products')
@Index(['userId'])
@Index(['category'])
@Index(['subCategory'])
@Index(['productCategory'])
@Index(['approved'])
@Index(['avgReview'])
@Index(['createdAt'])
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  userId: string;

  @Column()
  userDisplayName: string;

  @Column({ type: 'varchar', nullable: true })
  userPhoto: string | null;

  @Column({ length: 255 })
  name: string;

  @Column({ type: 'enum', enum: Unit })
  unit: Unit;

  @Column({
    type: 'numeric',
    precision: 12,
    scale: 3,
    default: 0,
    transformer: {
      to: (v: number) => v,
      from: (v: string) => parseFloat(v),
    },
  })
  minQuantity: number;

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
    precision: 3,
    scale: 2,
    default: 0,
    transformer: {
      to: (v: number) => v,
      from: (v: string) => parseFloat(v),
    },
  })
  avgReview: number;

  @Column({ default: 0 })
  numberReview: number;

  @Column({ length: 100 })
  category: string;

  @Column({ length: 120 })
  subCategory: string;

  @Column({ type: 'varchar', length: 140, nullable: true })
  productCategory: string | null;

  // Either a stringified number ("12") or the literal 'unlimited'.
  @Column({ length: 32, default: 'unlimited' })
  availability: string;

  @Column({ type: 'enum', enum: DeliveryOption })
  deliveryOption: DeliveryOption;

  @Column({ default: false })
  approved: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
