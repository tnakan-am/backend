import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateAdDto } from './ad.dto';

async function errorProps(extra: Record<string, unknown>) {
  const dto = plainToInstance(CreateAdDto, {
    image: 'https://cdn.example.com/a.jpg',
    headline: 'Sale',
    ...extra,
  });
  return (await validate(dto)).map((e) => e.property);
}

describe('CreateAdDto URLs', () => {
  it.each([
    '/seller/1',
    'https://shop.example.com/x',
    'http://localhost:4200/a',
  ])('accepts link %p', async (link) => {
    expect(await errorProps({ link })).toEqual([]);
  });

  it.each([
    'javascript:alert(1)',
    '//evil.com',
    'seller/1',
    'data:text/html,x',
  ])('rejects link %p', async (link) => {
    expect(await errorProps({ link })).toEqual(['link']);
  });

  it('accepts an upload URL on localhost', async () => {
    expect(
      await errorProps({ image: 'http://localhost:3000/uploads/u/a.jpg' }),
    ).toEqual([]);
  });

  it.each(['javascript:alert(1)', '/uploads/a.jpg', 'ftp://x.y/a.jpg'])(
    'rejects image %p',
    async (image) => {
      expect(await errorProps({ image })).toEqual(['image']);
    },
  );
});
