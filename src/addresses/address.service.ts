import {
  HttpException,
  Injectable,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Address } from './entities/address.entity';

@Injectable()
export class AddressService {
  constructor(
    @InjectRepository(Address)
    private readonly addressRepository: Repository<Address>,
  ) {}

  async create(createAddressDto: CreateAddressDto): Promise<Address> {
    try {
      const userData = await this.addressRepository.create(createAddressDto);
      return await this.addressRepository.save(userData);
    } catch (error) {
      if (error.code === '23505') {
        // Unique violation error code in PostgreSQL
        throw new HttpException('Email already exists', 409);
      }
      throw new InternalServerErrorException('Error creating user');
    }
  }

  async findOne(id: number): Promise<Address> {
    const userData = await this.addressRepository.findOneBy({ id });
    if (!userData) {
      throw new NotFoundException('User Not Found');
    }
    return userData;
  }

  async update(
    id: number,
    updateAddressDto: UpdateAddressDto,
  ): Promise<Address> {
    try {
      const existingUser = await this.findOne(id);

      const userData = this.addressRepository.merge(
        existingUser,
        updateAddressDto,
      );
      return await this.addressRepository.save(userData);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Error updating user');
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
      throw new InternalServerErrorException('Error removing user');
    }
  }

  async findAddress(id: number): Promise<Address> {
    const user = await this.addressRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User with email ${id} not found`);
    }
    return user;
  }
}
