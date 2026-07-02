import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('reviews')
@Index(['productId'])
@Index(['orderId'])
@Index(['userId'])
// One review per purchased order line; DB safety net behind the app-level guard.
@Index(['orderId', 'productId'], { unique: true })
export class Review {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  productId: string;

  @Column({ type: 'uuid' })
  orderId: string;

  @Column({ type: 'uuid' })
  userId: string;

  @Column()
  userName: string;

  @Column({ type: 'varchar', nullable: true })
  userPhoto: string | null;

  @Column({ type: 'smallint' })
  stars: number;

  @Column({ type: 'text' })
  comment: string;

  @CreateDateColumn()
  createdAt: Date;
}
