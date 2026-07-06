import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from './entities/notification.entity';
import { OrderStatus } from '../orders/order-status.enum';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private readonly repo: Repository<Notification>,
  ) {}

  create(input: {
    userId: string;
    orderId: string;
    productIds: string[];
    status?: OrderStatus;
  }): Promise<Notification> {
    return this.repo.save(
      this.repo.create({
        userId: input.userId,
        orderId: input.orderId,
        productIds: input.productIds,
        status: input.status ?? OrderStatus.pending,
      }),
    );
  }

  findById(id: string): Promise<Notification | null> {
    return this.repo.findOne({ where: { id } });
  }

  findForUser(userId: string): Promise<Notification[]> {
    return this.repo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: 200,
    });
  }

  async updateStatus(id: string, status: OrderStatus): Promise<Notification> {
    const notification = await this.repo.findOne({ where: { id } });
    if (!notification) throw new NotFoundException('Notification not found');
    notification.status = status;
    return this.repo.save(notification);
  }

  updateStatusByOrder(orderId: string, status: OrderStatus): Promise<unknown> {
    return this.repo.update({ orderId }, { status });
  }

  updateStatusByOrderVendor(
    orderId: string,
    vendorId: string,
    status: OrderStatus,
  ): Promise<unknown> {
    return this.repo.update({ orderId, userId: vendorId }, { status });
  }
}
