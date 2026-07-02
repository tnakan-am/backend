import { Test } from '@nestjs/testing';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
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
  let orderProductRepo: { findOne: jest.Mock; save: jest.Mock };
  let statusHistoryRepo: { create: jest.Mock; save: jest.Mock };
  let notifications: { updateStatusByOrder: jest.Mock };
  let gateway: { emitStatus: jest.Mock };

  beforeEach(async () => {
    orderRepo = { findOne: jest.fn(), save: jest.fn() };
    orderProductRepo = { findOne: jest.fn(), save: jest.fn((v) => v) };
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
        {
          provide: getRepositoryToken(OrderProduct),
          useValue: orderProductRepo,
        },
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

    it('forbids the customer from self-marking delivered', async () => {
      orderRepo.findOne.mockResolvedValue(makeOrder());
      await expect(
        service.updateOrderStatus(
          'order-uuid',
          jwt(OWNER, UserType.CUSTOMER),
          OrderStatus.delivered,
        ),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(orderRepo.save).not.toHaveBeenCalled();
    });

    it('acknowledges seen without touching status, history, or notifications', async () => {
      orderRepo.findOne.mockResolvedValue({
        ...makeOrder(),
        status: OrderStatus.delivered,
      } as Order);
      const result = await service.updateOrderStatus(
        'order-uuid',
        jwt(OWNER, UserType.CUSTOMER),
        OrderStatus.seen,
      );
      expect(result.status).toBe(OrderStatus.delivered);
      expect(orderRepo.save).not.toHaveBeenCalled();
      expect(statusHistoryRepo.save).not.toHaveBeenCalled();
      expect(notifications.updateStatusByOrder).not.toHaveBeenCalled();
    });

    it('forbids a vendor from setting seen', async () => {
      orderRepo.findOne.mockResolvedValue(makeOrder());
      await expect(
        service.updateOrderStatus(
          'order-uuid',
          jwt(VENDOR, UserType.BUSINESS),
          OrderStatus.seen,
        ),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(orderRepo.save).not.toHaveBeenCalled();
    });

    it('forbids an admin from setting seen on another user’s order', async () => {
      orderRepo.findOne.mockResolvedValue(makeOrder());
      await expect(
        service.updateOrderStatus(
          'order-uuid',
          jwt(STRANGER, UserType.ADMIN),
          OrderStatus.seen,
        ),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(orderRepo.save).not.toHaveBeenCalled();
    });

    it('forbids a vendor from regressing delivered back to processing', async () => {
      orderRepo.findOne.mockResolvedValue({
        ...makeOrder(),
        status: OrderStatus.delivered,
      } as Order);
      await expect(
        service.updateOrderStatus(
          'order-uuid',
          jwt(VENDOR, UserType.BUSINESS),
          OrderStatus.processing,
        ),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(orderRepo.save).not.toHaveBeenCalled();
    });
  });

  describe('updateOrderProductStatus', () => {
    function makeLine(status = OrderStatus.pending) {
      return { id: 'line-1', orderId: 'order-uuid', vendorId: VENDOR, status };
    }

    it('lets the vendor advance their line to processing', async () => {
      orderProductRepo.findOne.mockResolvedValue(makeLine());
      orderRepo.findOne.mockResolvedValue(makeOrder());
      const line = await service.updateOrderProductStatus(
        'order-uuid',
        'p1',
        jwt(VENDOR, UserType.BUSINESS),
        OrderStatus.processing,
      );
      expect(line.status).toBe(OrderStatus.processing);
      expect(orderProductRepo.save).toHaveBeenCalled();
    });

    it('forbids the vendor from regressing a delivered line', async () => {
      orderProductRepo.findOne.mockResolvedValue(
        makeLine(OrderStatus.delivered),
      );
      orderRepo.findOne.mockResolvedValue(makeOrder());
      await expect(
        service.updateOrderProductStatus(
          'order-uuid',
          'p1',
          jwt(VENDOR, UserType.BUSINESS),
          OrderStatus.processing,
        ),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(orderProductRepo.save).not.toHaveBeenCalled();
    });

    it('forbids the vendor from setting seen on their line', async () => {
      orderProductRepo.findOne.mockResolvedValue(makeLine());
      orderRepo.findOne.mockResolvedValue(makeOrder());
      await expect(
        service.updateOrderProductStatus(
          'order-uuid',
          'p1',
          jwt(VENDOR, UserType.BUSINESS),
          OrderStatus.seen,
        ),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(orderProductRepo.save).not.toHaveBeenCalled();
    });

    it('acknowledges owner seen without overwriting the line status', async () => {
      orderProductRepo.findOne.mockResolvedValue(
        makeLine(OrderStatus.delivered),
      );
      orderRepo.findOne.mockResolvedValue(makeOrder());
      const line = await service.updateOrderProductStatus(
        'order-uuid',
        'p1',
        jwt(OWNER, UserType.CUSTOMER),
        OrderStatus.seen,
      );
      expect(line.status).toBe(OrderStatus.delivered);
      expect(orderProductRepo.save).not.toHaveBeenCalled();
    });
  });
});

describe('OrdersService.createForUser stock enforcement', () => {
  let service: OrdersService;
  let orderRepo: { findOne: jest.Mock };
  let userRepo: { findOne: jest.Mock };
  let notifications: { create: jest.Mock };
  let gateway: { emitNew: jest.Mock };
  let em: { find: jest.Mock; create: jest.Mock; save: jest.Mock };

  beforeEach(async () => {
    orderRepo = { findOne: jest.fn().mockResolvedValue(makeOrder()) };
    userRepo = {
      findOne: jest.fn().mockResolvedValue({ id: 'buyer', phoneNumber: '1' }),
    };
    notifications = { create: jest.fn().mockResolvedValue({ id: 'n1' }) };
    gateway = { emitNew: jest.fn() };
    em = {
      find: jest.fn(),
      create: jest.fn((_entity, v) => v),
      save: jest.fn((v) => v),
    };
    const dataSource = {
      transaction: jest.fn((cb: (m: typeof em) => unknown) => cb(em)),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        OrdersService,
        { provide: getRepositoryToken(Order), useValue: orderRepo },
        { provide: getRepositoryToken(OrderProduct), useValue: {} },
        { provide: getRepositoryToken(OrderStatusHistory), useValue: {} },
        { provide: getRepositoryToken(Product), useValue: {} },
        { provide: getRepositoryToken(Users), useValue: userRepo },
        { provide: NotificationsService, useValue: notifications },
        { provide: NotificationsGateway, useValue: gateway },
        { provide: DataSource, useValue: dataSource },
      ],
    }).compile();
    service = moduleRef.get(OrdersService);
  });

  function product(availability: string) {
    return {
      id: 'p1',
      userId: 'v1',
      name: 'Apples',
      unit: 'kg',
      price: 100,
      image: 'i',
      description: 'd',
      approved: true,
      availability,
    };
  }

  it('rejects an order containing an unapproved product', async () => {
    em.find.mockResolvedValue([{ ...product('10'), approved: false }]);
    await expect(
      service.createForUser('buyer', {
        items: [{ productId: 'p1', quantity: 1 }],
        address: {},
      } as never),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(em.create).not.toHaveBeenCalled();
  });

  it('rejects an order exceeding finite availability', async () => {
    em.find.mockResolvedValue([product('3')]);
    await expect(
      service.createForUser('buyer', {
        items: [{ productId: 'p1', quantity: 5 }],
        address: {},
      } as never),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(em.create).not.toHaveBeenCalled();
  });

  it('decrements finite availability on a successful order', async () => {
    em.find.mockResolvedValue([product('10')]);
    await service.createForUser('buyer', {
      items: [{ productId: 'p1', quantity: 4 }],
      address: {},
    } as never);
    const productSave = em.save.mock.calls.find(
      (c) => c[0] && c[0].id === 'p1',
    );
    expect(productSave).toBeDefined();
    expect(productSave![0].availability).toBe('6');
  });

  it('rounds a fractional decrement to 3 decimals without float noise', async () => {
    em.find.mockResolvedValue([product('10.1')]);
    await service.createForUser('buyer', {
      items: [{ productId: 'p1', quantity: 4.7 }],
      address: {},
    } as never);
    const productSave = em.save.mock.calls.find(
      (c) => c[0] && c[0].id === 'p1',
    );
    expect(productSave![0].availability).toBe('5.4');
  });

  it('does not touch unlimited availability', async () => {
    em.find.mockResolvedValue([product('unlimited')]);
    await service.createForUser('buyer', {
      items: [{ productId: 'p1', quantity: 999 }],
      address: {},
    } as never);
    const productSave = em.save.mock.calls.find(
      (c) => c[0] && c[0].id === 'p1',
    );
    expect(productSave).toBeUndefined();
  });
});
