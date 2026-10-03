import { Test } from '@nestjs/testing';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AdsService } from './ads.service';
import { Advertisement } from './entities/advertisement.entity';
import { UserType } from '../users/entities/user.entity';
import { JwtPayload } from '../auth/jwt-payload.interface';

function jwt(sub: string, type: UserType): JwtPayload {
  return { sub, type, email: 'x@y.z', displayName: 'X' };
}

describe('AdsService', () => {
  let service: AdsService;
  let repo: {
    find: jest.Mock;
    findOne: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
    merge: jest.Mock;
    delete: jest.Mock;
  };

  beforeEach(async () => {
    repo = {
      find: jest.fn().mockResolvedValue([]),
      findOne: jest.fn(),
      create: jest.fn((v) => v),
      save: jest.fn((v) => v),
      merge: jest.fn((a, b) => ({ ...a, ...b })),
      delete: jest.fn().mockResolvedValue({ affected: 1 }),
    };
    const moduleRef = await Test.createTestingModule({
      providers: [
        AdsService,
        { provide: getRepositoryToken(Advertisement), useValue: repo },
      ],
    }).compile();
    service = moduleRef.get(AdsService);
  });

  it('lists only approved ads publicly', async () => {
    await service.getApproved();
    expect(repo.find.mock.calls[0][0].where).toEqual({ approved: true });
  });

  it('filters the admin list only when approved is given', async () => {
    await service.getAll();
    await service.getAll(false);
    expect(repo.find.mock.calls[0][0].where).toEqual({});
    expect(repo.find.mock.calls[1][0].where).toEqual({ approved: false });
  });

  it('creates ads unapproved and owned by the caller', async () => {
    const ad = await service.create(
      { image: 'a.jpg', headline: 'Sale' },
      'vendor-1',
    );
    expect(ad).toMatchObject({ userId: 'vendor-1', approved: false });
  });

  it('throws NotFound for a missing ad', async () => {
    repo.findOne.mockResolvedValue(null);
    await expect(service.getById('missing')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('sends an owner-edited approved ad back to moderation', async () => {
    repo.findOne.mockResolvedValue({ id: 'a', userId: 'v1', approved: true });
    const ad = await service.update(
      'a',
      { headline: 'New' },
      jwt('v1', UserType.BUSINESS),
    );
    expect(ad).toMatchObject({ headline: 'New', approved: false });
  });

  it('keeps approval when an admin edits', async () => {
    repo.findOne.mockResolvedValue({ id: 'a', userId: 'v1', approved: true });
    const ad = await service.update(
      'a',
      { headline: 'Fixed typo' },
      jwt('admin', UserType.ADMIN),
    );
    expect(ad.approved).toBe(true);
  });

  it('forbids another vendor from updating or deleting', async () => {
    repo.findOne.mockResolvedValue({ id: 'a', userId: 'v1' });
    const other = jwt('v2', UserType.BUSINESS);
    await expect(
      service.update('a', { headline: 'x' }, other),
    ).rejects.toBeInstanceOf(ForbiddenException);
    await expect(service.delete('a', other)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    expect(repo.delete).not.toHaveBeenCalled();
  });

  it('lets an admin delete any ad', async () => {
    repo.findOne.mockResolvedValue({ id: 'a', userId: 'v1' });
    await service.delete('a', jwt('admin', UserType.ADMIN));
    expect(repo.delete).toHaveBeenCalledWith('a');
  });

  it('rejects an empty update', async () => {
    await expect(
      service.update('a', {}, jwt('v1', UserType.BUSINESS)),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('sets the approval flag', async () => {
    repo.findOne.mockResolvedValue({ id: 'a', approved: false });
    const ad = await service.approve('a', true);
    expect(ad.approved).toBe(true);
  });
});
