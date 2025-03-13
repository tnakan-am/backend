import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './users/users.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Users } from './users/entities/user.entity';
import { AuthModule } from './auth/auth.module';
@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5433,
      username: 'postgres',
      password: '852456AA',
      database: 'homemade',
      entities: [Users],
      synchronize: true,
    }),
    UserModule,
    AuthModule,
  ],  controllers: [AppController],
  providers: [AppService],
})

export class AppModule {}
