import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Between,
  DataSource,
  In,
  LessThanOrEqual,
  MoreThanOrEqual,
  Repository,
} from 'typeorm';
import { Order, OrderStatus } from './entities/order.entity';
import { OrderProduct } from './entities/order-product.entity';
import { OrderStatusHistory } from './entities/order-status-history.entity';
import { Product } from '../products/entities/product.entity';
import { Users, UserType } from '../users/entities/user.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { JwtPayload } from '../auth/jwt-payload.interface';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationsGateway } from '../notifications/notifications.gateway';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(OrderProduct)
    private readonly orderProductRepository: Repository<OrderProduct>,
    @InjectRepository(OrderStatusHistory)
    private readonly statusHistoryRepository: Repository<OrderStatusHistory>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(Users)
    private readonly userRepository: Repository<Users>,
    private readonly notificationsService: NotificationsService,
    private readonly notificationsGateway: NotificationsGateway,
    private readonly dataSource: DataSource,
  ) {}

  async createForUser(userId: string, dto: CreateOrderDto): Promise<Order> {
    const productIds = dto.items.map((i) => i.productId);

    const buyer = await this.userRepository.findOne({ where: { id: userId } });
    if (!buyer) throw new NotFoundException('Buyer not found');

    const { created, products } = await this.dataSource.transaction(
      async (em) => {
        // Lock the product rows so the stock check-and-decrement below is
        // atomic against concurrent orders (SELECT ... FOR UPDATE).
        // Deterministic lock order (id ASC) so concurrent orders over
        // overlapping product sets cannot deadlock each other.
        const locked = await em.find(Product, {
          where: { id: In(productIds) },
          order: { id: 'ASC' },
          lock: { mode: 'pessimistic_write' },
        });
        if (locked.length !== productIds.length) {
          throw new BadRequestException('One or more products were not found');
        }
        const unapproved = locked.find((p) => !p.approved);
        if (unapproved) {
          throw new BadRequestException(
            `Product "${unapproved.name}" is not available for purchase`,
          );
        }
        const productsById = new Map(locked.map((p) => [p.id, p]));

        // Enforce and decrement finite availability ('unlimited' is skipped).
        for (const item of dto.items) {
          const p = productsById.get(item.productId)!;
          if (p.availability === 'unlimited') continue;
          const avail = Number(p.availability);
          if (!Number.isFinite(avail)) {
            throw new BadRequestException(
              `Product "${p.name}" has invalid availability`,
            );
          }
          if (Number(item.quantity) > avail) {
            throw new BadRequestException(`Insufficient stock for "${p.name}"`);
          }
          // Round to the quantity column's scale (numeric(12,3)) so fractional
          // units don't persist floating-point noise into the string column.
          p.availability = String(
            Number((avail - Number(item.quantity)).toFixed(3)),
          );
          await em.save(p);
        }

        const vendorIds = Array.from(new Set(locked.map((p) => p.userId)));
        const total = dto.items.reduce((sum, item) => {
          const p = productsById.get(item.productId)!;
          return sum + Number(p.price) * Number(item.quantity);
        }, 0);

        const order = em.create(Order, {
          userId,
          userPhone: dto.userPhone ?? buyer.phoneNumber ?? '',
          address: dto.address,
          status: OrderStatus.pending,
          total,
          vendorIds,
          productIds: locked.map((p) => p.id),
          paidAt: new Date(),
        });
        const savedOrder = await em.save(order);

        const orderProducts = dto.items.map((item) => {
          const p = productsById.get(item.productId)!;
          return em.create(OrderProduct, {
            orderId: savedOrder.id,
            productId: p.id,
            vendorId: p.userId,
            name: p.name,
            unit: p.unit,
            price: p.price,
            image: p.image,
            description: p.description,
            quantity: item.quantity,
            status: OrderStatus.pending,
            comment: item.comment ?? null,
          });
        });
        await em.save(orderProducts);

        await em.save(
          em.create(OrderStatusHistory, {
            orderId: savedOrder.id,
            userId,
            status: OrderStatus.pending,
          }),
        );
        return { created: savedOrder, products: locked };
      },
    );

    // Notify every vendor (out-of-tx so they only get the event if commit succeeded).
    const vendorIds = Array.from(new Set(products.map((p) => p.userId)));
    for (const vendorId of vendorIds) {
      const vendorProductIds = products
        .filter((p) => p.userId === vendorId)
        .map((p) => p.id);
      const notification = await this.notificationsService.create({
        userId: vendorId,
        orderId: created.id,
        productIds: vendorProductIds,
        status: OrderStatus.pending,
      });
      this.notificationsGateway.emitNew(notification);
    }

    return this.getById(created.id);
  }

  async getById(id: string): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { id },
      relations: ['products', 'statusHistory'],
    });
    if (!order) throw new NotFoundException('Order not found');
    return order;
  }

  /**
   * Loads an order only if the requester is its owner, a vendor on it, or an
   * admin. Used by the controller to prevent IDOR; internal flows use getById.
   */
  async getByIdForUser(id: string, user: JwtPayload): Promise<Order> {
    const order = await this.getById(id);
    this.assertCanAccess(order, user);
    return order;
  }

  private assertCanAccess(order: Order, user: JwtPayload): void {
    const isAdmin = user.type === UserType.ADMIN;
    const isOwner = order.userId === user.sub;
    const isVendor = order.vendorIds.includes(user.sub);
    if (!isAdmin && !isOwner && !isVendor) {
      throw new ForbiddenException('You cannot access this order');
    }
  }

  // Fulfillment progression used to forbid regressions (e.g. delivered back
  // to processing). 'seen' is an acknowledgement, not a fulfillment state.
  private static readonly STATUS_RANK: Record<OrderStatus, number> = {
    [OrderStatus.pending]: 0,
    [OrderStatus.seen]: 0,
    [OrderStatus.processing]: 1,
    [OrderStatus.delivered]: 2,
  };

  /**
   * Shared status matrix for orders and order lines: only the customer
   * (owner) may acknowledge with 'seen'; admins may set any fulfillment
   * status; vendors may advance to processing/delivered but not regress.
   * `pending` is set by the system at order creation.
   */
  private assertCanSetStatus(opts: {
    current: OrderStatus;
    next: OrderStatus;
    isAdmin: boolean;
    isVendor: boolean;
    isOwner: boolean;
  }): void {
    const { current, next, isAdmin, isVendor, isOwner } = opts;
    if (next === OrderStatus.seen) {
      if (isOwner) return;
      throw new ForbiddenException(
        'Only the customer can acknowledge with seen',
      );
    }
    if (isAdmin) return;
    if (isVendor) {
      if (next !== OrderStatus.processing && next !== OrderStatus.delivered) {
        throw new ForbiddenException('Vendors cannot set this order status');
      }
      if (
        OrdersService.STATUS_RANK[next] < OrdersService.STATUS_RANK[current]
      ) {
        throw new ForbiddenException('Order status cannot move backwards');
      }
      return;
    }
    throw new ForbiddenException('You cannot set this order status');
  }

  private assertCanSetOrderStatus(
    order: Order,
    user: JwtPayload,
    status: OrderStatus,
  ): void {
    this.assertCanSetStatus({
      current: order.status,
      next: status,
      isAdmin: user.type === UserType.ADMIN,
      isVendor: order.vendorIds.includes(user.sub),
      isOwner: order.userId === user.sub,
    });
  }

  async listForCustomer(userId: string): Promise<Order[]> {
    return this.orderRepository.find({
      where: { userId },
      relations: ['products'],
      order: { createdAt: 'DESC' },
    });
  }

  async listForVendor(vendorId: string): Promise<Order[]> {
    return this.orderRepository
      .createQueryBuilder('o')
      .leftJoinAndSelect('o.products', 'p')
      .where(':vendor = ANY(o."vendorIds")', { vendor: vendorId })
      .orderBy('o.createdAt', 'DESC')
      .getMany();
  }

  async listForAdmin(startDate?: string, endDate?: string): Promise<Order[]> {
    const where: any = {};
    if (startDate && endDate) {
      where.createdAt = Between(new Date(startDate), new Date(endDate));
    } else if (startDate) {
      where.createdAt = MoreThanOrEqual(new Date(startDate));
    } else if (endDate) {
      where.createdAt = LessThanOrEqual(new Date(endDate));
    }
    return this.orderRepository.find({
      where,
      relations: ['products'],
      order: { createdAt: 'DESC' },
    });
  }

  async updateOrderStatus(
    orderId: string,
    user: JwtPayload,
    status: OrderStatus,
  ): Promise<Order> {
    const order = await this.getById(orderId);
    this.assertCanAccess(order, user);
    this.assertCanSetOrderStatus(order, user, status);
    // 'seen' is a customer acknowledgement, not a fulfillment state: leave the
    // order, its history, and the vendors' notifications untouched.
    if (status === OrderStatus.seen) return order;
    order.status = status;
    await this.orderRepository.save(order);
    await this.statusHistoryRepository.save(
      this.statusHistoryRepository.create({
        orderId,
        userId: user.sub,
        status,
      }),
    );
    await this.notificationsService.updateStatusByOrder(orderId, status);
    for (const vendorId of order.vendorIds) {
      this.notificationsGateway.emitStatus(vendorId, {
        id: orderId,
        orderId,
        status,
      });
    }
    return this.getById(orderId);
  }

  async updateOrderProductStatus(
    orderId: string,
    productId: string,
    user: JwtPayload,
    status: OrderStatus,
  ): Promise<OrderProduct> {
    const orderProduct = await this.orderProductRepository.findOne({
      where: { orderId, productId },
    });
    if (!orderProduct) throw new NotFoundException('Order item not found');

    const order = await this.getById(orderId);
    this.assertCanAccess(order, user);
    this.assertCanSetStatus({
      current: orderProduct.status,
      next: status,
      isAdmin: user.type === UserType.ADMIN,
      isVendor: orderProduct.vendorId === user.sub,
      isOwner: order.userId === user.sub,
    });
    if (status === OrderStatus.seen) return orderProduct;

    orderProduct.status = status;
    return this.orderProductRepository.save(orderProduct);
  }
}
