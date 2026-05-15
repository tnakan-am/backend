import {
  HttpException,
  Injectable,
  NotFoundException,
  InternalServerErrorException,
  Logger,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { Users, UserType } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

export type SafeUser = Omit<
  Users,
  | 'password'
  | 'verificationToken'
  | 'passwordResetToken'
  | 'passwordResetExpiresAt'
>;

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(
    @InjectRepository(Users)
    private readonly userRepository: Repository<Users>,
  ) {}

  async create(dto: CreateUserDto): Promise<Users> {
    try {
      const existing = await this.userRepository.findOne({
        where: { email: dto.email.toLowerCase() },
      });
      if (existing) {
        throw new HttpException('Email already exists', 409);
      }

      const password = await this.hashPassword(dto.password);
      const verificationToken = this.generateToken();

      const entity = this.userRepository.create({
        ...dto,
        email: dto.email.toLowerCase(),
        password,
        verificationToken,
        verified: false,
        isTopSeller: dto.isTopSeller ?? false,
      });

      return await this.userRepository.save(entity);
    } catch (error) {
      if (error instanceof HttpException) throw error;
      if ((error as { code?: string }).code === '23505') {
        throw new HttpException('Email already exists', 409);
      }
      this.logger.error(`Failed to create user: ${dto.email}`, error as Error);
      throw new InternalServerErrorException('Error creating user');
    }
  }

  findRaw(id: string): Promise<Users | null> {
    return this.userRepository.findOne({ where: { id } });
  }

  async findById(id: string): Promise<Users> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async findByEmail(email: string): Promise<Users> {
    const user = await this.userRepository.findOne({
      where: { email: email.toLowerCase() },
    });
    if (!user)
      throw new NotFoundException(`User with email ${email} not found`);
    return user;
  }

  async findBusinesses(): Promise<SafeUser[]> {
    const users = await this.userRepository.find({
      where: { type: UserType.BUSINESS },
    });
    return users.map((u) => this.toSafeUser(u));
  }

  async findAll(): Promise<SafeUser[]> {
    const users = await this.userRepository.find();
    return users.map((u) => this.toSafeUser(u));
  }

  async update(id: string, dto: UpdateUserDto): Promise<SafeUser> {
    const user = await this.findById(id);
    const merged = this.userRepository.merge(user, dto);
    const saved = await this.userRepository.save(merged);
    return this.toSafeUser(saved);
  }

  async changePassword(
    id: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<void> {
    const user = await this.findById(id);
    const ok = await bcrypt.compare(currentPassword, user.password);
    if (!ok) throw new UnauthorizedException('Current password is incorrect');
    user.password = await this.hashPassword(newPassword);
    await this.userRepository.save(user);
  }

  async changeEmail(
    id: string,
    currentPassword: string,
    newEmail: string,
  ): Promise<SafeUser> {
    const user = await this.findById(id);
    const ok = await bcrypt.compare(currentPassword, user.password);
    if (!ok) throw new UnauthorizedException('Current password is incorrect');

    const lowered = newEmail.toLowerCase();
    const existing = await this.userRepository.findOne({
      where: { email: lowered },
    });
    if (existing && existing.id !== id) {
      throw new HttpException('Email already in use', 409);
    }

    user.email = lowered;
    user.verified = false;
    user.verifiedAt = null;
    user.verificationToken = this.generateToken();
    const saved = await this.userRepository.save(user);
    return this.toSafeUser(saved);
  }

  async remove(id: string): Promise<void> {
    const user = await this.findById(id);
    await this.userRepository.remove(user);
  }

  async verifyEmail(token: string): Promise<Users> {
    const user = await this.userRepository.findOne({
      where: { verificationToken: token },
    });
    if (!user) throw new NotFoundException('Invalid verification token');
    if (user.verified) {
      throw new BadRequestException('Email already verified');
    }
    user.verified = true;
    user.verifiedAt = new Date();
    user.verificationToken = null;
    return this.userRepository.save(user);
  }

  async issueVerificationToken(email: string): Promise<Users> {
    const user = await this.findByEmail(email);
    if (user.verified) {
      throw new BadRequestException('Email already verified');
    }
    user.verificationToken = this.generateToken();
    return this.userRepository.save(user);
  }

  async issuePasswordResetToken(email: string): Promise<Users | null> {
    const user = await this.userRepository.findOne({
      where: { email: email.toLowerCase() },
    });
    if (!user) return null;
    user.passwordResetToken = this.generateToken();
    user.passwordResetExpiresAt = new Date(Date.now() + 60 * 60 * 1000);
    return this.userRepository.save(user);
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { passwordResetToken: token },
    });
    if (!user) throw new NotFoundException('Invalid reset token');
    if (
      !user.passwordResetExpiresAt ||
      user.passwordResetExpiresAt.getTime() < Date.now()
    ) {
      throw new BadRequestException('Reset token has expired');
    }
    user.password = await this.hashPassword(newPassword);
    user.passwordResetToken = null;
    user.passwordResetExpiresAt = null;
    await this.userRepository.save(user);
  }

  toSafeUser(user: Users): SafeUser {
    const {
      password: _p,
      verificationToken: _v,
      passwordResetToken: _r,
      passwordResetExpiresAt: _e,
      ...rest
    } = user;
    return rest as SafeUser;
  }

  private hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
  }

  private generateToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }
}
