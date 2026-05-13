import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from './entities/category.entity';
import { SubCategory } from './entities/sub-category.entity';
import { ProductCategory } from './entities/product-category.entity';

export interface SubWithChildren extends SubCategory {
  productCategories: ProductCategory[];
}
export interface CategoryTree extends Category {
  sub: SubWithChildren[];
}

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
    @InjectRepository(SubCategory)
    private readonly subCategoryRepository: Repository<SubCategory>,
    @InjectRepository(ProductCategory)
    private readonly productCategoryRepository: Repository<ProductCategory>,
  ) {}

  findCategories(): Promise<Category[]> {
    return this.categoryRepository.find({
      where: { isActive: true },
      order: { sortOrder: 'ASC', name: 'ASC' },
    });
  }

  async findCategoryById(id: string): Promise<Category> {
    const category = await this.categoryRepository.findOne({ where: { id } });
    if (!category) throw new NotFoundException('Category not found');
    return category;
  }

  findSubCategories(categoryId?: string): Promise<SubCategory[]> {
    return this.subCategoryRepository.find({
      where: categoryId ? { categoryId, isActive: true } : { isActive: true },
      order: { sortOrder: 'ASC', name: 'ASC' },
    });
  }

  findProductCategories(subCategoryId?: string): Promise<ProductCategory[]> {
    return this.productCategoryRepository.find({
      where: subCategoryId
        ? { subCategoryId, isActive: true }
        : { isActive: true },
      order: { sortOrder: 'ASC', name: 'ASC' },
    });
  }

  async getTree(): Promise<CategoryTree[]> {
    const [categories, subCategories, productCategories] = await Promise.all([
      this.categoryRepository.find({
        where: { isActive: true },
        order: { sortOrder: 'ASC', name: 'ASC' },
      }),
      this.subCategoryRepository.find({
        where: { isActive: true },
        order: { sortOrder: 'ASC', name: 'ASC' },
      }),
      this.productCategoryRepository.find({
        where: { isActive: true },
        order: { sortOrder: 'ASC', name: 'ASC' },
      }),
    ]);

    const productCategoriesBySub = new Map<string, ProductCategory[]>();
    for (const pc of productCategories) {
      const arr = productCategoriesBySub.get(pc.subCategoryId) ?? [];
      arr.push(pc);
      productCategoriesBySub.set(pc.subCategoryId, arr);
    }

    const subsByCategory = new Map<string, SubWithChildren[]>();
    for (const sc of subCategories) {
      const arr = subsByCategory.get(sc.categoryId) ?? [];
      arr.push({
        ...sc,
        productCategories: productCategoriesBySub.get(sc.id) ?? [],
      });
      subsByCategory.set(sc.categoryId, arr);
    }

    return categories.map((c) => ({
      ...c,
      sub: subsByCategory.get(c.id) ?? [],
    }));
  }
}
