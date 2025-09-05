import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { UserService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { Users } from '../users/entities/user.entity';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly usersService: UserService,
    private readonly jwtService: JwtService,
  ) {}

  async signIn(email: string, pass: string): Promise<{ access_token: string, user: Users }> {
    try {
      const user = await this.usersService.findUser(email);
      const isPasswordValid = await bcrypt.compare(pass, user.password);

      if (!isPasswordValid) {
        this.logger.warn(`Failed login attempt for email: ${email} - invalid password`);
        throw new UnauthorizedException('Invalid email or password');
      }

      const payload = {
        sub: user.id,
        full_name: user.fullName,
        email: user.email,
        type: user.type,
      };

      delete user.password;
      const access_token = await this.jwtService.signAsync(payload);
      return { access_token, user };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      
      // Check if it's a NotFoundException from findUser
      if (error.status === 404) {
        this.logger.warn(`User not found: ${email}`);
        throw new UnauthorizedException('Invalid email or password');
      }
      
      // For any other error, log it and throw generic auth error
      this.logger.error(`Unexpected error during login for ${email}:`, error);
      throw new UnauthorizedException('Invalid email or password');
    }
  }
}
