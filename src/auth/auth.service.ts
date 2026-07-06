import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UserService, SafeUser } from '../users/users.service';
import { JwtPayload } from './jwt-payload.interface';

// A real bcrypt hash compared against when the email is unknown, so a failed
// login takes the same time whether or not the account exists (no enumeration
// oracle via response timing). The plaintext is irrelevant — it never matches.
const DUMMY_PASSWORD_HASH =
  '$2b$10$uwRiEw37ztqiE/GFbu50r.e/vxyJaoZ.nEoJN.VvUQZAhRSjB4JFa';

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
}
