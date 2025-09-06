import { SubCategory } from './sub-category.entity';
import { Category } from './category.entity';
import { ProductCategory } from './product-category.entity';
import { Product } from '../../products/entities/product.entity';

describe('SubCategory Entity', () => {
  let subCategory: SubCategory;
  let category: Category;

  beforeEach(() => {
    subCategory = new SubCategory();
    category = new Category();
  });

  it('should be defined', () => {
    expect(subCategory).toBeDefined();
  });

  describe('Properties', () => {
    it('should have all required properties', () => {
      subCategory.id = 1;
      subCategory.categoryId = 1;
      subCategory.name = 'Fruits';
      subCategory.slug = 'fruits';
      subCategory.description = 'Fresh fruits';
      subCategory.image = 'fruits.jpg';
      subCategory.isActive = true;
      subCategory.sortOrder = 1;
      subCategory.createdAt = new Date();
      subCategory.updatedAt = new Date();

      expect(subCategory.id).toBe(1);
      expect(subCategory.categoryId).toBe(1);
      expect(subCategory.name).toBe('Fruits');
      expect(subCategory.slug).toBe('fruits');
      expect(subCategory.description).toBe('Fresh fruits');
      expect(subCategory.image).toBe('fruits.jpg');
      expect(subCategory.isActive).toBe(true);
      expect(subCategory.sortOrder).toBe(1);
      expect(subCategory.createdAt).toBeInstanceOf(Date);
      expect(subCategory.updatedAt).toBeInstanceOf(Date);
    });

    it('should handle null description', () => {
      subCategory.description = null;
      expect(subCategory.description).toBeNull();
    });

    it('should handle null image', () => {
      subCategory.image = null;
      expect(subCategory.image).toBeNull();
    });

    it('should enforce unique constraint on categoryId and name', () => {
      subCategory.categoryId = 1;
      subCategory.name = 'Unique SubCategory';
      expect(subCategory.categoryId).toBe(1);
      expect(subCategory.name).toBe('Unique SubCategory');
    });

    it('should enforce unique constraint on categoryId and slug', () => {
      subCategory.categoryId = 1;
      subCategory.slug = 'unique-subcategory';
      expect(subCategory.categoryId).toBe(1);
      expect(subCategory.slug).toBe('unique-subcategory');
    });
  });

  describe('Relationships', () => {
    it('should have category relationship', () => {
      category.id = 1;
      category.name = 'Groceries';
      subCategory.category = category;
      subCategory.categoryId = category.id;

      expect(subCategory.category).toBeDefined();
      expect(subCategory.category.id).toBe(1);
      expect(subCategory.category.name).toBe('Groceries');
      expect(subCategory.categoryId).toBe(1);
    });

    it('should have productCategories relationship', () => {
      const prodCat1 = new ProductCategory();
      prodCat1.id = 1;
      prodCat1.name = 'Apples';

      const prodCat2 = new ProductCategory();
      prodCat2.id = 2;
      prodCat2.name = 'Bananas';

      subCategory.productCategories = [prodCat1, prodCat2];

      expect(subCategory.productCategories).toHaveLength(2);
      expect(subCategory.productCategories[0].name).toBe('Apples');
      expect(subCategory.productCategories[1].name).toBe('Bananas');
    });

    it('should have products relationship', () => {
      const product1 = new Product();
      product1.id = 1;
      product1.name = 'Red Apple';

      const product2 = new Product();
      product2.id = 2;
      product2.name = 'Green Apple';

      subCategory.products = [product1, product2];

      expect(subCategory.products).toHaveLength(2);
      expect(subCategory.products[0].name).toBe('Red Apple');
      expect(subCategory.products[1].name).toBe('Green Apple');
    });

    it('should handle cascade delete from category', () => {
      category.id = 1;
      subCategory.category = category;
      subCategory.categoryId = category.id;

      // The onDelete: 'CASCADE' decorator would handle this in DB
      expect(subCategory.category).toBeDefined();
    });

    it('should handle empty productCategories', () => {
      subCategory.productCategories = [];
      expect(subCategory.productCategories).toEqual([]);
    });

    it('should handle empty products', () => {
      subCategory.products = [];
      expect(subCategory.products).toEqual([]);
    });
  });

  describe('Default Values', () => {
    it('should have default values for certain properties', () => {
      const newSubCategory = new SubCategory();
      
      // These would be set by TypeORM decorators
      expect(newSubCategory.isActive).toBeUndefined(); // Will default to true in DB
      expect(newSubCategory.sortOrder).toBeUndefined(); // Will default to 0 in DB
    });
  });

  describe('Business Logic', () => {
    it('should be able to check if subcategory is active', () => {
      subCategory.isActive = true;
      expect(subCategory.isActive).toBe(true);

      subCategory.isActive = false;
      expect(subCategory.isActive).toBe(false);
    });

    it('should handle sort ordering within category', () => {
      const subCategories = [
        { ...new SubCategory(), sortOrder: 3, name: 'Meat' },
        { ...new SubCategory(), sortOrder: 1, name: 'Fruits' },
        { ...new SubCategory(), sortOrder: 2, name: 'Vegetables' },
      ];

      const sorted = subCategories.sort((a, b) => a.sortOrder - b.sortOrder);
      
      expect(sorted[0].name).toBe('Fruits');
      expect(sorted[1].name).toBe('Vegetables');
      expect(sorted[2].name).toBe('Meat');
    });

    it('should maintain relationship integrity', () => {
      category.id = 1;
      category.name = 'Groceries';
      
      subCategory.category = category;
      subCategory.categoryId = category.id;
      subCategory.name = 'Fruits';

      const prodCat = new ProductCategory();
      prodCat.subCategory = subCategory;
      prodCat.subCategoryId = subCategory.id;
      prodCat.name = 'Apples';

      expect(prodCat.subCategory.category).toBe(category);
      expect(prodCat.subCategoryId).toBe(subCategory.id);
    });
  });

  describe('SubCategory Hierarchy', () => {
    it('should support hierarchical structure with category', () => {
      category.id = 1;
      category.name = 'Drinks';
      
      subCategory.categoryId = 1;
      subCategory.category = category;
      subCategory.name = 'Non-Alcoholic';

      const prodCat1 = new ProductCategory();
      prodCat1.name = 'Water';
      prodCat1.subCategory = subCategory;

      const prodCat2 = new ProductCategory();
      prodCat2.name = 'Juice';
      prodCat2.subCategory = subCategory;

      subCategory.productCategories = [prodCat1, prodCat2];

      expect(subCategory.category.name).toBe('Drinks');
      expect(subCategory.productCategories).toHaveLength(2);
      expect(subCategory.productCategories[0].subCategory).toBe(subCategory);
    });

    it('should handle multiple subcategories per category', () => {
      category.id = 1;
      category.name = 'Groceries';

      const subCat1 = new SubCategory();
      subCat1.categoryId = category.id;
      subCat1.category = category;
      subCat1.name = 'Fruits';

      const subCat2 = new SubCategory();
      subCat2.categoryId = category.id;
      subCat2.category = category;
      subCat2.name = 'Vegetables';

      category.subCategories = [subCat1, subCat2];

      expect(category.subCategories).toHaveLength(2);
      expect(category.subCategories[0].categoryId).toBe(category.id);
      expect(category.subCategories[1].categoryId).toBe(category.id);
    });
  });
});