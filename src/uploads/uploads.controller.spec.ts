import { BadRequestException } from '@nestjs/common';
import { UploadsController } from './uploads.controller';
import { JwtPayload } from '../auth/jwt-payload.interface';

const user: JwtPayload = {
  sub: 'u1',
  type: 'customer' as any,
  email: 'a@b.com',
  displayName: 'A',
};

describe('UploadsController', () => {
  const controller = new UploadsController();

  it('builds a public URL from the stored filename', () => {
    const file = { filename: 'abc.png', size: 10 } as Express.Multer.File;
    const res = controller.uploadFile(file, user);
    expect(res.url).toContain('/u1/abc.png');
    expect(res.filename).toBe('abc.png');
  });

  it('rejects a missing file', () => {
    expect(() =>
      controller.uploadFile(undefined as unknown as Express.Multer.File, user),
    ).toThrow(BadRequestException);
  });
});
