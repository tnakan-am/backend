import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UserService } from '../users/users.service';
import { AddressService } from '../addresses/address.service';
import { EmailService } from '../email/email.service';
import { AuthGuard } from './auth.guard';
import { JwtService } from '@nestjs/jwt';
import { CreateUserDto, UserType } from '../users/dto/create-user.dto';
import { SignInDto } from './sign-in.dto';
import { UnauthorizedException, HttpException } from '@nestjs/common';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;
  let userService: UserService;
  let addressService: AddressService;
  let emailService: EmailService;

  const mockAuthService = {
    signIn: jest.fn(),
  };

  const mockUserService = {
    create: jest.fn(),
    verifyEmail: jest.fn(),
    findUser: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  const mockAddressService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  const mockEmailService = {
    sendVerificationEmail: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn(),
    signAsync: jest.fn(),
    verify: jest.fn(),
  };

  const mockAuthGuard = {
    canActivate: jest.fn(() => true),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
        {
          provide: UserService,
          useValue: mockUserService,
        },
        {
          provide: AddressService,
          useValue: mockAddressService,
        },
        {
          provide: EmailService,
          useValue: mockEmailService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: AuthGuard,
          useValue: mockAuthGuard,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
    userService = module.get<UserService>(UserService);
    addressService = module.get<AddressService>(AddressService);
    emailService = module.get<EmailService>(EmailService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('signIn', () => {
    it('should return access token for valid credentials', async () => {
      const signInDto: SignInDto = {
        email: 'john@example.com',
        password: 'password123',
      };

      const expectedResult = {
        access_token: 'jwt-token-123',
      };

      mockAuthService.signIn.mockResolvedValue(expectedResult);

      const result = await controller.signIn(signInDto);

      expect(result).toEqual(expectedResult);
      expect(mockAuthService.signIn).toHaveBeenCalledWith(
        'john@example.com',
        'password123',
      );
    });

    it('should throw UnauthorizedException for invalid credentials', async () => {
      const signInDto: SignInDto = {
        email: 'john@example.com',
        password: 'wrongpassword',
      };

      mockAuthService.signIn.mockRejectedValue(
        new UnauthorizedException('Invalid email or password'),
      );

      await expect(controller.signIn(signInDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw HttpException for unexpected errors', async () => {
      const signInDto: SignInDto = {
        email: 'john@example.com',
        password: 'password123',
      };

      mockAuthService.signIn.mockRejectedValue(new Error('Database error'));

      await expect(controller.signIn(signInDto)).rejects.toThrow(HttpException);
    });
  });

  describe('register', () => {
    it('should register a new user with address', async () => {
      const createUserDto: CreateUserDto = {
        fullName: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
        type: UserType.CUSTOMER,
        phone: '+37491234567',
        hvhh: 'test',
        address: {
          userId: 1,
          city: 'New York',
          region: 'NY',
          street: '123 Main St',
          house: '10A',
          zip: '10001',
        },
      };

      const createdUser = {
        id: 1,
        fullName: 'John Doe',
        email: 'john@example.com',
        type: UserType.CUSTOMER,
        verified: false,
        verificationToken: 'token123',
      };

      mockUserService.create.mockResolvedValue(createdUser);
      mockAddressService.create.mockResolvedValue({});
      mockEmailService.sendVerificationEmail.mockResolvedValue({});

      const result = await controller.register(createUserDto);

      expect(result.success).toBe(true);
      expect(result.data).toEqual({
        id: 1,
        email: 'john@example.com',
        fullName: 'John Doe',
        type: UserType.CUSTOMER,
        verified: false,
      });
      expect(result.message).toContain('Registration successful');
      expect(mockUserService.create).toHaveBeenCalledWith(createUserDto);
      expect(mockAddressService.create).toHaveBeenCalledWith({
        userId: 1,
        ...createUserDto.address,
      });
      expect(mockEmailService.sendVerificationEmail).toHaveBeenCalledWith(
        'john@example.com',
        'token123',
      );
    });

    it('should register user even if email sending fails', async () => {
      const createUserDto: CreateUserDto = {
        fullName: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
        type: UserType.CUSTOMER,
        phone: '+37491234567',
        hvhh: 'test',
        address: {
          userId: 1,
          city: 'New York',
          region: 'NY',
          street: '123 Main St',
          house: '10A',
          zip: '10001',
        },
      };

      const createdUser = {
        id: 1,
        fullName: 'John Doe',
        email: 'john@example.com',
        type: UserType.CUSTOMER,
        verified: false,
        verificationToken: 'token123',
      };

      mockUserService.create.mockResolvedValue(createdUser);
      mockAddressService.create.mockResolvedValue({});
      mockEmailService.sendVerificationEmail.mockRejectedValue(
        new Error('Email service unavailable'),
      );

      const result = await controller.register(createUserDto);

      expect(result.success).toBe(true);
      expect(mockEmailService.sendVerificationEmail).toHaveBeenCalled();
    });

    it('should throw HttpException for registration errors', async () => {
      const createUserDto: CreateUserDto = {
        fullName: 'John Doe',
        email: 'existing@example.com',
        password: 'password123',
        type: UserType.CUSTOMER,
        phone: '+37491234567',
        hvhh: 'test',
        address: {
          userId: 1,
          city: 'New York',
          region: 'NY',
          street: '123 Main St',
          house: '10A',
          zip: '10001',
        },
      };

      mockUserService.create.mockRejectedValue(
        new HttpException('User already exists', 409),
      );

      await expect(controller.register(createUserDto)).rejects.toThrow(
        HttpException,
      );
    });
  });

  describe('getProfile', () => {
    it('should return user profile', () => {
      const req = {
        user: {
          sub: 1,
          email: 'john@example.com',
          full_name: 'John Doe',
        },
      };

      const result = controller.getProfile(req);

      expect(result).toEqual(req.user);
    });
  });

  describe('verifyEmail', () => {
    it('should verify email with valid token', async () => {
      const token = 'validToken123';
      const verifiedUser = {
        id: 1,
        fullName: 'John Doe',
        email: 'john@example.com',
        verified: true,
        verifiedAt: new Date(),
      };

      mockUserService.verifyEmail.mockResolvedValue(verifiedUser);

      const result = await controller.verifyEmail(token);

      expect(result.success).toBe(true);
      expect(result.data).toEqual({
        id: 1,
        email: 'john@example.com',
        fullName: 'John Doe',
        verified: true,
        verifiedAt: verifiedUser.verifiedAt,
      });
      expect(result.message).toBe('Email verified successfully!');
      expect(mockUserService.verifyEmail).toHaveBeenCalledWith(token);
    });

    it('should throw HttpException for missing token', async () => {
      await expect(controller.verifyEmail(null)).rejects.toThrow(HttpException);
    });

    it('should throw HttpException for invalid token', async () => {
      mockUserService.verifyEmail.mockRejectedValue(
        new HttpException('Invalid verification token', 400),
      );

      await expect(controller.verifyEmail('invalidToken')).rejects.toThrow(
        HttpException,
      );
    });

    it('should throw HttpException for unexpected errors', async () => {
      mockUserService.verifyEmail.mockRejectedValue(new Error('Database error'));

      await expect(controller.verifyEmail('token')).rejects.toThrow(
        HttpException,
      );
    });
  });
});