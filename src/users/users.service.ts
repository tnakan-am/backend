import {
  HttpException,
  Injectable,
  NotFoundException,
  InternalServerErrorException,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { Users, UserType } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateSelfDto } from './dto/update-user.dto';
import { Product } from '../products/entities/product.entity';
import { EmailService } from '../email/email.service';

export type SafeUser = Omit<
  Users,
  | 'password'
  | 'verificationToken'
  | 'verificationTokenExpiresAt'
  | 'passwordResetToken'
  | 'passwordResetExpiresAt'
>;

export type PublicBusiness = Pick<
  Users,
  'id' | 'displayName' | 'image' | 'company' | 'isTopSeller'
>;

const VERIFICATION_TOKEN_TTL_MS = 24 * 60 * 60 * 1000;

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(
    @InjectRepository(Users)
    private readonly userRepository: Repository<Users>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    private readonly emailService: EmailService,
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
        verificationTokenExpiresAt: new Date(
          Date.now() + VERIFICATION_TOKEN_TTL_MS,
        ),
        verified: false,
        isTopSeller: false,
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

  /**
   * Public storefront directory, open to anonymous visitors: display fields
   * only, so contact details and tax ids (hvhh) can't be harvested in bulk.
   */
  async findBusinesses(): Promise<PublicBusiness[]> {
    return this.userRepository.find({
      where: { type: UserType.BUSINESS },
      select: {
        id: true,
        displayName: true,
        image: true,
        company: true,
        isTopSeller: true,
      },
    });
  }

  async findAll(): Promise<SafeUser[]> {
    const users = await this.userRepository.find();
    return users.map((u) => this.toSafeUser(u));
  }

  async update(id: string, dto: UpdateSelfDto): Promise<SafeUser> {
    const user = await this.findById(id);
    const merged = this.userRepository.merge(user, dto);
    const saved = await this.userRepository.save(merged);
    // Products denormalise the vendor's name and photo for cards; keep them
    // in sync.
    const productPatch: Partial<Product> = {};
    if (dto.displayName !== undefined) {
      productPatch.userDisplayName = dto.displayName;
    }
    if (dto.image !== undefined) productPatch.userPhoto = dto.image ?? null;
    if (Object.keys(productPatch).length) {
      await this.productRepository.update({ userId: id }, productPatch);
    }
    return this.toSafeUser(saved);
  }

  async changePassword(
    id: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<void> {
    const user = await this.findById(id);
    const ok = await bcrypt.compare(currentPassword, user.password);
    if (!ok) throw new BadRequestException('Current password is incorrect');
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
    if (!ok) throw new BadRequestException('Current password is incorrect');

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
    user.verificationTokenExpiresAt = new Date(
      Date.now() + VERIFICATION_TOKEN_TTL_MS,
    );
    const saved = await this.userRepository.save(user);

    try {
      await this.emailService.sendVerificationEmail(
        saved.email,
        saved.verificationToken!,
        'emailChange',
      );
    } catch (err) {
      this.logger.warn(
        `Verification email send failed for ${saved.email}`,
        err,
      );
    }

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
    if (
      !user.verificationTokenExpiresAt ||
      user.verificationTokenExpiresAt.getTime() < Date.now()
    ) {
      throw new BadRequestException('Verification token has expired');
    }
    user.verified = true;
    user.verifiedAt = new Date();
    user.verificationToken = null;
    user.verificationTokenExpiresAt = null;
    return this.userRepository.save(user);
  }

  async issueVerificationToken(email: string): Promise<Users> {
    const user = await this.findByEmail(email);
    if (user.verified) {
      throw new BadRequestException('Email already verified');
    }
    user.verificationToken = this.generateToken();
    user.verificationTokenExpiresAt = new Date(
      Date.now() + VERIFICATION_TOKEN_TTL_MS,
    );
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
      verificationTokenExpiresAt: _ve,
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
