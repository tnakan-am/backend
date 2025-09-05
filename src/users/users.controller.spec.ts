import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from './users.controller';
import { UserService } from './users.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Users } from './entities/user.entity';
import { CreateUserDto, UserType } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { HttpException } from '@nestjs/common';

describe('UserController', () => {
  let controller: UserController;

  const mockUserRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  const mockUserService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    findUser: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        {
          provide: UserService,
          useValue: mockUserService,
        },
        {
          provide: getRepositoryToken(Users),
          useValue: mockUserRepository,
        },
      ],
    }).compile();

    controller = module.get<UserController>(UserController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a new user', async () => {
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

      const expectedResult = {
        success: true,
        message: 'User Created Successfully',
      };

      mockUserService.create.mockResolvedValue({});

      const result = await controller.create(createUserDto);

      expect(result).toEqual(expectedResult);
      expect(mockUserService.create).toHaveBeenCalledWith(createUserDto);
    });

    it('should throw HttpException when service throws error', async () => {
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

      mockUserService.create.mockRejectedValue(
        new Error('User already exists'),
      );

      await expect(controller.create(createUserDto)).rejects.toThrow(
        HttpException,
      );
    });
  });

  describe('findOne', () => {
    it('should return a single user', async () => {
      const expectedResult = {
        id: 1,
        fullName: 'John Doe',
        email: 'john@example.com',
        type: UserType.CUSTOMER,
        phone: '+37491234567',
        verified: true,
      };

      mockUserService.findOne.mockResolvedValue(expectedResult);

      const result = await controller.findOne('1');

      expect(result).toEqual(expectedResult);
      expect(mockUserService.findOne).toHaveBeenCalledWith(1);
    });

    it('should remove password from response', async () => {
      const userWithPassword = {
        id: 1,
        fullName: 'John Doe',
        email: 'john@example.com',
        type: UserType.CUSTOMER,
        phone: '+37491234567',
        password: 'hashedPassword',
        verified: true,
      };

      mockUserService.findOne.mockResolvedValue(userWithPassword);

      const result = await controller.findOne('1');

      expect(result.password).toBeUndefined();
      expect(mockUserService.findOne).toHaveBeenCalledWith(1);
    });

    it('should throw HttpException when user not found', async () => {
      mockUserService.findOne.mockRejectedValue(
        new Error('User not found'),
      );

      await expect(controller.findOne('999')).rejects.toThrow(HttpException);
    });
  });

  describe('update', () => {
    it('should update a user', async () => {
      const updateUserDto: UpdateUserDto = {
        fullName: 'John Updated',
        phone: '+37498765432',
      };

      const expectedResult = {
        success: true,
        message: 'User Updated Successfully',
      };

      mockUserService.update.mockResolvedValue({});

      const result = await controller.update('1', updateUserDto);

      expect(result).toEqual(expectedResult);
      expect(mockUserService.update).toHaveBeenCalledWith(1, updateUserDto);
    });

    it('should throw HttpException when update fails', async () => {
      const updateUserDto: UpdateUserDto = {
        fullName: 'John Updated',
      };

      mockUserService.update.mockRejectedValue(
        new Error('Update failed'),
      );

      await expect(controller.update('1', updateUserDto)).rejects.toThrow(
        HttpException,
      );
    });
  });

  describe('remove', () => {
    it('should remove a user', async () => {
      const expectedResult = {
        success: true,
        message: 'User Deleted Successfully',
      };

      mockUserService.remove.mockResolvedValue({});

      const result = await controller.remove('1');

      expect(result).toEqual(expectedResult);
      expect(mockUserService.remove).toHaveBeenCalledWith(1);
    });

    it('should throw HttpException when delete fails', async () => {
      mockUserService.remove.mockRejectedValue(
        new Error('Delete failed'),
      );

      await expect(controller.remove('999')).rejects.toThrow(HttpException);
    });
  });
});