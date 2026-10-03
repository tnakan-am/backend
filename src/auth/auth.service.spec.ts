import { Test } from '@nestjs/testing';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { UserService } from '../users/users.service';
import { jwtConstants } from './constants';

describe('AuthService admin invites', () => {
  let service: AuthService;
  let jwt: JwtService;
  let users: { findByEmail: jest.Mock };

  beforeEach(async () => {
    users = {
      findByEmail: jest.fn().mockRejectedValue(new NotFoundException()),
    };
    const moduleRef = await Test.createTestingModule({
      imports: [JwtModule.register({ secret: jwtConstants.secret })],
      providers: [AuthService, { provide: UserService, useValue: users }],
    }).compile();
    service = moduleRef.get(AuthService);
    jwt = moduleRef.get(JwtService);
  });

  it('accepts an invite for the email it was issued to', async () => {
    const token = await service.createAdminInvite('New@Admin.io');
    await expect(
      service.verifyAdminInvite(token, 'new@admin.io'),
    ).resolves.toBeUndefined();
  });

  it('rejects an invite redeemed with a different email', async () => {
    const token = await service.createAdminInvite('a@b.c');
    await expect(
      service.verifyAdminInvite(token, 'other@b.c'),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects a session token used as an invite', async () => {
    const session = await jwt.signAsync({
      sub: '1',
      email: 'a@b.c',
      type: 'admin',
    });
    await expect(
      service.verifyAdminInvite(session, 'a@b.c'),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('cannot be used as a session token', async () => {
    const token = await service.createAdminInvite('a@b.c');
    await expect(
      jwt.verifyAsync(token, { secret: jwtConstants.secret }),
    ).rejects.toThrow();
  });

  it('rejects a token without the invite purpose', async () => {
    const token = await jwt.signAsync(
      { email: 'a@b.c' },
      { secret: `${jwtConstants.secret}:admin-invite` },
    );
    await expect(
      service.verifyAdminInvite(token, 'a@b.c'),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('refuses to invite an email that already has an account', async () => {
    users.findByEmail.mockResolvedValue({ id: '1' });
    await expect(service.createAdminInvite('a@b.c')).rejects.toBeInstanceOf(
      ConflictException,
    );
  });
});
