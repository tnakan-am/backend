import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum UserType {
  CUSTOMER = 'customer',
  BUSINESS = 'business',
  ADMIN = 'admin',
}

export interface UserAddress {
  street?: string;
  city?: string;
  region?: string;
  zip?: string;
  country?: string;
  house?: string;
}

@Entity('users')
@Index(['email'], { unique: true })
@Index(['type'])
export class Users {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column()
  displayName: string;

  @Column({ nullable: true })
  phoneNumber: string;

  @Column({
    type: 'enum',
    enum: UserType,
    default: UserType.CUSTOMER,
  })
  type: UserType;

  @Column({ nullable: true })
  name: string;

  @Column({ nullable: true })
  surname: string;

  @Column({ nullable: true })
  company: string;

  @Column({ nullable: true })
  hvhh: string;

  @Column({ nullable: true })
  image: string;

  @Column({ type: 'jsonb', nullable: true })
  address: UserAddress | null;

  @Column({ default: false })
  isTopSeller: boolean;

  @Column({ default: false })
  verified: boolean;

  @Column({ type: 'varchar', nullable: true })
  verificationToken: string | null;

  @Column({ type: 'timestamp', nullable: true })
  verificationTokenExpiresAt: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  verifiedAt: Date | null;

  @Column({ type: 'varchar', nullable: true })
  passwordResetToken: string | null;

  @Column({ type: 'timestamp', nullable: true })
  passwordResetExpiresAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
