import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_GUARD } from '@nestjs/core';
import { UserService } from './users.service';
import { UserController } from './users.controller';
import { Users } from './entities/user.entity';
import { AuthGuard } from '../auth/auth.guard';

@Module({
  imports: [TypeOrmModule.forFeature([Users])],
  controllers: [UserController],
  providers: [
    UserService,
    { provide: APP_GUARD, useClass: AuthGuard },
  ],
  exports: [UserService],
})
export class UserModule {}
