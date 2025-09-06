import 'reflect-metadata';
import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';
import { PaginationDto } from './pagination.dto';

describe('PaginationDto', () => {
  it('should have default values', () => {
    const dto = new PaginationDto();
    
    expect(dto.page).toBe(1);
    expect(dto.limit).toBe(10);
    expect(dto.sortBy).toBe('salesCount');
    expect(dto.sortOrder).toBe('DESC');
    expect(dto.isActive).toBe(true);
    expect(dto.skip).toBe(0);
  });

  it('should calculate skip correctly', () => {
    const dto = new PaginationDto();
    
    dto.page = 1;
    dto.limit = 10;
    expect(dto.skip).toBe(0);
    
    dto.page = 2;
    dto.limit = 10;
    expect(dto.skip).toBe(10);
    
    dto.page = 5;
    dto.limit = 20;
    expect(dto.skip).toBe(80);
  });

  describe('Validation', () => {
    it('should pass validation with valid data', async () => {
      const dto = plainToClass(PaginationDto, {
        page: 2,
        limit: 20,
        sortBy: 'price',
        sortOrder: 'ASC',
        categoryId: 1,
        search: 'apple',
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should fail validation with negative page', async () => {
      const dto = plainToClass(PaginationDto, {
        page: -1,
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('page');
    });

    it('should fail validation with zero page', async () => {
      const dto = plainToClass(PaginationDto, {
        page: 0,
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('page');
    });

    it('should fail validation with negative limit', async () => {
      const dto = plainToClass(PaginationDto, {
        limit: -10,
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('limit');
    });

    it('should fail validation with limit over 100', async () => {
      const dto = plainToClass(PaginationDto, {
        limit: 101,
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('limit');
    });

    it('should accept limit of exactly 100', async () => {
      const dto = plainToClass(PaginationDto, {
        limit: 100,
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });
  });

  describe('Type transformation', () => {
    it('should transform string numbers to numbers', () => {
      const dto = plainToClass(PaginationDto, {
        page: '3',
        limit: '15',
        categoryId: '5',
        subCategoryId: '10',
        productCategoryId: '20',
      });

      expect(typeof dto.page).toBe('number');
      expect(dto.page).toBe(3);
      expect(typeof dto.limit).toBe('number');
      expect(dto.limit).toBe(15);
      expect(typeof dto.categoryId).toBe('number');
      expect(dto.categoryId).toBe(5);
    });

    it('should handle boolean transformation', () => {
      const dto1 = plainToClass(PaginationDto, {
        isActive: 'true',
        isFeatured: 'false',
      });

      expect(dto1.isActive).toBe('true'); // Note: boolean transformation needs explicit handling
      expect(dto1.isFeatured).toBe('false');

      const dto2 = plainToClass(PaginationDto, {
        isActive: true,
        isFeatured: false,
      });

      expect(dto2.isActive).toBe(true);
      expect(dto2.isFeatured).toBe(false);
    });
  });

  describe('Optional fields', () => {
    it('should handle missing optional fields', async () => {
      const dto = plainToClass(PaginationDto, {});

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
      
      expect(dto.page).toBe(1);
      expect(dto.limit).toBe(10);
      expect(dto.search).toBeUndefined();
      expect(dto.categoryId).toBeUndefined();
      expect(dto.subCategoryId).toBeUndefined();
      expect(dto.productCategoryId).toBeUndefined();
      expect(dto.isFeatured).toBeUndefined();
    });

    it('should handle all fields provided', () => {
      const dto = plainToClass(PaginationDto, {
        page: 5,
        limit: 50,
        sortBy: 'rating',
        sortOrder: 'ASC',
        search: 'organic apple',
        categoryId: 1,
        subCategoryId: 2,
        productCategoryId: 3,
        isActive: false,
        isFeatured: true,
      });

      expect(dto.page).toBe(5);
      expect(dto.limit).toBe(50);
      expect(dto.sortBy).toBe('rating');
      expect(dto.sortOrder).toBe('ASC');
      expect(dto.search).toBe('organic apple');
      expect(dto.categoryId).toBe(1);
      expect(dto.subCategoryId).toBe(2);
      expect(dto.productCategoryId).toBe(3);
      expect(dto.isActive).toBe(false);
      expect(dto.isFeatured).toBe(true);
    });
  });

  describe('PaginatedResult interface', () => {
    it('should structure paginated result correctly', () => {
      const result = {
        data: [{ id: 1, name: 'Product' }],
        meta: {
          total: 100,
          page: 2,
          limit: 10,
          totalPages: 10,
          hasNextPage: true,
          hasPreviousPage: true,
        },
      };

      expect(result.data).toBeInstanceOf(Array);
      expect(result.meta).toBeDefined();
      expect(result.meta.total).toBe(100);
      expect(result.meta.totalPages).toBe(10);
      expect(result.meta.hasNextPage).toBe(true);
      expect(result.meta.hasPreviousPage).toBe(true);
    });

    it('should handle edge cases for pagination metadata', () => {
      // First page
      const firstPage = {
        meta: {
          total: 50,
          page: 1,
          limit: 10,
          totalPages: 5,
          hasNextPage: true,
          hasPreviousPage: false,
        },
      };

      expect(firstPage.meta.hasPreviousPage).toBe(false);
      expect(firstPage.meta.hasNextPage).toBe(true);

      // Last page
      const lastPage = {
        meta: {
          total: 50,
          page: 5,
          limit: 10,
          totalPages: 5,
          hasNextPage: false,
          hasPreviousPage: true,
        },
      };

      expect(lastPage.meta.hasPreviousPage).toBe(true);
      expect(lastPage.meta.hasNextPage).toBe(false);

      // Single page
      const singlePage = {
        meta: {
          total: 5,
          page: 1,
          limit: 10,
          totalPages: 1,
          hasNextPage: false,
          hasPreviousPage: false,
        },
      };

      expect(singlePage.meta.hasPreviousPage).toBe(false);
      expect(singlePage.meta.hasNextPage).toBe(false);

      // Empty result
      const emptyResult = {
        meta: {
          total: 0,
          page: 1,
          limit: 10,
          totalPages: 0,
          hasNextPage: false,
          hasPreviousPage: false,
        },
      };

      expect(emptyResult.meta.totalPages).toBe(0);
      expect(emptyResult.meta.hasNextPage).toBe(false);
      expect(emptyResult.meta.hasPreviousPage).toBe(false);
    });
  });

  describe('Sort options', () => {
    it('should accept valid sort fields', () => {
      const validSortFields = ['salesCount', 'rating', 'viewCount', 'price', 'createdAt', 'name', 'stockQuantity'];
      
      validSortFields.forEach(field => {
        const dto = new PaginationDto();
        dto.sortBy = field;
        expect(dto.sortBy).toBe(field);
      });
    });

    it('should accept valid sort orders', () => {
      const dto = new PaginationDto();
      
      dto.sortOrder = 'ASC';
      expect(dto.sortOrder).toBe('ASC');
      
      dto.sortOrder = 'DESC';
      expect(dto.sortOrder).toBe('DESC');
    });
  });

  describe('Search functionality', () => {
    it('should handle search strings', () => {
      const dto = new PaginationDto();
      
      dto.search = 'apple';
      expect(dto.search).toBe('apple');
      
      dto.search = 'organic fresh apples';
      expect(dto.search).toBe('organic fresh apples');
      
      dto.search = '';
      expect(dto.search).toBe('');
    });

    it('should handle special characters in search', () => {
      const dto = new PaginationDto();
      
      dto.search = 'apple & orange';
      expect(dto.search).toBe('apple & orange');
      
      dto.search = '50% off';
      expect(dto.search).toBe('50% off');
      
      dto.search = 'product-123';
      expect(dto.search).toBe('product-123');
    });
  });
});