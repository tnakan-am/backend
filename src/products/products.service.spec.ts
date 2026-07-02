import { Test } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ProductsService } from './products.service';
import { Product, Unit, DeliveryOption } from './entities/product.entity';
import { ProductDto } from './dto/product.dto';
import { UserType } from '../users/entities/user.entity';
import { JwtPayload } from '../auth/jwt-payload.interface';

function jwt(sub: string, type: UserType): JwtPayload {
  return { sub, type, email: 'x@y.z', displayName: 'X' };
}

describe('ProductsService', () => {
  let service: ProductsService;
  let repo: {
    findOne: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
    merge: jest.Mock;
  };

  beforeEach(async () => {
    repo = {
      findOne: jest.fn(),
      create: jest.fn((v) => v),
      save: jest.fn((v) => v),
      merge: jest.fn((a, b) => ({ ...a, ...b })),
    };
    const moduleRef = await Test.createTestingModule({
      providers: [
        ProductsService,
        { provide: getRepositoryToken(Product), useValue: repo },
      ],
    }).compile();
    service = moduleRef.get(ProductsService);
  });

  it('throws NotFound for a missing product', async () => {
    repo.findOne.mockResolvedValue(null);
    await expect(service.getById('missing')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('defaults approved to false on create', async () => {
    const dto: ProductDto = {
      name: 'Apples',
      unit: Unit.kg,
      minQuantity: 1,
      price: 100,
      image: 'http://x/img.png',
      description: 'desc',
      category: 'groceries',
      subCategory: 'fruits',
      availability: '10',
      deliveryOption: DeliveryOption.nearest,
    };
    await service.create(dto);
    const created = repo.create.mock.calls[0][0];
    expect(created.approved).toBe(false);
  });

  it('keeps an explicit approved=true on create', async () => {
    const dto = {
      name: 'Apples',
      unit: Unit.kg,
      minQuantity: 1,
      price: 100,
      image: 'http://x/img.png',
      description: 'desc',
      category: 'groceries',
      subCategory: 'fruits',
      availability: '10',
      deliveryOption: DeliveryOption.nearest,
      approved: true,
    } as ProductDto;
    await service.create(dto);
    const created = repo.create.mock.calls[0][0];
    expect(created.approved).toBe(true);
  });

  describe('update authorization', () => {
    it('rejects a non-owner non-admin (IDOR guard)', async () => {
      repo.findOne.mockResolvedValue({ id: 'p1', userId: 'owner' } as Product);
      await expect(
        service.update('p1', { name: 'x' }, jwt('stranger', UserType.CUSTOMER)),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(repo.save).not.toHaveBeenCalled();
    });

    it('allows the owner', async () => {
      repo.findOne.mockResolvedValue({ id: 'p1', userId: 'owner' } as Product);
      await service.update(
        'p1',
        { name: 'x' },
        jwt('owner', UserType.BUSINESS),
      );
      expect(repo.save).toHaveBeenCalled();
    });

    it('allows an admin', async () => {
      repo.findOne.mockResolvedValue({ id: 'p1', userId: 'owner' } as Product);
      await service.update(
        'p1',
        { name: 'x' },
        jwt('someadmin', UserType.ADMIN),
      );
      expect(repo.save).toHaveBeenCalled();
    });
  });

  describe('setAvailability authorization', () => {
    it('rejects a non-owner non-admin', async () => {
      repo.findOne.mockResolvedValue({ id: 'p1', userId: 'owner' } as Product);
      await expect(
        service.setAvailability('p1', '5', jwt('stranger', UserType.CUSTOMER)),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(repo.save).not.toHaveBeenCalled();
    });
  });
});
