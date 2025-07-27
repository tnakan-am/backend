import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Users } from '../../users/entities/user.entity';

@Entity()
export class Address {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: number;

  @ManyToOne(() => Users, (user) => user.addresses)
  @JoinColumn({ name: 'userId' })
  user: Users;

  @Column()
  city: string;

  @Column({ nullable: true, unique: true })
  region: string;

  @Column()
  street: string;

  @Column()
  house: string;

  @Column({ nullable: true })
  zip: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
