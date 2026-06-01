import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { SubCategory } from './sub-category.entity';

@Entity('product_categories')
@Index(['subCategoryId'])
export class ProductCategory {
  @PrimaryColumn({ length: 140 })
  id: string;

  @Column({ length: 120 })
  subCategoryId: string;

  @ManyToOne(
    () => SubCategory,
    (subCategory) => subCategory.productCategories,
    {
      onDelete: 'CASCADE',
    },
  )
  @JoinColumn({ name: 'subCategoryId' })
  subCategory: SubCategory;

  @Column({ length: 100 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: 0 })
  sortOrder: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
