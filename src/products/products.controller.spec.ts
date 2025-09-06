import { Test, TestingModule } from '@nestjs/testing';
import { HttpException, HttpStatus } from '@nestjs/common';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { ProductDto } from './dto/product.dto';
import { PaginationDto, PaginatedResult } from './dto/pagination.dto';
import { Product } from './entities/product.entity';
import { Category } from '../categories/entities/category.entity';
import { SubCategory } from '../categories/entities/sub-category.entity';
import { ProductCategory } from '../categories/entities/product-category.entity';

describe('ProductsController', () => {
  let controller: ProductsController;
  let service: ProductsService;

  const mockProductsService = {
    getProducts: jest.fn(),
    createProduct: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProductsController],
      providers: [
        {
          provide: ProductsService,
          useValue: mockProductsService,
        },
      ],
    }).compile();

    controller = module.get<ProductsController>(ProductsController);
    service = module.get<ProductsService>(ProductsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getProducts', () => {
    it('should return paginated products', async () => {
      const category = new Category();
      category.id = 1;
      category.name = 'Groceries';

      const subCategory = new SubCategory();
      subCategory.id = 1;
      subCategory.name = 'Fruits';

      const productCategory = new ProductCategory();
      productCategory.id = 1;
      productCategory.name = 'Apples';

      const products: Product[] = [
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

      const expectedResult: PaginatedResult<Product> = {
        data: products,
        meta: {
          total: 1,
          page: 1,
          limit: 10,
          totalPages: 1,
          hasNextPage: false,
          hasPreviousPage: false,
        },
      };

      const paginationDto: PaginationDto = {
        page: 1,
        limit: 10,
        skip: 0,
      };

      mockProductsService.getProducts.mockResolvedValue(expectedResult);

      const result = await controller.getProducts(paginationDto);

      expect(result).toEqual(expectedResult);
      expect(result.meta.total).toBe(1);
      expect(mockProductsService.getProducts).toHaveBeenCalledWith(paginationDto);
    });

    it('should return empty array when no products exist', async () => {
      const expectedResult: PaginatedResult<Product> = {
        data: [],
        meta: {
          total: 0,
          page: 1,
          limit: 10,
          totalPages: 0,
          hasNextPage: false,
          hasPreviousPage: false,
        },
      };

      const paginationDto: PaginationDto = {
        page: 1,
        limit: 10,
        skip: 0,
      };

      mockProductsService.getProducts.mockResolvedValue(expectedResult);

      const result = await controller.getProducts(paginationDto);

      expect(result.data).toEqual([]);
      expect(result.meta.total).toBe(0);
      expect(mockProductsService.getProducts).toHaveBeenCalledTimes(1);
    });

    it('should handle service errors', async () => {
      const paginationDto: PaginationDto = {
        page: 1,
        limit: 10,
        skip: 0,
      };

      mockProductsService.getProducts.mockRejectedValue(new Error('Database error'));

      await expect(controller.getProducts(paginationDto)).rejects.toThrow('Database error');
      expect(mockProductsService.getProducts).toHaveBeenCalledTimes(1);
    });

    it('should handle pagination parameters', async () => {
      const paginationDto: PaginationDto = {
        page: 2,
        limit: 20,
        sortBy: 'price',
        sortOrder: 'ASC',
        categoryId: 1,
        search: 'apple',
        skip: 20,
      };

      const expectedResult: PaginatedResult<Product> = {
        data: [],
        meta: {
          total: 100,
          page: 2,
          limit: 20,
          totalPages: 5,
          hasNextPage: true,
          hasPreviousPage: true,
        },
      };

      mockProductsService.getProducts.mockResolvedValue(expectedResult);

      const result = await controller.getProducts(paginationDto);

      expect(result.meta.page).toBe(2);
      expect(result.meta.hasNextPage).toBe(true);
      expect(result.meta.hasPreviousPage).toBe(true);
      expect(mockProductsService.getProducts).toHaveBeenCalledWith(paginationDto);
    });
  });

  describe('createProduct', () => {
    it('should create a new product successfully', async () => {
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

      const createdProduct = {
        id: 1,
        ...createProductDto,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockProductsService.createProduct.mockResolvedValue(createdProduct);

      const result = await controller.createProduct(createProductDto);

      expect(result).toEqual(createdProduct);
      expect(mockProductsService.createProduct).toHaveBeenCalledWith(createProductDto);
      expect(mockProductsService.createProduct).toHaveBeenCalledTimes(1);
    });

    it('should throw HttpException on service error', async () => {
      const createProductDto: ProductDto = {
        userId: 1,
        categoryId: 1,
        subCategoryId: 1,
        productCategoryId: 1,
        name: 'Product',
        description: 'Description',
        price: 10,
      };

      const errorMessage = 'Validation failed';
      mockProductsService.createProduct.mockRejectedValue(new Error(errorMessage));

      await expect(controller.createProduct(createProductDto)).rejects.toThrow(
        new HttpException(errorMessage, HttpStatus.BAD_REQUEST)
      );
      expect(mockProductsService.createProduct).toHaveBeenCalledWith(createProductDto);
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
      };

      const errorMessage = 'Foreign key constraint violation';
      mockProductsService.createProduct.mockRejectedValue(new Error(errorMessage));

      await expect(controller.createProduct(createProductDto)).rejects.toThrow(
        new HttpException(errorMessage, HttpStatus.BAD_REQUEST)
      );
    });

    it('should create product with minimal fields', async () => {
      const createProductDto: ProductDto = {
        userId: 1,
        categoryId: 1,
        subCategoryId: 1,
        productCategoryId: 1,
        name: 'Minimal Product',
        description: 'Description',
        price: 9.99,
      };

      const createdProduct = {
        id: 1,
        ...createProductDto,
        rating: 0,
        images: [],
        attributes: null,
        stockQuantity: 0,
        sku: null,
        isActive: true,
        isFeatured: false,
        viewCount: 0,
        salesCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockProductsService.createProduct.mockResolvedValue(createdProduct);

      const result = await controller.createProduct(createProductDto);

      expect(result.id).toBe(1);
      expect(result.name).toBe('Minimal Product');
      expect(result.sku).toBeNull();
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
        isFeatured: true,
        rating: 5,
        stockQuantity: 200,
      };

      const createdProduct = {
        id: 1,
        ...createProductDto,
        images: [],
        attributes: null,
        sku: null,
        isActive: true,
        viewCount: 0,
        salesCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockProductsService.createProduct.mockResolvedValue(createdProduct);

      const result = await controller.createProduct(createProductDto);

      expect(result.isFeatured).toBe(true);
      expect(result.rating).toBe(5);
    });

    it('should handle validation errors with proper status code', async () => {
      const invalidDto: ProductDto = {
        userId: null,
        categoryId: null,
        subCategoryId: null,
        productCategoryId: null,
        name: '',
        description: '',
        price: -10,
      };

      mockProductsService.createProduct.mockRejectedValue(new Error('Validation error'));

      try {
        await controller.createProduct(invalidDto);
      } catch (error) {
        expect(error).toBeInstanceOf(HttpException);
        expect(error.getStatus()).toBe(HttpStatus.BAD_REQUEST);
        expect(error.message).toBe('Validation error');
      }
    });
  });

  describe('Error handling', () => {
    it('should wrap service errors in HttpException', async () => {
      const dto: ProductDto = {
        userId: 1,
        categoryId: 1,
        subCategoryId: 1,
        productCategoryId: 1,
        name: 'Test',
        description: 'Test',
        price: 10,
      };

      const error = new Error('Service error');
      mockProductsService.createProduct.mockRejectedValue(error);

      await expect(controller.createProduct(dto)).rejects.toThrow(HttpException);
    });

    it('should preserve error message in HttpException', async () => {
      const dto: ProductDto = {
        userId: 1,
        categoryId: 1,
        subCategoryId: 1,
        productCategoryId: 1,
        name: 'Test',
        description: 'Test',
        price: 10,
      };

      const customError = new Error('Custom error message');
      mockProductsService.createProduct.mockRejectedValue(customError);

      try {
        await controller.createProduct(dto);
      } catch (error) {
        expect(error.message).toBe('Custom error message');
      }
    });

    it('should use BAD_REQUEST status for all errors', async () => {
      const dto: ProductDto = {
        userId: 1,
        categoryId: 1,
        subCategoryId: 1,
        productCategoryId: 1,
        name: 'Test',
        description: 'Test',
        price: 10,
      };

      mockProductsService.createProduct.mockRejectedValue(new Error('Any error'));

      try {
        await controller.createProduct(dto);
      } catch (error) {
        expect(error.getStatus()).toBe(HttpStatus.BAD_REQUEST);
      }
    });
  });

  describe('Controller-Service interaction', () => {
    it('should properly delegate to service for getProducts', async () => {
      const paginationDto: PaginationDto = {
        page: 1,
        limit: 10,
        skip: 0,
      };

      const expectedResult: PaginatedResult<Product> = {
        data: [],
        meta: {
          total: 0,
          page: 1,
          limit: 10,
          totalPages: 0,
          hasNextPage: false,
          hasPreviousPage: false,
        },
      };

      mockProductsService.getProducts.mockResolvedValue(expectedResult);

      await controller.getProducts(paginationDto);
      expect(mockProductsService.getProducts).toHaveBeenCalledWith(paginationDto);
    });

    it('should properly delegate to service for createProduct', async () => {
      const dto: ProductDto = {
        userId: 1,
        categoryId: 1,
        subCategoryId: 1,
        productCategoryId: 1,
        name: 'Test',
        description: 'Test',
        price: 10,
      };

      mockProductsService.createProduct.mockResolvedValue({ id: 1, ...dto });

      await controller.createProduct(dto);
      expect(mockProductsService.createProduct).toHaveBeenCalledWith(dto);
    });

    it('should not modify service response for getProducts', async () => {
      const paginationDto: PaginationDto = {
        page: 1,
        limit: 10,
        skip: 0,
      };

      const serviceResponse: PaginatedResult<any> = {
        data: [{ id: 1, custom: 'field' }],
        meta: {
          total: 1,
          page: 1,
          limit: 10,
          totalPages: 1,
          hasNextPage: false,
          hasPreviousPage: false,
        },
      };

      mockProductsService.getProducts.mockResolvedValue(serviceResponse);

      const result = await controller.getProducts(paginationDto);
      expect(result).toBe(serviceResponse);
    });

    it('should not modify service response for createProduct', async () => {
      const dto: ProductDto = {
        userId: 1,
        categoryId: 1,
        subCategoryId: 1,
        productCategoryId: 1,
        name: 'Test',
        description: 'Test',
        price: 10,
      };

      const serviceResponse = { id: 1, custom: 'field', ...dto };
      mockProductsService.createProduct.mockResolvedValue(serviceResponse);

      const result = await controller.createProduct(dto);
      expect(result).toBe(serviceResponse);
    });
  });
});
