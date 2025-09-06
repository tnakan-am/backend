import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { Product } from './entities/product.entity';
import { ProductDto } from './dto/product.dto';
import { PaginationDto, PaginatedResult } from './dto/pagination.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}

  private getQueryBuilder(): SelectQueryBuilder<Product> {
    return this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.user', 'user')
      .leftJoinAndSelect('product.category', 'category')
      .leftJoinAndSelect('product.subCategory', 'subCategory')
      .leftJoinAndSelect('product.productCategory', 'productCategory')
      .select([
        'product', // all product columns
        'category.id',
        'category.name',
        'category.slug', // only these from category
        'subCategory.id',
        'subCategory.name',
        'subCategory.slug', // only these from subCategory
        'productCategory.id',
        'productCategory.name',
        'productCategory.slug', // only these from productCategory
      ]);
  }

  async getProducts(
    paginationDto: PaginationDto,
  ): Promise<PaginatedResult<Product>> {
    const {
      page = 1,
      limit = 10,
      sortBy = 'salesCount',
      sortOrder = 'DESC',
      search,
      categoryId,
      subCategoryId,
      productCategoryId,
      isActive = true,
      isFeatured,
    } = paginationDto;

    const queryBuilder = this.getQueryBuilder();

    // Apply filters
    if (isActive !== undefined) {
      queryBuilder.andWhere('product.isActive = :isActive', { isActive });
    }

    if (isFeatured !== undefined) {
      queryBuilder.andWhere('product.isFeatured = :isFeatured', { isFeatured });
    }

    if (categoryId) {
      queryBuilder.andWhere('product.categoryId = :categoryId', { categoryId });
    }

    if (subCategoryId) {
      queryBuilder.andWhere('product.subCategoryId = :subCategoryId', {
        subCategoryId,
      });
    }

    if (productCategoryId) {
      queryBuilder.andWhere('product.productCategoryId = :productCategoryId', {
        productCategoryId,
      });
    }

    // Search functionality
    if (search) {
      queryBuilder.andWhere(
        '(product.name ILIKE :search OR product.description ILIKE :search OR product.sku ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    // Dynamic sorting
    const allowedSortFields = [
      'salesCount',
      'rating',
      'viewCount',
      'price',
      'createdAt',
      'name',
      'stockQuantity',
    ];
    const sortField = allowedSortFields.includes(sortBy)
      ? sortBy
      : 'salesCount';
    queryBuilder.orderBy(`product.${sortField}`, sortOrder);

    // Add secondary sorting for consistency
    if (sortField !== 'createdAt') {
      queryBuilder.addOrderBy('product.createdAt', 'DESC');
    }

    // Get total count before pagination
    const total = await queryBuilder.getCount();

    // Apply pagination
    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);

    // Execute query
    const data = await queryBuilder.getMany();

    // Calculate metadata
    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPreviousPage = page > 1;

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage,
        hasPreviousPage,
      },
    };
  }

  async createProduct(createProductDto: ProductDto) {
    try {
      return await this.productRepository.save(createProductDto);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  async getProductById(id: number) {
    try {
      const queryBuilder = this.getQueryBuilder();

      queryBuilder.andWhere('product.id = :id', { id });

      return await queryBuilder.getOne();
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  async updateProduct(id: number, updateProductDto: UpdateProductDto) {
    try {
      const existing = await this.productRepository.findOneBy({ id });
      if (!existing) {
        throw new HttpException('Product not found', HttpStatus.NOT_FOUND);
      }

      const data = this.productRepository.merge(existing, updateProductDto);

      return await this.productRepository.save(data);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }
}
