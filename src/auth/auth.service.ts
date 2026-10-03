import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { UserService, SafeUser } from '../users/users.service';
import { JwtPayload } from './jwt-payload.interface';
import { AdminInvite } from './entities/admin-invite.entity';

// A real bcrypt hash compared against when the email is unknown, so a failed
// login takes the same time whether or not the account exists (no enumeration
// oracle via response timing). The plaintext is irrelevant — it never matches.
const DUMMY_PASSWORD_HASH =
  '$2b$10$uwRiEw37ztqiE/GFbu50r.e/vxyJaoZ.nEoJN.VvUQZAhRSjB4JFa';

const ADMIN_INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

const hashToken = (token: string) =>
  crypto.createHash('sha256').update(token).digest('hex');

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly usersService: UserService,
    private readonly jwtService: JwtService,
    @InjectRepository(AdminInvite)
    private readonly inviteRepository: Repository<AdminInvite>,
  ) {}

  async signIn(
    email: string,
    password: string,
  ): Promise<{ access_token: string; user: SafeUser }> {
    let user;
    try {
      user = await this.usersService.findByEmail(email);
    } catch {
      // Spend the same work as a real comparison before failing.
      await bcrypt.compare(password, DUMMY_PASSWORD_HASH);
      throw new UnauthorizedException('Invalid email or password');
    }

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) {
      this.logger.warn(`Failed login for ${email}`);
      throw new UnauthorizedException('Invalid email or password');
    }
    if (!user.verified) {
      throw new UnauthorizedException('User not verified');
    }

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      displayName: user.displayName,
      type: user.type,
    };
    const access_token = await this.jwtService.signAsync(payload);
    return { access_token, user: this.usersService.toSafeUser(user) };
  }

  /**
   * Stores a 7-day, single-use admin invite for one email address and returns
   * the raw token to email. Only its hash is persisted.
   */
  async createAdminInvite(email: string, createdBy: string): Promise<string> {
    const normalized = email.toLowerCase();
    try {
      await this.usersService.findByEmail(normalized);
      throw new ConflictException('Email already exists');
    } catch (err) {
      if (!(err instanceof NotFoundException)) throw err;
    }
    const token = crypto.randomBytes(32).toString('hex');
    await this.inviteRepository.save(
      this.inviteRepository.create({
        email: normalized,
        tokenHash: hashToken(token),
        expiresAt: new Date(Date.now() + ADMIN_INVITE_TTL_MS),
        usedAt: null,
        createdBy,
      }),
    );
    return token;
  }

  /**
   * Consumes a live invite issued for `email`, or throws. The check and the
   * consume are one UPDATE, so concurrent requests can't redeem it twice, and
   * a used invite stays dead even if that admin is later deleted.
   */
  async redeemAdminInvite(token: string, email: string): Promise<void> {
    const result = await this.inviteRepository
      .createQueryBuilder()
      .update(AdminInvite)
      .set({ usedAt: () => 'now()' })
      .where('"tokenHash" = :hash', { hash: hashToken(token) })
      .andWhere('email = :email', { email: email.toLowerCase() })
      .andWhere('"usedAt" IS NULL')
      .andWhere('"expiresAt" > now()')
      .execute();
    if (!result.affected) {
      throw new BadRequestException('Invalid or expired invite');
    }
  }
}
