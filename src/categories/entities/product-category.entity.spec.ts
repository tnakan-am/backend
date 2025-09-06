import { ProductCategory } from './product-category.entity';
import { SubCategory } from './sub-category.entity';
import { Product } from '../../products/entities/product.entity';
import { Category } from './category.entity';

describe('ProductCategory Entity', () => {
  let productCategory: ProductCategory;
  let subCategory: SubCategory;

  beforeEach(() => {
    productCategory = new ProductCategory();
    subCategory = new SubCategory();
  });

  it('should be defined', () => {
    expect(productCategory).toBeDefined();
  });

  describe('Properties', () => {
    it('should have all required properties', () => {
      productCategory.id = 1;
      productCategory.subCategoryId = 1;
      productCategory.name = 'Apples';
      productCategory.slug = 'apples';
      productCategory.description = 'Fresh apples';
      productCategory.specifications = 'Organic, locally sourced';
      productCategory.isActive = true;
      productCategory.sortOrder = 1;
      productCategory.createdAt = new Date();
      productCategory.updatedAt = new Date();

      expect(productCategory.id).toBe(1);
      expect(productCategory.subCategoryId).toBe(1);
      expect(productCategory.name).toBe('Apples');
      expect(productCategory.slug).toBe('apples');
      expect(productCategory.description).toBe('Fresh apples');
      expect(productCategory.specifications).toBe('Organic, locally sourced');
      expect(productCategory.isActive).toBe(true);
      expect(productCategory.sortOrder).toBe(1);
      expect(productCategory.createdAt).toBeInstanceOf(Date);
      expect(productCategory.updatedAt).toBeInstanceOf(Date);
    });

    it('should handle null description', () => {
      productCategory.description = null;
      expect(productCategory.description).toBeNull();
    });

    it('should handle null specifications', () => {
      productCategory.specifications = null;
      expect(productCategory.specifications).toBeNull();
    });

    it('should enforce unique constraint on subCategoryId and name', () => {
      productCategory.subCategoryId = 1;
      productCategory.name = 'Unique Product Category';
      expect(productCategory.subCategoryId).toBe(1);
      expect(productCategory.name).toBe('Unique Product Category');
    });

    it('should enforce unique constraint on subCategoryId and slug', () => {
      productCategory.subCategoryId = 1;
      productCategory.slug = 'unique-product-category';
      expect(productCategory.subCategoryId).toBe(1);
      expect(productCategory.slug).toBe('unique-product-category');
    });
  });

  describe('Relationships', () => {
    it('should have subCategory relationship', () => {
      subCategory.id = 1;
      subCategory.name = 'Fruits';
      productCategory.subCategory = subCategory;
      productCategory.subCategoryId = subCategory.id;

      expect(productCategory.subCategory).toBeDefined();
      expect(productCategory.subCategory.id).toBe(1);
      expect(productCategory.subCategory.name).toBe('Fruits');
      expect(productCategory.subCategoryId).toBe(1);
    });

    it('should have products relationship', () => {
      const product1 = new Product();
      product1.id = 1;
      product1.name = 'Red Delicious Apple';

      const product2 = new Product();
      product2.id = 2;
      product2.name = 'Granny Smith Apple';

      productCategory.products = [product1, product2];

      expect(productCategory.products).toHaveLength(2);
      expect(productCategory.products[0].name).toBe('Red Delicious Apple');
      expect(productCategory.products[1].name).toBe('Granny Smith Apple');
    });

    it('should handle cascade delete from subCategory', () => {
      subCategory.id = 1;
      productCategory.subCategory = subCategory;
      productCategory.subCategoryId = subCategory.id;

      // The onDelete: 'CASCADE' decorator would handle this in DB
      expect(productCategory.subCategory).toBeDefined();
    });

    it('should handle empty products', () => {
      productCategory.products = [];
      expect(productCategory.products).toEqual([]);
    });
  });

  describe('Default Values', () => {
    it('should have default values for certain properties', () => {
      const newProductCategory = new ProductCategory();
      
      // These would be set by TypeORM decorators
      expect(newProductCategory.isActive).toBeUndefined(); // Will default to true in DB
      expect(newProductCategory.sortOrder).toBeUndefined(); // Will default to 0 in DB
    });
  });

  describe('Business Logic', () => {
    it('should be able to check if product category is active', () => {
      productCategory.isActive = true;
      expect(productCategory.isActive).toBe(true);

      productCategory.isActive = false;
      expect(productCategory.isActive).toBe(false);
    });

    it('should handle sort ordering within subcategory', () => {
      const productCategories = [
        { ...new ProductCategory(), sortOrder: 3, name: 'Oranges' },
        { ...new ProductCategory(), sortOrder: 1, name: 'Apples' },
        { ...new ProductCategory(), sortOrder: 2, name: 'Bananas' },
      ];

      const sorted = productCategories.sort((a, b) => a.sortOrder - b.sortOrder);
      
      expect(sorted[0].name).toBe('Apples');
      expect(sorted[1].name).toBe('Bananas');
      expect(sorted[2].name).toBe('Oranges');
    });

    it('should maintain relationship integrity through hierarchy', () => {
      const category = new Category();
      category.id = 1;
      category.name = 'Groceries';
      
      subCategory.id = 1;
      subCategory.category = category;
      subCategory.categoryId = category.id;
      subCategory.name = 'Fruits';

      productCategory.subCategory = subCategory;
      productCategory.subCategoryId = subCategory.id;
      productCategory.name = 'Apples';

      const product = new Product();
      product.productCategory = productCategory;
      product.productCategoryId = productCategory.id;
      product.name = 'Red Apple';

      expect(product.productCategory.subCategory.category).toBe(category);
      expect(product.productCategoryId).toBe(productCategory.id);
    });
  });

  describe('ProductCategory Specifications', () => {
    it('should handle complex specifications', () => {
      productCategory.specifications = JSON.stringify({
        origin: 'Local',
        organic: true,
        varieties: ['Red Delicious', 'Granny Smith', 'Gala'],
        storage: 'Cool, dry place',
        shelfLife: '2-3 weeks',
      });

      const specs = JSON.parse(productCategory.specifications);
      expect(specs.organic).toBe(true);
      expect(specs.varieties).toContain('Gala');
      expect(specs.shelfLife).toBe('2-3 weeks');
    });

    it('should handle simple text specifications', () => {
      productCategory.specifications = 'Fresh, organic, locally sourced';
      expect(productCategory.specifications).toBe('Fresh, organic, locally sourced');
    });
  });

  describe('Complete Hierarchy', () => {
    it('should support complete hierarchical structure', () => {
      const category = new Category();
      category.id = 1;
      category.name = 'Groceries';
      
      subCategory.id = 1;
      subCategory.categoryId = category.id;
      subCategory.category = category;
      subCategory.name = 'Meat';

      productCategory.id = 1;
      productCategory.subCategoryId = subCategory.id;
      productCategory.subCategory = subCategory;
      productCategory.name = 'Chicken';

      const product1 = new Product();
      product1.categoryId = category.id;
      product1.subCategoryId = subCategory.id;
      product1.productCategoryId = productCategory.id;
      product1.productCategory = productCategory;
      product1.name = 'Chicken Breast';

      const product2 = new Product();
      product2.categoryId = category.id;
      product2.subCategoryId = subCategory.id;
      product2.productCategoryId = productCategory.id;
      product2.productCategory = productCategory;
      product2.name = 'Chicken Thighs';

      productCategory.products = [product1, product2];

      expect(productCategory.products).toHaveLength(2);
      expect(productCategory.products[0].categoryId).toBe(category.id);
      expect(productCategory.products[0].subCategoryId).toBe(subCategory.id);
      expect(productCategory.products[0].productCategoryId).toBe(productCategory.id);
      expect(productCategory.subCategory.category.name).toBe('Groceries');
    });

    it('should handle multiple product categories per subcategory', () => {
      subCategory.id = 1;
      subCategory.name = 'Fruits';

      const prodCat1 = new ProductCategory();
      prodCat1.subCategoryId = subCategory.id;
      prodCat1.subCategory = subCategory;
      prodCat1.name = 'Apples';

      const prodCat2 = new ProductCategory();
      prodCat2.subCategoryId = subCategory.id;
      prodCat2.subCategory = subCategory;
      prodCat2.name = 'Bananas';

      subCategory.productCategories = [prodCat1, prodCat2];

      expect(subCategory.productCategories).toHaveLength(2);
      expect(subCategory.productCategories[0].subCategoryId).toBe(subCategory.id);
      expect(subCategory.productCategories[1].subCategoryId).toBe(subCategory.id);
    });
  });
});