import { AddressService } from './address.service';
import { NotFoundException, HttpException, InternalServerErrorException } from '@nestjs/common';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';

describe('AddressService', () => {
  let service: AddressService;
  let mockAddressRepository: any;
  let mockLogger: any;

  beforeEach(() => {
    mockAddressRepository = {
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

    service = new AddressService(mockAddressRepository);
    (service as any).logger = mockLogger;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new address', async () => {
      const createAddressDto: CreateAddressDto = {
        userId: 1,
        city: 'New York',
        region: 'NY',
        street: '123 Main St',
        house: '10A',
        zip: '10001',
      };

      const savedAddress = {
        id: 1,
        ...createAddressDto,
      };

      mockAddressRepository.create.mockReturnValue(savedAddress);
      mockAddressRepository.save.mockResolvedValue(savedAddress);

      const result = await service.create(createAddressDto);

      expect(mockAddressRepository.create).toHaveBeenCalledWith(createAddressDto);
      expect(mockAddressRepository.save).toHaveBeenCalledWith(savedAddress);
      expect(result).toEqual(savedAddress);
    });

    it('should throw HttpException if address already exists', async () => {
      const createAddressDto: CreateAddressDto = {
        userId: 1,
        city: 'New York',
        region: 'NY',
        street: '123 Main St',
        house: '10A',
        zip: '10001',
      };

      mockAddressRepository.create.mockReturnValue(createAddressDto);
      mockAddressRepository.save.mockRejectedValue({
        code: '23505',
      });

      await expect(service.create(createAddressDto)).rejects.toThrow(HttpException);
    });

    it('should throw InternalServerErrorException for other errors', async () => {
      const createAddressDto: CreateAddressDto = {
        userId: 1,
        city: 'New York',
        region: 'NY',
        street: '123 Main St',
        house: '10A',
        zip: '10001',
      };

      mockAddressRepository.create.mockReturnValue(createAddressDto);
      mockAddressRepository.save.mockRejectedValue(new Error('Database error'));

      await expect(service.create(createAddressDto)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('findOne', () => {
    it('should return an address by id', async () => {
      const expectedAddress = {
        id: 1,
        userId: 1,
        city: 'New York',
        region: 'NY',
        street: '123 Main St',
        house: '10A',
        zip: '10001',
      };

      mockAddressRepository.findOneBy.mockResolvedValue(expectedAddress);

      const result = await service.findOne(1);

      expect(mockAddressRepository.findOneBy).toHaveBeenCalledWith({ id: 1 });
      expect(result).toEqual(expectedAddress);
    });

    it('should throw NotFoundException if address not found', async () => {
      mockAddressRepository.findOneBy.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update an address', async () => {
      const updateAddressDto: UpdateAddressDto = {
        city: 'Los Angeles',
        region: 'CA',
      };

      const existingAddress = {
        id: 1,
        userId: 1,
        city: 'New York',
        region: 'NY',
        street: '123 Main St',
        house: '10A',
        zip: '10001',
      };

      const mergedAddress = {
        ...existingAddress,
        ...updateAddressDto,
      };

      mockAddressRepository.findOneBy.mockResolvedValue(existingAddress);
      mockAddressRepository.merge.mockReturnValue(mergedAddress);
      mockAddressRepository.save.mockResolvedValue(mergedAddress);

      const result = await service.update(1, updateAddressDto);

      expect(mockAddressRepository.merge).toHaveBeenCalledWith(existingAddress, updateAddressDto);
      expect(mockAddressRepository.save).toHaveBeenCalledWith(mergedAddress);
      expect(result).toEqual(mergedAddress);
    });

    it('should throw NotFoundException if address not found during update', async () => {
      mockAddressRepository.findOneBy.mockResolvedValue(null);

      await expect(service.update(999, {})).rejects.toThrow(NotFoundException);
    });

    it('should throw InternalServerErrorException for other errors', async () => {
      const existingAddress = {
        id: 1,
        userId: 1,
        city: 'New York',
        region: 'NY',
        street: '123 Main St',
        house: '10A',
        zip: '10001',
      };

      mockAddressRepository.findOneBy.mockResolvedValue(existingAddress);
      mockAddressRepository.merge.mockReturnValue(existingAddress);
      mockAddressRepository.save.mockRejectedValue(new Error('Database error'));

      await expect(service.update(1, {})).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('remove', () => {
    it('should remove an address', async () => {
      const existingAddress = {
        id: 1,
        userId: 1,
        city: 'New York',
        region: 'NY',
        street: '123 Main St',
        house: '10A',
        zip: '10001',
      };

      mockAddressRepository.findOneBy.mockResolvedValue(existingAddress);
      mockAddressRepository.remove.mockResolvedValue(existingAddress);

      const result = await service.remove(1);

      expect(mockAddressRepository.remove).toHaveBeenCalledWith(existingAddress);
      expect(result).toEqual(existingAddress);
    });

    it('should throw NotFoundException if address not found during removal', async () => {
      mockAddressRepository.findOneBy.mockResolvedValue(null);

      await expect(service.remove(999)).rejects.toThrow(NotFoundException);
    });

    it('should throw InternalServerErrorException for other errors', async () => {
      const existingAddress = {
        id: 1,
        userId: 1,
        city: 'New York',
        region: 'NY',
        street: '123 Main St',
        house: '10A',
        zip: '10001',
      };

      mockAddressRepository.findOneBy.mockResolvedValue(existingAddress);
      mockAddressRepository.remove.mockRejectedValue(new Error('Database error'));

      await expect(service.remove(1)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('findAddress', () => {
    it('should return an address by id', async () => {
      const expectedAddress = {
        id: 1,
        userId: 1,
        city: 'New York',
        region: 'NY',
        street: '123 Main St',
        house: '10A',
        zip: '10001',
      };

      mockAddressRepository.findOne.mockResolvedValue(expectedAddress);

      const result = await service.findAddress(1);

      expect(mockAddressRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(result).toEqual(expectedAddress);
    });

    it('should throw NotFoundException if address not found', async () => {
      mockAddressRepository.findOne.mockResolvedValue(null);

      await expect(service.findAddress(999)).rejects.toThrow(NotFoundException);
    });
  });
});