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
    getOne: jest.fn(),
  };

  const mockProductRepository = {
    find: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    findOneBy: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    create: jest.fn(),
    findAndCount: jest.fn(),
    createQueryBuilder: jest.fn(),
    merge: jest.fn(),
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
      expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledTimes(4); // user, category, subCategory, productCategory
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
      expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith('product.user', 'user');
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

  describe('getProductById', () => {
    it('should return a product by id', async () => {
      const product = {
        id: 1,
        name: 'Test Product',
        price: 10.99,
        userId: 1,
        categoryId: 1,
        subCategoryId: 1,
        productCategoryId: 1,
        description: 'Test',
        rating: 4.5,
        images: [],
        attributes: null,
        stockQuantity: 10,
        sku: 'TEST001',
        isActive: true,
        isFeatured: false,
        viewCount: 0,
        salesCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockQueryBuilder.getOne.mockResolvedValue(product);

      const result = await service.getProductById(1);

      expect(result).toEqual(product);
      expect(mockProductRepository.createQueryBuilder).toHaveBeenCalledWith('product');
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('product.id = :id', { id: 1 });
      expect(mockQueryBuilder.getOne).toHaveBeenCalled();
    });

    it('should return null when product not found', async () => {
      mockQueryBuilder.getOne.mockResolvedValue(null);

      const result = await service.getProductById(999);

      expect(result).toBeNull();
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('product.id = :id', { id: 999 });
    });

    it('should handle database errors', async () => {
      mockQueryBuilder.getOne.mockRejectedValue(new Error('Database error'));

      await expect(service.getProductById(1)).rejects.toThrow('Database error');
    });

    it('should include all relations when fetching by id', async () => {
      const product = {
        id: 1,
        name: 'Test Product',
        category: { id: 1, name: 'Groceries', slug: 'groceries' },
        subCategory: { id: 1, name: 'Fruits', slug: 'fruits' },
        productCategory: { id: 1, name: 'Apples', slug: 'apples' },
      };

      mockQueryBuilder.getOne.mockResolvedValue(product);

      const result = await service.getProductById(1);

      expect(result).toHaveProperty('category');
      expect(result).toHaveProperty('subCategory');
      expect(result).toHaveProperty('productCategory');
      expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith('product.user', 'user');
      expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith('product.category', 'category');
      expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith('product.subCategory', 'subCategory');
      expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith('product.productCategory', 'productCategory');
    });
  });

  describe('updateProduct', () => {
    it('should update a product successfully', async () => {
      const existingProduct = {
        id: 1,
        name: 'Old Product',
        price: 10.99,
        description: 'Old description',
      };

      const updateDto = {
        name: 'Updated Product',
        price: 15.99,
        description: 'Updated description',
      };

      const mergedProduct = {
        ...existingProduct,
        ...updateDto,
      };

      const updatedProduct = {
        ...mergedProduct,
        updatedAt: new Date(),
      };

      mockProductRepository.findOneBy.mockResolvedValue(existingProduct);
      mockProductRepository.merge.mockReturnValue(mergedProduct);
      mockProductRepository.save.mockResolvedValue(updatedProduct);

      const result = await service.updateProduct(1, updateDto);

      expect(result).toEqual(updatedProduct);
      expect(mockProductRepository.findOneBy).toHaveBeenCalledWith({ id: 1 });
      expect(mockProductRepository.merge).toHaveBeenCalledWith(existingProduct, updateDto);
      expect(mockProductRepository.save).toHaveBeenCalledWith(mergedProduct);
    });

    it('should throw error when product not found', async () => {
      mockProductRepository.findOneBy.mockResolvedValue(null);

      await expect(service.updateProduct(999, { name: 'Test' })).rejects.toThrow('Product not found');
      expect(mockProductRepository.findOneBy).toHaveBeenCalledWith({ id: 999 });
      expect(mockProductRepository.save).not.toHaveBeenCalled();
    });

    it('should handle database errors during update', async () => {
      const existingProduct = { id: 1, name: 'Product' };
      mockProductRepository.findOneBy.mockResolvedValue(existingProduct);
      mockProductRepository.merge.mockReturnValue(existingProduct);
      mockProductRepository.save.mockRejectedValue(new Error('Database error'));

      await expect(service.updateProduct(1, { name: 'Updated' })).rejects.toThrow('Database error');
    });

    it('should update partial fields', async () => {
      const existingProduct = {
        id: 1,
        name: 'Product',
        price: 10.99,
        description: 'Description',
        isActive: true,
      };

      const updateDto = {
        price: 20.99,
      };

      const mergedProduct = {
        ...existingProduct,
        price: 20.99,
      };

      mockProductRepository.findOneBy.mockResolvedValue(existingProduct);
      mockProductRepository.merge.mockReturnValue(mergedProduct);
      mockProductRepository.save.mockResolvedValue(mergedProduct);

      const result = await service.updateProduct(1, updateDto);

      expect(result.price).toBe(20.99);
      expect(result.name).toBe('Product');
      expect(result.description).toBe('Description');
    });
  });

  describe('deleteProduct', () => {
    it('should delete a product successfully', async () => {
      const deleteResult = {
        raw: [],
        affected: 1,
      };

      mockProductRepository.delete.mockResolvedValue(deleteResult);

      const result = await service.deleteProduct(1);

      expect(result).toEqual(deleteResult);
      expect(result.affected).toBe(1);
      expect(mockProductRepository.delete).toHaveBeenCalledWith(1);
      expect(mockProductRepository.delete).toHaveBeenCalledTimes(1);
    });

    it('should return affected: 0 when product not found', async () => {
      const deleteResult = {
        raw: [],
        affected: 0,
      };

      mockProductRepository.delete.mockResolvedValue(deleteResult);

      const result = await service.deleteProduct(999);

      expect(result.affected).toBe(0);
      expect(mockProductRepository.delete).toHaveBeenCalledWith(999);
    });

    it('should handle database errors during deletion', async () => {
      mockProductRepository.delete.mockRejectedValue(new Error('Database error'));

      await expect(service.deleteProduct(1)).rejects.toThrow('Database error');
      expect(mockProductRepository.delete).toHaveBeenCalledWith(1);
    });

    it('should handle foreign key constraint errors', async () => {
      const error = new Error('Cannot delete product with existing orders');
      mockProductRepository.delete.mockRejectedValue(error);

      await expect(service.deleteProduct(1)).rejects.toThrow('Cannot delete product with existing orders');
    });

    it('should delete multiple products by passing different ids', async () => {
      const deleteResult = {
        raw: [],
        affected: 1,
      };

      mockProductRepository.delete.mockResolvedValue(deleteResult);

      const result1 = await service.deleteProduct(1);
      const result2 = await service.deleteProduct(2);
      const result3 = await service.deleteProduct(3);

      expect(result1.affected).toBe(1);
      expect(result2.affected).toBe(1);
      expect(result3.affected).toBe(1);
      expect(mockProductRepository.delete).toHaveBeenCalledTimes(3);
      expect(mockProductRepository.delete).toHaveBeenNthCalledWith(1, 1);
      expect(mockProductRepository.delete).toHaveBeenNthCalledWith(2, 2);
      expect(mockProductRepository.delete).toHaveBeenNthCalledWith(3, 3);
    });
  });
});
