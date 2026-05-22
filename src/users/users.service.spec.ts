import { Test } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { UserService } from './users.service';
import { Users, UserType } from './entities/user.entity';

describe('UserService', () => {
  let service: UserService;
  let repo: { findOne: jest.Mock; save: jest.Mock };

  beforeEach(async () => {
    repo = { findOne: jest.fn(), save: jest.fn() };
    const moduleRef = await Test.createTestingModule({
      providers: [
        UserService,
        { provide: getRepositoryToken(Users), useValue: repo },
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
      ).rejects.toBeInstanceOf(UnauthorizedException);
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
});
