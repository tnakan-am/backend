import {
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { Product } from './entities/product.entity';
import { ProductDto } from './dto/product.dto';
import { PaginatedResult, PaginationDto } from './dto/pagination.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { JwtPayload } from '../auth/jwt-payload.interface';
import { UserType } from '../users/entities/user.entity';

const ALLOWED_SORT_FIELDS = new Set([
  'createdAt',
  'updatedAt',
  'price',
  'avgReview',
  'numberReview',
  'name',
]);

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}

  async getProducts(dto: PaginationDto): Promise<PaginatedResult<Product>> {
    const {
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
      search,
      category,
      subCategory,
      productCategory,
      userId,
    } = dto;

    const qb: SelectQueryBuilder<Product> =
      this.productRepository.createQueryBuilder('p');

    // Public listing: only approved products are ever exposed here.
    qb.andWhere('p.approved = true');
    if (userId) qb.andWhere('p.userId = :userId', { userId });
    if (category) qb.andWhere('p.category = :category', { category });
    if (subCategory)
      qb.andWhere('p.subCategory = :subCategory', { subCategory });
    if (productCategory)
      qb.andWhere('p.productCategory = :productCategory', { productCategory });
    if (search) {
      qb.andWhere('(p.name ILIKE :search OR p.description ILIKE :search)', {
        search: `%${search}%`,
      });
    }

    const sortField = ALLOWED_SORT_FIELDS.has(sortBy) ? sortBy : 'createdAt';
    qb.orderBy(`p.${sortField}`, sortOrder === 'ASC' ? 'ASC' : 'DESC');
    if (sortField !== 'createdAt') qb.addOrderBy('p.createdAt', 'DESC');

    const total = await qb.getCount();
    qb.skip((page - 1) * limit).take(limit);
    const data = await qb.getMany();

    const totalPages = Math.ceil(total / limit) || 1;
    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  }

  async getTopProducts(limit = 10): Promise<Product[]> {
    return this.productRepository
      .createQueryBuilder('p')
      .where('p.approved = true')
      .orderBy('p.avgReview', 'DESC')
      .addOrderBy('p.numberReview', 'DESC')
      .take(limit)
      .getMany();
  }

  async getById(id: string): Promise<Product> {
    const product = await this.productRepository.findOne({ where: { id } });
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  async create(dto: ProductDto): Promise<Product> {
    const entity = this.productRepository.create({
      ...dto,
      approved: dto.approved ?? false,
    });
    return this.productRepository.save(entity);
  }

  async update(
    id: string,
    dto: UpdateProductDto,
    user: JwtPayload,
  ): Promise<Product> {
    const existing = await this.getById(id);
    this.assertCanModify(existing, user);
    const merged = this.productRepository.merge(existing, dto);
    return this.productRepository.save(merged);
  }

  async delete(id: string): Promise<{ success: true }> {
    const result = await this.productRepository.delete(id);
    if (!result.affected) {
      throw new HttpException('Product not found', HttpStatus.NOT_FOUND);
    }
    return { success: true };
  }

  async approve(id: string, approved: boolean): Promise<Product> {
    const product = await this.getById(id);
    product.approved = approved;
    return this.productRepository.save(product);
  }

  async setAvailability(
    id: string,
    availability: string,
    user: JwtPayload,
  ): Promise<Product> {
    const product = await this.getById(id);
    this.assertCanModify(product, user);
    product.availability = availability;
    return this.productRepository.save(product);
  }

  private assertCanModify(product: Product, user: JwtPayload): void {
    const isAdmin = user.type === UserType.ADMIN;
    const isOwner = product.userId === user.sub;
    if (!isAdmin && !isOwner) {
      throw new ForbiddenException('You cannot modify this product');
    }
  }

  async batchUpdateByUserId(
    userId: string,
    patch: Partial<Product>,
  ): Promise<{ updated: number }> {
    const result = await this.productRepository.update({ userId }, patch);
    return { updated: result.affected || 0 };
  }

  async recomputeReviewAggregates(productId: string): Promise<void> {
    const row = await this.productRepository.manager.query(
      `SELECT COALESCE(AVG(stars), 0)::numeric(3,2) AS avg, COUNT(*)::int AS cnt
         FROM reviews WHERE "productId" = $1`,
      [productId],
    );
    const { avg, cnt } = row[0] || { avg: 0, cnt: 0 };
    await this.productRepository.update(
      { id: productId },
      { avgReview: Number(avg), numberReview: Number(cnt) },
    );
  }
}
