import { Test } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { UserService } from './users.service';
import { Users, UserType } from './entities/user.entity';
import { Product } from '../products/entities/product.entity';
import { EmailService } from '../email/email.service';

describe('UserService', () => {
  let service: UserService;
  let repo: {
    find: jest.Mock;
    findOne: jest.Mock;
    save: jest.Mock;
    merge: jest.Mock;
  };
  let productRepo: { update: jest.Mock };
  let email: { sendVerificationEmail: jest.Mock };

  beforeEach(async () => {
    repo = {
      find: jest.fn().mockResolvedValue([]),
      findOne: jest.fn(),
      save: jest.fn(),
      merge: jest.fn((a, b) => ({ ...a, ...b })),
    };
    productRepo = { update: jest.fn() };
    email = { sendVerificationEmail: jest.fn() };
    const moduleRef = await Test.createTestingModule({
      providers: [
        UserService,
        { provide: getRepositoryToken(Users), useValue: repo },
        { provide: getRepositoryToken(Product), useValue: productRepo },
        { provide: EmailService, useValue: email },
      ],
    }).compile();
    service = moduleRef.get(UserService);
  });

  describe('toSafeUser', () => {
    it('strips password and token fields', () => {
      const user = {
        id: '1',
        email: 'a@b.com',
        displayName: 'A',
        password: 'hash',
        verificationToken: 'vt',
        passwordResetToken: 'rt',
        passwordResetExpiresAt: new Date(),
        type: UserType.CUSTOMER,
      } as Users;

      const safe = service.toSafeUser(user) as Record<string, unknown>;
      expect(safe.password).toBeUndefined();
      expect(safe.verificationToken).toBeUndefined();
      expect(safe.passwordResetToken).toBeUndefined();
      expect(safe.passwordResetExpiresAt).toBeUndefined();
      expect(safe.email).toBe('a@b.com');
    });
  });

  describe('changePassword', () => {
    it('rejects an incorrect current password', async () => {
      const hash = await bcrypt.hash('correct', 10);
      repo.findOne.mockResolvedValue({ id: '1', password: hash } as Users);

      await expect(
        service.changePassword('1', 'wrong', 'NewPassword1!'),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(repo.save).not.toHaveBeenCalled();
    });

    it('updates the password when the current one matches', async () => {
      const hash = await bcrypt.hash('correct', 10);
      repo.findOne.mockResolvedValue({ id: '1', password: hash } as Users);
      repo.save.mockImplementation((u) => u);

      await service.changePassword('1', 'correct', 'NewPassword1!');
      expect(repo.save).toHaveBeenCalled();
      const saved = repo.save.mock.calls[0][0];
      expect(saved.password).not.toBe(hash);
    });
  });

  describe('findBusinesses', () => {
    it('selects display fields only, no contact or tax data', async () => {
      await service.findBusinesses();
      const { select } = repo.find.mock.calls[0][0];
      expect(Object.keys(select).sort()).toEqual(
        ['company', 'displayName', 'id', 'image', 'isTopSeller'].sort(),
      );
    });
  });

  describe('update', () => {
    it('syncs a new profile image onto the vendor’s products', async () => {
      repo.findOne.mockResolvedValue({ id: '1' } as Users);
      repo.save.mockImplementation((u) => u);

      await service.update('1', { image: 'http://x/new.png' });
      expect(productRepo.update).toHaveBeenCalledWith(
        { userId: '1' },
        { userPhoto: 'http://x/new.png' },
      );
    });

    it('syncs a new display name onto the vendor’s products', async () => {
      repo.findOne.mockResolvedValue({ id: '1' } as Users);
      repo.save.mockImplementation((u) => u);

      await service.update('1', { displayName: 'B' });
      expect(productRepo.update).toHaveBeenCalledWith(
        { userId: '1' },
        { userDisplayName: 'B' },
      );
    });

    it('leaves products alone when neither name nor image changes', async () => {
      repo.findOne.mockResolvedValue({ id: '1' } as Users);
      repo.save.mockImplementation((u) => u);

      await service.update('1', { phoneNumber: '123' });
      expect(productRepo.update).not.toHaveBeenCalled();
    });
  });

  describe('changeEmail', () => {
    it('rejects an incorrect current password with 400, not 401', async () => {
      const hash = await bcrypt.hash('correct', 10);
      repo.findOne.mockResolvedValue({ id: '1', password: hash } as Users);

      await expect(
        service.changeEmail('1', 'wrong', 'new@b.com'),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(repo.save).not.toHaveBeenCalled();
    });

    it('sends a verification email to the new address', async () => {
      const hash = await bcrypt.hash('correct', 10);
      repo.findOne
        .mockResolvedValueOnce({ id: '1', password: hash } as Users)
        .mockResolvedValueOnce(null);
      repo.save.mockImplementation((u) => u);

      const safe = await service.changeEmail('1', 'correct', 'New@B.com');
      expect(safe.verified).toBe(false);
      expect(email.sendVerificationEmail).toHaveBeenCalledWith(
        'new@b.com',
        expect.any(String),
        'emailChange',
      );
    });

    it('still succeeds when the email send fails', async () => {
      const hash = await bcrypt.hash('correct', 10);
      repo.findOne
        .mockResolvedValueOnce({ id: '1', password: hash } as Users)
        .mockResolvedValueOnce(null);
      repo.save.mockImplementation((u) => u);
      email.sendVerificationEmail.mockRejectedValue(new Error('smtp down'));

      await expect(
        service.changeEmail('1', 'correct', 'new@b.com'),
      ).resolves.toMatchObject({ email: 'new@b.com' });
    });
  });

  describe('verifyEmail', () => {
    it('rejects an expired verification token', async () => {
      repo.findOne.mockResolvedValue({
        id: '1',
        verified: false,
        verificationToken: 'vt',
        verificationTokenExpiresAt: new Date(Date.now() - 1000),
      } as Users);

      await expect(service.verifyEmail('vt')).rejects.toBeInstanceOf(
        BadRequestException,
      );
      expect(repo.save).not.toHaveBeenCalled();
    });

    it('rejects a token with no expiry recorded', async () => {
      repo.findOne.mockResolvedValue({
        id: '1',
        verified: false,
        verificationToken: 'vt',
        verificationTokenExpiresAt: null,
      } as Users);

      await expect(service.verifyEmail('vt')).rejects.toBeInstanceOf(
        BadRequestException,
      );
      expect(repo.save).not.toHaveBeenCalled();
    });

    it('verifies and clears the token when not expired', async () => {
      repo.findOne.mockResolvedValue({
        id: '1',
        verified: false,
        verificationToken: 'vt',
        verificationTokenExpiresAt: new Date(Date.now() + 60_000),
      } as Users);
      repo.save.mockImplementation((u) => u);

      await service.verifyEmail('vt');
      const saved = repo.save.mock.calls[0][0];
      expect(saved.verified).toBe(true);
      expect(saved.verificationToken).toBeNull();
      expect(saved.verificationTokenExpiresAt).toBeNull();
    });
  });
});
