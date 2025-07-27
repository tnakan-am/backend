import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class Address {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: 'int',
    nullable: false,
  })
  userId: number;

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
