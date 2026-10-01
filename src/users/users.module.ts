import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_GUARD } from '@nestjs/core';
import { UserService } from './users.service';
import { UserController } from './users.controller';
import { Users } from './entities/user.entity';
import { AuthGuard } from '../auth/auth.guard';
import { EmailModule } from '../email/email.module';
import { Product } from '../products/entities/product.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Users, Product]), EmailModule],
  controllers: [UserController],
  providers: [UserService, { provide: APP_GUARD, useClass: AuthGuard }],
  exports: [UserService],
})
export class UserModule {}
