import { Test, TestingModule } from '@nestjs/testing';
import { ProductsService } from './products.service';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { Product } from './entities/product.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ProductDto } from './dto/product.dto';
import { PaginationDto } from './dto/pagination.dto';
import { Category } from '../categories/entities/category.entity';
import { SubCategory } from '../categories/entities/sub-category.entity';
import { ProductCategory } from '../categories/entities/product-category.entity';

describe('ProductsService', () => {
  let service: ProductsService;
  let repository: Repository<Product>;
  let queryBuilder: SelectQueryBuilder<Product>;

  const mockQueryBuilder = {
    createQueryBuilder: jest.fn(),
    leftJoinAndSelect: jest.fn(),
    select: jest.fn(),
    andWhere: jest.fn(),
    orderBy: jest.fn(),
    addOrderBy: jest.fn(),
    skip: jest.fn(),
    take: jest.fn(),
    getMany: jest.fn(),
    getCount: jest.fn(),
  };

  const mockProductRepository = {
    find: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    create: jest.fn(),
    findAndCount: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  beforeEach(async () => {
    // Setup query builder chain
    mockQueryBuilder.leftJoinAndSelect.mockReturnThis();
    mockQueryBuilder.select.mockReturnThis();
    mockQueryBuilder.andWhere.mockReturnThis();
    mockQueryBuilder.orderBy.mockReturnThis();
    mockQueryBuilder.addOrderBy.mockReturnThis();
    mockQueryBuilder.skip.mockReturnThis();
    mockQueryBuilder.take.mockReturnThis();
    mockQueryBuilder.getMany.mockResolvedValue([]);
    mockQueryBuilder.getCount.mockResolvedValue(0);

    mockProductRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

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
    it('should return paginated products with metadata', async () => {
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
      ];

      const paginationDto: PaginationDto = {
        page: 1,
        limit: 10,
        sortBy: 'salesCount',
        sortOrder: 'DESC',
        skip: 0,
      };

      mockQueryBuilder.getMany.mockResolvedValue(expectedProducts);
      mockQueryBuilder.getCount.mockResolvedValue(1);

      const result = await service.getProducts(paginationDto);

      expect(result.data).toEqual(expectedProducts);
      expect(result.meta).toEqual({
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: false,
      });
      expect(mockProductRepository.createQueryBuilder).toHaveBeenCalledWith('product');
      expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledTimes(3);
      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith('product.salesCount', 'DESC');
    });

    it('should return empty array when no products exist', async () => {
      const paginationDto: PaginationDto = {
        page: 1,
        limit: 10,
        skip: 0,
      };

      mockQueryBuilder.getMany.mockResolvedValue([]);
      mockQueryBuilder.getCount.mockResolvedValue(0);

      const result = await service.getProducts(paginationDto);

      expect(result.data).toEqual([]);
      expect(result.meta.total).toBe(0);
      expect(result.meta.totalPages).toBe(0);
      expect(result.meta.hasNextPage).toBe(false);
    });

    it('should handle database errors', async () => {
      const paginationDto: PaginationDto = {
        page: 1,
        limit: 10,
        skip: 0,
      };

      mockQueryBuilder.getCount.mockRejectedValue(new Error('Database error'));

      await expect(service.getProducts(paginationDto)).rejects.toThrow('Database error');
      expect(mockProductRepository.createQueryBuilder).toHaveBeenCalledTimes(1);
    });

    it('should apply filters correctly', async () => {
      const paginationDto: PaginationDto = {
        page: 1,
        limit: 10,
        categoryId: 1,
        subCategoryId: 2,
        productCategoryId: 3,
        isActive: true,
        isFeatured: true,
        search: 'apple',
        skip: 0,
      };

      mockQueryBuilder.getMany.mockResolvedValue([]);
      mockQueryBuilder.getCount.mockResolvedValue(0);

      await service.getProducts(paginationDto);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('product.isActive = :isActive', { isActive: true });
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('product.isFeatured = :isFeatured', { isFeatured: true });
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('product.categoryId = :categoryId', { categoryId: 1 });
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('product.subCategoryId = :subCategoryId', { subCategoryId: 2 });
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('product.productCategoryId = :productCategoryId', { productCategoryId: 3 });
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        '(product.name ILIKE :search OR product.description ILIKE :search OR product.sku ILIKE :search)',
        { search: '%apple%' }
      );
    });

    it('should handle pagination correctly', async () => {
      const paginationDto: PaginationDto = {
        page: 3,
        limit: 20,
        skip: 40,
      };

      mockQueryBuilder.getMany.mockResolvedValue([]);
      mockQueryBuilder.getCount.mockResolvedValue(100);

      const result = await service.getProducts(paginationDto);

      expect(mockQueryBuilder.skip).toHaveBeenCalledWith(40);
      expect(mockQueryBuilder.take).toHaveBeenCalledWith(20);
      expect(result.meta).toEqual({
        total: 100,
        page: 3,
        limit: 20,
        totalPages: 5,
        hasNextPage: true,
        hasPreviousPage: true,
      });
    });

    it('should handle different sort options', async () => {
      const paginationDto: PaginationDto = {
        page: 1,
        limit: 10,
        sortBy: 'price',
        sortOrder: 'ASC',
        skip: 0,
      };

      mockQueryBuilder.getMany.mockResolvedValue([]);
      mockQueryBuilder.getCount.mockResolvedValue(0);

      await service.getProducts(paginationDto);

      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith('product.price', 'ASC');
      expect(mockQueryBuilder.addOrderBy).toHaveBeenCalledWith('product.createdAt', 'DESC');
    });

    it('should use default sort when invalid field provided', async () => {
      const paginationDto: PaginationDto = {
        page: 1,
        limit: 10,
        sortBy: 'invalidField',
        sortOrder: 'DESC',
        skip: 0,
      };

      mockQueryBuilder.getMany.mockResolvedValue([]);
      mockQueryBuilder.getCount.mockResolvedValue(0);

      await service.getProducts(paginationDto);

      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith('product.salesCount', 'DESC');
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
    it('should use repository createQueryBuilder method correctly', async () => {
      const paginationDto: PaginationDto = {
        page: 1,
        limit: 10,
        skip: 0,
      };

      mockQueryBuilder.getMany.mockResolvedValue([]);
      mockQueryBuilder.getCount.mockResolvedValue(0);

      await service.getProducts(paginationDto);

      expect(mockProductRepository.createQueryBuilder).toHaveBeenCalledWith('product');
      expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith('product.category', 'category');
      expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith('product.subCategory', 'subCategory');
      expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith('product.productCategory', 'productCategory');
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
