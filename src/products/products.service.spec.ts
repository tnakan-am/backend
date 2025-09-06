import { Test, TestingModule } from '@nestjs/testing';
import { ProductsService } from './products.service';
import { Repository } from 'typeorm';
import { Product } from './entities/product.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ProductDto } from './dto/product.dto';
import { Category } from '../categories/entities/category.entity';
import { SubCategory } from '../categories/entities/sub-category.entity';
import { ProductCategory } from '../categories/entities/product-category.entity';

describe('ProductsService', () => {
  let service: ProductsService;
  let repository: Repository<Product>;

  const mockProductRepository = {
    find: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    create: jest.fn(),
    findAndCount: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        {
          provide: getRepositoryToken(Product),
          useValue: mockProductRepository,
        },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
    repository = module.get<Repository<Product>>(getRepositoryToken(Product));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getProducts', () => {
    it('should return an array of products with relations', async () => {
      const category = new Category();
      category.id = 1;
      category.name = 'Groceries';

      const subCategory = new SubCategory();
      subCategory.id = 1;
      subCategory.name = 'Fruits';

      const productCategory = new ProductCategory();
      productCategory.id = 1;
      productCategory.name = 'Apples';

      const expectedProducts: Product[] = [
        {
          id: 1,
          userId: 1,
          categoryId: 1,
          subCategoryId: 1,
          productCategoryId: 1,
          name: 'Red Apple',
          description: 'Fresh red apples',
          price: 2.99,
          rating: 4.5,
          images: ['apple1.jpg'],
          attributes: { color: 'red' },
          stockQuantity: 100,
          sku: 'APL001',
          isActive: true,
          isFeatured: false,
          viewCount: 0,
          salesCount: 0,
          category: category,
          subCategory: subCategory,
          productCategory: productCategory,
          user: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 2,
          userId: 1,
          categoryId: 1,
          subCategoryId: 1,
          productCategoryId: 1,
          name: 'Green Apple',
          description: 'Fresh green apples',
          price: 3.49,
          rating: 4.2,
          images: ['apple2.jpg'],
          attributes: { color: 'green' },
          stockQuantity: 75,
          sku: 'APL002',
          isActive: true,
          isFeatured: true,
          viewCount: 10,
          salesCount: 5,
          category: category,
          subCategory: subCategory,
          productCategory: productCategory,
          user: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockProductRepository.find.mockResolvedValue(expectedProducts);

      const result = await service.getProducts();

      expect(result).toEqual(expectedProducts);
      expect(mockProductRepository.find).toHaveBeenCalledWith({
        relations: {
          category: true,
          subCategory: true,
          productCategory: true,
        },
      });
      expect(mockProductRepository.find).toHaveBeenCalledTimes(1);
    });

    it('should return empty array when no products exist', async () => {
      mockProductRepository.find.mockResolvedValue([]);

      const result = await service.getProducts();

      expect(result).toEqual([]);
      expect(mockProductRepository.find).toHaveBeenCalledWith({
        relations: {
          category: true,
          subCategory: true,
          productCategory: true,
        },
      });
    });

    it('should handle database errors', async () => {
      mockProductRepository.find.mockRejectedValue(new Error('Database error'));

      await expect(service.getProducts()).rejects.toThrow('Database error');
      expect(mockProductRepository.find).toHaveBeenCalledTimes(1);
    });

    it('should fetch products with all relations', async () => {
      const product = new Product();
      product.id = 1;
      product.name = 'Test Product';
      product.category = new Category();
      product.subCategory = new SubCategory();
      product.productCategory = new ProductCategory();

      mockProductRepository.find.mockResolvedValue([product]);

      const result = await service.getProducts();

      expect(result[0].category).toBeDefined();
      expect(result[0].subCategory).toBeDefined();
      expect(result[0].productCategory).toBeDefined();
    });
  });

  describe('createProduct', () => {
    it('should create a new product', async () => {
      const createProductDto: ProductDto = {
        userId: 1,
        categoryId: 1,
        subCategoryId: 1,
        productCategoryId: 1,
        name: 'New Product',
        description: 'Product description',
        price: 19.99,
        rating: 0,
        images: ['product.jpg'],
        attributes: { size: 'medium' },
        stockQuantity: 50,
        sku: 'PRD001',
        isActive: true,
        isFeatured: false,
        viewCount: 0,
        salesCount: 0,
      };

      const savedProduct = {
        id: 1,
        ...createProductDto,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockProductRepository.save.mockResolvedValue(savedProduct);

      const result = await service.createProduct(createProductDto);

      expect(result).toEqual(savedProduct);
      expect(mockProductRepository.save).toHaveBeenCalledWith(createProductDto);
      expect(mockProductRepository.save).toHaveBeenCalledTimes(1);
    });

    it('should create product with minimal required fields', async () => {
      const createProductDto: ProductDto = {
        userId: 1,
        categoryId: 1,
        subCategoryId: 1,
        productCategoryId: 1,
        name: 'Minimal Product',
        description: 'Description',
        price: 9.99,
        rating: 0,
        images: [],
        attributes: null,
        stockQuantity: 0,
        sku: null,
        isActive: true,
        isFeatured: false,
        viewCount: 0,
        salesCount: 0,
      };

      const savedProduct = {
        id: 1,
        ...createProductDto,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockProductRepository.save.mockResolvedValue(savedProduct);

      const result = await service.createProduct(createProductDto);

      expect(result).toEqual(savedProduct);
      expect(result.sku).toBeNull();
      expect(result.images).toEqual([]);
    });

    it('should handle validation errors', async () => {
      const invalidProductDto: ProductDto = {
        userId: null,
        categoryId: null,
        subCategoryId: null,
        productCategoryId: null,
        name: '',
        description: '',
        price: -10,
        rating: 0,
        images: [],
        attributes: null,
        stockQuantity: -5,
        sku: null,
        isActive: true,
        isFeatured: false,
        viewCount: 0,
        salesCount: 0,
      };

      mockProductRepository.save.mockRejectedValue(new Error('Validation failed'));

      await expect(service.createProduct(invalidProductDto)).rejects.toThrow('Validation failed');
      expect(mockProductRepository.save).toHaveBeenCalledTimes(1);
    });

    it('should handle database constraint errors', async () => {
      const createProductDto: ProductDto = {
        userId: 999,
        categoryId: 999,
        subCategoryId: 999,
        productCategoryId: 999,
        name: 'Product',
        description: 'Description',
        price: 10,
        rating: 0,
        images: [],
        attributes: null,
        stockQuantity: 0,
        sku: 'DUPLICATE',
        isActive: true,
        isFeatured: false,
        viewCount: 0,
        salesCount: 0,
      };

      mockProductRepository.save.mockRejectedValue(new Error('Foreign key constraint violation'));

      await expect(service.createProduct(createProductDto)).rejects.toThrow('Foreign key constraint violation');
    });

    it('should create featured product', async () => {
      const createProductDto: ProductDto = {
        userId: 1,
        categoryId: 1,
        subCategoryId: 1,
        productCategoryId: 1,
        name: 'Featured Product',
        description: 'This is featured',
        price: 99.99,
        rating: 5,
        images: ['featured1.jpg', 'featured2.jpg'],
        attributes: { featured: true, badge: 'bestseller' },
        stockQuantity: 200,
        sku: 'FEAT001',
        isActive: true,
        isFeatured: true,
        viewCount: 1000,
        salesCount: 100,
      };

      const savedProduct = {
        id: 1,
        ...createProductDto,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockProductRepository.save.mockResolvedValue(savedProduct);

      const result = await service.createProduct(createProductDto);

      expect(result.isFeatured).toBe(true);
      expect(result.salesCount).toBe(100);
      expect(result.viewCount).toBe(1000);
    });

    it('should handle complex product attributes', async () => {
      const createProductDto: ProductDto = {
        userId: 1,
        categoryId: 1,
        subCategoryId: 1,
        productCategoryId: 1,
        name: 'Complex Product',
        description: 'Product with complex attributes',
        price: 49.99,
        rating: 4.0,
        images: ['img1.jpg', 'img2.jpg', 'img3.jpg'],
        attributes: {
          colors: ['red', 'blue', 'green'],
          sizes: { small: 10, medium: 20, large: 15 },
          materials: ['cotton', 'polyester'],
          features: {
            waterproof: true,
            washable: true,
            warranty: '2 years',
          },
        },
        stockQuantity: 45,
        sku: 'CPLX001',
        isActive: true,
        isFeatured: false,
        viewCount: 0,
        salesCount: 0,
      };

      const savedProduct = {
        id: 1,
        ...createProductDto,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockProductRepository.save.mockResolvedValue(savedProduct);

      const result = await service.createProduct(createProductDto);

      expect(result.attributes.colors).toContain('red');
      expect(result.attributes.sizes.medium).toBe(20);
      expect(result.attributes.features.waterproof).toBe(true);
    });
  });

  describe('Repository interaction', () => {
    it('should use repository find method correctly', async () => {
      await service.getProducts();

      expect(mockProductRepository.find).toHaveBeenCalledWith({
        relations: {
          category: true,
          subCategory: true,
          productCategory: true,
        },
      });
    });

    it('should use repository save method correctly', async () => {
      const dto: ProductDto = {
        userId: 1,
        categoryId: 1,
        subCategoryId: 1,
        productCategoryId: 1,
        name: 'Test',
        description: 'Test',
        price: 10,
        rating: 0,
        images: [],
        attributes: null,
        stockQuantity: 0,
        sku: null,
        isActive: true,
        isFeatured: false,
        viewCount: 0,
        salesCount: 0,
      };

      await service.createProduct(dto);

      expect(mockProductRepository.save).toHaveBeenCalledWith(dto);
    });
  });
});
