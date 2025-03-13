import {
  HttpException,
  Injectable,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Users} from './entities/user.entity';
import * as bcrypt from 'bcrypt';

export type User = any;

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(Users)
    private readonly userRepository: Repository <Users>,
  ) {}

  private readonly users = [
     this.userRepository.find()
  ];

  async create(
    createUserDto: CreateUserDto,
  ): Promise<Users> {
    createUserDto.password = await this.hashPassword(createUserDto.password);
    const userData =
      await this.userRepository.create(createUserDto);

    return this.userRepository.save(userData);
  }

  async findAll(): Promise<Users[]> {
    return await this.userRepository.find();
  }

  async findOne(id: number): Promise<Users> {
    const userData =
      await this.userRepository.findOneBy({ id });
    if (!userData) {
      throw new HttpException(
        'User Not Found',
        404,
      );
    }
    return userData;
  }

  async update(
    id: number,
    updateUserDto: UpdateUserDto,
  ): Promise<Users> {
    const existingUser = await this.findOne(id);

    if (updateUserDto.password) {
      updateUserDto.password = await this.hashPassword(updateUserDto.password);
    }

    const userData = this.userRepository.merge(
      existingUser,
      updateUserDto,
    );
    return await this.userRepository.save(
      userData,
    );
  }

  async remove(id: number): Promise<Users> {
    const existingUser = await this.findOne(id);
    return await this.userRepository.remove(
      existingUser,
    );
  }
  private async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
  }

  async findUser(email: string): Promise<User | undefined> {
    const users = await this.userRepository.find();
    return users.find(user => user.email === email);
  }

}