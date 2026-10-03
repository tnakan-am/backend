import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('advertisements')
@Index(['userId'])
@Index(['approved'])
@Index(['createdAt'])
export class Advertisement {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  userId: string;

  @Column()
  image: string;

  @Column({ length: 120 })
  headline: string;

  @Column({ type: 'varchar', nullable: true })
  subheadline: string | null;

  @Column({ type: 'varchar', length: 40, nullable: true })
  cta: string | null;

  @Column({ type: 'varchar', nullable: true })
  link: string | null;

  @Column({ default: false })
  approved: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
