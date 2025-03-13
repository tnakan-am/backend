
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UserService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {

  constructor(private usersService: UserService ,private jwtService: JwtService
  ) {}

  async signIn(email: string, pass: string): Promise<{ access_token: string }>{
    const user = await this.usersService.findUser(email);

    if (!(await bcrypt.compare(pass, user?.password))) {
      throw new UnauthorizedException();
    }
    const payload = { sub: user.id, full_name: user.fullName,email: user.email, };
    return {
      access_token: await this.jwtService.signAsync(payload),
    };
  }
}
