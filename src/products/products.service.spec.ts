import { Test } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ProductsService } from './products.service';
import { Product, Unit, DeliveryOption } from './entities/product.entity';
import { ProductDto } from './dto/product.dto';

describe('ProductsService', () => {
  let service: ProductsService;
  let repo: { findOne: jest.Mock; create: jest.Mock; save: jest.Mock };

  beforeEach(async () => {
    repo = {
      findOne: jest.fn(),
      create: jest.fn((v) => v),
      save: jest.fn((v) => v),
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
});
