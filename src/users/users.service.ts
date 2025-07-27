import {
  HttpException,
  Injectable,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Users } from './entities/user.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(Users)
    private readonly userRepository: Repository<Users>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<Users> {
    try {
      createUserDto.password = await this.hashPassword(createUserDto.password);
      const userData = await this.userRepository.create(createUserDto);
      return await this.userRepository.save(userData);
    } catch (error) {
      if (error.code === '23505') {
        // Unique violation error code in PostgreSQL
        throw new HttpException('Email already exists', 409);
      }
      throw new InternalServerErrorException('Error creating user');
    }
  }

  async findOne(id: number): Promise<Users> {
    const userData = await this.userRepository.findOneBy({ id });
    if (!userData) {
      throw new NotFoundException('User Not Found');
    }
    return userData;
  }

  async update(id: number, updateUserDto: UpdateUserDto): Promise<Users> {
    try {
      const existingUser = await this.findOne(id);

      if (updateUserDto.password) {
        updateUserDto.password = await this.hashPassword(
          updateUserDto.password,
        );
      }

      const userData = this.userRepository.merge(existingUser, updateUserDto);
      return await this.userRepository.save(userData);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Error updating user');
    }
  }

  async remove(id: number): Promise<Users> {
    try {
      const existingUser = await this.findOne(id);
      return await this.userRepository.remove(existingUser);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Error removing user');
    }
  }

  private async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
  }

  async findUser(email: string): Promise<Users> {
    const user = await this.userRepository.findOne({ where: { email } });
    if (!user) {
      throw new NotFoundException(`User with email ${email} not found`);
    }
    return user;
  }
}
