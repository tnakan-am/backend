import {
  HttpException,
  Injectable,
  NotFoundException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Address } from './entities/address.entity';

@Injectable()
export class AddressService {
  private readonly logger = new Logger(AddressService.name);

  constructor(
    @InjectRepository(Address)
    private readonly addressRepository: Repository<Address>,
  ) {}

  async create(createAddressDto: CreateAddressDto): Promise<Address> {
    try {
      const userData = this.addressRepository.create(createAddressDto);
      return await this.addressRepository.save(userData);
    } catch (error) {
      if (error.code === '23505') {
        // Unique violation error code in PostgreSQL
        this.logger.warn(
          `Attempted to create duplicate address for userId: ${createAddressDto.userId}`,
        );
        throw new HttpException('Address already exists for this user', 409);
      }
      this.logger.error(
        `Failed to create address for userId: ${createAddressDto.userId}`,
        error instanceof Error ? error.stack : error,
      );
      throw new InternalServerErrorException('Error creating address');
    }
  }

  async findOne(id: number): Promise<Address> {
    const userData = await this.addressRepository.findOneBy({ id });
    if (!userData) {
      throw new NotFoundException('Address Not Found');
    }
    return userData;
  }

  async update(
    id: number,
    updateAddressDto: UpdateAddressDto,
  ): Promise<Address> {
    try {
      const existing = await this.findOne(id);

      const data = this.addressRepository.merge(
        existing,
        updateAddressDto,
      );
      return await this.addressRepository.save(data);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(
        `Failed to update address with id: ${id}`,
        error instanceof Error ? error.stack : error,
      );
      throw new InternalServerErrorException('Error updating address');
    }
  }

  async remove(id: number): Promise<Address> {
    try {
      const existingUser = await this.findOne(id);
      return await this.addressRepository.remove(existingUser);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(
        `Failed to remove address with id: ${id}`,
        error instanceof Error ? error.stack : error,
      );
      throw new InternalServerErrorException('Error removing address');
    }
  }

  async findAddress(id: number): Promise<Address> {
    const address = await this.addressRepository.findOne({ where: { id } });
    if (!address) {
      throw new NotFoundException(`Address with id ${id} not found`);
    }
    return address;
  }

  async findAddressByUserId(userId: number): Promise<Address> {
    const address = await this.addressRepository.findOne({ where: { userId } });
    if (!address) {
      throw new NotFoundException(`Address with userId ${userId} not found`);
    }
    return address;
  }
}
