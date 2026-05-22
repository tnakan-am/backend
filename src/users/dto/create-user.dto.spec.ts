import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateUserDto } from './create-user.dto';
import { UserType } from '../entities/user.entity';

const base = {
  email: 'a@b.com',
  password: 'Password123!',
  displayName: 'Test',
};

async function errorsFor(type: unknown) {
  const dto = plainToInstance(CreateUserDto, { ...base, type });
  return validate(dto);
}

describe('CreateUserDto type restriction', () => {
  it('accepts customer', async () => {
    expect(await errorsFor(UserType.CUSTOMER)).toHaveLength(0);
  });

  it('accepts business', async () => {
    expect(await errorsFor(UserType.BUSINESS)).toHaveLength(0);
  });

  it('rejects admin (privilege-escalation guard)', async () => {
    const errors = await errorsFor(UserType.ADMIN);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('type');
  });

  it('rejects an arbitrary value', async () => {
    const errors = await errorsFor('superuser');
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('type');
  });
});
