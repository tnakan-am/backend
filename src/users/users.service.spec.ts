import { UserService } from './users.service';
import { NotFoundException, HttpException } from '@nestjs/common';
import { CreateUserDto, UserType } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

jest.mock('bcrypt');
jest.mock('crypto');

describe('UserService', () => {
  let service: UserService;
  let mockUserRepository: any;
  let mockLogger: any;

  beforeEach(() => {
    mockUserRepository = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      findOneBy: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      remove: jest.fn(),
      merge: jest.fn(),
    };

    mockLogger = {
      log: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
      verbose: jest.fn(),
    };

    // Create service instance directly with mocked dependencies
    service = new UserService(mockUserRepository);
    // Override the logger
    (service as any).logger = mockLogger;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new user with hashed password and verification token', async () => {
      const createUserDto: CreateUserDto = {
        fullName: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
        type: UserType.CUSTOMER,
        phone: '+37491234567',
        hvhh: 'test',
        address: {
          userId: 1,
          street: '123 Main St',
          city: 'New York',
          region: 'NY',
          house: '10A',
          zip: '10001',
        },
      };

      const hashedPassword = 'hashedPassword123';
      const verificationToken = 'token123';
      const savedUser = {
        id: 1,
        ...createUserDto,
        password: hashedPassword,
        verified: false,
        verificationToken,
        verifiedAt: null,
        addresses: [],
      };

      (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);
      (crypto.randomBytes as jest.Mock).mockReturnValue({
        toString: () => verificationToken,
      });
      mockUserRepository.create.mockReturnValue(savedUser);
      mockUserRepository.save.mockResolvedValue(savedUser);

      const result = await service.create(createUserDto);

      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10);
      expect(crypto.randomBytes).toHaveBeenCalledWith(32);
      expect(mockUserRepository.create).toHaveBeenCalledWith({
        ...createUserDto,
        password: hashedPassword,
        verified: false,
        verificationToken,
      });
      expect(mockUserRepository.save).toHaveBeenCalledWith(savedUser);
      expect(result).toEqual(savedUser);
    });

    it('should throw HttpException if user already exists', async () => {
      const createUserDto: CreateUserDto = {
        fullName: 'John Doe',
        email: 'existing@example.com',
        password: 'password123',
        type: UserType.CUSTOMER,
        phone: '+37491234567',
        hvhh: 'test',
        address: {
          userId: 1,
          street: '123 Main St',
          city: 'New York',
          region: 'NY',
          house: '10A',
          zip: '10001',
        },
      };

      const hashedPassword = 'hashedPassword123';
      const verificationToken = 'token123';

      (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);
      (crypto.randomBytes as jest.Mock).mockReturnValue({
        toString: () => verificationToken,
      });
      
      mockUserRepository.create.mockReturnValue({
        ...createUserDto,
        password: hashedPassword,
        verified: false,
        verificationToken,
      });
      
      mockUserRepository.save.mockRejectedValue({
        code: '23505',
      });

      await expect(service.create(createUserDto)).rejects.toThrow(
        HttpException,
      );
    });
  });

  describe('findOne', () => {
    it('should return a user by id', async () => {
      const expectedUser = {
        id: 1,
        fullName: 'John Doe',
        email: 'john@example.com',
        type: UserType.CUSTOMER,
        phone: '+37491234567',
        verified: true,
        addresses: [],
      };

      mockUserRepository.findOne.mockResolvedValue(expectedUser);

      const result = await service.findOne(1);

      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: ['addresses'],
      });
      expect(result).toEqual(expectedUser);
    });

    it('should throw NotFoundException if user not found', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findUser', () => {
    it('should return a user by email', async () => {
      const expectedUser = {
        id: 1,
        fullName: 'John Doe',
        email: 'john@example.com',
        password: 'hashedPassword',
        type: UserType.CUSTOMER,
        phone: '+37491234567',
        verified: true,
      };

      mockUserRepository.findOne.mockResolvedValue(expectedUser);

      const result = await service.findUser('john@example.com');

      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { email: 'john@example.com' },
      });
      expect(result).toEqual(expectedUser);
    });

    it('should throw NotFoundException if user not found by email', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(service.findUser('notfound@example.com')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update a user', async () => {
      const updateUserDto: UpdateUserDto = {
        fullName: 'John Updated',
        phone: '+37498765432',
      };

      const existingUser = {
        id: 1,
        fullName: 'John Doe',
        email: 'john@example.com',
        type: UserType.CUSTOMER,
        phone: '+37491234567',
        verified: true,
        addresses: [],
      };

      const mergedUser = {
        ...existingUser,
        ...updateUserDto,
      };

      mockUserRepository.findOne.mockResolvedValue(existingUser);
      mockUserRepository.merge.mockReturnValue(mergedUser);
      mockUserRepository.save.mockResolvedValue(mergedUser);

      const result = await service.update(1, updateUserDto);

      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: ['addresses'],
      });
      expect(mockUserRepository.merge).toHaveBeenCalledWith(existingUser, updateUserDto);
      expect(mockUserRepository.save).toHaveBeenCalledWith(mergedUser);
      expect(result).toEqual(mergedUser);
    });

    it('should throw NotFoundException if user not found during update', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(service.update(999, {})).rejects.toThrow(NotFoundException);
    });

    it('should hash password if password is being updated', async () => {
      const updateUserDto: UpdateUserDto = {
        password: 'newPassword123',
      };

      const hashedPassword = 'hashedNewPassword';
      const existingUser = {
        id: 1,
        fullName: 'John Doe',
        email: 'john@example.com',
        type: UserType.CUSTOMER,
        phone: '+37491234567',
        verified: true,
        addresses: [],
      };

      (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);
      mockUserRepository.findOne.mockResolvedValue(existingUser);
      mockUserRepository.merge.mockReturnValue({ ...existingUser, password: hashedPassword });
      mockUserRepository.save.mockResolvedValue({ ...existingUser, password: hashedPassword });

      await service.update(1, updateUserDto);

      expect(bcrypt.hash).toHaveBeenCalledWith('newPassword123', 10);
      expect(mockUserRepository.merge).toHaveBeenCalledWith(existingUser, { password: hashedPassword });
      expect(mockUserRepository.save).toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should remove a user', async () => {
      const existingUser = {
        id: 1,
        fullName: 'John Doe',
        email: 'john@example.com',
        type: UserType.CUSTOMER,
        phone: '+37491234567',
        verified: true,
        addresses: [],
      };

      mockUserRepository.findOne.mockResolvedValue(existingUser);
      mockUserRepository.remove.mockResolvedValue(existingUser);

      const result = await service.remove(1);

      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: ['addresses'],
      });
      expect(mockUserRepository.remove).toHaveBeenCalledWith(existingUser);
      expect(result).toEqual(existingUser);
    });

    it('should throw NotFoundException if user not found during removal', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(service.remove(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('verifyEmail', () => {
    it('should verify a user email with valid token', async () => {
      const token = 'validToken123';
      const user = {
        id: 1,
        fullName: 'John Doe',
        email: 'john@example.com',
        verificationToken: token,
        verified: false,
        verifiedAt: null,
      };

      const verifiedUser = {
        ...user,
        verified: true,
        verificationToken: null,
        verifiedAt: new Date(),
      };

      mockUserRepository.findOne.mockResolvedValue(user);
      mockUserRepository.save.mockResolvedValue(verifiedUser);

      const result = await service.verifyEmail(token);

      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { verificationToken: token },
      });
      expect(mockUserRepository.save).toHaveBeenCalled();
      expect(result.verified).toBe(true);
      expect(result.verificationToken).toBeNull();
    });

    it('should throw NotFoundException for invalid verification token', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(service.verifyEmail('invalidToken')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw HttpException if user is already verified', async () => {
      const user = {
        id: 1,
        fullName: 'John Doe',
        email: 'john@example.com',
        verificationToken: 'token',
        verified: true,
        verifiedAt: new Date(),
      };

      mockUserRepository.findOne.mockResolvedValue(user);

      await expect(service.verifyEmail('token')).rejects.toThrow(
        HttpException,
      );
    });
  });
});