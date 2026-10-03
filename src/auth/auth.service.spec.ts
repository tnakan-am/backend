import { Test } from '@nestjs/testing';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as crypto from 'crypto';
import { AuthService } from './auth.service';
import { UserService } from '../users/users.service';
import { AdminInvite } from './entities/admin-invite.entity';

const sha256 = (v: string) =>
  crypto.createHash('sha256').update(v).digest('hex');

describe('AuthService admin invites', () => {
  let service: AuthService;
  let users: { findByEmail: jest.Mock };
  let qb: {
    update: jest.Mock;
    set: jest.Mock;
    where: jest.Mock;
    andWhere: jest.Mock;
    execute: jest.Mock;
  };
  let repo: {
    create: jest.Mock;
    save: jest.Mock;
    createQueryBuilder: jest.Mock;
  };

  beforeEach(async () => {
    users = {
      findByEmail: jest.fn().mockRejectedValue(new NotFoundException()),
    };
    qb = {
      update: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      execute: jest.fn().mockResolvedValue({ affected: 1 }),
    };
    repo = {
      create: jest.fn((v) => v),
      save: jest.fn((v) => v),
      createQueryBuilder: jest.fn(() => qb),
    };
    const moduleRef = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UserService, useValue: users },
        { provide: JwtService, useValue: {} },
        { provide: getRepositoryToken(AdminInvite), useValue: repo },
      ],
    }).compile();
    service = moduleRef.get(AuthService);
  });

  it('stores only a hash of the invite token, unused, for 7 days', async () => {
    const token = await service.createAdminInvite('New@Admin.io', 'admin-1');
    const saved = repo.save.mock.calls[0][0];
    expect(saved.tokenHash).toBe(sha256(token));
    expect(saved.tokenHash).not.toBe(token);
    expect(saved).toMatchObject({
      email: 'new@admin.io',
      usedAt: null,
      createdBy: 'admin-1',
    });
    const days = (saved.expiresAt.getTime() - Date.now()) / 86_400_000;
    expect(days).toBeGreaterThan(6.99);
    expect(days).toBeLessThanOrEqual(7);
  });

  it('refuses to invite an email that already has an account', async () => {
    users.findByEmail.mockResolvedValue({ id: '1' });
    await expect(
      service.createAdminInvite('a@b.c', 'admin-1'),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(repo.save).not.toHaveBeenCalled();
  });

  it('consumes a live invite matching the token hash and email', async () => {
    await service.redeemAdminInvite('tok', 'New@Admin.io');
    expect(qb.where).toHaveBeenCalledWith('"tokenHash" = :hash', {
      hash: sha256('tok'),
    });
    expect(qb.andWhere).toHaveBeenCalledWith('email = :email', {
      email: 'new@admin.io',
    });
    expect(qb.andWhere).toHaveBeenCalledWith('"usedAt" IS NULL');
    expect(qb.andWhere).toHaveBeenCalledWith('"expiresAt" > now()');
  });

  it('rejects an unknown, used, expired or wrong-email invite', async () => {
    qb.execute.mockResolvedValue({ affected: 0 });
    await expect(
      service.redeemAdminInvite('tok', 'a@b.c'),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
