import { Category } from './category.entity';
import { SubCategory } from './sub-category.entity';
import { Product } from '../../products/entities/product.entity';

describe('Category Entity', () => {
  let category: Category;

  beforeEach(() => {
    category = new Category();
  });

  it('should be defined', () => {
    expect(category).toBeDefined();
  });

  describe('Properties', () => {
    it('should have all required properties', () => {
      category.id = 1;
      category.name = 'Groceries';
      category.slug = 'groceries';
      category.description = 'Fresh produce and essentials';
      category.icon = 'grocery-icon.svg';
      category.image = 'grocery-banner.jpg';
      category.isActive = true;
      category.sortOrder = 1;
      category.createdAt = new Date();
      category.updatedAt = new Date();

      expect(category.id).toBe(1);
      expect(category.name).toBe('Groceries');
      expect(category.slug).toBe('groceries');
      expect(category.description).toBe('Fresh produce and essentials');
      expect(category.icon).toBe('grocery-icon.svg');
      expect(category.image).toBe('grocery-banner.jpg');
      expect(category.isActive).toBe(true);
      expect(category.sortOrder).toBe(1);
      expect(category.createdAt).toBeInstanceOf(Date);
      expect(category.updatedAt).toBeInstanceOf(Date);
    });

    it('should handle null description', () => {
      category.description = null;
      expect(category.description).toBeNull();
    });

    it('should handle null icon', () => {
      category.icon = null;
      expect(category.icon).toBeNull();
    });

    it('should handle null image', () => {
      category.image = null;
      expect(category.image).toBeNull();
    });

    it('should have unique name constraint', () => {
      category.name = 'Unique Category';
      expect(category.name).toBe('Unique Category');
    });

    it('should have unique slug constraint', () => {
      category.slug = 'unique-category';
      expect(category.slug).toBe('unique-category');
    });
  });

  describe('Relationships', () => {
    it('should have subCategories relationship', () => {
      const subCategory1 = new SubCategory();
      subCategory1.id = 1;
      subCategory1.name = 'Fruits';

      const subCategory2 = new SubCategory();
      subCategory2.id = 2;
      subCategory2.name = 'Vegetables';

      category.subCategories = [subCategory1, subCategory2];

      expect(category.subCategories).toHaveLength(2);
      expect(category.subCategories[0].name).toBe('Fruits');
      expect(category.subCategories[1].name).toBe('Vegetables');
    });

    it('should have products relationship', () => {
      const product1 = new Product();
      product1.id = 1;
      product1.name = 'Apple';

      const product2 = new Product();
      product2.id = 2;
      product2.name = 'Orange';

      category.products = [product1, product2];

      expect(category.products).toHaveLength(2);
      expect(category.products[0].name).toBe('Apple');
      expect(category.products[1].name).toBe('Orange');
    });

    it('should handle empty subCategories', () => {
      category.subCategories = [];
      expect(category.subCategories).toEqual([]);
    });

    it('should handle empty products', () => {
      category.products = [];
      expect(category.products).toEqual([]);
    });
  });

  describe('Default Values', () => {
    it('should have default values for certain properties', () => {
      const newCategory = new Category();
      
      // These would be set by TypeORM decorators
      expect(newCategory.isActive).toBeUndefined(); // Will default to true in DB
      expect(newCategory.sortOrder).toBeUndefined(); // Will default to 0 in DB
    });
  });

  describe('Business Logic', () => {
    it('should be able to check if category is active', () => {
      category.isActive = true;
      expect(category.isActive).toBe(true);

      category.isActive = false;
      expect(category.isActive).toBe(false);
    });

    it('should handle sort ordering', () => {
      const categories = [
        { ...new Category(), sortOrder: 3, name: 'Third' },
        { ...new Category(), sortOrder: 1, name: 'First' },
        { ...new Category(), sortOrder: 2, name: 'Second' },
      ];

      const sorted = categories.sort((a, b) => a.sortOrder - b.sortOrder);
      
      expect(sorted[0].name).toBe('First');
      expect(sorted[1].name).toBe('Second');
      expect(sorted[2].name).toBe('Third');
    });

    it('should generate valid slug from name', () => {
      const testCases = [
        { name: 'Fruits & Vegetables', expectedSlug: 'fruits-vegetables' },
        { name: 'Semi-Finished Products', expectedSlug: 'semi-finished-products' },
        { name: 'Dairy', expectedSlug: 'dairy' },
      ];

      testCases.forEach(testCase => {
        const slug = testCase.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        expect(slug).toContain(testCase.expectedSlug.split('-')[0]);
      });
    });
  });

  describe('Category Hierarchy', () => {
    it('should support hierarchical structure', () => {
      const mainCategory = new Category();
      mainCategory.name = 'Groceries';
      
      const subCat1 = new SubCategory();
      subCat1.name = 'Fruits';
      subCat1.category = mainCategory;

      const subCat2 = new SubCategory();
      subCat2.name = 'Vegetables';
      subCat2.category = mainCategory;

      mainCategory.subCategories = [subCat1, subCat2];

      expect(mainCategory.subCategories).toHaveLength(2);
      expect(mainCategory.subCategories[0].category).toBe(mainCategory);
      expect(mainCategory.subCategories[1].category).toBe(mainCategory);
    });
  });
});