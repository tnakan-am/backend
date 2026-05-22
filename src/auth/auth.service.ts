import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UserService, SafeUser } from '../users/users.service';
import { JwtPayload } from './jwt-payload.interface';

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
