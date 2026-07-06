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

function lineFor(
  vendorId: string,
  status = OrderStatus.pending,
  productId = 'p1',
): OrderProduct {
  return {
    id: `line-${productId}`,
    orderId: 'order-uuid',
    productId,
    vendorId,
    status,
  } as OrderProduct;
}

function makeOrder(overrides: Partial<Order> = {}): Order {
  return {
    id: 'order-uuid',
    userId: OWNER,
    vendorIds: [VENDOR],
    status: OrderStatus.pending,
    products: [lineFor(VENDOR)],
    ...overrides,
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
  let notifications: {
    updateStatusByOrder: jest.Mock;
    updateStatusByOrderVendor: jest.Mock;
  };
  let gateway: { emitStatus: jest.Mock };

  beforeEach(async () => {
    orderRepo = { findOne: jest.fn(), save: jest.fn() };
    orderProductRepo = { findOne: jest.fn(), save: jest.fn((v) => v) };
    statusHistoryRepo = {
      create: jest.fn((v) => v),
      save: jest.fn(),
    };
    notifications = {
      updateStatusByOrder: jest.fn(),
      updateStatusByOrderVendor: jest.fn(),
    };
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
      expect(orderProductRepo.save).not.toHaveBeenCalled();
      expect(notifications.updateStatusByOrderVendor).not.toHaveBeenCalled();
    });

    it('lets a vendor advance only their own lines and derives the order status', async () => {
      orderRepo.findOne.mockResolvedValue(makeOrder());
      orderRepo.save.mockResolvedValue(makeOrder());
      await service.updateOrderStatus(
        'order-uuid',
        jwt(VENDOR, UserType.BUSINESS),
        OrderStatus.processing,
      );
      expect(orderProductRepo.save).toHaveBeenCalled();
      expect(orderRepo.save).toHaveBeenCalled();
      expect(statusHistoryRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ userId: VENDOR, status: 'processing' }),
      );
      expect(notifications.updateStatusByOrderVendor).toHaveBeenCalledWith(
        'order-uuid',
        VENDOR,
        OrderStatus.processing,
      );
      expect(gateway.emitStatus).toHaveBeenCalledWith(
        VENDOR,
        expect.objectContaining({ status: 'processing' }),
      );
    });

    it('does not let one vendor advance another vendor’s items', async () => {
      const other = 'other-vendor';
      orderRepo.findOne.mockResolvedValue(
        makeOrder({
          vendorIds: [VENDOR, other],
          products: [
            lineFor(VENDOR, OrderStatus.pending, 'p1'),
            lineFor(other, OrderStatus.pending, 'p2'),
          ],
        }),
      );
      orderRepo.save.mockResolvedValue(makeOrder());
      await service.updateOrderStatus(
        'order-uuid',
        jwt(VENDOR, UserType.BUSINESS),
        OrderStatus.delivered,
      );
      // Only this vendor's single line was saved; the whole order is not
      // delivered because the other vendor's line is still pending.
      const savedLines = orderProductRepo.save.mock.calls[0][0];
      expect(savedLines).toHaveLength(1);
      expect(savedLines[0].vendorId).toBe(VENDOR);
      expect(statusHistoryRepo.save).toHaveBeenCalledWith(
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
      orderRepo.findOne.mockResolvedValue(
        makeOrder({ status: OrderStatus.delivered }),
      );
      const result = await service.updateOrderStatus(
        'order-uuid',
        jwt(OWNER, UserType.CUSTOMER),
        OrderStatus.seen,
      );
      expect(result.status).toBe(OrderStatus.delivered);
      expect(orderRepo.save).not.toHaveBeenCalled();
      expect(orderProductRepo.save).not.toHaveBeenCalled();
      expect(statusHistoryRepo.save).not.toHaveBeenCalled();
      expect(notifications.updateStatusByOrderVendor).not.toHaveBeenCalled();
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

    it('forbids a vendor from regressing a delivered line to processing', async () => {
      orderRepo.findOne.mockResolvedValue(
        makeOrder({
          status: OrderStatus.delivered,
          products: [lineFor(VENDOR, OrderStatus.delivered)],
        }),
      );
      await expect(
        service.updateOrderStatus(
          'order-uuid',
          jwt(VENDOR, UserType.BUSINESS),
          OrderStatus.processing,
        ),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(orderRepo.save).not.toHaveBeenCalled();
      expect(orderProductRepo.save).not.toHaveBeenCalled();
    });
  });

  describe('updateOrderProductStatus', () => {
    it('lets the vendor advance their line to processing', async () => {
      orderRepo.findOne.mockResolvedValue(
        makeOrder({ products: [lineFor(VENDOR, OrderStatus.pending)] }),
      );
      const line = await service.updateOrderProductStatus(
        'order-uuid',
        'p1',
        jwt(VENDOR, UserType.BUSINESS),
        OrderStatus.processing,
      );
      expect(line.status).toBe(OrderStatus.processing);
      expect(orderProductRepo.save).toHaveBeenCalled();
      expect(notifications.updateStatusByOrderVendor).toHaveBeenCalledWith(
        'order-uuid',
        VENDOR,
        OrderStatus.processing,
      );
    });

    it('throws NotFound when the line is not on the order', async () => {
      orderRepo.findOne.mockResolvedValue(
        makeOrder({ products: [lineFor(VENDOR, OrderStatus.pending)] }),
      );
      await expect(
        service.updateOrderProductStatus(
          'order-uuid',
          'missing-product',
          jwt(VENDOR, UserType.BUSINESS),
          OrderStatus.processing,
        ),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('forbids the vendor from regressing a delivered line', async () => {
      orderRepo.findOne.mockResolvedValue(
        makeOrder({ products: [lineFor(VENDOR, OrderStatus.delivered)] }),
      );
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
      orderRepo.findOne.mockResolvedValue(
        makeOrder({ products: [lineFor(VENDOR, OrderStatus.pending)] }),
      );
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
      orderRepo.findOne.mockResolvedValue(
        makeOrder({ products: [lineFor(VENDOR, OrderStatus.delivered)] }),
      );
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

  // Stock is now persisted in a single batched em.save([...]); flatten so the
  // saved product is found whether the argument is an array or a lone entity.
  function savedProduct(id: string) {
    return em.save.mock.calls
      .flatMap((c) => (Array.isArray(c[0]) ? c[0] : [c[0]]))
      .find((v) => v && v.id === id);
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
    const saved = savedProduct('p1');
    expect(saved).toBeDefined();
    expect(saved.availability).toBe('6');
  });

  it('rounds a fractional decrement to 3 decimals without float noise', async () => {
    em.find.mockResolvedValue([product('10.1')]);
    await service.createForUser('buyer', {
      items: [{ productId: 'p1', quantity: 4.7 }],
      address: {},
    } as never);
    expect(savedProduct('p1').availability).toBe('5.4');
  });

  it('does not touch unlimited availability', async () => {
    em.find.mockResolvedValue([product('unlimited')]);
    await service.createForUser('buyer', {
      items: [{ productId: 'p1', quantity: 999 }],
      address: {},
    } as never);
    expect(savedProduct('p1')).toBeUndefined();
  });
});
