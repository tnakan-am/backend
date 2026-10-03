import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UserService, SafeUser } from '../users/users.service';
import { JwtPayload } from './jwt-payload.interface';
import { jwtConstants } from './constants';

// A real bcrypt hash compared against when the email is unknown, so a failed
// login takes the same time whether or not the account exists (no enumeration
// oracle via response timing). The plaintext is irrelevant — it never matches.
const DUMMY_PASSWORD_HASH =
  '$2b$10$uwRiEw37ztqiE/GFbu50r.e/vxyJaoZ.nEoJN.VvUQZAhRSjB4JFa';

const ADMIN_INVITE_PURPOSE = 'admin-invite';
const ADMIN_INVITE_TTL = '7d';

// Invites use their own key so an invite can never pass the AuthGuard as a
// session token, and a session token can never be redeemed as an invite.
const adminInviteSecret = () =>
  `${jwtConstants.secret}:${ADMIN_INVITE_PURPOSE}`;

interface AdminInvitePayload {
  purpose: typeof ADMIN_INVITE_PURPOSE;
  email: string;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly usersService: UserService,
    private readonly jwtService: JwtService,
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
   * Issues a signed, 7-day admin invite bound to one email address. It is
   * single-use in effect: once that email registers, it can't register again.
   */
  async createAdminInvite(email: string): Promise<string> {
    const normalized = email.toLowerCase();
    try {
      await this.usersService.findByEmail(normalized);
      throw new ConflictException('Email already exists');
    } catch (err) {
      if (!(err instanceof NotFoundException)) throw err;
    }
    const payload: AdminInvitePayload = {
      purpose: ADMIN_INVITE_PURPOSE,
      email: normalized,
    };
    return this.jwtService.signAsync(payload, {
      secret: adminInviteSecret(),
      expiresIn: ADMIN_INVITE_TTL,
    });
  }

  /** Throws unless `token` is a live admin invite issued for `email`. */
  async verifyAdminInvite(token: string, email: string): Promise<void> {
    let payload: AdminInvitePayload;
    try {
      payload = await this.jwtService.verifyAsync<AdminInvitePayload>(token, {
        secret: adminInviteSecret(),
      });
    } catch {
      throw new BadRequestException('Invalid or expired invite');
    }
    if (
      payload.purpose !== ADMIN_INVITE_PURPOSE ||
      payload.email !== email.toLowerCase()
    ) {
      throw new BadRequestException('Invalid or expired invite');
    }
  }
}
