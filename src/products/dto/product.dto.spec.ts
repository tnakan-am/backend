import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateProductDto } from './create-product.dto';
import { UpdateProductDto } from './update-product.dto';
import { DeliveryOption, Unit } from '../entities/product.entity';

const base = {
  name: 'Apples',
  unit: Unit.kg,
  image: 'apples.jpg',
  description: 'Fresh',
  category: 'fruit',
  subCategory: 'apples',
  availability: 'unlimited',
  deliveryOption: DeliveryOption.nextDay,
};

describe('ProductDto numeric fields', () => {
  it('coerces numeric strings from form inputs', async () => {
    const dto = plainToInstance(CreateProductDto, {
      ...base,
      price: '12.5',
      minQuantity: '2',
    });
    expect(await validate(dto)).toHaveLength(0);
    expect(dto.price).toBe(12.5);
    expect(dto.minQuantity).toBe(2);
  });

  it('still accepts real numbers', async () => {
    const dto = plainToInstance(CreateProductDto, {
      ...base,
      price: 3,
      minQuantity: 0,
    });
    expect(await validate(dto)).toHaveLength(0);
  });

  it.each(['', '  ', 'abc'])('rejects price %p', async (price) => {
    const dto = plainToInstance(CreateProductDto, {
      ...base,
      price,
      minQuantity: 1,
    });
    const errors = await validate(dto);
    expect(errors.map((e) => e.property)).toEqual(['price']);
  });

  it('coerces on partial updates too', async () => {
    const dto = plainToInstance(UpdateProductDto, { price: '7' });
    expect(await validate(dto)).toHaveLength(0);
    expect(dto.price).toBe(7);
  });
});
