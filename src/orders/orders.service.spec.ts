import { Test } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { OrdersService } from './orders.service';
import { Order, OrderStatus } from './entities/order.entity';
import { OrderProduct } from './entities/order-product.entity';
import { OrderStatusHistory } from './entities/order-status-history.entity';
import { Product } from '../products/entities/product.entity';
import { Users, UserType } from '../users/entities/user.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationsGateway } from '../notifications/notifications.gateway';
import { JwtPayload } from '../auth/jwt-payload.interface';

const OWNER = 'owner-uuid';
const VENDOR = 'vendor-uuid';
const STRANGER = 'stranger-uuid';

function makeOrder(): Order {
  return {
    id: 'order-uuid',
    userId: OWNER,
    vendorIds: [VENDOR],
    status: OrderStatus.pending,
  } as Order;
}

function jwt(sub: string, type: UserType): JwtPayload {
  return { sub, type, email: 'x@y.z', displayName: 'X' };
}

describe('OrdersService access control', () => {
  let service: OrdersService;
  let orderRepo: { findOne: jest.Mock; save: jest.Mock };
  let statusHistoryRepo: { create: jest.Mock; save: jest.Mock };
  let notifications: { updateStatusByOrder: jest.Mock };
  let gateway: { emitStatus: jest.Mock };

  beforeEach(async () => {
    orderRepo = { findOne: jest.fn(), save: jest.fn() };
    statusHistoryRepo = {
      create: jest.fn((v) => v),
      save: jest.fn(),
    };
    notifications = { updateStatusByOrder: jest.fn() };
    gateway = { emitStatus: jest.fn() };

    const moduleRef = await Test.createTestingModule({
      providers: [
        OrdersService,
        { provide: getRepositoryToken(Order), useValue: orderRepo },
        { provide: getRepositoryToken(OrderProduct), useValue: {} },
        {
          provide: getRepositoryToken(OrderStatusHistory),
          useValue: statusHistoryRepo,
        },
        { provide: getRepositoryToken(Product), useValue: {} },
        { provide: getRepositoryToken(Users), useValue: {} },
        { provide: NotificationsService, useValue: notifications },
        { provide: NotificationsGateway, useValue: gateway },
        { provide: DataSource, useValue: {} },
      ],
    }).compile();

    service = moduleRef.get(OrdersService);
  });

  describe('getByIdForUser', () => {
    it('allows the order owner', async () => {
      orderRepo.findOne.mockResolvedValue(makeOrder());
      await expect(
        service.getByIdForUser('order-uuid', jwt(OWNER, UserType.CUSTOMER)),
      ).resolves.toMatchObject({ id: 'order-uuid' });
    });

    it('allows a vendor on the order', async () => {
      orderRepo.findOne.mockResolvedValue(makeOrder());
      await expect(
        service.getByIdForUser('order-uuid', jwt(VENDOR, UserType.BUSINESS)),
      ).resolves.toMatchObject({ id: 'order-uuid' });
    });

    it('allows an admin', async () => {
      orderRepo.findOne.mockResolvedValue(makeOrder());
      await expect(
        service.getByIdForUser('order-uuid', jwt(STRANGER, UserType.ADMIN)),
      ).resolves.toMatchObject({ id: 'order-uuid' });
    });

    it('rejects an unrelated user (IDOR guard)', async () => {
      orderRepo.findOne.mockResolvedValue(makeOrder());
      await expect(
        service.getByIdForUser('order-uuid', jwt(STRANGER, UserType.CUSTOMER)),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('throws NotFound when the order does not exist', async () => {
      orderRepo.findOne.mockResolvedValue(null);
      await expect(
        service.getByIdForUser('missing', jwt(OWNER, UserType.CUSTOMER)),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('updateOrderStatus', () => {
    it('rejects an unrelated user before mutating', async () => {
      orderRepo.findOne.mockResolvedValue(makeOrder());
      await expect(
        service.updateOrderStatus(
          'order-uuid',
          jwt(STRANGER, UserType.CUSTOMER),
          OrderStatus.delivered,
        ),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(orderRepo.save).not.toHaveBeenCalled();
      expect(notifications.updateStatusByOrder).not.toHaveBeenCalled();
    });

    it('lets a vendor update and emits to vendors', async () => {
      orderRepo.findOne.mockResolvedValue(makeOrder());
      orderRepo.save.mockResolvedValue(makeOrder());
      await service.updateOrderStatus(
        'order-uuid',
        jwt(VENDOR, UserType.BUSINESS),
        OrderStatus.processing,
      );
      expect(orderRepo.save).toHaveBeenCalled();
      expect(statusHistoryRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ userId: VENDOR, status: 'processing' }),
      );
      expect(gateway.emitStatus).toHaveBeenCalledWith(
        VENDOR,
        expect.objectContaining({ status: 'processing' }),
      );
    });
  });
});
