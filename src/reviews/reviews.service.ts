import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Review } from './entities/review.entity';
import { OrderProduct } from '../orders/entities/order-product.entity';
import { Users } from '../users/entities/user.entity';
import { ProductsService } from '../products/products.service';
import { CreateReviewDto } from './dto/create-review.dto';

@Injectable()
export class ReviewsService {
  constructor(
    @InjectRepository(Review)
    private readonly reviewRepository: Repository<Review>,
    @InjectRepository(OrderProduct)
    private readonly orderProductRepository: Repository<OrderProduct>,
    @InjectRepository(Users)
    private readonly userRepository: Repository<Users>,
    private readonly productsService: ProductsService,
    private readonly dataSource: DataSource,
  ) {}

  async create(userId: string, dto: CreateReviewDto): Promise<Review> {
    const orderProduct = await this.orderProductRepository.findOne({
      where: { orderId: dto.orderId, productId: dto.productId },
      relations: ['order'],
    });
    if (!orderProduct) {
      throw new NotFoundException('Order line not found');
    }
    if (orderProduct.order.userId !== userId) {
      throw new BadRequestException('You can only review your own orders');
    }
    if (orderProduct.reviewRef) {
      throw new BadRequestException('This order line is already reviewed');
    }

    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const review = await this.dataSource.transaction(async (em) => {
      const saved = await em.save(
        em.create(Review, {
          productId: dto.productId,
          orderId: dto.orderId,
          userId,
          userName: user.displayName,
          userPhoto: dto.userPhoto ?? user.image ?? null,
          stars: dto.stars,
          comment: dto.comment,
        }),
      );
      await em.update(
        OrderProduct,
        { id: orderProduct.id },
        { reviewRef: saved.id },
      );
      return saved;
    });

    await this.productsService.recomputeReviewAggregates(dto.productId);
    return review;
  }

  findByProduct(productId: string): Promise<Review[]> {
    return this.reviewRepository.find({
      where: { productId },
      order: { createdAt: 'DESC' },
    });
  }
}
