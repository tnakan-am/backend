import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UserModule } from '../users/users.module';
import { EmailModule } from '../email/email.module';
import { jwtConstants } from './constants';

@Module({
  imports: [
    UserModule,
    EmailModule,
    JwtModule.registerAsync({
      global: true,
      useFactory: () => ({
        secret: jwtConstants.secret,
        signOptions: { expiresIn: jwtConstants.expiresIn },
      }),
    }),
  ],
  providers: [AuthService],
  controllers: [AuthController],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}
