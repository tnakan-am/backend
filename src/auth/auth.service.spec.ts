import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UserService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UserType } from '../users/dto/create-user.dto';

jest.mock('bcrypt');

describe('AuthService', () => {
  let service: AuthService;
  let userService: UserService;
  let jwtService: JwtService;

  const mockUserService = {
    findUser: jest.fn(),
    create: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn(),
    signAsync: jest.fn(),
    verify: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UserService,
          useValue: mockUserService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userService = module.get<UserService>(UserService);
    jwtService = module.get<JwtService>(JwtService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('signIn', () => {
    it('should return an access token for valid credentials', async () => {
      const mockUser = {
        id: 1,
        fullName: 'John Doe',
        email: 'john@example.com',
        password: 'hashedPassword',
        type: UserType.CUSTOMER,
        phone: '+37491234567',
        verified: true,
      };

      const mockToken = 'jwt-token-123';

      mockUserService.findUser.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      mockJwtService.signAsync.mockResolvedValue(mockToken);

      const result = await service.signIn('john@example.com', 'password123');

      expect(result).toEqual({ access_token: mockToken });
      expect(mockUserService.findUser).toHaveBeenCalledWith('john@example.com');
      expect(bcrypt.compare).toHaveBeenCalledWith('password123', 'hashedPassword');
      expect(mockJwtService.signAsync).toHaveBeenCalledWith({
        sub: 1,
        full_name: 'John Doe',
        email: 'john@example.com',
      });
    });

    it('should throw UnauthorizedException for invalid password', async () => {
      const mockUser = {
        id: 1,
        fullName: 'John Doe',
        email: 'john@example.com',
        password: 'hashedPassword',
        type: UserType.CUSTOMER,
        phone: '+37491234567',
        verified: true,
      };

      mockUserService.findUser.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        service.signIn('john@example.com', 'wrongpassword'),
      ).rejects.toThrow(UnauthorizedException);

      expect(mockUserService.findUser).toHaveBeenCalledWith('john@example.com');
      expect(bcrypt.compare).toHaveBeenCalledWith('wrongpassword', 'hashedPassword');
    });

    it('should throw UnauthorizedException when user not found', async () => {
      mockUserService.findUser.mockRejectedValue(new Error('User not found'));

      await expect(
        service.signIn('notfound@example.com', 'password'),
      ).rejects.toThrow(UnauthorizedException);
    });

  });
});