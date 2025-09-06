import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { SubCategory } from './sub-category.entity';
import { Product } from '../../products/entities/product.entity';

@Entity('product_categories')
@Index(['subCategoryId', 'name'], { unique: true })
@Index(['subCategoryId', 'slug'], { unique: true })
@Index(['subCategoryId'])
@Index(['isActive'])
export class ProductCategory {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  subCategoryId: number;

  @ManyToOne(() => SubCategory, (subCategory) => subCategory.productCategories, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'subCategoryId' })
  subCategory: SubCategory;

  @Column({ length: 100 })
  name: string;

  @Column({ length: 100 })
  slug: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ nullable: true })
  specifications: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: 0 })
  sortOrder: number;

  @OneToMany(() => Product, (product) => product.productCategory)
  products: Product[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}