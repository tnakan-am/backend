import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { ResetPasswordDto } from './sign-in.dto';

async function errorsFor(password: unknown) {
  const dto = plainToInstance(ResetPasswordDto, {
    token: 'sometoken',
    password,
  });
  return validate(dto);
}

describe('ResetPasswordDto password minimum length', () => {
  it('accepts an 8-character password', async () => {
    expect(await errorsFor('12345678')).toHaveLength(0);
  });

  it('rejects a password shorter than 8 characters', async () => {
    const errors = await errorsFor('short1');
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('password');
  });

  it('rejects an empty password', async () => {
    const errors = await errorsFor('');
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('password');
  });
});
