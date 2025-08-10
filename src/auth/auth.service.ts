import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UserService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UserService,
    private readonly jwtService: JwtService,
  ) {}

  async signIn(email: string, pass: string): Promise<{ access_token: string }> {
    try {
      const user = await this.usersService.findUser(email);
      const isPasswordValid = await bcrypt.compare(pass, user.password);

      if (!isPasswordValid) {
        throw new UnauthorizedException('Invalid email or password');
      }

      const payload = {
        sub: user.id,
        full_name: user.fullName,
        email: user.email,
      };

      const access_token = await this.jwtService.signAsync(payload);
      return { access_token };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Invalid email or password');
    }
  }
}
