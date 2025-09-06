import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  UpdateDateColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { Users } from '../../users/entities/user.entity';
import { Category } from '../../categories/entities/category.entity';
import { SubCategory } from '../../categories/entities/sub-category.entity';
import { ProductCategory } from '../../categories/entities/product-category.entity';

@Entity('products')
@Index(['userId'])
@Index(['categoryId'])
@Index(['subCategoryId'])
@Index(['productCategoryId'])
@Index(['price'])
@Index(['isActive'])
@Index(['createdAt'])
@Index(['name'])
@Index(['categoryId', 'subCategoryId', 'productCategoryId']) // Composite index for category filtering
export class Product {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: number;

  @ManyToOne(() => Users, (user) => user.products)
  @JoinColumn({ name: 'userId' })
  user: Users;

  @Column()
  categoryId: number;

  @ManyToOne(() => Category, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'categoryId' })
  category: Category;

  @Column()
  subCategoryId: number;

  @ManyToOne(() => SubCategory, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'subCategoryId' })
  subCategory: SubCategory;

  @Column()
  productCategoryId: number;

  @ManyToOne(() => ProductCategory, (productCategory) => productCategory.products, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'productCategoryId' })
  productCategory: ProductCategory;

  @Column({ length: 255 })
  name: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @Column({ type: 'decimal', precision: 3, scale: 2, default: 0 })
  rating: number;

  @Column({ type: 'json', nullable: true })
  images: string[];

  @Column({ type: 'json', nullable: true })
  attributes: Record<string, any>;

  @Column({ default: 0 })
  stockQuantity: number;

  @Column({ length: 50, nullable: true })
  sku: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: false })
  isFeatured: boolean;

  @Column({ default: 0 })
  viewCount: number;

  @Column({ default: 0 })
  salesCount: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}